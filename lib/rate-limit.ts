// A small in-memory rate limit: at most `limit` requests per `windowMs` for
// each key (we use the caller's IP address). It protects the one endpoint
// that calls a paid model from being hammered.
//
// It lives in memory, so it resets when the server restarts, and on a host
// that runs several instances each instance counts on its own.

interface Window {
  start: number; // when this key's current window began (ms)
  count: number; // requests seen in the current window
}

// On globalThis so every API route shares one copy (see lib/data.ts).
const shared = globalThis as typeof globalThis & { __rateWindows?: Map<string, Window> };
const windows = (shared.__rateWindows ??= new Map<string, Window>());

// Past this many keys, expired entries are cleared so the map cannot grow forever.
const MAX_KEYS = 5000;

/** True if this request is allowed, false if the key is over its limit. */
export function allowRequest(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  if (windows.size > MAX_KEYS) {
    for (const [k, w] of windows) {
      if (now - w.start >= windowMs) windows.delete(k);
    }
  }

  const current = windows.get(key);
  if (!current || now - current.start >= windowMs) {
    windows.set(key, { start: now, count: 1 });
    return true;
  }
  current.count += 1;
  return current.count <= limit;
}

/**
 * The caller's IP address. Behind a proxy (Vercel) it is the first entry of
 * the x-forwarded-for header; locally there is no header, so every local
 * request shares one key.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0].trim() || request.headers.get("x-real-ip") || "local";
}
