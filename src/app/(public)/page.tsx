"use client";

import { useEffect, useState } from "react";
import HeroCarousel from "@/components/blog/HeroCarousel";
import PostCard from "@/components/blog/PostCard";
import {
  Database,
  Server,
  Brain,
  BarChart3,
  Code2,
  Globe,
  Terminal,
  ArrowRight,
  Loader2,
} from "lucide-react";

const techCategories = [
  { name: "DBA", slug: "dba", icon: Database, color: "from-orange-500 to-red-500" },
  { name: "SRE", slug: "sre", icon: Server, color: "from-indigo-500 to-purple-500" },
  { name: "AI", slug: "ai", icon: Brain, color: "from-cyan-500 to-blue-500" },
  { name: "大数据", slug: "bigdata", icon: BarChart3, color: "from-green-500 to-emerald-500" },
  { name: "Python", slug: "python", icon: Code2, color: "from-yellow-500 to-orange-500" },
  { name: "Golang", slug: "golang", icon: Terminal, color: "from-sky-400 to-blue-500" },
  { name: "前端", slug: "frontend", icon: Globe, color: "from-pink-500 to-rose-500" },
];

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

export default function HomePage() {
  const [typedText, setTypedText] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeMsg, setSubscribeMsg] = useState("");
  const fullText = "探索技术的无限可能";

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i <= fullText.length) {
        setTypedText(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 150);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("/api/posts?limit=6")
      .then((res) => res.json())
      .then((data) => setPosts(data.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
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
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="py-8">
        <HeroCarousel />
      </section>

      {/* Intro / Typing effect */}
      <section className="py-12 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="gradient-text">{typedText}</span>
          <span className="animate-pulse text-accent">|</span>
        </h2>
        <p className="text-muted text-lg max-w-2xl mx-auto">
          深耕 DBA、SRE、AI、大数据等领域，分享一线实战经验与技术思考
        </p>
      </section>

      {/* Category Cards */}
      <section className="py-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-foreground">技术分类</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          {techCategories.map((cat) => (
            <a
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              className="glass rounded-xl p-4 text-center card-hover group cursor-pointer"
            >
              <div
                className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
              >
                <cat.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-foreground">
                {cat.name}
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Latest Posts */}
      <section className="py-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-foreground">最新文章</h3>
          <a
            href="/blog"
            className="text-sm text-primary-light hover:text-primary flex items-center gap-1 cursor-pointer"
          >
            查看全部 <ArrowRight className="w-4 h-4" />
          </a>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted">
            <p className="text-lg">暂无文章</p>
            <p className="text-sm mt-1">快去后台发布第一篇文章吧</p>
          </div>
        )}
      </section>

      {/* Personal Intro */}
      <section className="py-12">
        <div className="glass rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl font-bold text-white shrink-0 animate-pulse-glow">
            Dev
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-3">
              关于我
            </h3>
            <p className="text-muted leading-relaxed mb-4">
              资深 SRE / DBA 工程师，热衷于云原生、数据库优化、AI 应用和大数据技术。
              多年一线运维和开发经验，曾参与多个大型分布式系统的架构设计与运维保障。
              这里记录我的技术沉淀和成长思考。
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "Kubernetes",
                "Docker",
                "MySQL",
                "PostgreSQL",
                "Python",
                "Go",
                "Prometheus",
                "Terraform",
                "LLM",
                "Flink",
              ].map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary-light border border-primary/20 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Subscribe CTA */}
      <section className="py-12 mb-8">
        <div className="glass rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold gradient-text mb-3">
            订阅更新
          </h3>
          <p className="text-muted mb-6">
            输入邮箱，第一时间获取最新文章推送
          </p>
          <form onSubmit={handleSubscribe} className="max-w-md mx-auto flex gap-2">
            <input
              type="email"
              placeholder="your@email.com"
              value={subscribeEmail}
              onChange={(e) => setSubscribeEmail(e.target.value)}
              required
              className="flex-1 px-4 py-3 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-primary hover:bg-primary-light text-white rounded-xl font-medium transition-colors cursor-pointer"
            >
              订阅
            </button>
          </form>
          {subscribeMsg && (
            <p className="text-sm mt-3 text-primary-light">{subscribeMsg}</p>
          )}
        </div>
      </section>
    </div>
  );
}
