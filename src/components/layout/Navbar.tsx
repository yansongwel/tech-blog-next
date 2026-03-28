"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, Search, ChevronDown } from "lucide-react";
import { useSiteConfig } from "@/lib/useSiteConfig";

interface Category {
  name: string;
  slug: string;
  children?: { name: string; slug: string }[];
}

export default function Navbar() {
  const config = useSiteConfig();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  const siteName = config.site_name || "TechBlog";
  const siteLogo = config.site_logo || siteName[0];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform">
              {siteLogo}
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:block">
              {siteName}
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            <Link
              href="/"
              className="px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            >
              首页
            </Link>
            {categories.map((cat) => (
              <div
                key={cat.slug}
                className="relative"
                onMouseEnter={() =>
                  cat.children?.length && setActiveDropdown(cat.slug)
                }
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href={`/categories/${cat.slug}`}
                  className="px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {cat.name}
                  {cat.children?.length ? <ChevronDown className="w-3 h-3" /> : null}
                </Link>
                {cat.children?.length && activeDropdown === cat.slug ? (
                  <div className="absolute top-full left-0 mt-1 py-2 glass rounded-xl shadow-xl min-w-[160px] animate-fade-in">
                    {cat.children.map((child) => (
                      <Link
                        key={child.slug}
                        href={`/categories/${child.slug}`}
                        className="block px-4 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            <Link href="/album" className="px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
              相册
            </Link>
            <Link href="/about" className="px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
              关于
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-foreground/60 hover:text-foreground hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              className="lg:hidden p-2 text-foreground/60 hover:text-foreground cursor-pointer"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="absolute top-full left-0 right-0 glass p-4 animate-fade-in">
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
            <input
              type="text"
              placeholder="搜索文章... 按回车搜索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
              autoFocus
            />
          </form>
        </div>
      )}

      {mobileOpen && (
        <div className="lg:hidden glass border-t border-border animate-fade-in">
          <div className="px-4 py-4 space-y-2">
            <Link href="/" className="block px-3 py-2 text-foreground/80 hover:text-foreground rounded-lg cursor-pointer">首页</Link>
            {categories.map((cat) => (
              <div key={cat.slug}>
                <Link href={`/categories/${cat.slug}`} className="block px-3 py-2 text-foreground/80 hover:text-foreground rounded-lg cursor-pointer">{cat.name}</Link>
                {cat.children?.length ? (
                  <div className="ml-4 space-y-1">
                    {cat.children.map((child) => (
                      <Link key={child.slug} href={`/categories/${child.slug}`} className="block px-3 py-1.5 text-sm text-muted hover:text-foreground rounded-lg cursor-pointer">{child.name}</Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            <Link href="/album" className="block px-3 py-2 text-foreground/80 hover:text-foreground rounded-lg cursor-pointer">相册</Link>
            <Link href="/about" className="block px-3 py-2 text-foreground/80 hover:text-foreground rounded-lg cursor-pointer">关于</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
