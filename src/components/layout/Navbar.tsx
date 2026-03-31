"use client";

import { useState, useEffect, useRef, Fragment, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu as MenuIcon,
  X,
  Search,
  ChevronDown,
  ChevronRight,
  FileText,
  ArrowRight,
  Command,
  Sparkles,
  Sun,
  Moon,
  Rss,
} from "lucide-react";
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import { useSiteConfig, updateSiteConfigCache } from "@/lib/useSiteConfig";
import { applyThemeClass } from "@/components/ThemeApplier";
import { getCategoryIcon, getCategoryColor, getCategoryDesc } from "@/lib/categoryUtils";

interface Category {
  name: string;
  slug: string;
  icon?: string | null;
  color?: string | null;
  description?: string | null;
  children?: { name: string; slug: string; icon?: string | null; color?: string | null }[];
}

export default function Navbar() {
  const config = useSiteConfig();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mounted, setMounted] = useState(false);
  const [searchResults, setSearchResults] = useState<{ title: string; slug: string; category?: { name: string } }[]>([]);
  // Derive theme from config (single source of truth); fallback to DOM class before config loads
  const theme = config.theme_name
    || (typeof document !== "undefined"
      ? Array.from(document.documentElement.classList).find((c) => c.startsWith("theme-"))
      : null)
    || "theme-dark-indigo";

  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard hydration guard pattern
  useEffect(() => { setMounted(true); }, []);
  const dropdownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Scroll & reading progress
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setReadingProgress(docHeight > 0 ? Math.min(window.scrollY / docHeight, 1) : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCategories(data); })
      .catch(() => {});
  }, []);

  // Close overlays on route change
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setDrawerOpen(false); setCmdOpen(false); }, [pathname]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDropdown(null);
        setCmdOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Focus search input when command palette opens
  /* eslint-disable react-hooks/set-state-in-effect -- clearing derived state when dialog closes */
  useEffect(() => {
    if (cmdOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchResults([]);
    }
  }, [cmdOpen]);

  // Debounced instant search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/posts?search=${encodeURIComponent(searchQuery.trim())}&limit=5`)
        .then((r) => r.json())
        .then((data) => setSearchResults(data.posts || []))
        .catch(() => setSearchResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const openDropdown = useCallback((slug: string) => {
    if (dropdownTimer.current) clearTimeout(dropdownTimer.current);
    setActiveDropdown(slug);
  }, []);

  const closeDropdown = useCallback(() => {
    dropdownTimer.current = setTimeout(() => setActiveDropdown(null), 200);
  }, []);

  const handleSearch = useCallback((query: string) => {
    if (query.trim()) {
      router.push(`/blog?search=${encodeURIComponent(query.trim())}`);
      setCmdOpen(false);
      setSearchQuery("");
    }
  }, [router]);

  const siteName = config.site_name || "TechBlog";
  const siteLogo = config.site_logo || siteName[0];

  const staticLinks = [
    { href: "/blog", label: "博客", icon: FileText },
    { href: "/tags", label: "标签", icon: null },
    { href: "/archive", label: "归档", icon: null },
    { href: "/album", label: "相册", icon: Sparkles },
    { href: "/about", label: "关于", icon: null },
  ];

  const isArticlePage = pathname.startsWith("/blog/") && pathname !== "/blog";

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "glass-strong shadow-lg shadow-black/10"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group cursor-pointer shrink-0">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300" suppressHydrationWarning>
                {siteLogo}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-accent opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300 -z-10" />
              </div>
              <span className="text-lg sm:text-xl font-bold gradient-text" suppressHydrationWarning>
                {siteName}
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-0.5">
              {/* Home link */}
              <Link
                href="/"
                className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 cursor-pointer ${
                  pathname === "/"
                    ? "text-primary-light bg-primary/10"
                    : "text-foreground/70 hover:text-foreground hover:bg-white/5"
                }`}
              >
                首页
              </Link>

              {/* Category dropdowns */}
              {categories.map((cat) => {
                const hasChildren = cat.children && cat.children.length > 0;
                const IconComp = getCategoryIcon(cat);
                const isActive = pathname.startsWith(`/categories/${cat.slug}`);

                return (
                  <div
                    key={cat.slug}
                    className="relative"
                    onMouseEnter={() => openDropdown(cat.slug)}
                    onMouseLeave={closeDropdown}
                  >
                    <Link
                      href={`/categories/${cat.slug}`}
                      aria-expanded={activeDropdown === cat.slug}
                      aria-haspopup="true"
                      className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 flex items-center gap-1 cursor-pointer ${
                        isActive
                          ? "text-primary-light bg-primary/10"
                          : "text-foreground/70 hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      {cat.name}
                      {hasChildren && (
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${activeDropdown === cat.slug ? "rotate-180" : ""}`} />
                      )}
                    </Link>

                    {/* Mega Dropdown */}
                    {activeDropdown === cat.slug && hasChildren && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3">
                        <div className="mega-dropdown glass-strong rounded-2xl shadow-2xl shadow-black/20 p-2 min-w-[320px]">
                          {/* Category header */}
                          <div className="px-3 py-2.5 mb-1">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getCategoryColor(cat)} flex items-center justify-center`}>
                                <IconComp className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-foreground">{cat.name}</div>
                                <div className="text-xs text-muted">
                                  {getCategoryDesc(cat)}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mx-2 mb-1" />

                          {/* Child categories */}
                          {cat.children!.map((child) => (
                            <Link
                              key={child.slug}
                              href={`/categories/${child.slug}`}
                              className="mega-dropdown-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer group/item"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover/item:bg-primary group-hover/item:shadow-sm group-hover/item:shadow-primary/50 transition-all" />
                              <span className="text-sm text-foreground/70 group-hover/item:text-foreground transition-colors">
                                {child.name}
                              </span>
                              <ArrowRight className="w-3 h-3 text-muted opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all ml-auto" />
                            </Link>
                          ))}

                          {/* View all link */}
                          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mx-2 mt-1 mb-1" />
                          <Link
                            href={`/categories/${cat.slug}`}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-primary-light hover:text-primary transition-colors cursor-pointer rounded-lg hover:bg-primary/5"
                          >
                            查看全部 {cat.name} 文章
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Static links */}
              {staticLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 cursor-pointer ${
                    pathname === link.href
                      ? "text-primary-light bg-primary/10"
                      : "text-foreground/70 hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-0.5">
              {/* Theme toggle */}
              <button
                onClick={() => {
                  const next = theme === "theme-light" ? "theme-dark-indigo" : "theme-light";
                  applyThemeClass(next);
                  updateSiteConfigCache("theme_name", next);
                  fetch("/api/admin/settings", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ theme_name: next }),
                  }).catch(() => {});
                }}
                className="flex p-2 text-foreground/50 hover:text-foreground hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                aria-label="切换主题"
              >
                {mounted ? (theme === "theme-light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />) : <Sun className="w-4 h-4" />}
              </button>
              {/* RSS */}
              <a
                href="/feed.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex p-2 text-foreground/50 hover:text-foreground hover:bg-white/5 rounded-lg transition-all"
                aria-label="RSS 订阅"
              >
                <Rss className="w-4 h-4" />
              </a>
              {/* Search */}
              <button
                onClick={() => setCmdOpen(true)}
                className="flex items-center gap-2 px-2.5 py-1.5 text-foreground/50 hover:text-foreground hover:bg-white/5 rounded-lg transition-all cursor-pointer group"
                aria-label="搜索 (Ctrl+K)"
              >
                <Search className="w-4 h-4 group-hover:text-primary-light transition-colors" />
                <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-muted border border-border/60 rounded-md px-1.5 py-0.5 font-mono">
                  <Command className="w-2.5 h-2.5" />K
                </kbd>
              </button>
              <button
                className="lg:hidden p-2 text-foreground/60 hover:text-foreground cursor-pointer"
                onClick={() => setDrawerOpen(true)}
                aria-label="打开菜单"
              >
                <MenuIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Reading progress bar */}
        {isArticlePage && readingProgress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border/20">
            <div
              className="reading-progress h-full"
              style={{ transform: `scaleX(${readingProgress})` }}
            />
          </div>
        )}
      </nav>

      {/* ===== Command Palette (Search) ===== */}
      <Transition show={cmdOpen} as={Fragment}>
        <Dialog onClose={() => { setCmdOpen(false); setSearchQuery(""); }} className="relative z-[70]">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </TransitionChild>

          <div className="fixed inset-0 flex items-start justify-center pt-[20vh] px-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-xl">
                <div className="glass-strong rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden">
                  {/* Search input */}
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleSearch(searchQuery); }}
                    className="flex items-center gap-3 px-5 py-4 border-b border-border/30"
                  >
                    <Search className="w-5 h-5 text-primary-light shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="搜索文章、分类、标签..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent text-foreground text-base placeholder:text-muted/60 focus:outline-none"
                    />
                    <kbd className="text-[10px] text-muted border border-border/50 rounded px-1.5 py-0.5 font-mono">ESC</kbd>
                  </form>

                  {/* Quick links */}
                  <div className="px-3 py-3 max-h-[40vh] overflow-y-auto">
                    {searchResults.length === 0 && (
                    <div className="px-2 py-1.5 text-xs font-medium text-muted uppercase tracking-wider">快速导航</div>
                    )}
                    {searchResults.length === 0 && categories.slice(0, 5).map((cat) => {
                      const IconComp = getCategoryIcon(cat);
                      const color = getCategoryColor(cat);
                      return (
                        <button
                          key={cat.slug}
                          onClick={() => { router.push(`/categories/${cat.slug}`); setCmdOpen(false); }}
                          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left hover:bg-white/5 transition-colors cursor-pointer group"
                        >
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <IconComp className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-sm text-foreground">{cat.name}</div>
                            <div className="text-xs text-muted">{getCategoryDesc(cat)}</div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      );
                    })}

                    {/* Instant search results */}
                    {searchResults.length > 0 && (
                      <>
                        <div className="h-px bg-border/30 mx-2 my-2" />
                        <div className="px-2 py-1.5 text-xs font-medium text-muted uppercase tracking-wider">文章</div>
                        {searchResults.map((post) => (
                          <button
                            key={post.slug}
                            onClick={() => { router.push(`/blog/${post.slug}`); setCmdOpen(false); setSearchQuery(""); }}
                            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left hover:bg-white/5 transition-colors cursor-pointer group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <FileText className="w-4 h-4 text-primary-light" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-foreground truncate">{post.title}</div>
                              {post.category && <div className="text-xs text-muted">{post.category.name}</div>}
                            </div>
                          </button>
                        ))}
                      </>
                    )}

                    {searchQuery.trim() && (
                      <>
                        <div className="h-px bg-border/30 mx-2 my-2" />
                        <button
                          onClick={() => handleSearch(searchQuery)}
                          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Search className="w-4 h-4 text-primary-light" />
                          </div>
                          <div className="text-sm text-foreground">
                            搜索 &ldquo;<span className="text-primary-light">{searchQuery}</span>&rdquo;
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>

      {/* ===== Mobile drawer ===== */}
      <Transition show={drawerOpen} as={Fragment}>
        <Dialog onClose={() => setDrawerOpen(false)} className="relative z-[60] lg:hidden">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </TransitionChild>

          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="ease-in duration-200"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <DialogPanel className="fixed inset-y-0 left-0 w-72 bg-surface border-r border-border overflow-y-auto">
              {/* Drawer header */}
              <div className="flex items-center justify-between h-16 px-5 border-b border-border">
                <Link href="/" className="flex items-center gap-2 cursor-pointer" onClick={() => setDrawerOpen(false)}>
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xs">
                    {siteLogo}
                  </div>
                  <span className="font-bold gradient-text">{siteName}</span>
                </Link>
                <button onClick={() => setDrawerOpen(false)} className="p-1.5 text-muted hover:text-foreground cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer search */}
              <div className="p-4 border-b border-border">
                <button
                  onClick={() => { setDrawerOpen(false); setTimeout(() => setCmdOpen(true), 150); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-muted cursor-pointer hover:border-primary/30 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  <span>搜索文章...</span>
                  <kbd className="ml-auto text-[10px] border border-border/50 rounded px-1 py-0.5 font-mono">⌘K</kbd>
                </button>
              </div>

              {/* Drawer nav links */}
              <nav className="p-3 space-y-0.5">
                <Link
                  href="/"
                  onClick={() => setDrawerOpen(false)}
                  className={`block px-3 py-2.5 text-sm rounded-lg cursor-pointer transition-colors ${
                    pathname === "/" ? "text-primary-light bg-primary/10" : "text-foreground/80 hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  首页
                </Link>

                {categories.map((cat) => {
                  const IconComp = getCategoryIcon(cat);
                  const color = getCategoryColor(cat);

                  return (
                    <div key={cat.slug}>
                      <div className="flex items-center">
                        <Link
                          href={`/categories/${cat.slug}`}
                          onClick={() => setDrawerOpen(false)}
                          className={`flex-1 flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg cursor-pointer transition-colors ${
                            pathname === `/categories/${cat.slug}` ? "text-primary-light bg-primary/10" : "text-foreground/80 hover:text-foreground hover:bg-white/5"
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${color} flex items-center justify-center`}>
                            <IconComp className="w-3.5 h-3.5 text-white" />
                          </div>
                          {cat.name}
                        </Link>
                        {cat.children?.length ? (
                          <button
                            onClick={() => setExpandedMobile(expandedMobile === cat.slug ? null : cat.slug)}
                            className="p-2 text-muted hover:text-foreground cursor-pointer"
                          >
                            <ChevronRight className={`w-4 h-4 transition-transform ${expandedMobile === cat.slug ? "rotate-90" : ""}`} />
                          </button>
                        ) : null}
                      </div>
                      {cat.children?.length && expandedMobile === cat.slug ? (
                        <div className="ml-3 pl-3 border-l border-border/50 space-y-0.5 animate-fade-in">
                          {cat.children.map((child) => (
                            <Link
                              key={child.slug}
                              href={`/categories/${child.slug}`}
                              onClick={() => setDrawerOpen(false)}
                              className={`block px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
                                pathname === `/categories/${child.slug}` ? "text-primary-light" : "text-muted hover:text-foreground"
                              }`}
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                <div className="h-px bg-border/30 my-2" />

                {staticLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`block px-3 py-2.5 text-sm rounded-lg cursor-pointer transition-colors ${
                      pathname === link.href ? "text-primary-light bg-primary/10" : "text-foreground/80 hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>
    </>
  );
}
