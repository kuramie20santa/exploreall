// Fetch a "lead image" from Wikipedia for a given capital city or country.
// Uses Wikipedia REST API summary endpoint — free, no API key, CORS-friendly.
// Server-side cached for 24h via Next.js fetch revalidate.

const ENDPOINT = "https://en.wikipedia.org/api/rest_v1/page/summary/";

/**
 * Returns a Wikipedia thumbnail URL for the given capital, falling back to
 * the country name if the capital can't be resolved. Returns null if both fail.
 */
export async function getCapitalImage(
  capital: string | null | undefined,
  countryName: string
): Promise<string | null> {
  const candidates = [capital, countryName].filter(Boolean) as string[];

  for (const term of candidates) {
    const url = ENDPOINT + encodeURIComponent(term.replace(/\s+/g, "_"));
    try {
      const res = await fetch(url, {
        next: { revalidate: 60 * 60 * 24 }, // 24h
        headers: { Accept: "application/json" },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const img: string | undefined =
        data?.originalimage?.source ||
        data?.thumbnail?.source ||
        undefined;
      if (img) return img;
    } catch {
      // network or upstream error — try the next candidate
      continue;
    }
  }
  return null;
}

/**
 * Look up images for many countries in parallel. Used by the home page so the
 * 8 popular countries get their hover images pre-loaded server-side.
 */
export async function getCapitalImages(
  countries: { code: string; capital: string | null; name: string }[]
): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  const results = await Promise.all(
    countries.map(async (c) => [c.code, await getCapitalImage(c.capital, c.name)] as const)
  );
  for (const [code, url] of results) map.set(code, url);
  return map;
}
