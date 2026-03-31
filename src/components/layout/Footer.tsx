"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GitBranch, Mail, Rss, Clock, Eye, Users, Heart, ArrowUp } from "lucide-react";
import { useSiteConfig } from "@/lib/useSiteConfig";

interface Category {
  name: string;
  slug: string;
}

function computeDays(startDate: string) {
  return Math.max(1, Math.floor(
    (Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  ));
}

function RunningDays({ startDate }: { startDate: string }) {
  const [days] = useState(() => computeDays(startDate));
  return <span suppressHydrationWarning className="font-mono text-foreground">{days}</span>;
}

export default function Footer() {
  const config = useSiteConfig();
  const [categories, setCategories] = useState<Category[]>([]);
  const [friendLinks, setFriendLinks] = useState<{ id: string; name: string; url: string; description: string | null; logo: string | null }[]>([]);
  const [stats, setStats] = useState<{ totalViews: number; siteVisits: number; startDate: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/site-stats").then((r) => r.json()).catch(() => null),
      fetch("/api/categories").then((r) => r.json()).catch(() => []),
      fetch("/api/friend-links").then((r) => r.json()).catch(() => []),
    ]).then(([statsData, catsData, linksData]) => {
      if (statsData) setStats(statsData);
      if (Array.isArray(catsData)) setCategories(catsData);
      if (Array.isArray(linksData)) setFriendLinks(linksData);
    });
  }, []);

  const siteName = config.site_name || "TechBlog";
  const siteDesc = config.site_description || "";
  const githubUrl = config.github_url;
  const emailAddr = config.email;
  const icpNumber = config.icp_number;

  return (
    <footer className="relative z-10 border-t border-border/50 bg-surface/30 backdrop-blur-md">
      {/* Glow divider line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-6 md:gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-4">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm" suppressHydrationWarning>
                {(config.site_logo || siteName)[0]}
              </div>
              <h3 className="text-xl font-bold gradient-text" suppressHydrationWarning>{siteName}</h3>
            </div>
            <p className="text-muted text-sm leading-relaxed mb-5" suppressHydrationWarning>{siteDesc}</p>
            <div className="flex gap-3">
              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-surface border border-border/50 flex items-center justify-center text-muted hover:text-foreground hover:border-primary/30 hover:shadow-sm hover:shadow-primary/10 transition-all"
                >
                  <GitBranch className="w-4 h-4" />
                </a>
              )}
              {emailAddr && (
                <a
                  href={`mailto:${emailAddr}`}
                  className="w-9 h-9 rounded-lg bg-surface border border-border/50 flex items-center justify-center text-muted hover:text-foreground hover:border-primary/30 hover:shadow-sm hover:shadow-primary/10 transition-all"
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
              <Link
                href="/blog"
                className="w-9 h-9 rounded-lg bg-surface border border-border/50 flex items-center justify-center text-muted hover:text-foreground hover:border-primary/30 hover:shadow-sm hover:shadow-primary/10 transition-all"
              >
                <Rss className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Categories */}
          <div className="md:col-span-3">
            <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">技术分类</h4>
            <ul className="space-y-2.5">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/categories/${cat.slug}`}
                    className="text-sm text-muted hover:text-primary-light transition-colors flex items-center gap-2 group"
                  >
                    <div className="w-1 h-1 rounded-full bg-muted/40 group-hover:bg-primary-light transition-colors" />
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links */}
          <div className="md:col-span-2">
            <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">更多</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/blog", label: "博客" },
                { href: "/about", label: "关于" },
                { href: "/album", label: "相册" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted hover:text-primary-light transition-colors flex items-center gap-2 group"
                  >
                    <div className="w-1 h-1 rounded-full bg-muted/40 group-hover:bg-primary-light transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Site stats card */}
          {stats && (
            <div className="sm:col-span-2 md:col-span-3">
              <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">站点数据</h4>
              <div className="glass rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2.5 text-sm">
                  <Clock className="w-4 h-4 text-primary-light shrink-0" />
                  <span className="text-muted">已运行</span>
                  <RunningDays startDate={stats.startDate} />
                  <span className="text-muted">天</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Eye className="w-4 h-4 text-accent shrink-0" />
                  <span className="text-muted">浏览</span>
                  <span className="font-mono text-foreground">{stats.totalViews.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-muted">访问</span>
                  <span className="font-mono text-foreground">{stats.siteVisits.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Friend Links */}
        {friendLinks.length > 0 && (
          <div className="mt-10 pt-6 border-t border-border/30">
            <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">友情链接</h4>
            <div className="flex flex-wrap gap-2.5">
              {friendLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-sm text-muted hover:text-foreground glass rounded-lg hover:border-primary/30 transition-all cursor-pointer hover:shadow-sm hover:shadow-primary/10 hover:-translate-y-0.5"
                  title={link.description || link.name}
                >
                  {link.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={link.logo}
                      alt={link.name}
                      loading="lazy"
                      className="w-5 h-5 rounded-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : null}
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-muted flex items-center gap-1.5" suppressHydrationWarning>
            &copy; {new Date().getFullYear()} {siteName}
            <span className="mx-1.5 text-border">·</span>
            Made with <Heart className="w-3 h-3 text-pink-400 inline" /> and code
            {icpNumber && (
              <>
                <span className="mx-1.5 text-border">·</span>
                {icpNumber}
              </>
            )}
          </div>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-sm text-muted hover:text-primary-light flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            回到顶部
          </button>
        </div>
      </div>
    </footer>
  );
}
