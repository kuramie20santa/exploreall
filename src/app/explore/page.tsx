import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/card";
import { safetyColor, safetyLabel } from "@/lib/utils";
import { PostCard } from "@/components/post-card";
import type { PostWithMeta } from "@/lib/types";
import { CountryGrid } from "@/components/country-grid";

export const dynamic = "force-dynamic";

export default async function ExplorePage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = createClient();
  const q = (searchParams.q || "").trim();

  const [{ data: countries }, { data: ratings }, { data: tags }] = await Promise.all([
    supabase.from("countries").select("code,name,flag_emoji,capital,continent").order("name"),
    supabase.from("safety_ratings").select("country_code,score,level"),
    supabase.from("tags").select("slug,label,use_count").order("label"),
  ]);

  const ratingByCode = new Map((ratings ?? []).map((r) => [r.country_code, r]));

  let postResults: PostWithMeta[] = [];
  if (q) {
    const { data } = await supabase
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(username,full_name,avatar_url), images:post_images(url,position)")
      .eq("is_deleted", false)
      .or(`title.ilike.%${q}%,content.ilike.%${q}%,city.ilike.%${q}%`)
      .order("like_count", { ascending: false })
      .limit(6);
    postResults = (data ?? []) as unknown as PostWithMeta[];
  }

  const trending = (countries ?? []).slice(0, 6);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">Explore</h1>
        <p className="mt-1 text-muted-foreground">
          {q ? <>Results for <Badge>“{q}”</Badge></> : "Browse countries, tags, and trending destinations."}
        </p>
      </div>

      {!q ? (
        <section>
          <h2 className="font-display text-xl font-semibold tracking-tight mb-3">Trending destinations</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
            {trending.map((c) => {
              const r = ratingByCode.get(c.code);
              return (
                <Link key={c.code} href={`/country/${c.code}`} className="rounded-3xl bg-card hairline shadow-soft p-5 lift hover:shadow-glow press">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{c.flag_emoji}</span>
                    {r ? <Badge className={safetyColor(r.level)}>{r.score} · {safetyLabel(r.level)}</Badge> : null}
                  </div>
                  <h3 className="mt-3 font-display text-xl font-semibold tracking-tight">{c.name}</h3>
                  <p className="text-sm text-muted-foreground">{c.capital} · {c.continent}</p>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {postResults.length > 0 ? (
        <section>
          <h2 className="font-display text-xl font-semibold tracking-tight mb-3">Stories matching “{q}”</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {postResults.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="font-display text-xl font-semibold tracking-tight mb-3">All countries</h2>
        <CountryGrid
          countries={countries ?? []}
          ratings={ratings ?? []}
          defaultQuery={q}
        />
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold tracking-tight mb-3">Browse by tag</h2>
        <div className="flex flex-wrap gap-2 stagger">
          {(tags ?? []).map((t) => (
            <Link
              key={t.slug}
              href={`/forum?tag=${t.slug}`}
              className="inline-flex h-9 items-center justify-center px-4 rounded-full bg-muted hover:bg-muted/70 text-sm font-medium leading-none press transition"
            >
              #{t.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
