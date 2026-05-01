import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/card";
import { PostCard } from "@/components/post-card";
import type { PostWithMeta } from "@/lib/types";
import { Settings } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", params.username)
    .maybeSingle();

  if (!profile) notFound();
  const isMe = user?.id === profile.id;

  const [{ data: posts }, { data: countries }] = await Promise.all([
    supabase
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(username,full_name,avatar_url), images:post_images(url,position)")
      .eq("is_deleted", false)
      .eq("author_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(24),
    supabase.from("countries").select("code,name,flag_emoji"),
  ]);
  const home = profile.home_country
    ? (await supabase.from("countries").select("code,name,flag_emoji").eq("code", profile.home_country).maybeSingle()).data
    : null;
  const postsTyped = (posts ?? []) as unknown as PostWithMeta[];
  const countryByCode = new Map((countries ?? []).map((c) => [c.code, c]));
  const visited = (profile.travel_history ?? []).map((code: string) => countryByCode.get(code)).filter(Boolean) as { code: string; name: string; flag_emoji: string | null }[];

  return (
    <div className="space-y-10">
      <section className="relative rounded-[2.25rem] hairline bg-card shadow-soft overflow-hidden animate-scaleIn">
        <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(80%_60%_at_30%_0%,hsl(var(--muted))_0%,transparent_70%)]" />
        <div className="relative px-6 sm:px-10 pt-10 pb-8 flex flex-col sm:flex-row gap-6 items-start sm:items-end">
          <Avatar url={profile.avatar_url} name={profile.full_name || profile.username} size={96} />
          <div className="flex-1">
            <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
              {profile.full_name || `@${profile.username}`}
            </h1>
            <p className="text-muted-foreground">@{profile.username}</p>
            {profile.bio ? <p className="mt-3 max-w-xl">{profile.bio}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {home ? (
                <Link href={`/country/${home.code}`}><Badge>🏠 {home.flag_emoji} {home.name}</Badge></Link>
              ) : null}
              <Badge>{postsTyped.length} posts</Badge>
              <Badge>{visited.length} countries visited</Badge>
            </div>
          </div>
          {isMe ? (
            <Link href="/settings" className="inline-flex items-center gap-2 h-10 px-4 rounded-full hairline text-sm hover:bg-muted transition">
              <Settings className="h-4 w-4" /> Edit profile
            </Link>
          ) : null}
        </div>
      </section>

      {visited.length > 0 ? (
        <section>
          <h2 className="font-display text-xl font-semibold tracking-tight mb-3">Travel history</h2>
          <div className="flex flex-wrap gap-2">
            {visited.map((c) => (
              <Link key={c.code} href={`/country/${c.code}`}>
                <Badge>{c.flag_emoji} {c.name}</Badge>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="font-display text-2xl font-semibold tracking-tight mb-4">Posts</h2>
        {postsTyped.length === 0 ? (
          <div className="rounded-3xl hairline bg-card p-10 text-center text-muted-foreground">
            No posts yet.
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
      </section>
    </div>
  );
}
