"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Comment } from "@/lib/types";
import { Avatar } from "./ui/avatar";
import { Textarea } from "./ui/input";
import { Button } from "./ui/button";
import { timeAgo } from "@/lib/utils";
import { Trash2 } from "lucide-react";

export function Comments({
  postId,
  initial,
  currentUserId,
}: {
  postId: string;
  initial: Comment[];
  currentUserId: string | null;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [comments, setComments] = React.useState(initial);
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    if (!currentUserId) { router.push("/login"); return; }
    setBusy(true);
    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: postId, author_id: currentUserId, content: text.trim() })
      .select("*")
      .single();
    setBusy(false);
    if (error) { alert(error.message); return; }
    const { data: prof } = await supabase
      .from("profiles")
      .select("username, full_name, avatar_url")
      .eq("id", currentUserId)
      .single();
    setComments((c) => [...c, { ...(data as Comment), author: prof || undefined }]);
    setText("");
  }

  async function remove(id: string) {
    if (!confirm("Delete comment?")) return;
    await supabase.from("comments").delete().eq("id", id);
    setComments((c) => c.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={currentUserId ? "Share your thoughts…" : "Sign in to leave a comment"}
          disabled={!currentUserId}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={busy || !text.trim()}>
            {busy ? "Posting…" : "Post comment"}
          </Button>
        </div>
      </form>

      <ul className="space-y-5">
        {comments.length === 0 ? (
          <li className="text-sm text-muted-foreground animate-fadeIn">Be the first to comment.</li>
        ) : null}
        {comments.map((c) => (
          <li key={c.id} className="flex gap-3 animate-slideUp">
            <Avatar url={c.author?.avatar_url} name={c.author?.full_name || c.author?.username} size={36} />
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">@{c.author?.username || "user"}</span>
                <span className="text-xs text-muted-foreground">{timeAgo(c.created_at)}</span>
                {c.author_id === currentUserId ? (
                  <button
                    onClick={() => remove(c.id)}
                    className="ml-auto text-xs text-muted-foreground hover:text-red-500 inline-flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" /> delete
                  </button>
                ) : null}
              </div>
              <p className="mt-1 text-[15px] leading-relaxed whitespace-pre-wrap">{c.content}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
