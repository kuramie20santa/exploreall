import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center text-center">
      <div>
        <p className="text-sm text-muted-foreground">404</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight mt-2">Lost in transit.</h1>
        <p className="mt-2 text-muted-foreground">We couldn't find that page.</p>
        <Link href="/" className="inline-flex mt-6 h-10 px-5 items-center rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90">
          Back home
        </Link>
      </div>
    </div>
  );
}
