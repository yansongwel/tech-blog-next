"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Search, ChevronDown } from "lucide-react";

const categories = [
  {
    name: "DBA",
    slug: "dba",
    children: [
      { name: "MySQL", slug: "mysql" },
      { name: "PostgreSQL", slug: "postgresql" },
      { name: "Redis", slug: "redis" },
      { name: "MongoDB", slug: "mongodb" },
    ],
  },
  {
    name: "SRE",
    slug: "sre",
    children: [
      { name: "DevOps", slug: "devops" },
      { name: "Kubernetes", slug: "kubernetes" },
      { name: "Docker", slug: "docker" },
      { name: "监控告警", slug: "monitoring" },
      { name: "CI/CD", slug: "cicd" },
    ],
  },
  { name: "AI", slug: "ai" },
  { name: "大数据", slug: "bigdata" },
  { name: "Python", slug: "python" },
  { name: "Golang", slug: "golang" },
  { name: "前端", slug: "frontend" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform">
              T
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:block">
              TechBlog
            </span>
          </Link>

          {/* Desktop Nav */}
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
                  cat.children && setActiveDropdown(cat.slug)
                }
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href={`/categories/${cat.slug}`}
                  className="px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {cat.name}
                  {cat.children && <ChevronDown className="w-3 h-3" />}
                </Link>
                {cat.children && activeDropdown === cat.slug && (
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
                )}
              </div>
            ))}
            <Link
              href="/album"
              className="px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            >
              相册
            </Link>
            <Link
              href="/about"
              className="px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            >
              关于
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-foreground/60 hover:text-foreground hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Mobile menu toggle */}
            <button
              className="lg:hidden p-2 text-foreground/60 hover:text-foreground cursor-pointer"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="absolute top-full left-0 right-0 glass p-4 animate-fade-in">
          <div className="max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="搜索文章..."
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden glass border-t border-border animate-fade-in">
          <div className="px-4 py-4 space-y-2">
            <Link
              href="/"
              className="block px-3 py-2 text-foreground/80 hover:text-foreground rounded-lg cursor-pointer"
            >
              首页
            </Link>
            {categories.map((cat) => (
              <div key={cat.slug}>
                <Link
                  href={`/categories/${cat.slug}`}
                  className="block px-3 py-2 text-foreground/80 hover:text-foreground rounded-lg cursor-pointer"
                >
                  {cat.name}
                </Link>
                {cat.children && (
                  <div className="ml-4 space-y-1">
                    {cat.children.map((child) => (
                      <Link
                        key={child.slug}
                        href={`/categories/${child.slug}`}
                        className="block px-3 py-1.5 text-sm text-muted hover:text-foreground rounded-lg cursor-pointer"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Link
              href="/album"
              className="block px-3 py-2 text-foreground/80 hover:text-foreground rounded-lg cursor-pointer"
            >
              相册
            </Link>
            <Link
              href="/about"
              className="block px-3 py-2 text-foreground/80 hover:text-foreground rounded-lg cursor-pointer"
            >
              关于
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
