"use client";

import { useEffect } from "react";
import { useSiteConfig } from "@/lib/useSiteConfig";

const THEME_CLASSES = [
  "theme-dark-indigo",
  "theme-dark-emerald",
  "theme-dark-rose",
  "theme-dark-amber",
  "theme-light",
];

export default function ThemeApplier() {
  const config = useSiteConfig();

  useEffect(() => {
    const theme = config.theme_name || "theme-dark-indigo";
    const html = document.documentElement;
    // Remove old theme classes, add new one
    THEME_CLASSES.forEach((cls) => html.classList.remove(cls));
    if (THEME_CLASSES.includes(theme)) {
      html.classList.add(theme);
    }
  }, [config.theme_name]);

  return null;
}
