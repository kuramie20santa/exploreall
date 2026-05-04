import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/post-card";
import type { PostWithMeta } from "@/lib/types";
import { ArrowRight, Compass, Globe2, ShieldCheck } from "lucide-react";
import { SupportCard } from "@/components/support-card";
import { CountryHoverCard } from "@/components/country-hover-card";
import { getCapitalImages } from "@/lib/capital-images";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createClient();

  const [{ data: posts }, { data: countries }, { data: ratings }] = await Promise.all([
    supabase
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(username,full_name,avatar_url), images:post_images(url,position)")
      .eq("is_deleted", false)
      .order("like_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.from("countries").select("code,name,flag_emoji,capital").order("name").limit(8),
    supabase.from("safety_ratings").select("country_code,score,level").order("score", { ascending: false }).limit(8),
  ]);

  const ratingByCode = new Map((ratings ?? []).map((r) => [r.country_code, r]));
  const postsTyped = (posts ?? []) as unknown as PostWithMeta[];

  // Pre-fetch capital images for the popular-countries grid (8 cards) so the
  // hover effect is instant. Cached on the server for 24h.
  const capitalImages = await getCapitalImages(
    (countries ?? []).map((c) => ({ code: c.code, capital: c.capital, name: c.name }))
  );

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2.25rem] hairline bg-card shadow-soft animate-scaleIn">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_50%_0%,hsl(var(--muted))_0%,transparent_70%)]" />
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-foreground/[0.03] animate-float" aria-hidden />
        <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-foreground/[0.03] animate-float [animation-delay:-3s]" aria-hidden />
        <div className="relative px-6 sm:px-10 py-16 sm:py-24 max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground rounded-full bg-muted px-3 py-1 ring-1 ring-inset ring-black/5 dark:ring-white/10 animate-fadeIn">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pop" /> Now in beta
          </span>
          <h1 className="mt-6 font-display text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05] animate-slideUp">
            ExploreAll Travel
          </h1>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed animate-slideUp [animation-delay:80ms]">
            A clean, modern community for sharing your trips, discovering destinations, and checking country safety — all in one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-slideUp [animation-delay:160ms]">
            <Link href="/forum" className="h-11 px-6 inline-flex items-center gap-2 rounded-full bg-foreground text-background font-medium hover:opacity-90 transition press">
              Browse the forum <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/explore" className="h-11 px-6 inline-flex items-center gap-2 rounded-full hairline hover:bg-muted transition press">
              Explore destinations
            </Link>
          </div>
        </div>
      </section>

      {/* Feature row */}
      <section className="grid sm:grid-cols-3 gap-4 stagger">
        <Feature icon={<Globe2 className="h-5 w-5" />} title="Real travel stories" body="A premium feed of trips from real people — no influencer fluff." />
        <Feature icon={<ShieldCheck className="h-5 w-5" />} title="Country safety" body="Clear safety scores, common scams, and tips for every country." />
        <Feature icon={<Compass className="h-5 w-5" />} title="Discover" body="Search by country, city, or tag. Save what inspires you." />
      </section>

      {/* Trending */}
      <section>
        <SectionHeader title="Trending stories" href="/forum" cta="See all" />
        {postsTyped.length === 0 ? (
          <EmptyHint />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
            {postsTyped.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                country={
                  p.country_code
                    ? (countries ?? []).find((c) => c.code === p.country_code) || null
                    : null
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Support */}
      <SupportCard />

      {/* Popular countries */}
      <section>
        <SectionHeader title="Popular countries" href="/explore" cta="Explore all" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          {(countries ?? []).map((c) => (
            <CountryHoverCard
              key={c.code}
              href={`/country/${c.code}`}
              flag={c.flag_emoji}
              name={c.name}
              capital={c.capital}
              rating={ratingByCode.get(c.code) ?? null}
              initialImage={capitalImages.get(c.code) ?? null}
              showContinent={false}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-3xl bg-card hairline shadow-soft p-6">
      <div className="h-9 w-9 rounded-2xl bg-muted flex items-center justify-center">{icon}</div>
      <h3 className="mt-4 font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function SectionHeader({ title, href, cta }: { title: string; href: string; cta: string }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h2>
      <Link href={href} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        {cta} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function EmptyHint() {
  return (
    <div className="rounded-3xl hairline bg-card p-10 text-center text-muted-foreground">
      <p>No posts yet. <Link href="/create" className="underline hover:text-foreground">Be the first to share a trip</Link>.</p>
    </div>
  );
}
