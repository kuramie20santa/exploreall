import Link from "next/link";
import { LoginForm } from "./form";
import { SocialAuthButtons } from "@/components/social-auth-buttons";

export const dynamic = "force-dynamic";

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md rounded-[2rem] bg-card hairline shadow-soft p-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-center">Welcome back</h1>
        <p className="mt-1 text-center text-muted-foreground text-sm">Sign in to share trips and save places.</p>

        <div className="mt-8">
          <SocialAuthButtons next={searchParams.next} />
        </div>

        <div className="mt-2">
          <LoginForm next={searchParams.next} />
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New here? <Link href="/signup" className="text-foreground hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
