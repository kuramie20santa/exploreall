"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Compass, Globe2, MessageCircle, Search, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Country = { code: string; name: string; capital: string | null; flag_emoji: string | null };
type Tag = { slug: string; label: string };
type Suggestion =
  | { kind: "country"; href: string; key: string; primary: string; secondary?: string; flag?: string | null }
  | { kind: "city";    href: string; key: string; primary: string; secondary?: string; flag?: string | null }
  | { kind: "tag";     href: string; key: string; primary: string; secondary?: string }
  | { kind: "post";    href: string; key: string; primary: string; secondary?: string }
  | { kind: "search";  href: string; key: string; primary: string; secondary?: string };

const MAX_RESULTS = 8;

export function SearchBox() {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const [countries, setCountries] = React.useState<Country[]>([]);
  const [cities, setCities] = React.useState<{ name: string; country_code: string }[]>([]);
  const [tags, setTags] = React.useState<Tag[]>([]);
  const [posts, setPosts] = React.useState<{ id: string; title: string; city: string | null; country_code: string | null }[]>([]);
  const [postLoading, setPostLoading] = React.useState(false);

  // Load reference data once
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: cs }, { data: ct }, { data: tg }] = await Promise.all([
        supabase.from("countries").select("code,name,capital,flag_emoji"),
        supabase.from("cities").select("name,country_code"),
        supabase.from("tags").select("slug,label"),
      ]);
      if (cancelled) return;
      setCountries(cs ?? []);
      setCities(ct ?? []);
      setTags(tg ?? []);
    })();
    return () => { cancelled = true; };
  }, [supabase]);

  // Debounced post search
  React.useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setPosts([]); return; }
    const timer = setTimeout(async () => {
      setPostLoading(true);
      const { data } = await supabase
        .from("posts")
        .select("id,title,city,country_code")
        .eq("is_deleted", false)
        .or(`title.ilike.%${term}%,city.ilike.%${term}%`)
        .order("like_count", { ascending: false })
        .limit(4);
      setPosts(data ?? []);
      setPostLoading(false);
    }, 220);
    return () => clearTimeout(timer);
  }, [q, supabase]);

  // Close on outside click / escape
  React.useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Build suggestions
  const suggestions = React.useMemo<Suggestion[]>(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];

    const out: Suggestion[] = [];

    // Countries — match name, capital, or 2-letter code
    const countryMatches = countries
      .filter((c) =>
        c.name.toLowerCase().includes(term) ||
        (c.capital ?? "").toLowerCase().includes(term) ||
        c.code.toLowerCase() === term
      )
      .slice(0, 4);
    for (const c of countryMatches) {
      out.push({
        kind: "country",
        key: `country-${c.code}`,
        href: `/country/${c.code}`,
        primary: c.name,
        secondary: c.capital ? `Capital: ${c.capital}` : undefined,
        flag: c.flag_emoji,
      });
    }

    // Cities (avoid duplicating an already-listed capital)
    const seen = new Set(countryMatches.map((c) => c.name.toLowerCase()));
    const cityMatches = cities
      .filter((ct) => ct.name.toLowerCase().includes(term) && !seen.has(ct.name.toLowerCase()))
      .slice(0, 3);
    for (const ct of cityMatches) {
      const country = countries.find((c) => c.code === ct.country_code);
      out.push({
        kind: "city",
        key: `city-${ct.country_code}-${ct.name}`,
        href: `/forum?country=${ct.country_code}`,
        primary: ct.name,
        secondary: country?.name ?? "",
        flag: country?.flag_emoji ?? null,
      });
    }

    // Tags
    const tagMatches = tags
      .filter((t) => t.label.toLowerCase().includes(term) || t.slug.includes(term))
      .slice(0, 3);
    for (const t of tagMatches) {
      out.push({
        kind: "tag",
        key: `tag-${t.slug}`,
        href: `/forum?tag=${t.slug}`,
        primary: `#${t.label}`,
        secondary: "Tag",
      });
    }

    // Posts (server-fetched, debounced)
    for (const p of posts) {
      out.push({
        kind: "post",
        key: `post-${p.id}`,
        href: `/forum/${p.id}`,
        primary: p.title,
        secondary: p.city ?? "",
      });
    }

    // Always offer "Search posts for X" at the bottom
    out.push({
      kind: "search",
      key: "search-all",
      href: `/forum?q=${encodeURIComponent(q.trim())}`,
      primary: `Search posts for "${q.trim()}"`,
      secondary: "Press Enter",
    });

    return out.slice(0, MAX_RESULTS);
  }, [q, countries, cities, tags, posts]);

  React.useEffect(() => { setActive(0); }, [q]);

  function go(href: string) {
    setOpen(false);
    setQ("");
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = suggestions[active];
      if (target) go(target.href);
      else if (q.trim()) go(`/forum?q=${encodeURIComponent(q.trim())}`);
    }
  }

  const showPanel = open && (q.trim().length > 0);

  return (
    <div ref={wrapRef} className="relative hidden md:block">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search countries, cities, tags, posts…"
        className="h-9 w-full rounded-full bg-muted pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
        aria-autocomplete="list"
        aria-expanded={showPanel}
        aria-controls="search-suggestions"
      />

      {showPanel ? (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-2 rounded-2xl bg-card hairline shadow-glow overflow-hidden animate-scaleIn origin-top"
        >
          {suggestions.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              {postLoading ? "Searching…" : "No results."}
            </p>
          ) : (
            <ul className="py-1.5">
              {suggestions.map((s, i) => (
                <li key={s.key}>
                  <Link
                    href={s.href}
                    onClick={(e) => { e.preventDefault(); go(s.href); }}
                    onMouseEnter={() => setActive(i)}
                    role="option"
                    aria-selected={i === active}
                    className={
                      "flex items-center gap-3 px-3 py-2.5 mx-1.5 rounded-xl text-sm transition " +
                      (i === active ? "bg-muted" : "hover:bg-muted/70")
                    }
                  >
                    <SuggestionIcon kind={s.kind} flag={(s as any).flag} />
                    <span className="flex-1 min-w-0">
                      <span className="block font-medium truncate">{s.primary}</span>
                      {s.secondary ? (
                        <span className="block text-[11px] text-muted-foreground truncate">{s.secondary}</span>
                      ) : null}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide hidden sm:inline">
                      {s.kind}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SuggestionIcon({ kind, flag }: { kind: Suggestion["kind"]; flag?: string | null }) {
  if ((kind === "country" || kind === "city") && flag) {
    return <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-base shrink-0">{flag}</span>;
  }
  const Icon =
    kind === "country" ? Globe2 :
    kind === "city" ? Compass :
    kind === "tag" ? Tag :
    kind === "post" ? MessageCircle :
    Search;
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted shrink-0">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
    </span>
  );
}
