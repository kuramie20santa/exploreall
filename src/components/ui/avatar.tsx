import * as React from "react";
import { cn } from "@/lib/utils";

export function Avatar({
  url,
  name,
  size = 40,
  className,
}: {
  url?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const initials =
    (name || "T")
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-black/5 dark:ring-white/10",
        className
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name || "avatar"} className="h-full w-full object-cover" />
      ) : (
        <span className="text-[13px] font-medium text-muted-foreground">{initials}</span>
      )}
    </div>
  );
}
