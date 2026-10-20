import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import ts from 'typescript';

async function load(path, rewrite = (source) => source) {
  const source = rewrite(fs.readFileSync(new URL(path, import.meta.url), 'utf8'));
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import(`data:text/javascript,${encodeURIComponent(js)}`);
}
const { createTeacherAvatarCache } = await load('../lib/teacher-avatar-cache.ts');
const { validateTeacherPhoto, avatarDimensions, prepareTeacherPhoto } = await load('../lib/teacher-photo.ts');
const url = (path) => `https://example.test/sign/${path}?token=private`;
const signed = (paths) => paths.map((path) => ({ path, signedUrl: url(path) }));
function setup(options = {}) {
  const saved = new Map();
  const calls = [];
  const deps = {
    storage: () => ({ getItem: (key) => saved.get(key), setItem: (key, value) => saved.set(key, value), removeItem: (key) => saved.delete(key) }),
    validUrl: (value) => value.startsWith('https://example.test/sign/'),
    sign: async (paths) => { calls.push(paths); return signed(paths); },
    timeoutMs: 15, retryTimeoutMs: 15, retryDelayMs: 1,
    ...options,
  };
  const cache = createTeacherAvatarCache(deps);
  cache.activate('user:school');
  return { cache, deps, calls, saved };
}

test('batches visible requests and deduplicates the same photo across cards/profile/edit', async () => {
  const { cache, calls } = setup();
  const first = cache.get('user:school', 'a');
  assert.equal(first, cache.get('user:school', 'a'));
  assert.deepEqual(await Promise.all([first, cache.get('user:school', 'b')]), [url('a'), url('b')]);
  assert.deepEqual(calls, [['a', 'b']]);
  assert.equal(await cache.get('user:school', 'a'), url('a'));
  assert.equal(calls.length, 1);
});

test('reuses URLs after reload and refreshes before expiry', async () => {
  let now = 1000;
  const { cache, deps, calls } = setup({ now: () => now });
  await cache.get('user:school', 'a');
  const reloaded = createTeacherAvatarCache(deps);
  reloaded.activate('user:school');
  assert.equal(await reloaded.get('user:school', 'a'), url('a'));
  assert.equal(calls.length, 1);
  now += 56 * 60_000;
  assert.equal(reloaded.peek('user:school', 'a'), null);
  await reloaded.get('user:school', 'a');
  assert.equal(calls.length, 2);
});

test('changed paths and removal never reuse the previous photo', async () => {
  const { cache, calls } = setup();
  await cache.get('user:school', 'old');
  assert.equal(await cache.get('user:school', 'new'), url('new'));
  cache.invalidate('old');
  assert.equal(cache.peek('user:school', 'old'), null);
  assert.equal(await cache.get('user:school', ''), null);
  assert.equal(calls.length, 2);
});

test('a hanging Storage request is aborted, retried once, and settles without throwing', async () => {
  let calls = 0, aborts = 0;
  const { cache } = setup({ sign: (_paths, signal) => {
    calls++;
    signal.addEventListener('abort', () => aborts++);
    return new Promise(() => {});
  } });
  assert.equal(await cache.get('user:school', 'a'), null);
  assert.equal(calls, 2);
  assert.equal(aborts, 2);
});

test('transient failure can recover in the background', async () => {
  let calls = 0;
  const { cache } = setup({ sign: async (paths) => { if (++calls === 1) throw new Error('temporary'); return signed(paths); } });
  assert.equal(await cache.get('user:school', 'a'), url('a'));
  assert.equal(calls, 2);
});

test('sign out/account or school change clears cached bearer URLs and aborts stale requests', async () => {
  const { cache, saved } = setup();
  await cache.get('user:school', 'a');
  cache.activate('other:school');
  assert.equal(saved.size, 0);
  assert.equal(cache.peek('user:school', 'a'), null);
  assert.equal(await cache.get('user:school', 'a'), null);
  cache.activate('');
  assert.equal(await cache.get('other:school', 'a'), null);
});

test('an old in-flight result cannot enter a newly signed-in account cache', async () => {
  let started;
  const ready = new Promise((resolve) => { started = resolve; });
  const { cache } = setup({ sign: async () => { started(); return new Promise(() => {}); } });
  const old = cache.get('user:school', 'a');
  await ready;
  cache.activate('other:school');
  assert.equal(await old, null);
  assert.equal(cache.peek('other:school', 'a'), null);
});

test('blocked session storage and per-file missing URLs do not break avatar loading', async () => {
  const { cache } = setup({ storage: () => { throw new Error('blocked'); }, sign: async () => [{ path: 'a', signedUrl: null }, ...signed(['b'])] });
  assert.deepEqual(await Promise.all([cache.get('user:school', 'a'), cache.get('user:school', 'b')]), [null, url('b')]);
});

test('never caches an unrelated path or foreign URL from a malformed response', async () => {
  const { cache } = setup({ sign: async () => [{ path: 'a', signedUrl: 'https://evil.test/image' }, ...signed(['other'])] });
  assert.equal(await cache.get('user:school', 'a'), null);
  assert.equal(cache.peek('user:school', 'other'), null);
});

test('caps batch size at 20 and resolves later queued requests', async () => {
  const { cache, calls } = setup();
  const paths = Array.from({ length: 25 }, (_, i) => `photo-${i}`);
  assert.deepEqual(await Promise.all(paths.map((path) => cache.get('user:school', path))), paths.map(url));
  assert.deepEqual(calls.map((batch) => batch.length), [20, 5]);
});

test('upload validation and thumbnail dimensions preserve aspect ratio without upscaling', () => {
  assert.equal(validateTeacherPhoto({ type: 'image/jpeg', size: 1000 }), '');
  assert.match(validateTeacherPhoto({ type: 'image/svg+xml', size: 1000 }), /JPG/);
  assert.match(validateTeacherPhoto({ type: 'image/png', size: 3 * 1024 * 1024 }), /2 MB/);
  assert.deepEqual(avatarDimensions(2000, 1000), { width: 256, height: 128 });
  assert.deepEqual(avatarDimensions(1000, 2000), { width: 128, height: 256 });
  assert.deepEqual(avatarDimensions(64, 64), { width: 64, height: 64 });
});

test('upload preparation writes a small WebP and always releases its temporary object URL', async () => {
  const original = { Image: globalThis.Image, document: globalThis.document, create: URL.createObjectURL, revoke: URL.revokeObjectURL };
  let revoked = 0, quality, drawn;
  const canvas = {
    width: 0, height: 0,
    getContext: () => ({ drawImage: (...args) => { drawn = args.slice(3); } }),
    toBlob: (callback, type, amount) => { quality = amount; callback(new Blob(['optimized'], { type })); },
  };
  globalThis.Image = class { naturalWidth = 1200; naturalHeight = 1600; async decode() {} };
  globalThis.document = { createElement: () => canvas };
  URL.createObjectURL = () => 'blob:test';
  URL.revokeObjectURL = () => revoked++;
  try {
    const result = await prepareTeacherPhoto(new File(['photo'], 'photo.jpg', { type: 'image/jpeg' }));
    assert.equal(result.type, 'image/webp');
    assert.equal(result.name, 'profile.webp');
    assert.equal(quality, 0.82);
    assert.deepEqual(drawn, [192, 256]);
    assert.equal(revoked, 1);
    globalThis.Image = class { async decode() { throw new Error('Invalid image'); } };
    await assert.rejects(prepareTeacherPhoto(new File(['bad'], 'bad.jpg', { type: 'image/jpeg' })), /Invalid image/);
    assert.equal(revoked, 2);
  } finally {
    globalThis.Image = original.Image;
    globalThis.document = original.document;
    URL.createObjectURL = original.create;
    URL.revokeObjectURL = original.revoke;
  }
});

test('teacher page no longer waits for any Storage signing request', () => {
  const page = fs.readFileSync(new URL('../app/principal/teachers/page.tsx', import.meta.url), 'utf8');
  const loader = page.slice(page.indexOf('async function loadTeachers()'), page.indexOf('async function loadOverview()'));
  assert.doesNotMatch(loader, /createSignedUrl|teacherAvatarCache\.get|\.storage/);
  assert.match(page, /TeacherAvatar/);
  assert.match(page, /select\("id"\)\.single\(\)/);
  assert.match(page, /check\.data\?\.avatar_path !== uploadedPath/);
});

test('cleanup retries a timeout, preserves active photos, and never deletes for another user', async () => {
  const saved = new Map();
  globalThis.sessionStorage = { getItem: (key) => saved.get(key), setItem: (key, value) => saved.set(key, value) };
  let signedIn = 'user', activePath = 'new', linkedPath = 'new', failures = 1;
  const deleted = [];
  globalThis.__avatarCleanupTest = {
    teacherAvatarCache: { invalidate() {} },
    supabase: {
      auth: { getSession: async () => ({ data: { session: { user: { id: signedIn } } } }) },
      from: (table) => ({ select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ error: null, data: table === 'teachers' ? { id: 'teacher', avatar_path: activePath, user_id: 'linked' } : { avatar_path: linkedPath } }) }),
      storage: { from: () => ({ remove: async ([path]) => { deleted.push(path); return { error: failures-- > 0 ? new Error('timeout') : null }; } }) },
    },
  };
  const { cleanupTeacherAvatar } = await load('../lib/teacher-avatar-cleanup.ts', (source) => source
    .replace(/import .* from .*;\n/g, '')
    .replace('type Job', 'const { supabase, teacherAvatarCache } = globalThis.__avatarCleanupTest;\ntype Job'));
  assert.equal(await cleanupTeacherAvatar('user:school', { teacherId: 'teacher', path: 'old' }), true);
  assert.deepEqual(deleted, ['old', 'old']);
  assert.equal(await cleanupTeacherAvatar('user:school', { teacherId: 'teacher', path: 'new' }), false);
  linkedPath = 'old-linked';
  assert.equal(await cleanupTeacherAvatar('user:school', { teacherId: 'teacher', path: 'old-linked' }), false);
  signedIn = 'another-user';
  assert.equal(await cleanupTeacherAvatar('user:school', { teacherId: 'teacher', path: 'private' }), false);
  assert.deepEqual(deleted, ['old', 'old']);
  activePath = '';
  delete globalThis.__avatarCleanupTest;
  delete globalThis.sessionStorage;
});
