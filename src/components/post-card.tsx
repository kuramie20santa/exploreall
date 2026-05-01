import Link from "next/link";
import { MapPin, MessageCircle, Heart, Calendar } from "lucide-react";
import type { PostWithMeta } from "@/lib/types";
import { Avatar } from "./ui/avatar";
import { Badge } from "./ui/card";
import { formatDate, timeAgo } from "@/lib/utils";

export function PostCard({ post, country }: { post: PostWithMeta; country?: { name: string; flag_emoji: string | null } | null }) {
  const cover = post.images?.[0]?.url;
  return (
    <Link
      href={`/forum/${post.id}`}
      className="group block rounded-3xl bg-card hairline shadow-soft overflow-hidden lift hover:shadow-glow press"
    >
      {cover ? (
        <div className="aspect-[16/10] overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt=""
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
          />
        </div>
      ) : null}
      <div className="p-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Avatar url={post.author?.avatar_url} name={post.author?.full_name || post.author?.username} size={22} />
          <span className="font-medium text-foreground">@{post.author?.username}</span>
          <span>·</span>
          <span>{timeAgo(post.created_at)}</span>
        </div>

        <h3 className="mt-3 font-display text-[18px] font-semibold tracking-tight leading-snug line-clamp-2">
          {post.title}
        </h3>

        <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {post.content}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {country ? (
            <Badge>
              <span className="mr-1">{country.flag_emoji}</span>{country.name}
              {post.city ? <span className="ml-1 text-muted-foreground">· {post.city}</span> : null}
            </Badge>
          ) : post.city ? (
            <Badge><MapPin className="mr-1 h-3 w-3" />{post.city}</Badge>
          ) : null}
          {post.trip_start ? (
            <Badge><Calendar className="mr-1 h-3 w-3" />{formatDate(post.trip_start)}{post.trip_end ? ` – ${formatDate(post.trip_end)}` : ""}</Badge>
          ) : null}
          {(post.tags ?? []).slice(0, 3).map((t) => (
            <Badge key={t}>#{t}</Badge>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{post.like_count}</span>
          <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{post.comment_count}</span>
        </div>
      </div>
    </Link>
  );
}
