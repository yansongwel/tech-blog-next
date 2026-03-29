"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu as MenuIcon, X, Search, ChevronDown, ChevronRight } from "lucide-react";
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import { useSiteConfig } from "@/lib/useSiteConfig";

interface Category {
  name: string;
  slug: string;
  children?: { name: string; slug: string }[];
}

export default function Navbar() {
  const config = useSiteConfig();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const dropdownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCategories(data); })
      .catch(() => {});
  }, []);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); setSearchOpen(false); }, [pathname]);

  // Keyboard: Escape closes dropdown/search
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDropdown(null);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const openDropdown = (slug: string) => {
    if (dropdownTimer.current) clearTimeout(dropdownTimer.current);
    setActiveDropdown(slug);
  };
  const closeDropdown = () => {
    dropdownTimer.current = setTimeout(() => setActiveDropdown(null), 150);
  };

  const siteName = config.site_name || "TechBlog";
  const siteLogo = config.site_logo || siteName[0];

  const navLinks = [
    { href: "/", label: "首页" },
    ...categories.map((cat) => ({
      href: `/categories/${cat.slug}`,
      label: cat.name,
      children: cat.children,
      slug: cat.slug,
    })),
    { href: "/blog", label: "博客" },
    { href: "/album", label: "相册" },
    { href: "/about", label: "关于" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[var(--glass-bg,rgba(26,26,46,0.85))] backdrop-blur-xl shadow-lg border-b border-border/50"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group cursor-pointer shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform">
                {siteLogo}
              </div>
              <span className="text-xl font-bold gradient-text hidden sm:block">
                {siteName}
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-0.5">
              {navLinks.map((link) => {
                const hasChildren = "children" in link && link.children?.length;
                const slug = "slug" in link ? link.slug : undefined;

                if (!hasChildren) {
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                        pathname === link.href
                          ? "text-primary-light bg-primary/10"
                          : "text-foreground/70 hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                }

                return (
                  <div
                    key={link.href}
                    className="relative"
                    onMouseEnter={() => openDropdown(slug!)}
                    onMouseLeave={closeDropdown}
                  >
                    <Link
                      href={link.href}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                        pathname.startsWith(`/categories/${slug}`)
                          ? "text-primary-light bg-primary/10"
                          : "text-foreground/70 hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      {link.label}
                      <ChevronDown className={`w-3 h-3 transition-transform ${activeDropdown === slug ? "rotate-180" : ""}`} />
                    </Link>
                    {/* Dropdown with padding bridge (pt-2 fills the gap so hover doesn't break) */}
                    {activeDropdown === slug && (
                      <div className="absolute top-full left-0 pt-2">
                        <div className="py-1.5 bg-[var(--glass-bg,rgba(26,26,46,0.95))] backdrop-blur-xl rounded-xl shadow-xl border border-border/50 min-w-[180px] animate-fade-in">
                          {link.children!.map((child) => (
                            <Link
                              key={child.slug}
                              href={`/categories/${child.slug}`}
                              className="block px-4 py-2.5 text-sm text-foreground/70 hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-foreground/60 hover:text-foreground hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                aria-label="搜索"
              >
                <Search className="w-5 h-5" />
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

        {/* Search bar */}
        {searchOpen && (
          <div className="absolute top-full left-0 right-0 bg-[var(--glass-bg,rgba(26,26,46,0.95))] backdrop-blur-xl border-b border-border/50 p-4 animate-fade-in">
            <form
              className="max-w-2xl mx-auto"
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  router.push(`/blog?search=${encodeURIComponent(searchQuery.trim())}`);
                  setSearchOpen(false);
                  setSearchQuery("");
                }
              }}
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="搜索文章..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                  autoFocus
                />
              </div>
            </form>
          </div>
        )}
      </nav>

      {/* Mobile drawer with Headless UI */}
      <Transition show={drawerOpen} as={Fragment}>
        <Dialog onClose={() => setDrawerOpen(false)} className="relative z-[60] lg:hidden">
          {/* Backdrop */}
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

          {/* Panel */}
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
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      router.push(`/blog?search=${encodeURIComponent(searchQuery.trim())}`);
                      setDrawerOpen(false);
                      setSearchQuery("");
                    }
                  }}
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="text"
                      placeholder="搜索文章..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
                    />
                  </div>
                </form>
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

                {categories.map((cat) => (
                  <div key={cat.slug}>
                    <div className="flex items-center">
                      <Link
                        href={`/categories/${cat.slug}`}
                        onClick={() => setDrawerOpen(false)}
                        className={`flex-1 px-3 py-2.5 text-sm rounded-lg cursor-pointer transition-colors ${
                          pathname === `/categories/${cat.slug}` ? "text-primary-light bg-primary/10" : "text-foreground/80 hover:text-foreground hover:bg-white/5"
                        }`}
                      >
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
                ))}

                <Link href="/blog" onClick={() => setDrawerOpen(false)} className={`block px-3 py-2.5 text-sm rounded-lg cursor-pointer transition-colors ${pathname === "/blog" ? "text-primary-light bg-primary/10" : "text-foreground/80 hover:text-foreground hover:bg-white/5"}`}>
                  博客
                </Link>
                <Link href="/album" onClick={() => setDrawerOpen(false)} className={`block px-3 py-2.5 text-sm rounded-lg cursor-pointer transition-colors ${pathname === "/album" ? "text-primary-light bg-primary/10" : "text-foreground/80 hover:text-foreground hover:bg-white/5"}`}>
                  相册
                </Link>
                <Link href="/about" onClick={() => setDrawerOpen(false)} className={`block px-3 py-2.5 text-sm rounded-lg cursor-pointer transition-colors ${pathname === "/about" ? "text-primary-light bg-primary/10" : "text-foreground/80 hover:text-foreground hover:bg-white/5"}`}>
                  关于
                </Link>
              </nav>
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>
    </>
  );
}
