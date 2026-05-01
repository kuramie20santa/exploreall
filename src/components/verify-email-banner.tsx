import Link from "next/link";
import { MailWarning } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export async function VerifyEmailBanner() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  if (user.email_confirmed_at) return null;

  return (
    <div className="container pt-4 animate-fadeIn">
      <div className="flex items-center gap-3 rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20 px-4 py-2.5 text-sm">
        <MailWarning className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <p className="flex-1 text-amber-900 dark:text-amber-200 leading-snug">
          Please confirm your email — until then you can browse but can't post, comment, or like.
        </p>
        <Link
          href="/settings"
          className="inline-flex h-8 items-center justify-center px-3 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-100 text-xs font-medium leading-none press transition"
        >
          Resend
        </Link>
      </div>
    </div>
  );
}
