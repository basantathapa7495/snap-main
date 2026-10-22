// Private R2 image gateway. The bucket has no public R2 domain.
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const PATH = new RegExp(`^(?:${UUID}/${UUID}/${UUID}|${UUID}/${UUID})\\.(?:webp|png|jpg|jpeg)$`, 'i');
const MAX_BYTES = 2 * 1024 * 1024;
const ttl = 3600;

function json(value, status = 200, headers = {}) {
  return Response.json(value, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

function cors(request, env) {
  const origin = request.headers.get('Origin');
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((part) => part.trim());
  return origin && allowed.includes(origin) ? {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Vary': 'Origin',
  } : {};
}

async function hmac(env, value) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.SIGNING_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signed = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)));
  return Array.from(signed, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function safePath(value) {
  return typeof value === 'string' && PATH.test(value) && value.length < 180;
}

async function api(env, token, path) {
  const response = await fetch(`${env.SUPABASE_URL}${path}`, {
    headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` },
    redirect: 'manual',
  });
  if (!response.ok) throw new Error(`Authorization lookup failed (${response.status})`);
  return response.json();
}

async function identity(request, env) {
  const token = request.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;
  const user = await api(env, token, '/auth/v1/user');
  if (!user?.id) return null;
  const profiles = await api(env, token, `/rest/v1/profiles?select=user_id,school_id,role&user_id=eq.${user.id}&limit=1`);
  const profile = profiles[0];
  if (!profile?.school_id || !['teacher', 'principal', 'admin', 'school_admin'].includes(profile.role?.toLowerCase())) return null;
  return { token, id: user.id, profile };
}

async function authorizedPaths(env, identity, paths) {
  const school = identity.profile.school_id;
  const principal = identity.profile.role.toLowerCase() !== 'teacher';
  const filter = principal ? `school_id=eq.${school}` : `user_id=eq.${identity.id}&school_id=eq.${school}`;
  const inPaths = paths.map((path) => `"${path}"`).join(',');
  const rows = await api(env, identity.token, `/rest/v1/teachers?select=id,avatar_path,user_id&${filter}&avatar_path=in.(${encodeURIComponent(inPaths)})`);
  return new Set(rows.map((row) => row.avatar_path));
}

async function teacherForObject(env, identity, key, method) {
  const parts = key.split('/');
  const principal = identity.profile.role.toLowerCase() !== 'teacher';
  if (method === 'PUT' && (principal ? parts.length !== 3 : parts.length !== 2)) return null;
  if (parts.length === 3 && parts[0] !== identity.profile.school_id) return null;
  if (parts.length === 2 && !principal && parts[0] !== identity.id) return null;
  const filter = parts.length === 3
    ? `id=eq.${parts[1]}${principal ? '' : `&user_id=eq.${identity.id}`}`
    : `user_id=eq.${parts[0]}`;
  const rows = await api(env, identity.token, `/rest/v1/teachers?select=id,avatar_path,school_id,user_id&${filter}&school_id=eq.${identity.profile.school_id}&limit=1`);
  return rows[0] || null;
}

async function photo(request, env, url) {
  const path = decodeURIComponent(url.pathname.slice('/photo/'.length));
  const expires = Number(url.searchParams.get('e'));
  const signature = url.searchParams.get('sig');
  if (!safePath(path) || !Number.isSafeInteger(expires) || expires < Date.now() / 1000 || expires > Date.now() / 1000 + ttl + 60 || !/^[0-9a-f]{64}$/.test(signature || '')) return new Response(null, { status: 403 });
  if (await hmac(env, `${path}\n${expires}`) !== signature) return new Response(null, { status: 403 });
  const object = await env.AVATARS.get(path);
  if (!object) return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  const maxAge = Math.max(0, Math.min(ttl, expires - Math.floor(Date.now() / 1000)));
  return new Response(request.method === 'HEAD' ? null : object.body, {
    headers: { 'Content-Type': object.httpMetadata?.contentType || 'image/webp', 'Cache-Control': `private, max-age=${maxAge}`, 'X-Content-Type-Options': 'nosniff' },
  });
}

export default {
  async fetch(request, env) {
    const headers = cors(request, env);
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (url.pathname.startsWith('/photo/') && ['GET', 'HEAD'].includes(request.method)) {
      try { return await photo(request, env, url); } catch { return new Response(null, { status: 500 }); }
    }
    if (request.headers.has('Origin') && !headers['Access-Control-Allow-Origin']) return json({ error: 'Origin not allowed.' }, 403);
    try {
      const user = await identity(request, env);
      if (!user) return json({ error: 'Sign in required.' }, 401, headers);
      if (url.pathname === '/sign' && request.method === 'POST') {
        const input = await request.json();
        if (!Array.isArray(input?.paths)) return json({ error: 'Invalid paths.' }, 400, headers);
        const paths = [...new Set(input.paths)];
        if (paths.length > 20 || paths.some((path) => !safePath(path))) return json({ error: 'Invalid paths.' }, 400, headers);
        const allowed = await authorizedPaths(env, user, paths);
        const expires = Math.floor(Date.now() / 1000) + ttl;
        const urls = await Promise.all(paths.filter((path) => allowed.has(path)).map(async (path) => ({
          path, signedUrl: `${url.origin}/photo/${path}?e=${expires}&sig=${await hmac(env, `${path}\n${expires}`)}`,
        })));
        return json({ urls }, 200, headers);
      }
      if (url.pathname.startsWith('/object/') && ['PUT', 'DELETE'].includes(request.method)) {
        const path = decodeURIComponent(url.pathname.slice('/object/'.length));
        if (!safePath(path)) return json({ error: 'Invalid object path.' }, 400, headers);
        const teacher = await teacherForObject(env, user, path, request.method);
        if (!teacher) return json({ error: 'Teacher not found.' }, 404, headers);
        if (request.method === 'DELETE') {
          if (teacher.avatar_path === path) return json({ error: 'Photo is still in use.' }, 409, headers);
          if (teacher.user_id) {
            const linked = await api(env, user.token, `/rest/v1/profiles?select=avatar_path&user_id=eq.${teacher.user_id}&school_id=eq.${teacher.school_id}&limit=1`);
            if (linked[0]?.avatar_path === path) return json({ error: 'Photo is still linked to a profile.' }, 409, headers);
          }
          await env.AVATARS.delete(path);
          return json({ ok: true }, 200, headers);
        }
        if (!path.endsWith('.webp') || request.headers.get('Content-Type') !== 'image/webp') return json({ error: 'A WebP image is required.' }, 415, headers);
        if (await env.AVATARS.head(path)) return json({ error: 'Photo already exists.' }, 409, headers);
        const bytes = await request.arrayBuffer();
        const head = new Uint8Array(bytes.slice(0, 12));
        if (!bytes.byteLength || bytes.byteLength > MAX_BYTES || String.fromCharCode(...head.slice(0, 4)) !== 'RIFF' || String.fromCharCode(...head.slice(8, 12)) !== 'WEBP') return json({ error: 'Invalid or oversized picture.' }, 413, headers);
        await env.AVATARS.put(path, bytes, { httpMetadata: { contentType: 'image/webp' } });
        return json({ path }, 201, headers);
      }
      return json({ error: 'Not found.' }, 404, headers);
    } catch (error) {
      console.error('Teacher image gateway error', error);
      return json({ error: 'Photo service is temporarily unavailable.' }, 503, headers);
    }
  },
};
