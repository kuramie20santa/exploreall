import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(d: string | Date | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function timeAgo(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  const s = Math.round((Date.now() - date.getTime()) / 1000);
  const map: [number, string][] = [
    [60, "s"],
    [60, "m"],
    [24, "h"],
    [7, "d"],
    [4.345, "w"],
    [12, "mo"],
    [Number.POSITIVE_INFINITY, "y"],
  ];
  let v = s;
  let unit = "s";
  for (const [div, u] of map) {
    if (v < div) {
      unit = u;
      break;
    }
    v = v / div;
    unit = u;
  }
  return `${Math.max(1, Math.floor(v))}${unit} ago`;
}

export function safetyColor(level?: string | null) {
  switch (level) {
    case "safe":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20";
    case "mostly_safe":
      return "bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-sky-500/20";
    case "caution":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/20";
    case "high_risk":
      return "bg-orange-500/10 text-orange-700 dark:text-orange-300 ring-orange-500/20";
    case "do_not_travel":
      return "bg-red-500/10 text-red-700 dark:text-red-300 ring-red-500/20";
    default:
      return "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 ring-zinc-500/20";
  }
}

export function safetyLabel(level?: string | null) {
  switch (level) {
    case "safe": return "Safe";
    case "mostly_safe": return "Mostly safe";
    case "caution": return "Use caution";
    case "high_risk": return "High risk";
    case "do_not_travel": return "Do not travel";
    default: return "Unknown";
  }
}
