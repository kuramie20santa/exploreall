import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreatePostForm } from "./form";

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/create");

  const [{ data: countries }, { data: tags }] = await Promise.all([
    supabase.from("countries").select("code,name,flag_emoji").order("name"),
    supabase.from("tags").select("slug,label").order("label"),
  ]);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">Share a trip</h1>
      <p className="mt-1 text-muted-foreground">Add photos, dates, and a country tag — everything is optional except a title and story.</p>
      <div className="mt-8">
        <CreatePostForm countries={countries ?? []} tags={tags ?? []} userId={user.id} />
      </div>
    </div>
  );
}
