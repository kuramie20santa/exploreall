"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import type { Profile } from "@/lib/types";

type Country = { code: string; name: string; flag_emoji: string | null };

export function SettingsForm({
  profile,
  email,
  countries,
}: {
  profile: Profile;
  email: string;
  countries: Country[];
}) {
  const supabase = createClient();
  const router = useRouter();

  const [fullName, setFullName] = React.useState(profile.full_name ?? "");
  const [username, setUsername] = React.useState(profile.username);
  const [bio, setBio] = React.useState(profile.bio ?? "");
  const [home, setHome] = React.useState(profile.home_country ?? "");
  const [history, setHistory] = React.useState<string[]>(profile.travel_history ?? []);
  const [countryQuery, setCountryQuery] = React.useState("");
  const [historyQuery, setHistoryQuery] = React.useState("");
  const [emailValue, setEmailValue] = React.useState(email);
  const [password, setPassword] = React.useState("");
  const [isPrivate, setPrivate] = React.useState(profile.is_private);
  const [notifyEmail, setNotifyEmail] = React.useState(profile.notify_email);
  const [notifyComments, setNotifyComments] = React.useState(profile.notify_comments);
  const [notifyLikes, setNotifyLikes] = React.useState(profile.notify_likes);
  const [avatarUrl, setAvatarUrl] = React.useState(profile.avatar_url);
  const [avatarBusy, setAvatarBusy] = React.useState(false);
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [savingAccount, setSavingAccount] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function uploadAvatar(file: File) {
    setAvatarBusy(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { alert(error.message); setAvatarBusy(false); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", profile.id);
    setAvatarUrl(data.publicUrl);
    setAvatarBusy(false);
    router.refresh();
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true); setMsg(null);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName || null,
        username,
        bio: bio || null,
        home_country: home || null,
        travel_history: history,
        is_private: isPrivate,
        notify_email: notifyEmail,
        notify_comments: notifyComments,
        notify_likes: notifyLikes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
    setSavingProfile(false);
    if (error) { setMsg(error.message); return; }
    setMsg("Saved.");
    router.refresh();
  }

  async function saveAccount(e: React.FormEvent) {
    e.preventDefault();
    setSavingAccount(true); setMsg(null);
    const updates: { email?: string; password?: string } = {};
    if (emailValue && emailValue !== email) updates.email = emailValue;
    if (password) updates.password = password;
    if (Object.keys(updates).length === 0) { setSavingAccount(false); return; }
    const { error } = await supabase.auth.updateUser(updates);
    setSavingAccount(false);
    if (error) { setMsg(error.message); return; }
    setPassword("");
    setMsg(updates.email ? "Check your inbox to confirm the new email." : "Password updated.");
  }

  async function deleteAccount() {
    const ok = confirm("This permanently deletes your account, posts, comments, and saves. Continue?");
    if (!ok) return;
    // Delete profile row — cascades to posts/comments/likes/saves via FKs.
    await supabase.from("profiles").delete().eq("id", profile.id);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  function toggleHistory(code: string) {
    setHistory((h) => (h.includes(code) ? h.filter((c) => c !== code) : [...h, code]));
  }

  return (
    <div className="space-y-10">
      {/* Profile */}
      <form onSubmit={saveProfile} className="rounded-3xl bg-card hairline p-6 sm:p-8 space-y-6">
        <h2 className="font-display text-xl font-semibold tracking-tight">Profile</h2>

        <div className="flex items-center gap-4">
          <Avatar url={avatarUrl} name={fullName || username} size={64} />
          <label className="inline-flex items-center gap-2 h-9 px-4 rounded-full hairline text-sm hover:bg-muted transition cursor-pointer">
            {avatarBusy ? "Uploading…" : "Upload photo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files && uploadAvatar(e.target.files[0])}
            />
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Full name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label>Username</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} />
          </div>
        </div>

        <div>
          <Label>Bio</Label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell other travelers about you…" />
        </div>

        <div>
          <Label>Home country</Label>
          <Input
            placeholder="Search countries…"
            value={countryQuery}
            onChange={(e) => setCountryQuery(e.target.value)}
          />
          <select
            value={home}
            onChange={(e) => setHome(e.target.value)}
            size={6}
            className="mt-2 w-full rounded-2xl bg-muted px-2 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">— None —</option>
            {countries
              .filter((c) =>
                !countryQuery.trim()
                  ? true
                  : c.name.toLowerCase().includes(countryQuery.trim().toLowerCase()) ||
                    c.code.toLowerCase() === countryQuery.trim().toLowerCase()
              )
              .map((c) => (
                <option key={c.code} value={c.code}>{c.flag_emoji} {c.name} ({c.code})</option>
              ))}
          </select>
        </div>

        <div>
          <Label>Travel history</Label>
          <Input
            placeholder="Search countries to add or remove…"
            value={historyQuery}
            onChange={(e) => setHistoryQuery(e.target.value)}
          />
          {history.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2 stagger">
              {history.map((code) => {
                const c = countries.find((x) => x.code === code);
                if (!c) return null;
                return (
                  <span key={code} className="inline-flex h-8 items-center gap-1.5 px-3 rounded-full bg-foreground text-background text-xs font-medium leading-none">
                    {c.flag_emoji} {c.name}
                    <button type="button" onClick={() => toggleHistory(code)} aria-label="Remove" className="opacity-70 hover:opacity-100">
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          ) : null}
          <div className="mt-3 max-h-64 overflow-y-auto rounded-2xl bg-muted/50 hairline p-2 flex flex-wrap gap-2">
            {countries
              .filter((c) =>
                !historyQuery.trim()
                  ? true
                  : c.name.toLowerCase().includes(historyQuery.trim().toLowerCase()) ||
                    c.code.toLowerCase() === historyQuery.trim().toLowerCase()
              )
              .slice(0, 80)
              .map((c) => {
                const on = history.includes(c.code);
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => toggleHistory(c.code)}
                    className={`inline-flex h-8 items-center justify-center px-3 rounded-full text-xs font-medium leading-none press transition ${
                      on ? "bg-foreground text-background" : "bg-background hairline text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c.flag_emoji} {c.name}
                  </button>
                );
              })}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={savingProfile}>{savingProfile ? "Saving…" : "Save profile"}</Button>
        </div>
      </form>

      {/* Account */}
      <form onSubmit={saveAccount} className="rounded-3xl bg-card hairline p-6 sm:p-8 space-y-6">
        <h2 className="font-display text-xl font-semibold tracking-tight">Account</h2>
        <div>
          <Label>Email</Label>
          <Input type="email" value={emailValue} onChange={(e) => setEmailValue(e.target.value)} />
        </div>
        <div>
          <Label>New password</Label>
          <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep current" />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={savingAccount}>{savingAccount ? "Saving…" : "Update account"}</Button>
        </div>
      </form>

      {/* Privacy & notifications */}
      <div className="rounded-3xl bg-card hairline p-6 sm:p-8 space-y-4">
        <h2 className="font-display text-xl font-semibold tracking-tight">Privacy & notifications</h2>
        <Toggle label="Private profile" body="Hide your profile from other users." checked={isPrivate} onChange={setPrivate} />
        <Toggle label="Email notifications" body="Receive product and account emails." checked={notifyEmail} onChange={setNotifyEmail} />
        <Toggle label="Comment notifications" body="Notify me when someone comments on my posts." checked={notifyComments} onChange={setNotifyComments} />
        <Toggle label="Like notifications" body="Notify me when someone likes my posts." checked={notifyLikes} onChange={setNotifyLikes} />
        <p className="text-xs text-muted-foreground pt-2">Click “Save profile” above to apply.</p>
      </div>

      {/* Danger zone */}
      <div className="rounded-3xl hairline border-red-500/20 bg-red-500/[0.03] p-6 sm:p-8 space-y-4">
        <h2 className="font-display text-xl font-semibold tracking-tight text-red-600 dark:text-red-400">Danger zone</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={signOut}>Sign out</Button>
          <Button variant="destructive" onClick={deleteAccount}>Delete account</Button>
        </div>
      </div>

      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
    </div>
  );
}

function Toggle({
  label, body, checked, onChange,
}: { label: string; body: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-4 py-2 cursor-pointer">
      <span className="flex-1">
        <span className="block text-[15px] font-medium">{label}</span>
        <span className="block text-sm text-muted-foreground">{body}</span>
      </span>
      <span
        onClick={() => onChange(!checked)}
        className={`relative inline-block w-11 h-6 rounded-full transition shrink-0 ${checked ? "bg-foreground" : "bg-muted"}`}
      >
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background shadow transition ${checked ? "translate-x-5" : ""}`} />
      </span>
    </label>
  );
}
