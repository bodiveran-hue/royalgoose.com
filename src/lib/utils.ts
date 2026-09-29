import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatXaf(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)} M €`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} k €`;
  return `${n} €`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function acr(acute: number, chronic: number) {
  if (!chronic) return 0;
  return Math.round((acute / chronic) * 100) / 100;
}

export function fatigueTone(v: number) {
  if (v >= 75) return "critical" as const;
  if (v >= 60) return "warn" as const;
  return "ok" as const;
}
