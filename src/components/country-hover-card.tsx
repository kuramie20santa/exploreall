"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "./ui/card";
import { safetyColor, safetyLabel } from "@/lib/utils";
import { fetchCapitalImage } from "@/lib/capital-images-client";

type Rating = { score: number; level: string };

type CommonProps = {
  href: string;
  flag: string | null;
  name: string;
  capital: string | null;
  continent?: string | null;
  rating?: Rating | null;
  /** Pre-resolved image URL (server-side fetch). If null/undefined, lazy-fetches on first hover. */
  initialImage?: string | null;
  layout?: "card" | "row";
  showContinent?: boolean;
  className?: string;
};

export function CountryHoverCard({
  href,
  flag,
  name,
  capital,
  continent,
  rating,
  initialImage,
  layout = "card",
  showContinent = true,
  className,
}: CommonProps) {
  const [img, setImg] = React.useState<string | null>(initialImage ?? null);
  const [loaded, setLoaded] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const fetchedRef = React.useRef(false);

  // Preload the image once we know its URL so the fade-in is instant.
  React.useEffect(() => {
    if (!img) return;
    const im = new window.Image();
    im.onload = () => setLoaded(true);
    im.src = img;
  }, [img]);

  async function ensureImage() {
    if (img || fetchedRef.current) return;
    fetchedRef.current = true;
    const url = await fetchCapitalImage(capital, name);
    setImg(url);
  }

  function onEnter() {
    setHovered(true);
    void ensureImage();
  }

  function onLeave() {
    setHovered(false);
  }

  const showImage = !!img && loaded && hovered;

  if (layout === "row") {
    return (
      <Link
        href={href}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onFocus={onEnter}
        onBlur={onLeave}
        className={
          "group relative overflow-hidden rounded-2xl bg-card hairline p-4 flex items-center gap-3 lift press transition " +
          (className ?? "")
        }
      >
        {/* Background image (slides in from the right) */}
        {img ? (
          <span
            aria-hidden
            className={
              "pointer-events-none absolute inset-0 bg-cover bg-center transition-all duration-700 ease-[cubic-bezier(.2,.8,.2,1)] " +
              (showImage ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4")
            }
            style={{ backgroundImage: `url(${img})` }}
          />
        ) : null}
        {/* Dark gradient overlay for readability when image is showing */}
        <span
          aria-hidden
          className={
            "pointer-events-none absolute inset-0 transition-opacity duration-500 " +
            "bg-gradient-to-r from-black/85 via-black/55 to-black/30 " +
            (showImage ? "opacity-100" : "opacity-0")
          }
        />

        <span className="relative z-10 text-2xl">{flag}</span>
        <span className="relative z-10 flex-1 min-w-0">
          <span
            className={
              "block font-medium truncate transition-colors duration-300 " +
              (showImage ? "text-white" : "")
            }
          >
            {name}
          </span>
          <span
            className={
              "block text-xs truncate transition-colors duration-300 " +
              (showImage ? "text-white/80" : "text-muted-foreground")
            }
          >
            {capital ?? "—"}{showContinent && continent ? ` · ${continent}` : ""}
          </span>
        </span>
        {rating ? (
          <Badge className={"relative z-10 " + safetyColor(rating.level)}>
            {rating.score}
          </Badge>
        ) : null}
      </Link>
    );
  }

  // Default: large card layout
  return (
    <Link
      href={href}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      className={
        "group relative overflow-hidden rounded-3xl bg-card hairline shadow-soft p-5 lift hover:shadow-glow press transition " +
        (className ?? "")
      }
    >
      {/* Background image — fades + scales in */}
      {img ? (
        <span
          aria-hidden
          className={
            "pointer-events-none absolute inset-0 bg-cover bg-center transition-all duration-700 ease-[cubic-bezier(.2,.8,.2,1)] " +
            (showImage ? "opacity-100 scale-100" : "opacity-0 scale-110")
          }
          style={{ backgroundImage: `url(${img})` }}
        />
      ) : null}

      {/* Gradient veil for text legibility once image is on */}
      <span
        aria-hidden
        className={
          "pointer-events-none absolute inset-0 transition-opacity duration-500 " +
          "bg-gradient-to-t from-black/80 via-black/40 to-black/30 " +
          (showImage ? "opacity-100" : "opacity-0")
        }
      />

      <div className="relative z-10 flex items-center justify-between">
        <span className="text-3xl drop-shadow-sm">{flag}</span>
        {rating ? (
          <Badge className={safetyColor(rating.level)}>
            {rating.score} · {safetyLabel(rating.level)}
          </Badge>
        ) : null}
      </div>

      <h3
        className={
          "relative z-10 mt-3 font-display text-xl font-semibold tracking-tight transition-colors duration-300 " +
          (showImage ? "text-white" : "")
        }
      >
        {name}
      </h3>
      <p
        className={
          "relative z-10 text-sm transition-colors duration-300 " +
          (showImage ? "text-white/85" : "text-muted-foreground")
        }
      >
        {capital ?? "—"}{showContinent && continent ? ` · ${continent}` : ""}
      </p>
    </Link>
  );
}
