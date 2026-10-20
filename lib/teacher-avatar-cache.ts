// Dependency-injected so cache isolation, retries and aborts can be tested without Auth.
type Entry = { url: string; expiresAt: number };
type Signed = { path: string | null; signedUrl: string | null };
type Dependencies = {
  sign: (paths: string[], signal: AbortSignal) => Promise<Signed[]>;
  storage: () => Pick<Storage, "getItem" | "setItem" | "removeItem"> | null;
  validUrl: (url: string) => boolean;
  now?: () => number;
  timeoutMs?: number;
  retryTimeoutMs?: number;
  retryDelayMs?: number;
};
export const AVATAR_URL_SECONDS = 3600;
const REFRESH_MARGIN_MS = 5 * 60_000;
const PREFIX = "nepsom:teacher-avatars:v1:";

export function createTeacherAvatarCache(deps: Dependencies) {
  const now = deps.now || Date.now;
  let scope = "";
  let generation = 0;
  const entries = new Map<string, Entry>();
  const pending = new Map<string, Promise<string | null>>();
  const queued = new Map<string, (url: string | null) => void>();
  const controllers = new Set<AbortController>();
  let flushTimer: ReturnType<typeof setTimeout> | undefined;
  let flushing = false;

  function persist() {
    if (!scope) return;
    try {
      const current = [...entries].filter(([, entry]) => entry.expiresAt > now() + REFRESH_MARGIN_MS).slice(-200);
      deps.storage()?.setItem(PREFIX + scope, JSON.stringify(current));
    } catch { /* Restricted/full session storage must not prevent loading. */ }
  }

  function activate(nextScope: string) {
    if (scope === nextScope) return;
    const previous = scope;
    generation++;
    flushing = false;
    for (const controller of controllers) controller.abort();
    controllers.clear();
    clearTimeout(flushTimer);
    flushTimer = undefined;
    for (const resolve of queued.values()) resolve(null);
    queued.clear();
    pending.clear();
    entries.clear();
    scope = nextScope;
    try {
      if (previous) deps.storage()?.removeItem(PREFIX + previous);
      if (!scope) return;
      const saved: unknown = JSON.parse(deps.storage()?.getItem(PREFIX + scope) || "[]");
      if (!Array.isArray(saved)) return;
      for (const row of saved.slice(-200)) {
        if (!Array.isArray(row) || typeof row[0] !== "string") continue;
        const entry = row[1];
        if (entry && typeof entry.url === "string" && deps.validUrl(entry.url) &&
            typeof entry.expiresAt === "number" && entry.expiresAt > now() + REFRESH_MARGIN_MS &&
            entry.expiresAt <= now() + AVATAR_URL_SECONDS * 1000) entries.set(row[0], entry);
      }
    } catch { /* Ignore corrupted or unavailable session storage. */ }
  }

  function peek(requestScope: string, path: string) {
    if (!scope || requestScope !== scope) return null;
    const entry = entries.get(path);
    return entry && entry.expiresAt > now() + REFRESH_MARGIN_MS ? entry.url : null;
  }

  async function signWithTimeout(paths: string[], timeoutMs: number) {
    const controller = new AbortController();
    controllers.add(controller);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        deps.sign(paths, controller.signal),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () => reject(new Error("Avatar request aborted")), { once: true });
          timer = setTimeout(() => controller.abort(), timeoutMs);
        }),
      ]);
    } finally {
      clearTimeout(timer);
      controllers.delete(controller);
    }
  }

  async function flush() {
    flushTimer = undefined;
    flushing = true;
    const batch = [...queued.entries()].slice(0, 20);
    for (const [path] of batch) queued.delete(path);
    const startedGeneration = generation;
    const startedAt = now();
    try {
      let signed: Signed[];
      try {
        signed = await signWithTimeout(batch.map(([path]) => path), deps.timeoutMs ?? 3000);
      } catch {
        // One bounded background retry; no page loading state depends on this.
        if (generation !== startedGeneration) return;
        await new Promise((resolve) => setTimeout(resolve, deps.retryDelayMs ?? 2000));
        if (generation !== startedGeneration) return;
        signed = await signWithTimeout(batch.map(([path]) => path), deps.retryTimeoutMs ?? 30_000);
      }
      if (generation !== startedGeneration) return;
      const requested = new Set(batch.map(([path]) => path));
      for (const item of signed) {
        if (item.path && requested.has(item.path) && item.signedUrl && deps.validUrl(item.signedUrl)) {
          entries.set(item.path, { url: item.signedUrl, expiresAt: startedAt + AVATAR_URL_SECONDS * 1000 });
        }
      }
      persist();
    } catch { /* Keep initials if Storage is unavailable. Retry on next visit/online. */ }
    finally {
      for (const [path, resolve] of batch) {
        if (generation === startedGeneration) pending.delete(path);
        resolve(generation === startedGeneration ? peek(scope, path) : null);
      }
      if (generation === startedGeneration) {
        flushing = false;
        if (queued.size && !flushTimer) flushTimer = setTimeout(() => void flush(), 20);
      }
    }
  }

  function get(requestScope: string, path: string) {
    if (!requestScope || requestScope !== scope || !path) return Promise.resolve(null);
    const cached = peek(requestScope, path);
    if (cached) return Promise.resolve(cached);
    const inflight = pending.get(path);
    if (inflight) return inflight;
    const promise = new Promise<string | null>((resolve) => queued.set(path, resolve));
    pending.set(path, promise);
    if (!flushTimer && !flushing) flushTimer = setTimeout(() => void flush(), 20);
    return promise;
  }

  function invalidate(path: string) { entries.delete(path); persist(); }
  function refreshIn(requestScope: string, path: string) {
    const entry = requestScope === scope ? entries.get(path) : null;
    return entry ? Math.max(1000, entry.expiresAt - now() - REFRESH_MARGIN_MS + 100) : 60_000;
  }
  return { activate, peek, get, invalidate, refreshIn };
}
