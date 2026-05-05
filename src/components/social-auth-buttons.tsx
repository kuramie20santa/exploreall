"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * "Continue with Google / Apple" buttons. Renders a divider above when used
 * alongside an email form. Set `enableApple={false}` to hide the Apple button
 * (until the user has configured it in Supabase).
 */
export function SocialAuthButtons({
  next,
  enableGoogle = true,
  enableApple = true,
  showDivider = true,
}: {
  next?: string;
  enableGoogle?: boolean;
  enableApple?: boolean;
  showDivider?: boolean;
}) {
  const supabase = React.useMemo(() => createClient(), []);
  const [busy, setBusy] = React.useState<"google" | "apple" | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  async function signIn(provider: "google" | "apple") {
    setErr(null);
    setBusy(provider);
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const redirectTo = `${origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) {
      setBusy(null);
      setErr(error.message);
    }
    // On success the browser is redirected to the OAuth provider — no further
    // local state to manage.
  }

  if (!enableGoogle && !enableApple) return null;

  return (
    <div className="space-y-3">
      {enableGoogle ? (
        <button
          type="button"
          onClick={() => signIn("google")}
          disabled={busy !== null}
          className="w-full inline-flex items-center justify-center gap-2.5 h-11 px-5 rounded-full hairline bg-card hover:bg-muted text-sm font-medium press transition disabled:opacity-50 disabled:pointer-events-none"
        >
          <GoogleIcon />
          {busy === "google" ? "Redirecting…" : "Continue with Google"}
        </button>
      ) : null}

      {enableApple ? (
        <button
          type="button"
          onClick={() => signIn("apple")}
          disabled={busy !== null}
          className="w-full inline-flex items-center justify-center gap-2.5 h-11 px-5 rounded-full bg-foreground text-background hover:opacity-90 text-sm font-medium press transition disabled:opacity-50 disabled:pointer-events-none"
        >
          <AppleIcon />
          {busy === "apple" ? "Redirecting…" : "Continue with Apple"}
        </button>
      ) : null}

      {err ? <p className="text-xs text-red-500 text-center">{err}</p> : null}

      {showDivider ? (
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wide">
            <span className="bg-card px-3 text-muted-foreground">or</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function GoogleIcon() {
  // Multicolor Google "G" — works in light and dark mode
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden focusable="false">
      <path fill="#EA4335" d="M12 10.2v3.78h5.31c-.23 1.21-.92 2.23-1.96 2.92v2.43h3.17c1.85-1.7 2.92-4.21 2.92-7.18 0-.69-.06-1.36-.18-2H12z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.89 6.6-2.42l-3.17-2.43c-.88.59-2 .94-3.43.94-2.64 0-4.88-1.79-5.68-4.18H3.06v2.62A9.99 9.99 0 0 0 12 22z" />
      <path fill="#FBBC05" d="M6.32 13.91A6 6 0 0 1 6 12c0-.66.11-1.31.32-1.91V7.47H3.06A10 10 0 0 0 2 12c0 1.62.39 3.15 1.06 4.53l3.26-2.62z" />
      <path fill="#4285F4" d="M12 5.82c1.47 0 2.78.51 3.82 1.5l2.83-2.83C16.96 2.96 14.7 2 12 2 7.96 2 4.46 4.32 3.06 7.47l3.26 2.62C7.12 7.61 9.36 5.82 12 5.82z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden focusable="false" fill="currentColor">
      <path d="M16.365 1.43c0 1.14-.41 2.21-1.23 3.04-.79.85-2.04 1.46-3.04 1.39-.13-1.1.43-2.27 1.18-3.05.83-.86 2.21-1.51 3.09-1.38zM20.7 17.42c-.55 1.27-.81 1.83-1.51 2.94-.99 1.55-2.39 3.49-4.13 3.5-1.55.02-1.95-1.01-4.06-1-2.11.01-2.55 1.02-4.1 1-1.74-.02-3.07-1.78-4.07-3.33C.66 17.06.16 11.91 2.27 8.99c1.5-2.07 3.86-3.27 6.08-3.27 2.27 0 3.69 1.24 5.57 1.24 1.82 0 2.93-1.24 5.55-1.24 1.97 0 4.05 1.07 5.54 2.92-4.86 2.66-4.07 9.6-4.31 8.78z" />
    </svg>
  );
}
