"use client";

// In-memory cache of capital → image URL for the current page session.
// Used by client components that fetch images lazily on first hover so the
// long country list doesn't make 250 network requests up front.

const cache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

const ENDPOINT = "https://en.wikipedia.org/api/rest_v1/page/summary/";

export function fetchCapitalImage(
  capital: string | null | undefined,
  countryName: string
): Promise<string | null> {
  const key = (capital || countryName).toLowerCase();
  if (cache.has(key)) return Promise.resolve(cache.get(key) ?? null);
  const existing = inflight.get(key);
  if (existing) return existing;

  const candidates = [capital, countryName].filter(Boolean) as string[];

  const p = (async () => {
    for (const term of candidates) {
      const url = ENDPOINT + encodeURIComponent(term.replace(/\s+/g, "_"));
      try {
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) continue;
        const data = await res.json();
        const img: string | undefined =
          data?.originalimage?.source || data?.thumbnail?.source || undefined;
        if (img) {
          cache.set(key, img);
          return img;
        }
      } catch {
        continue;
      }
    }
    cache.set(key, null);
    return null;
  })();

  inflight.set(key, p);
  p.finally(() => inflight.delete(key));
  return p;
}
