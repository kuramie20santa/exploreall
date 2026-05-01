import { Heart } from "lucide-react";

export const SUPPORT_URL = "https://revolut.me/18kshv";

/** Prominent card for the home page. */
export function SupportCard() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] hairline bg-card shadow-soft animate-scaleIn">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_80%_20%,rgba(244,63,94,0.10)_0%,transparent_70%)]" />
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-rose-500/10 blur-2xl animate-float" aria-hidden />

      <div className="relative px-6 sm:px-10 py-10 sm:py-12 grid sm:grid-cols-[1fr_auto] gap-6 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground rounded-full bg-muted px-3 py-1 ring-1 ring-inset ring-black/5 dark:ring-white/10">
            <Heart className="h-3 w-3 fill-rose-500 text-rose-500 animate-pop" /> Built by one person
          </div>
          <h2 className="mt-4 font-display text-2xl sm:text-3xl font-semibold tracking-tight leading-tight">
            Enjoying ExploreAll?
          </h2>
          <p className="mt-2 text-muted-foreground max-w-md leading-relaxed">
            ExploreAll is built and hosted independently — no ads, no trackers, no investors.
            If it's useful to you, a small tip helps keep it running and ad-free.
          </p>
        </div>

        <div className="flex sm:justify-end">
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-foreground text-background font-medium hover:opacity-90 transition press shadow-soft"
          >
            <Heart className="h-4 w-4 fill-rose-500 text-rose-500" /> Support the project
          </a>
        </div>
      </div>
    </section>
  );
}

/** Small inline pill — for the footer or sidebar. */
export function SupportLink({ className }: { className?: string }) {
  return (
    <a
      href={SUPPORT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition group " +
        (className ?? "")
      }
    >
      <Heart className="h-3 w-3 group-hover:fill-rose-500 group-hover:text-rose-500 transition" />
      Support ExploreAll
    </a>
  );
}
