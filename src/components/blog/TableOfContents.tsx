"use client";

import { useEffect, useState, useCallback } from "react";
import { List, ChevronDown } from "lucide-react";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Generate a stable heading id from text + index.
 * Kept in sync with injectHeadingIds() below.
 */
export function slugifyHeading(text: string, index: number): string {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-|-$/g, "") || "heading";
  return `heading-${base}-${index}`;
}

/**
 * Pre-process HTML string: inject `id` attributes into h2/h3 elements
 * so they survive React re-renders.
 * Also returns the extracted TOC items.
 *
 * NOTE: This function only adds `id` attributes to existing heading tags.
 * It does NOT render or set innerHTML — callers are responsible for
 * sanitizing with DOMPurify before rendering.
 */
export function injectHeadingIds(html: string): { html: string; headings: TocItem[] } {
  const headings: TocItem[] = [];
  let index = 0;

  const processed = html.replace(
    /<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi,
    (match, tag: string, attrs: string, content: string) => {
      // Strip HTML tags from content for display text
      const text = content.replace(/<[^>]*>/g, "").trim();
      const level = tag.toLowerCase() === "h2" ? 2 : 3;

      // Check if id already exists in attributes
      const existingId = attrs.match(/\bid="([^"]+)"/)?.[1];
      const id = existingId || slugifyHeading(text, index);
      index++;

      headings.push({ id, text, level });

      if (existingId) {
        return match; // Already has id, keep as-is
      }
      return `<${tag}${attrs} id="${id}">${content}</${tag}>`;
    }
  );

  return { html: processed, headings };
}

export default function TableOfContents({
  headings: externalHeadings,
}: {
  headings?: TocItem[];
  contentReady?: boolean;
}) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Use externally-provided headings (from injectHeadingIds) or scan DOM as fallback
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (externalHeadings && externalHeadings.length > 0) {
      setHeadings(externalHeadings);
      return;
    }

    // Fallback: scan DOM (for content not processed by injectHeadingIds)
    const article = document.querySelector("article");
    if (!article) return;

    const elements = article.querySelectorAll("h2, h3");
    const items: TocItem[] = [];
    elements.forEach((el, i) => {
      const id = el.id || slugifyHeading(el.textContent || "", i);
      if (!el.id) el.id = id;
      items.push({
        id,
        text: el.textContent || "",
        level: el.tagName === "H2" ? 2 : 3,
      });
    });
    setHeadings(items);
  }, [externalHeadings]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Observe headings for active tracking
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px" }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  const scrollToHeading = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: "smooth" });
      // Update URL hash without triggering scroll (for shareable links)
      history.replaceState(null, "", `#${id}`);
    }
    setMobileOpen(false);
  }, []);

  if (headings.length < 2) return null;

  const tocList = (
    <ul className="space-y-0.5">
      {headings.map((item) => (
        <li key={item.id}>
          <button
            onClick={() => scrollToHeading(item.id)}
            className={`block w-full text-left text-xs py-1.5 transition-all cursor-pointer rounded-lg px-2.5 ${
              item.level === 3 ? "pl-5" : ""
            } ${
              activeId === item.id
                ? "text-primary-light font-medium bg-primary/10"
                : "text-muted hover:text-foreground hover:bg-white/5"
            }`}
          >
            {item.text}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* Desktop TOC - fixed sidebar */}
      <nav className="hidden xl:block fixed right-8 top-24 w-56 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div className="glass rounded-xl p-4">
          <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <List className="w-3.5 h-3.5" /> 目录
          </h4>
          {tocList}
        </div>
      </nav>

      {/* Mobile TOC - collapsible at top of article */}
      <div className="xl:hidden mb-6">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full flex items-center justify-between px-4 py-3 glass rounded-xl text-sm text-foreground cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <List className="w-4 h-4 text-primary-light" />
            文章目录 ({headings.length})
          </span>
          <ChevronDown className={`w-4 h-4 text-muted transition-transform ${mobileOpen ? "rotate-180" : ""}`} />
        </button>
        {mobileOpen && (
          <div className="mt-2 glass rounded-xl p-3 animate-fade-in max-h-60 overflow-y-auto">
            {tocList}
          </div>
        )}
      </div>
    </>
  );
}
