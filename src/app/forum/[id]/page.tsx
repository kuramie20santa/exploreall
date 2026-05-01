import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/card";
import { PostActions } from "@/components/post-actions";
import { Comments } from "@/components/comments";
import type { Comment, PostWithMeta } from "@/lib/types";
import { Calendar, MapPin } from "lucide-react";
import { formatDate, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PostDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: post } = await supabase
    .from("posts")
    .select("*, author:profiles!posts_author_id_fkey(username,full_name,avatar_url), images:post_images(url,position)")
    .eq("id", params.id)
    .eq("is_deleted", false)
    .maybeSingle();

  if (!post) notFound();
  const p = post as unknown as PostWithMeta;

  let country: { code: string; name: string; flag_emoji: string | null } | null = null;
  if (p.country_code) {
    const { data: c } = await supabase
      .from("countries")
      .select("code,name,flag_emoji")
      .eq("code", p.country_code)
      .maybeSingle();
    country = c;
  }

  let liked = false, saved = false;
  if (user) {
    const [{ data: l }, { data: s }] = await Promise.all([
      supabase.from("likes").select("post_id").eq("user_id", user.id).eq("post_id", p.id).maybeSingle(),
      supabase.from("saves").select("post_id").eq("user_id", user.id).eq("post_id", p.id).maybeSingle(),
    ]);
    liked = !!l;
    saved = !!s;
  }

  const { data: rawComments } = await supabase
    .from("comments")
    .select("*, author:profiles!comments_author_id_fkey(username,full_name,avatar_url)")
    .eq("post_id", p.id)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });
  const comments = (rawComments ?? []) as unknown as Comment[];

  let relatedQuery = supabase
    .from("posts")
    .select("id,title,country_code,city,created_at, author:profiles!posts_author_id_fkey(username)")
    .eq("is_deleted", false)
    .neq("id", p.id);
  if (p.country_code) relatedQuery = relatedQuery.eq("country_code", p.country_code);
  const { data: related } = await relatedQuery
    .order("like_count", { ascending: false })
    .limit(4);

  const images = (p.images ?? []).slice().sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));

  return (
    <article className="max-w-3xl mx-auto space-y-8">
      <header className="space-y-4">
        <Link href="/forum" className="text-sm text-muted-foreground hover:text-foreground">← Back to forum</Link>
        <h1 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">{p.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href={`/profile/${p.author?.username}`} className="inline-flex items-center gap-2 hover:text-foreground">
            <Avatar url={p.author?.avatar_url} name={p.author?.full_name || p.author?.username} size={28} />
            <span className="font-medium text-foreground">@{p.author?.username}</span>
          </Link>
          <span>·</span>
          <span>{timeAgo(p.created_at)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {country ? (
            <Link href={`/country/${country.code}`}>
              <Badge><span className="mr-1">{country.flag_emoji}</span>{country.name}{p.city ? <span className="ml-1 text-muted-foreground">· {p.city}</span> : null}</Badge>
            </Link>
          ) : p.city ? (
            <Badge><MapPin className="mr-1 h-3 w-3" />{p.city}</Badge>
          ) : null}
          {p.trip_start ? (
            <Badge>
              <Calendar className="mr-1 h-3 w-3" />
              {formatDate(p.trip_start)}{p.trip_end ? ` – ${formatDate(p.trip_end)}` : ""}
            </Badge>
          ) : null}
          {(p.tags ?? []).map((t) => (
            <Link key={t} href={`/forum?tag=${t}`}><Badge>#{t}</Badge></Link>
          ))}
        </div>
      </header>

      {images.length > 0 ? (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          {images.map((img: any, i: number) => (
            <div
              key={i}
              className={`overflow-hidden rounded-3xl bg-muted hairline ${i === 0 && images.length > 1 ? "sm:col-span-2 aspect-[16/9]" : "aspect-[4/3]"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      ) : null}

      <div className="prose-like text-[17px] leading-[1.75] whitespace-pre-wrap">{p.content}</div>

      <PostActions
        postId={p.id}
        initialLiked={liked}
        initialSaved={saved}
        initialLikes={p.like_count}
        isOwner={user?.id === p.author_id}
      />

      <hr className="border-border" />

      <section>
        <h2 className="font-display text-2xl font-semibold tracking-tight mb-4">
          Comments <span className="text-muted-foreground font-normal">· {comments.length}</span>
        </h2>
        <Comments postId={p.id} initial={comments} currentUserId={user?.id ?? null} />
      </section>

      {(related ?? []).length > 0 ? (
        <section>
          <h2 className="font-display text-2xl font-semibold tracking-tight mb-4">Related</h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {(related ?? []).map((r) => (
              <li key={r.id}>
                <Link href={`/forum/${r.id}`} className="block rounded-2xl bg-card hairline p-4 hover:shadow-soft transition">
                  <p className="font-medium line-clamp-2">{r.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">@{(r as any).author?.username} · {timeAgo(r.created_at)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
