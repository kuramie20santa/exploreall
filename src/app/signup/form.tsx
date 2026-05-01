"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  validateEmail,
  validateFullName,
  validatePassword,
  validateUsername,
} from "@/lib/validate";

export function SignupForm() {
  const supabase = createClient();
  const router = useRouter();
  const [fullName, setFullName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  // Honeypot — invisible field. Bots that fill all inputs trip it.
  const [hp, setHp] = React.useState("");
  // Track when the form was rendered. Anyone submitting in <2s is a bot.
  const mountedAt = React.useRef<number>(Date.now());

  const [errors, setErrors] = React.useState<{
    fullName?: string;
    username?: string;
    email?: string;
    password?: string;
    form?: string;
  }>({});
  const [busy, setBusy] = React.useState(false);
  const [info, setInfo] = React.useState<string | null>(null);

  function validateAll() {
    const next: typeof errors = {};
    next.fullName = validateFullName(fullName) ?? undefined;
    next.username = validateUsername(username) ?? undefined;
    next.email = validateEmail(email) ?? undefined;
    next.password = validatePassword(password) ?? undefined;
    setErrors(next);
    return Object.values(next).every((v) => !v);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setInfo(null);

    // Honeypot check
    if (hp.trim() !== "") {
      // Pretend success so bots don't probe.
      setInfo("Check your inbox to confirm your email.");
      return;
    }

    // Time-on-page check (humans take >2s to fill the form).
    if (Date.now() - mountedAt.current < 2000) {
      setErrors({ form: "Slow down — please try again." });
      return;
    }

    if (!validateAll()) return;

    setBusy(true);

    // Make sure the username isn't already taken — fail fast with a nice error
    // instead of letting the trigger silently rename the user.
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username.toLowerCase())
      .maybeSingle();
    if (existing) {
      setBusy(false);
      setErrors({ username: "That username is already taken." });
      return;
    }

    const emailRedirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`;
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo,
        data: { full_name: fullName.trim(), username: username.toLowerCase() },
      },
    });
    setBusy(false);
    if (error) {
      setErrors({ form: error.message });
      return;
    }
    if (data.session) {
      // Email confirmation is OFF in Supabase — recommend turning it ON.
      router.push("/");
      router.refresh();
    } else {
      setInfo("Almost there — check your inbox to confirm your email before signing in.");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {/* Honeypot: hidden from users, often filled by bots */}
      <div aria-hidden style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
          />
        </label>
      </div>

      <Field label="Full name" error={errors.fullName}>
        <Input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          required
          maxLength={60}
        />
      </Field>

      <Field
        label="Username"
        hint="3–20 chars, lowercase letters, numbers, underscores."
        error={errors.username}
      >
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
          autoComplete="username"
          required
          minLength={3}
          maxLength={20}
        />
      </Field>

      <Field label="Email" error={errors.email}>
        <Input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          inputMode="email"
        />
      </Field>

      <Field
        label="Password"
        hint="At least 10 characters, with letters and numbers."
        error={errors.password}
      >
        <Input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={10}
        />
      </Field>

      {errors.form ? <p className="text-sm text-red-500 animate-fadeIn">{errors.form}</p> : null}
      {info ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400 animate-fadeIn">{info}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Creating…" : "Create account"}
      </Button>

      <p className="text-[11px] text-muted-foreground text-center leading-relaxed pt-1">
        By signing up you confirm this is your real email and you'll keep your account secure. Disposable / temp-mail providers are not allowed.
      </p>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-500 animate-fadeIn">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
