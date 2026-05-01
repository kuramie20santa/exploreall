import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/card";
import { PostCard } from "@/components/post-card";
import type { PostWithMeta } from "@/lib/types";
import { safetyColor, safetyLabel } from "@/lib/utils";
import { Calendar, Compass, ShieldCheck, Sparkles, AlertTriangle, FileText, MapPin } from "lucide-react";
import { CountryStats } from "@/components/country-stats";
import { CurrencyWidget } from "@/components/currency-widget";
import { AirlinesSection } from "@/components/airlines";
import { getCountryExtras, getFxRates } from "@/lib/country-data";
import { AIRLINES_BY_COUNTRY } from "@/data/airlines";

export const dynamic = "force-dynamic";

export default async function CountryPage({ params }: { params: { code: string } }) {
  const supabase = createClient();
  const code = params.code.toUpperCase();

  const [{ data: country }, { data: rating }, { data: cities }, { data: posts }, extras, fx] = await Promise.all([
    supabase.from("countries").select("*").eq("code", code).maybeSingle(),
    supabase.from("safety_ratings").select("*").eq("country_code", code).maybeSingle(),
    supabase.from("cities").select("name,is_capital,description").eq("country_code", code).order("is_capital", { ascending: false }).order("name"),
    supabase
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(username,full_name,avatar_url), images:post_images(url,position)")
      .eq("is_deleted", false)
      .eq("country_code", code)
      .order("like_count", { ascending: false })
      .limit(6),
    getCountryExtras(code),
    getFxRates(),
  ]);

  if (!country) notFound();
  const postsTyped = (posts ?? []) as unknown as PostWithMeta[];
  const airlines = AIRLINES_BY_COUNTRY[code] ?? [];

  const score = rating?.score ?? null;
  const level = rating?.level ?? null;
  const ringPct = score != null ? (score / 10) * 100 : 0;

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2.25rem] hairline bg-card shadow-soft animate-scaleIn">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_20%_0%,hsl(var(--muted))_0%,transparent_70%)]" />
        <div className="px-6 sm:px-12 py-12 sm:py-16 grid sm:grid-cols-[1fr_auto] gap-10 items-center">
          <div>
            <Link href="/explore" className="text-sm text-muted-foreground hover:text-foreground">← All countries</Link>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-5xl">{country.flag_emoji}</span>
              <h1 className="font-display text-4xl sm:text-6xl font-semibold tracking-tight">{country.name}</h1>
            </div>
            <p className="mt-2 text-muted-foreground">Capital: {country.capital ?? "—"} · {country.continent ?? "—"}</p>
            {country.travel_summary ? (
              <p className="mt-5 max-w-2xl text-[17px] leading-relaxed">{country.travel_summary}</p>
            ) : null}
          </div>

          {/* Safety dial */}
          <div className="flex items-center justify-center">
            <div className="relative h-44 w-44 rounded-full bg-muted ring-1 ring-inset ring-black/5 dark:ring-white/10 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                <circle cx="50" cy="50" r="44" stroke="currentColor" strokeOpacity="0.08" strokeWidth="8" fill="none" />
                <circle
                  cx="50" cy="50" r="44" fill="none" strokeWidth="8" strokeLinecap="round"
                  stroke="currentColor"
                  strokeDasharray={`${(ringPct / 100) * (2 * Math.PI * 44)} 999`}
                  className={
                    level === "safe" ? "text-emerald-500" :
                    level === "mostly_safe" ? "text-sky-500" :
                    level === "caution" ? "text-amber-500" :
                    level === "high_risk" ? "text-orange-500" :
                    level === "do_not_travel" ? "text-red-500" :
                    "text-muted-foreground"
                  }
                />
              </svg>
              <div className="text-center">
                <div className="font-display text-4xl font-semibold tracking-tight">{score ?? "—"}</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">Safety</div>
                {level ? (
                  <Badge className={`mt-2 ${safetyColor(level)}`}>{safetyLabel(level)}</Badge>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-5 stagger">
        <InfoCard icon={<ShieldCheck className="h-4 w-4" />} title="Safety summary" body={rating?.summary || "No data yet."} />
        <InfoCard icon={<Calendar className="h-4 w-4" />} title="Best time to visit" body={country.best_time_to_visit || "Year-round."} />
        <InfoCard icon={<FileText className="h-4 w-4" />} title="Visa & entry" body={country.visa_notes || "Check your country's foreign affairs office."} />
      </div>

      {/* Live country stats */}
      {extras ? <CountryStats extras={extras} /> : null}

      {/* Live currency widget */}
      {extras?.currency_code && fx?.rates ? (
        <CurrencyWidget
          localCurrency={extras.currency_code}
          localName={extras.currency_name}
          rates={fx.rates}
          updatedAt={fx.updated_at}
        />
      ) : null}

      {/* Airlines */}
      <AirlinesSection airlines={airlines} countryName={country.name} />

      {/* Map link */}
      {extras?.maps_url ? (
        <a
          href={extras.maps_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-full hairline bg-card hover:bg-muted text-sm font-medium press transition"
        >
          <MapPin className="h-4 w-4" /> Open {country.name} on Google Maps
        </a>
      ) : null}

      <div className="grid lg:grid-cols-2 gap-5">
        <ListCard icon={<Sparkles className="h-4 w-4" />} title="Travel tips" items={country.common_tips ?? []} />
        <ListCard icon={<AlertTriangle className="h-4 w-4" />} title="Common scams & risks" items={country.common_scams ?? []} accent="warn" />
      </div>

      {/* Best cities */}
      <section>
        <h2 className="font-display text-2xl font-semibold tracking-tight mb-4 flex items-center gap-2">
          <Compass className="h-5 w-5" /> Best cities to visit
        </h2>
        {(cities ?? []).length === 0 ? (
          <p className="text-muted-foreground">No cities listed yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
            {(cities ?? []).map((c) => (
              <div key={c.name} className="rounded-3xl bg-card hairline p-5 lift">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold tracking-tight">{c.name}</h3>
                  {c.is_capital ? <Badge>Capital</Badge> : null}
                </div>
                {c.description ? (
                  <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Posts about this country */}
      <section>
        <h2 className="font-display text-2xl font-semibold tracking-tight mb-4">Stories from {country.name}</h2>
        {postsTyped.length === 0 ? (
          <div className="rounded-3xl hairline bg-card p-8 text-center text-muted-foreground">
            No stories yet. <Link href="/create" className="underline hover:text-foreground">Be the first</Link>.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
            {postsTyped.map((p) => (
              <PostCard key={p.id} post={p} country={{ name: country.name, flag_emoji: country.flag_emoji }} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function InfoCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-3xl bg-card hairline p-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
        {icon} {title}
      </div>
      <p className="mt-3 text-[15px] leading-relaxed">{body}</p>
    </div>
  );
}

function ListCard({ icon, title, items, accent }: { icon: React.ReactNode; title: string; items: string[]; accent?: "warn" }) {
  return (
    <div className="rounded-3xl bg-card hairline p-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
        {icon} {title}
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No data yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((t, i) => (
            <li key={i} className="flex gap-3 text-[15px]">
              <span className={`mt-2 h-1.5 w-1.5 rounded-full shrink-0 ${accent === "warn" ? "bg-amber-500" : "bg-emerald-500"}`} />
              {t}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
