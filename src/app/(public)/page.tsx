"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import HeroCarousel from "@/components/blog/HeroCarousel";
import PostCard from "@/components/blog/PostCard";
import { useSiteConfig } from "@/lib/useSiteConfig";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { PostGridSkeleton } from "@/components/blog/Skeleton";
import {
  ArrowRight,
  MapPin,
  Eye,
  FileText,
  Heart,
  Users,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { getCategoryIcon, getCategoryColor } from "@/lib/categoryUtils";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  color?: string | null;
  description?: string | null;
  _count: { posts: number };
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  category: { name: string; slug: string };
  viewCount: number;
  _count: { likes: number; comments: number };
  publishedAt: string;
}

// ─── Animated counter ────────────────────────────

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    const duration = 1500;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <span className="font-bold text-3xl md:text-4xl gradient-text tabular-nums">
      {value.toLocaleString()}{suffix}
    </span>
  );
}

// ─── Section heading ─────────────────────────────

function SectionHeading({ title, action }: { title: string; action?: { label: string; href: string } }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <div className="w-1 h-7 rounded-full bg-gradient-to-b from-primary to-accent" />
        <h3 className="text-2xl font-bold text-foreground">{title}</h3>
      </div>
      {action && (
        <Link
          href={action.href}
          className="text-sm text-primary-light hover:text-primary flex items-center gap-1 cursor-pointer group"
        >
          {action.label}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  );
}

// ─── Main page ───────────────────────────────────

export default function HomePage() {
  const [typedText, setTypedText] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeMsg, setSubscribeMsg] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [visitorInfo, setVisitorInfo] = useState<{ ip: string; city?: string; region?: string; country?: string } | null>(null);
  const [siteStats, setSiteStats] = useState<{
    totalViews: number; totalPosts: number; totalLikes: number; siteVisits: number;
    hotPosts?: { id: string; title: string; slug: string; viewCount: number; category: { name: string } }[];
    recentComments?: { id: string; author: string; content: string; createdAt: string; post: { title: string; slug: string } }[];
  } | null>(null);
  const config = useSiteConfig();
  const fullText = useMemo(() => config.site_description || "探索技术的无限可能", [config.site_description]);
  const revealRef = useScrollReveal<HTMLDivElement>();

  // Typing effect
  useEffect(() => {
    let i = 0;
    setTypedText("");
    const timer = setInterval(() => {
      if (i <= fullText.length) {
        setTypedText(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 150);
    return () => clearInterval(timer);
  }, [fullText]);

  // Fetch all data in parallel
  useEffect(() => {
    Promise.all([
      fetch("/api/posts?limit=7").then((r) => r.json()).catch(() => ({ posts: [] })),
      fetch("/api/categories").then((r) => r.json()).catch(() => []),
      fetch("/api/visitor-info").then((r) => r.json()).catch(() => null),
      fetch("/api/site-stats").then((r) => r.json()).catch(() => null),
    ]).then(([postsData, catsData, visitorData, statsData]) => {
      setPosts(postsData.posts || []);
      setCategories(Array.isArray(catsData) ? catsData : []);
      if (visitorData?.ip) setVisitorInfo(visitorData);
      if (statsData) setSiteStats({
        totalViews: statsData.totalViews || 0,
        totalPosts: statsData.totalPosts || 0,
        totalLikes: statsData.totalLikes || 0,
        siteVisits: statsData.siteVisits || 0,
      });
      setLoading(false);
    });
  }, []);

  const handleSubscribe = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribeMsg("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: subscribeEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubscribeMsg(data.message);
        setSubscribeEmail("");
      } else {
        setSubscribeMsg(data.error || "订阅失败");
      }
    } catch {
      setSubscribeMsg("网络错误，请重试");
    }
  }, [subscribeEmail]);

  const featuredPost = posts[0];
  const restPosts = posts.slice(1);

  return (
    <div ref={revealRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* ===== Hero Carousel ===== */}
      <section className="py-8">
        <HeroCarousel />
      </section>

      {/* ===== Typing Hero + Visitor Welcome ===== */}
      <section className="py-10 text-center scroll-reveal">
        <h2 className="text-4xl md:text-5xl font-bold mb-4" suppressHydrationWarning>
          <span className="gradient-text">{typedText}</span>
          <span className="animate-pulse text-accent">|</span>
        </h2>
        <p className="text-muted text-lg max-w-2xl mx-auto mb-6" suppressHydrationWarning>
          {config.site_subtitle || ""}
        </p>

        {visitorInfo && (
          <div className="inline-flex items-center gap-2.5 glass rounded-full px-5 py-2.5 text-sm animate-fade-in">
            <MapPin className="w-4 h-4 text-accent-light" />
            <span className="text-muted">
              欢迎来自
              <span className="text-foreground font-medium mx-1">
                {[visitorInfo.city, visitorInfo.region, visitorInfo.country].filter(Boolean).join(", ") || "远方"}
              </span>
              的访客
            </span>
            <span className="text-primary-light font-mono text-xs">{visitorInfo.ip}</span>
          </div>
        )}
      </section>

      {/* ===== Site Stats (animated numbers) ===== */}
      {siteStats && (
        <section className="py-6 scroll-reveal">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: FileText, label: "文章", value: siteStats.totalPosts, color: "text-primary-light" },
              { icon: Eye, label: "浏览", value: siteStats.totalViews, color: "text-accent-light" },
              { icon: Heart, label: "获赞", value: siteStats.totalLikes, color: "text-pink-400" },
              { icon: Users, label: "访问", value: siteStats.siteVisits, color: "text-emerald-400" },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-2xl p-5 text-center card-glow">
                <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                <AnimatedNumber target={stat.value} />
                <div className="text-xs text-muted mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== Gradient divider ===== */}
      <div className="section-divider my-4" />

      {/* ===== Category Cards ===== */}
      {categories.length > 0 && (
        <section className="py-10 scroll-reveal">
          <SectionHeading title="技术分类" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 stagger-children">
            {categories.map((cat) => {
              const IconComp = getCategoryIcon(cat);
              const color = getCategoryColor(cat);
              return (
                <Link
                  key={cat.slug}
                  href={`/categories/${cat.slug}`}
                  className="glass rounded-2xl p-5 text-center card-hover card-glow group cursor-pointer"
                >
                  <div
                    className={`w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}
                    style={{ boxShadow: "0 0 0 transparent" }}
                  >
                    <IconComp className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-foreground block">
                    {cat.name}
                  </span>
                  <span className="text-xs text-muted mt-1.5 block">{cat._count.posts} 篇文章</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ===== Featured + Latest Posts ===== */}
      <section className="py-10 scroll-reveal">
        <SectionHeading title="最新文章" action={{ label: "查看全部", href: "/blog" }} />

        {loading ? (
          <PostGridSkeleton count={6} />
        ) : posts.length > 0 ? (
          <div className="space-y-6">
            {/* Featured post — large card */}
            {featuredPost && (
              <Link href={`/blog/${featuredPost.slug}`} className="block group cursor-pointer scroll-reveal">
                <article className="glass rounded-2xl overflow-hidden card-hover card-glow">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="relative h-64 md:h-80 overflow-hidden">
                      {featuredPost.coverImage ? (
                        <img
                          src={featuredPost.coverImage}
                          alt={featuredPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 group-hover:scale-105 transition-transform duration-700" />
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary/90 text-white rounded-lg backdrop-blur-sm">
                          <Sparkles className="w-3 h-3" />
                          推荐
                        </span>
                      </div>
                    </div>
                    <div className="p-6 md:p-8 flex flex-col justify-center">
                      <span className="text-xs font-medium text-primary-light mb-3">{featuredPost.category.name}</span>
                      <h3 className="text-2xl md:text-3xl font-bold text-foreground group-hover:text-primary-light transition-colors mb-3 line-clamp-2">
                        {featuredPost.title}
                      </h3>
                      <p className="text-muted leading-relaxed mb-5 line-clamp-3">
                        {featuredPost.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted">
                        <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{featuredPost.viewCount}</span>
                        <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" />{featuredPost._count?.likes || 0}</span>
                        <span className="ml-auto text-xs">{new Date(featuredPost.publishedAt).toLocaleDateString("zh-CN")}</span>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            )}

            {/* Rest of posts — grid */}
            {restPosts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restPosts.map((post, i) => (
                  <div key={post.id} className={`scroll-reveal scroll-reveal-delay-${Math.min(i + 1, 3)}`}>
                    <PostCard post={post} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 text-muted glass rounded-2xl">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted/40" />
            <p className="text-lg">暂无文章</p>
            <p className="text-sm mt-1">快去后台发布第一篇文章吧</p>
          </div>
        )}
      </section>

      {/* ===== Hot Posts Ranking ===== */}
      {siteStats?.hotPosts && siteStats.hotPosts.length > 0 && (
        <section className="py-10 scroll-reveal">
          <SectionHeading title="热门文章" action={{ label: "查看全部", href: "/blog" }} />
          <div className="glass rounded-2xl p-6">
            {siteStats.hotPosts.map((hp, i) => (
              <Link
                key={hp.id}
                href={`/blog/${hp.slug}`}
                className={`flex items-center gap-4 py-3 group cursor-pointer ${i < siteStats.hotPosts!.length - 1 ? "border-b border-border/20" : ""}`}
              >
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  i === 0 ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white" :
                  i === 1 ? "bg-gradient-to-br from-slate-400 to-slate-500 text-white" :
                  i === 2 ? "bg-gradient-to-br from-amber-700 to-amber-800 text-white" :
                  "bg-surface text-muted"
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground group-hover:text-primary-light transition-colors line-clamp-1">
                    {hp.title}
                  </h4>
                  <span className="text-xs text-muted">{hp.category.name}</span>
                </div>
                <span className="text-xs text-muted flex items-center gap-1 shrink-0">
                  <Eye className="w-3 h-3" />{hp.viewCount.toLocaleString()}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== Recent Comments ===== */}
      {siteStats?.recentComments && siteStats.recentComments.length > 0 && (
        <section className="py-10 scroll-reveal">
          <SectionHeading title="最新评论" />
          <div className="glass rounded-2xl p-6 space-y-4">
            {siteStats.recentComments.map((c) => (
              <Link key={c.id} href={`/blog/${c.post.slug}`} className="flex gap-3 group cursor-pointer">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {c.author[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-muted mb-1">
                    <span className="font-medium text-foreground">{c.author}</span>
                    <span>评论了</span>
                    <span className="text-primary-light group-hover:underline truncate">{c.post.title}</span>
                  </div>
                  <p className="text-sm text-muted line-clamp-1">{c.content}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="section-divider my-4" />

      {/* ===== Author Intro ===== */}
      <section className="py-12 scroll-reveal">
        <div className="glass rounded-2xl card-glow p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
          <div className="relative shrink-0">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl font-bold text-white animate-pulse-glow" suppressHydrationWarning>
              {config.author_avatar || "Dev"}
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-4 border-surface flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-3" suppressHydrationWarning>
              {config.author_name || "关于我"}
            </h3>
            <p className="text-muted leading-relaxed mb-5" suppressHydrationWarning>
              {config.author_bio || ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {(config.author_skills || "").split(",").filter(Boolean).map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary-light border border-primary/20 rounded-full hover:bg-primary/20 transition-colors"
                >
                  {skill.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Subscribe CTA ===== */}
      <section className="py-10 mb-8 scroll-reveal">
        <div className="relative glass rounded-2xl card-glow p-8 md:p-12 text-center overflow-hidden">
          {/* Background decorative gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

          <div className="relative">
            <Sparkles className="w-8 h-8 mx-auto mb-4 text-primary-light" />
            <h3 className="text-2xl md:text-3xl font-bold gradient-text mb-3">
              订阅更新
            </h3>
            <p className="text-muted mb-8 max-w-md mx-auto">
              输入邮箱，第一时间获取最新文章推送
            </p>
            <form onSubmit={handleSubscribe} className="max-w-lg mx-auto flex flex-col sm:flex-row gap-3">
              <label htmlFor="subscribe-email" className="sr-only">邮箱地址</label>
              <input
                id="subscribe-email"
                type="email"
                placeholder="your@email.com"
                value={subscribeEmail}
                onChange={(e) => setSubscribeEmail(e.target.value)}
                required
                aria-describedby={subscribeMsg ? "subscribe-msg" : undefined}
                className="flex-1 px-5 py-3.5 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              />
              <button
                type="submit"
                className="px-8 py-3.5 bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/25 text-white rounded-xl font-medium transition-all cursor-pointer hover:-translate-y-0.5"
              >
                订阅
              </button>
            </form>
            {subscribeMsg && (
              <p id="subscribe-msg" role="status" aria-live="polite" className="text-sm mt-4 text-primary-light animate-fade-in">
                {subscribeMsg}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
