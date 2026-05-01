import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/post-card";
import type { PostWithMeta } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/saved");

  const { data: rows } = await supabase
    .from("saves")
    .select("post:posts(*, author:profiles!posts_author_id_fkey(username,full_name,avatar_url), images:post_images(url,position))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const posts: PostWithMeta[] = (rows ?? [])
    .map((r: any) => r.post)
    .filter(Boolean);

  const { data: countries } = await supabase.from("countries").select("code,name,flag_emoji");
  const countryByCode = new Map((countries ?? []).map((c) => [c.code, c]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">Saved</h1>
        <p className="mt-1 text-muted-foreground">Posts you've bookmarked.</p>
      </div>
      {posts.length === 0 ? (
        <div className="rounded-3xl hairline bg-card p-10 text-center text-muted-foreground">
          Nothing saved yet. Tap the bookmark on any post to keep it here.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
          {posts.map((p) => (
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
