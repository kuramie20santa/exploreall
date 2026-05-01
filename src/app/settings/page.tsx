import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/settings");

  const [{ data: profile }, { data: countries }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("countries").select("code,name,flag_emoji").order("name"),
  ]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-1 text-muted-foreground">Manage your profile, account, and preferences.</p>
      <div className="mt-8">
        <SettingsForm profile={profile!} email={user.email!} countries={countries ?? []} />
      </div>
    </div>
  );
}
