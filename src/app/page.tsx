import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/post-card";
import type { PostWithMeta } from "@/lib/types";
import {
  ArrowRight, Compass, Globe2, ShieldCheck, Sparkles,
  PenSquare, MapPin, Search, Heart, BadgeCheck,
} from "lucide-react";
import { SupportCard } from "@/components/support-card";
import { CountryHoverCard } from "@/components/country-hover-card";
import { getCapitalImages } from "@/lib/capital-images";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createClient();

  const [
    { data: posts },
    { data: countries },
    { data: ratings },
    { count: countriesTotal },
    { count: postsTotal },
    { count: usersTotal },
  ] = await Promise.all([
    supabase
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(username,full_name,avatar_url), images:post_images(url,position)")
      .eq("is_deleted", false)
      .order("like_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.from("countries").select("code,name,flag_emoji,capital").order("name").limit(8),
    supabase.from("safety_ratings").select("country_code,score,level").order("score", { ascending: false }).limit(8),
    supabase.from("countries").select("code", { count: "exact", head: true }),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("is_deleted", false),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const ratingByCode = new Map((ratings ?? []).map((r) => [r.country_code, r]));
  const postsTyped = (posts ?? []) as unknown as PostWithMeta[];

  // Pre-fetch capital images for the popular-countries grid (8 cards) so the
  // hover effect is instant. Cached on the server for 24h.
  const capitalImages = await getCapitalImages(
    (countries ?? []).map((c) => ({ code: c.code, capital: c.capital, name: c.name }))
  );

  const recentAvatars = postsTyped
    .map((p) => p.author?.avatar_url)
    .filter(Boolean)
    .slice(0, 4) as string[];

  return (
    <div className="space-y-20 sm:space-y-24">
      {/* ========= HERO ========= */}
      <section className="relative overflow-hidden rounded-[2.5rem] hairline bg-card shadow-soft animate-scaleIn">
        {/* Layered animated mesh gradient */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(70%_80%_at_50%_0%,hsl(var(--muted))_0%,transparent_70%)]" aria-hidden />
        <div className="absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-rose-500/10 blur-3xl animate-float" aria-hidden />
        <div className="absolute -bottom-32 right-1/4 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl animate-float [animation-delay:-3s]" aria-hidden />
        <div className="absolute top-1/2 -right-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl animate-float [animation-delay:-6s]" aria-hidden />

        <div className="relative px-6 sm:px-10 py-20 sm:py-32 max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 text-xs font-medium rounded-full bg-muted px-3 py-1 ring-1 ring-inset ring-black/5 dark:ring-white/10 animate-fadeIn">
            <Sparkles className="h-3 w-3 text-rose-500" />
            <span>The travel forum that doesn't suck</span>
          </span>

          <h1 className="mt-6 font-display text-5xl sm:text-7xl font-semibold tracking-tight leading-[1.02] animate-slideUp">
            Real trips.<br />
            <span className="bg-gradient-to-br from-rose-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
              Real travelers.
            </span><br />
            One clean place.
          </h1>

          <p className="mt-6 text-base sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto animate-slideUp [animation-delay:80ms]">
            Share your trips. Read honest stories. Check country safety, currencies, and airlines —
            all in one ad-free, algorithm-free place.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3 animate-slideUp [animation-delay:160ms]">
            <Link
              href="/forum"
              className="h-12 px-7 inline-flex items-center gap-2 rounded-full bg-foreground text-background font-medium hover:opacity-90 transition press shadow-soft"
            >
              Browse the forum <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/explore"
              className="h-12 px-7 inline-flex items-center gap-2 rounded-full hairline bg-card hover:bg-muted transition press"
            >
              Explore destinations
            </Link>
          </div>

          {/* Avatar stack + social proof */}
          {(recentAvatars.length > 0 || (usersTotal ?? 0) > 0) ? (
            <div className="mt-10 inline-flex items-center gap-3 animate-fadeIn [animation-delay:280ms]">
              <div className="flex -space-x-2">
                {recentAvatars.slice(0, 4).map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="h-7 w-7 rounded-full ring-2 ring-card object-cover"
                  />
                ))}
                {recentAvatars.length === 0 ? (
                  <span className="h-7 w-7 rounded-full bg-rose-500/20 ring-2 ring-card flex items-center justify-center text-[11px]">🧳</span>
                ) : null}
              </div>
              <span className="text-xs text-muted-foreground">
                Join <span className="font-semibold text-foreground">{usersTotal ?? "early"}</span>
                {usersTotal ? " travelers" : " travelers"} sharing trips
              </span>
            </div>
          ) : null}
        </div>
      </section>

      {/* ========= STATS BAR ========= */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger">
        <Stat value={`${countriesTotal ?? 250}+`} label="Countries covered" icon={<Globe2 className="h-4 w-4" />} />
        <Stat value={`${postsTotal ?? 0}`} label="Trip stories" icon={<PenSquare className="h-4 w-4" />} />
        <Stat value="0" label="Ads or trackers" icon={<BadgeCheck className="h-4 w-4" />} accent="emerald" />
        <Stat value="100%" label="Free, forever" icon={<Heart className="h-4 w-4" />} accent="rose" />
      </section>

      {/* ========= FEATURES ========= */}
      <section className="grid sm:grid-cols-3 gap-4 stagger">
        <Feature
          icon={<Globe2 className="h-5 w-5" />}
          title="Real travel stories"
          body="A premium feed of trips from real people — no influencer fluff, no SEO spam, no affiliate links."
        />
        <Feature
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Country safety"
          body="Clear safety scores, common scams, best time to visit, and tips — for every country in the world."
        />
        <Feature
          icon={<Compass className="h-5 w-5" />}
          title="Practical tools"
          body="Live currency converter, major airlines per country, capital photos. Everything you actually need."
        />
      </section>

      {/* ========= HOW IT WORKS ========= */}
      <section>
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">How it works</h2>
          <p className="mt-2 text-muted-foreground">Three steps. No paywalls. No surprises.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5 stagger">
          <Step
            n="01"
            icon={<Search className="h-5 w-5" />}
            title="Find a country"
            body="Search any of 250+ countries. See its safety score, currency, capital, and what locals warn about."
          />
          <Step
            n="02"
            icon={<MapPin className="h-5 w-5" />}
            title="Read real trips"
            body="Browse stories from people who actually went. Filter by country, city, or tags like #solo or #budget."
          />
          <Step
            n="03"
            icon={<PenSquare className="h-5 w-5" />}
            title="Share your own"
            body="Post your trip with photos, dates, and tags. Help the next traveler the way others helped you."
          />
        </div>
      </section>

      {/* ========= TRENDING STORIES ========= */}
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

      {/* ========= SUPPORT ========= */}
      <SupportCard />

      {/* ========= POPULAR COUNTRIES ========= */}
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

      {/* ========= FINAL CTA ========= */}
      <section className="relative overflow-hidden rounded-[2.5rem] hairline bg-card shadow-soft animate-scaleIn">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_50%_50%,hsl(var(--muted))_0%,transparent_70%)]" aria-hidden />
        <div className="absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-rose-500/10 blur-3xl animate-float" aria-hidden />
        <div className="relative px-6 sm:px-10 py-16 sm:py-20 max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
            Got a trip worth sharing?
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Spend 5 minutes writing it up. Help someone plan theirs. Build the travel community
            you wish existed.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/create"
              className="h-12 px-7 inline-flex items-center gap-2 rounded-full bg-foreground text-background font-medium hover:opacity-90 transition press shadow-soft"
            >
              <PenSquare className="h-4 w-4" /> Share your trip
            </Link>
            <Link
              href="/signup"
              className="h-12 px-7 inline-flex items-center gap-2 rounded-full hairline bg-card hover:bg-muted transition press"
            >
              Create a free account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-3xl bg-card hairline shadow-soft p-6 lift">
      <div className="h-10 w-10 rounded-2xl bg-muted flex items-center justify-center">{icon}</div>
      <h3 className="mt-4 font-medium">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function Step({ n, icon, title, body }: { n: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="relative rounded-3xl bg-card hairline shadow-soft p-6 lift">
      <span className="absolute top-5 right-5 text-xs font-mono text-muted-foreground/60">{n}</span>
      <div className="h-10 w-10 rounded-2xl bg-foreground text-background flex items-center justify-center">{icon}</div>
      <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function Stat({
  value,
  label,
  icon,
  accent,
}: {
  value: string | number;
  label: string;
  icon: React.ReactNode;
  accent?: "rose" | "emerald";
}) {
  const accentRing =
    accent === "rose"
      ? "ring-rose-500/20 bg-rose-500/5"
      : accent === "emerald"
      ? "ring-emerald-500/20 bg-emerald-500/5"
      : "";
  return (
    <div className={`rounded-3xl bg-card hairline shadow-soft p-5 ${accentRing}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
        {icon} <span>{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl sm:text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function SectionHeader({ title, href, cta }: { title: string; href: string; cta: string }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h2>
      <Link href={href} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition">
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
