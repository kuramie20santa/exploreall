import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/post-card";
import type { PostWithMeta } from "@/lib/types";
import { Badge } from "@/components/ui/card";
import { PenSquare } from "lucide-react";
import { ForumCountryPicker } from "@/components/forum-country-picker";

export const dynamic = "force-dynamic";

type Search = { q?: string; country?: string; tag?: string; sort?: "recent" | "popular" };

export default async function ForumPage({ searchParams }: { searchParams: Search }) {
  const supabase = createClient();
  const sort = searchParams.sort ?? "recent";

  let query = supabase
    .from("posts")
    .select("*, author:profiles!posts_author_id_fkey(username,full_name,avatar_url), images:post_images(url,position)")
    .eq("is_deleted", false);

  if (searchParams.q) {
    query = query.or(`title.ilike.%${searchParams.q}%,content.ilike.%${searchParams.q}%`);
  }
  if (searchParams.country) query = query.eq("country_code", searchParams.country);
  if (searchParams.tag) query = query.contains("tags", [searchParams.tag]);

  query = sort === "popular"
    ? query.order("like_count", { ascending: false })
    : query.order("created_at", { ascending: false });

  const [{ data: posts }, { data: countries }, { data: tags }] = await Promise.all([
    query.limit(60),
    supabase.from("countries").select("code,name,flag_emoji,continent").order("name"),
    supabase.from("tags").select("slug,label").order("label"),
  ]);

  const postsTyped = (posts ?? []) as unknown as PostWithMeta[];
  const countryByCode = new Map((countries ?? []).map((c) => [c.code, c]));

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">Forum</h1>
          <p className="mt-1 text-muted-foreground">Trip reports, photo essays, and travel questions.</p>
        </div>
        <Link href="/create" className="h-10 px-5 inline-flex items-center gap-2 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition">
          <PenSquare className="h-4 w-4" /> New post
        </Link>
      </div>

      {/* Filters */}
      <div className="relative z-40 rounded-3xl bg-card hairline p-4 flex flex-wrap items-center gap-2 animate-fadeIn">
        <SortLink current={sort} value="recent" search={searchParams}>Recent</SortLink>
        <SortLink current={sort} value="popular" search={searchParams}>Popular</SortLink>
        <span className="mx-1 h-5 w-px bg-border" />
        <ForumCountryPicker countries={countries ?? []} />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterPill active={!searchParams.tag} href={buildHref(searchParams, { tag: undefined })}>
          All tags
        </FilterPill>
        {(tags ?? []).map((t) => (
          <FilterPill
            key={t.slug}
            active={searchParams.tag === t.slug}
            href={buildHref(searchParams, { tag: t.slug })}
          >
            #{t.label}
          </FilterPill>
        ))}
      </div>

      {searchParams.q ? (
        <p className="text-sm text-muted-foreground">
          Showing results for <Badge>“{searchParams.q}”</Badge>
        </p>
      ) : null}

      {postsTyped.length === 0 ? (
        <div className="rounded-3xl hairline bg-card p-10 text-center text-muted-foreground animate-fadeIn">
          No posts match these filters yet.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
          {postsTyped.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              country={p.country_code ? countryByCode.get(p.country_code) ?? null : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SortLink({ current, value, search, children }: { current: string; value: "recent" | "popular"; search: Search; children: React.ReactNode }) {
  const active = current === value;
  return (
    <Link
      href={buildHref(search, { sort: value })}
      className={`h-9 px-4 inline-flex items-center rounded-full text-sm transition ${active ? "bg-foreground text-background" : "hover:bg-muted text-muted-foreground"}`}
    >
      {children}
    </Link>
  );
}

function FilterPill({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`inline-flex h-8 items-center justify-center px-3 rounded-full text-xs font-medium leading-none whitespace-nowrap press transition ${active ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/70"}`}
    >
      {children}
    </Link>
  );
}

function buildHref(current: Search, patch: Partial<Search>): string {
  const merged: Record<string, string | undefined> = { ...current, ...patch };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v) params.set(k, String(v));
  }
  const qs = params.toString();
  return `/forum${qs ? `?${qs}` : ""}`;
}
