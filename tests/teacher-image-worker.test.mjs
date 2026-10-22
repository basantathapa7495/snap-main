import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { webcrypto } from 'node:crypto';

globalThis.crypto ||= webcrypto;
const source = fs.readFileSync(new URL('../cloudflare/teacher-images/worker.js', import.meta.url), 'utf8');
const { default: worker } = await import(`data:text/javascript,${encodeURIComponent(source)}`);
const school = 'e1ef34a5-dd3f-49cd-8136-0e5e2ec773c6';
const teacherId = '37c72a1f-2d74-468f-b764-5a752e736916';
const userId = '762247c1-f8b3-4c8e-a91d-8c7d538fc212';
const path = `${school}/${teacherId}/16941e52-6b5a-4776-81b9-8e61e1dcb838.webp`;
const origin = 'https://nepsom.xyz';
const env = {
  SUPABASE_URL: 'https://project.test', SUPABASE_PUBLISHABLE_KEY: 'publishable',
  ALLOWED_ORIGINS: origin, SIGNING_SECRET: 'secret-for-tests-only',
};

function setup() {
  const objects = new Map();
  const row = { id: teacherId, avatar_path: null, school_id: school, user_id: userId };
  env.AVATARS = {
    put: async (key, bytes, options) => objects.set(key, { bytes, httpMetadata: options.httpMetadata }),
    head: async (key) => objects.has(key) ? { size: objects.get(key).bytes.byteLength } : null,
    get: async (key) => objects.has(key) ? { body: objects.get(key).bytes, httpMetadata: objects.get(key).httpMetadata } : null,
    delete: async (key) => objects.delete(key),
  };
  const original = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    assert.equal(opts.redirect, 'manual');
    const token = opts.headers.Authorization;
    if (token !== 'Bearer principal' && token !== 'Bearer teacher') return Response.json({ error: 'unauthorized' }, { status: 401 });
    if (url.endsWith('/auth/v1/user')) return Response.json({ id: token === 'Bearer teacher' ? userId : '14e01ad6-b18f-4eb0-aad0-8288db5db377' });
    if (url.includes('/rest/v1/profiles')) return Response.json([{ school_id: school, role: token === 'Bearer teacher' ? 'teacher' : 'principal', avatar_path: row.avatar_path }]);
    if (url.includes('/rest/v1/teachers')) {
      const query = new URL(url).searchParams;
      if (query.has('id') && query.get('id') !== `eq.${teacherId}`) return Response.json([]);
      if (url.includes('avatar_path=in.') && !url.includes(encodeURIComponent(`"${row.avatar_path}"`))) return Response.json([]);
      return Response.json([row]);
    }
    throw new Error(`Unexpected ${url}`);
  };
  return { row, objects, restore: () => { globalThis.fetch = original; } };
}

function request(method, endpoint, token, body, contentType) {
  return new Request(`https://images.nepsom.xyz${endpoint}`, {
    method, headers: { Origin: origin, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(contentType ? { 'Content-Type': contentType } : {}) }, body,
  });
}

test('private uploads, authorized signing, expiry, and safe replacement cleanup', async () => {
  const { row, objects, restore } = setup();
  try {
    const bytes = new Uint8Array([82, 73, 70, 70, 12, 0, 0, 0, 87, 69, 66, 80, 1]);
    assert.equal((await worker.fetch(request('PUT', `/object/${path}`, null, bytes, 'image/webp'), env)).status, 401);
    assert.equal((await worker.fetch(request('PUT', `/object/${path}`, 'principal', bytes, 'image/png'), env)).status, 415);
    assert.equal((await worker.fetch(request('PUT', `/object/${path}`, 'principal', bytes, 'image/webp'), env)).status, 201);
    assert.equal(objects.has(path), true);
    assert.equal((await worker.fetch(request('POST', '/sign', 'principal', JSON.stringify({ paths: [path] }), 'application/json'), env)).status, 200);
    row.avatar_path = path;
    const signed = await worker.fetch(request('POST', '/sign', 'teacher', JSON.stringify({ paths: [path] }), 'application/json'), env);
    const url = (await signed.json()).urls[0].signedUrl;
    assert.equal((await worker.fetch(new Request(url), env)).status, 200);
    assert.equal((await worker.fetch(new Request(url.replace('sig=', 'sig=0')), env)).status, 403);
    assert.equal((await worker.fetch(request('DELETE', `/object/${path}`, 'principal'), env)).status, 409);
    row.avatar_path = null;
    assert.equal((await worker.fetch(request('DELETE', `/object/${path}`, 'principal'), env)).status, 200);
    assert.equal(objects.has(path), false);
    assert.deepEqual((await (await worker.fetch(request('POST', '/sign', 'teacher', JSON.stringify({ paths: [path] }), 'application/json'), env)).json()).urls, []);
  } finally { restore(); }
});

test('different school, invalid objects, and foreign origins are refused', async () => {
  const { restore } = setup();
  try {
    const foreign = `3a854314-ac96-4743-bd26-bc8ae3cf18dc/${teacherId}/16941e52-6b5a-4776-81b9-8e61e1dcb838.webp`;
    assert.equal((await worker.fetch(request('PUT', `/object/${foreign}`, 'principal', 'RIFF0000WEBP', 'image/webp'), env)).status, 404);
    assert.equal((await worker.fetch(request('PUT', `/object/${path}`, 'principal', 'not-an-image', 'image/webp'), env)).status, 413);
    const evil = new Request('https://images.nepsom.xyz/sign', { method: 'POST', headers: { Origin: 'https://evil.test', Authorization: 'Bearer principal' }, body: '{}' });
    assert.equal((await worker.fetch(evil, env)).status, 403);
  } finally { restore(); }
});
