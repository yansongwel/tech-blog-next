"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GitBranch, Mail, Rss, Clock, Eye, Users } from "lucide-react";
import { useSiteConfig } from "@/lib/useSiteConfig";

interface Category {
  name: string;
  slug: string;
}

function RunningDays({ startDate }: { startDate: string }) {
  const days = Math.floor(
    (Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  return <span className="font-mono text-foreground">{Math.max(1, days)}</span>;
}

export default function Footer() {
  const config = useSiteConfig();
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<{ totalViews: number; siteVisits: number; startDate: string } | null>(null);

  useEffect(() => {
    fetch("/api/site-stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {});
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  const siteName = config.site_name || "TechBlog";
  const siteDesc = config.site_description || "";
  const githubUrl = config.github_url;
  const emailAddr = config.email;
  const icpNumber = config.icp_number;

  return (
    <footer className="relative z-10 border-t border-border bg-surface/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <h3 className="text-xl font-bold gradient-text mb-3">{siteName}</h3>
            <p className="text-muted text-sm leading-relaxed">{siteDesc}</p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3">技术分类</h4>
            <ul className="space-y-2">
              {categories.slice(0, 4).map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/categories/${cat.slug}`} className="text-sm text-muted hover:text-foreground transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3">更多分类</h4>
            <ul className="space-y-2">
              {categories.slice(4).map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/categories/${cat.slug}`} className="text-sm text-muted hover:text-foreground transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3">链接</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-muted hover:text-foreground transition-colors">关于我</Link></li>
              <li><Link href="/album" className="text-sm text-muted hover:text-foreground transition-colors">相册</Link></li>
            </ul>
            <div className="flex gap-3 mt-4">
              {githubUrl && (
                <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-foreground transition-colors">
                  <GitBranch className="w-5 h-5" />
                </a>
              )}
              {emailAddr && (
                <a href={`mailto:${emailAddr}`} className="text-muted hover:text-foreground transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
              )}
              <Link href="/blog" className="text-muted hover:text-foreground transition-colors">
                <Rss className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Site stats */}
        {stats && (
          <div className="mt-8 pt-6 border-t border-border flex flex-wrap items-center justify-center gap-6 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary-light" />
              运行 <RunningDays startDate={stats.startDate} /> 天
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-accent" />
              文章浏览 {stats.totalViews.toLocaleString()} 次
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary-light" />
              访问 {stats.siteVisits.toLocaleString()} 次
            </span>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-border text-center text-sm text-muted">
          &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
          {icpNumber && <span className="ml-4">{icpNumber}</span>}
        </div>
      </div>
    </footer>
  );
}
