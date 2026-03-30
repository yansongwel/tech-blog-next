"use client";

import { useEffect } from "react";
import { useSiteConfig } from "@/lib/useSiteConfig";

export const THEME_CLASSES = [
  "theme-dark-indigo",
  "theme-dark-emerald",
  "theme-dark-rose",
  "theme-dark-amber",
  "theme-light",
];

/** Safely swap theme class on <html> without destroying font/utility classes */
export function applyThemeClass(theme: string) {
  const html = document.documentElement;
  if (html.classList.contains(theme)) return;
  THEME_CLASSES.forEach((cls) => html.classList.remove(cls));
  if (THEME_CLASSES.includes(theme)) {
    html.classList.add(theme);
  }
}

export default function ThemeApplier() {
  const config = useSiteConfig();

  useEffect(() => {
    // Skip if config hasn't loaded yet — keep server-rendered theme intact
    if (!config.theme_name) return;
    applyThemeClass(config.theme_name);
  }, [config.theme_name]);

  return null;
}
