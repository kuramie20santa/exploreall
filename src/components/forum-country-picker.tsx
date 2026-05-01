"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, Search, X } from "lucide-react";

type Country = { code: string; name: string; flag_emoji: string | null; continent: string | null };

export function ForumCountryPicker({ countries }: { countries: Country[] }) {
  const router = useRouter();
  const search = useSearchParams();
  const current = search.get("country") || "";

  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [continent, setContinent] = React.useState<string>("all");
  const ref = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selected = countries.find((c) => c.code === current);

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
        c.code.toLowerCase() === term
      );
    });
  }, [countries, q, continent]);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Focus input when opening
  React.useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  function navTo(code: string | null) {
    const params = new URLSearchParams(Array.from(search.entries()));
    if (code) params.set("country", code);
    else params.delete("country");
    router.push(`/forum${params.toString() ? `?${params}` : ""}`);
    setOpen(false);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    navTo(null);
  }

  return (
    <div ref={ref} className="relative z-50">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex h-9 items-center gap-2 px-3 rounded-full text-sm font-medium leading-none press transition hairline hover:bg-muted ${
          selected ? "bg-foreground text-background hairline-0" : "bg-card"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <>
            <span>{selected.flag_emoji}</span>
            <span className="truncate max-w-[180px]">{selected.name}</span>
            <span
              role="button"
              onClick={clear}
              aria-label="Clear country"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-background/20"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          </>
        ) : (
          <>
            <span>All countries</span>
            <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
          </>
        )}
      </button>

      {open ? (
        <div className="absolute z-50 mt-2 w-[min(92vw,420px)] rounded-2xl bg-card hairline shadow-glow p-3 animate-scaleIn origin-top">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${countries.length} countries…`}
              className="h-10 w-full rounded-xl bg-muted pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="mt-2 flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {continents.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setContinent(c)}
                className={`inline-flex h-7 items-center justify-center px-2.5 rounded-full text-[11px] font-medium leading-none whitespace-nowrap transition ${
                  continent === c ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {c === "all" ? "All" : c}
              </button>
            ))}
          </div>

          <div className="mt-2 max-h-72 overflow-y-auto rounded-xl">
            <button
              type="button"
              onClick={() => navTo(null)}
              className={`flex w-full items-center justify-between px-3 py-2 rounded-xl text-sm hover:bg-muted transition ${!current ? "bg-muted" : ""}`}
            >
              <span className="font-medium">All countries</span>
              {!current ? <Check className="h-4 w-4" /> : null}
            </button>
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">No countries match.</p>
            ) : (
              filtered.map((c) => {
                const on = c.code === current;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => navTo(c.code)}
                    className={`flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-muted transition ${on ? "bg-muted" : ""}`}
                  >
                    <span className="text-lg leading-none">{c.flag_emoji}</span>
                    <span className="flex-1 text-left truncate">{c.name}</span>
                    <span className="text-[11px] text-muted-foreground">{c.code}</span>
                    {on ? <Check className="h-4 w-4" /> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
