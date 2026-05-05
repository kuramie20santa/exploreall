import Link from "next/link";
import { SignupForm } from "./form";
import { SocialAuthButtons } from "@/components/social-auth-buttons";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md rounded-[2rem] bg-card hairline shadow-soft p-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-center">Create your account</h1>
        <p className="mt-1 text-center text-muted-foreground text-sm">Free, takes a few seconds.</p>

        <div className="mt-8">
          <SocialAuthButtons />
        </div>

        <div className="mt-2">
          <SignupForm />
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already a member? <Link href="/login" className="text-foreground hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
