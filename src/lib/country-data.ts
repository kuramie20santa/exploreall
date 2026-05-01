// Server-side fetchers for live country stats and FX rates.
// Both have aggressive caching so repeated page loads are cheap.

export type CountryExtras = {
  iso2: string;
  iso3: string | null;
  official_name: string | null;
  region: string | null;
  subregion: string | null;
  population: number | null;
  area_km2: number | null;
  languages: string[];
  timezones: string[];
  calling_code: string | null;
  drives_on: "left" | "right" | null;
  currency_code: string | null;
  currency_symbol: string | null;
  currency_name: string | null;
  flag_svg: string | null;
  maps_url: string | null;
  latlng: [number, number] | null;
};

export async function getCountryExtras(code: string): Promise<CountryExtras | null> {
  try {
    const url = `https://restcountries.com/v3.1/alpha/${encodeURIComponent(code)}?fields=cca2,cca3,name,population,area,currencies,languages,timezones,idd,car,maps,flags,latlng,subregion,region`;
    const res = await fetch(url, { next: { revalidate: 86400 } }); // 24h
    if (!res.ok) return null;
    const data = await res.json();
    const c = Array.isArray(data) ? data[0] : data;
    if (!c) return null;

    const currencyEntries = Object.entries(c.currencies || {});
    const [cur_code, cur_obj] = currencyEntries[0] || [null, null];

    const idd = c.idd || {};
    const calling_code =
      idd.root && idd.suffixes?.length
        ? `${idd.root}${idd.suffixes.length === 1 ? idd.suffixes[0] : ""}`
        : null;

    return {
      iso2: c.cca2 || code.toUpperCase(),
      iso3: c.cca3 || null,
      official_name: c.name?.official || null,
      region: c.region || null,
      subregion: c.subregion || null,
      population: typeof c.population === "number" ? c.population : null,
      area_km2: typeof c.area === "number" ? c.area : null,
      languages: c.languages ? Object.values(c.languages) as string[] : [],
      timezones: Array.isArray(c.timezones) ? c.timezones : [],
      calling_code,
      drives_on: c.car?.side || null,
      currency_code: cur_code,
      currency_symbol: (cur_obj as any)?.symbol || null,
      currency_name: (cur_obj as any)?.name || null,
      flag_svg: c.flags?.svg || null,
      maps_url: c.maps?.googleMaps || null,
      latlng: Array.isArray(c.latlng) && c.latlng.length === 2 ? c.latlng as [number, number] : null,
    };
  } catch {
    return null;
  }
}

// FX rates are returned with USD as base. Convert anywhere with /
export type FxRates = {
  base: string;
  rates: Record<string, number>;
  updated_at: string;
};

export async function getFxRates(): Promise<FxRates | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 }, // 1h
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.result !== "success") return null;
    return {
      base: data.base_code,
      rates: data.rates,
      updated_at: data.time_last_update_utc,
    };
  } catch {
    return null;
  }
}

// Convert `amount` of `from` to `to` using USD-based rates.
// 1 from = (rates[to] / rates[from]) * amount
export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>
): number | null {
  const f = rates[from];
  const t = rates[to];
  if (!f || !t) return null;
  return (amount * t) / f;
}

export function formatMoney(n: number, code: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      maximumFractionDigits: n >= 100 ? 0 : 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${code}`;
  }
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat(undefined).format(n);
}
