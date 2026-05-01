"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/card";
import { safetyColor } from "@/lib/utils";

type Country = { code: string; name: string; flag_emoji: string | null; capital: string | null; continent: string | null };
type Rating = { country_code: string; score: number; level: string };

export function CountryGrid({ countries, ratings, defaultQuery = "" }: { countries: Country[]; ratings: Rating[]; defaultQuery?: string }) {
  const [q, setQ] = React.useState(defaultQuery);
  const [continent, setContinent] = React.useState<string>("all");

  const ratingByCode = React.useMemo(() => new Map(ratings.map((r) => [r.country_code, r])), [ratings]);
  const continents = React.useMemo(() => {
    const set = new Set<string>();
    for (const c of countries) if (c.continent) set.add(c.continent);
    return ["all", ...Array.from(set).sort()];
  }, [countries]);

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    return countries.filter((c) => {
      if (continent !== "all" && c.continent !== continent) return false;
      if (!term) return true;
      return (
        c.name.toLowerCase().includes(term) ||
        (c.capital ?? "").toLowerCase().includes(term) ||
        c.code.toLowerCase() === term
      );
    });
  }, [countries, q, continent]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${countries.length} countries…`}
            className="h-11 w-full rounded-2xl bg-muted pl-10 pr-4 text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {continents.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setContinent(c)}
              className={`inline-flex h-9 items-center justify-center px-4 rounded-full text-xs font-medium leading-none whitespace-nowrap press transition ${
                continent === c ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {c === "all" ? "All continents" : c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center animate-fadeIn">No countries match.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger">
          {filtered.map((c) => {
            const r = ratingByCode.get(c.code);
            return (
              <Link
                key={c.code}
                href={`/country/${c.code}`}
                className="rounded-2xl bg-card hairline p-4 hover:bg-muted transition flex items-center gap-3 lift press"
              >
                <span className="text-2xl">{c.flag_emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.capital ?? "—"} · {c.continent ?? "—"}</p>
                </div>
                {r ? <Badge className={safetyColor(r.level)}>{r.score}</Badge> : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
