"use client";

import { Bookmark, Heart, Share2, Trash2 } from "lucide-react";
import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function PostActions({
  postId,
  initialLiked,
  initialSaved,
  initialLikes,
  isOwner,
}: {
  postId: string;
  initialLiked: boolean;
  initialSaved: boolean;
  initialLikes: number;
  isOwner: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [liked, setLiked] = React.useState(initialLiked);
  const [saved, setSaved] = React.useState(initialSaved);
  const [likes, setLikes] = React.useState(initialLikes);
  const [busy, setBusy] = React.useState(false);

  async function toggleLike() {
    if (busy) return;
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    if (liked) {
      setLiked(false); setLikes((n) => Math.max(0, n - 1));
      await supabase.from("likes").delete().eq("user_id", user.id).eq("post_id", postId);
    } else {
      setLiked(true); setLikes((n) => n + 1);
      await supabase.from("likes").insert({ user_id: user.id, post_id: postId });
    }
    setBusy(false);
  }

  async function toggleSave() {
    if (busy) return;
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    if (saved) {
      setSaved(false);
      await supabase.from("saves").delete().eq("user_id", user.id).eq("post_id", postId);
    } else {
      setSaved(true);
      await supabase.from("saves").insert({ user_id: user.id, post_id: postId });
    }
    setBusy(false);
  }

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try { await navigator.share({ url, title: "ExploreAll post" }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied");
    }
  }

  async function remove() {
    if (!confirm("Delete this post permanently?")) return;
    setBusy(true);
    await supabase.from("posts").delete().eq("id", postId);
    router.push("/forum");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={toggleLike}
        className={cn(
          "inline-flex items-center gap-1.5 h-9 px-3 rounded-full hairline text-sm leading-none press transition hover:bg-muted",
          liked && "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
        )}
      >
        <Heart className={cn("h-4 w-4 transition", liked && "fill-current animate-pop")} />
        {likes}
      </button>
      <button
        onClick={toggleSave}
        className={cn(
          "inline-flex items-center gap-1.5 h-9 px-3 rounded-full hairline text-sm leading-none press transition hover:bg-muted",
          saved && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
        )}
      >
        <Bookmark className={cn("h-4 w-4 transition", saved && "fill-current animate-pop")} />
        {saved ? "Saved" : "Save"}
      </button>
      <button
        onClick={share}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full hairline text-sm leading-none press transition hover:bg-muted"
      >
        <Share2 className="h-4 w-4" /> Share
      </button>
      {isOwner ? (
        <button
          onClick={remove}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full hairline text-sm leading-none press transition hover:bg-muted text-red-600 dark:text-red-400"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      ) : null}
    </div>
  );
}
