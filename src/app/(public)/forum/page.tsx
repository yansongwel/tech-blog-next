"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Plus, Flame, Clock, HelpCircle } from "lucide-react";
import Link from "next/link";
import ThreadCard from "@/components/forum/ThreadCard";

interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  _count: { posts: number };
}

type SortType = "latest" | "hot" | "unanswered";

export default function ForumPage() {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [posts, setPosts] = useState<Record<string, unknown>[]>([]);
  const [sort, setSort] = useState<SortType>("latest");
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch("/api/forum/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/forum/posts?sort=${sort}&limit=30`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setPosts(data.posts || []);
          setTotal(data.total || 0);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [sort]);

  const sortOptions: { key: SortType; label: string; icon: React.ReactNode }[] = [
    { key: "latest", label: "最新", icon: <Clock className="w-3.5 h-3.5" /> },
    { key: "hot", label: "热门", icon: <Flame className="w-3.5 h-3.5" /> },
    { key: "unanswered", label: "未回复", icon: <HelpCircle className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-primary" />
            技术论坛
          </h1>
          <p className="text-muted mt-1">探讨技术问题，分享经验心得</p>
        </div>
        <Link
          href="/forum/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-light text-white rounded-lg font-medium transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          发帖
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main content */}
        <div className="lg:col-span-3">
          {/* Sort tabs */}
          <div className="flex items-center gap-1 mb-4 p-1 glass rounded-lg w-fit">
            {sortOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSort(opt.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors cursor-pointer ${
                  sort === opt.key
                    ? "bg-primary/15 text-primary-light"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>

          {/* Post list */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="glass rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-surface rounded w-3/4 mb-2" />
                  <div className="h-3 bg-surface rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <MessageSquare className="w-12 h-12 text-muted mx-auto mb-3" />
              <p className="text-muted">暂无帖子，来发第一帖吧！</p>
            </div>
          ) : (
            <div className="space-y-2">
              {posts.map((post) => (
                <ThreadCard key={(post as { id: string }).id} post={post as ThreadCardProps["post"]} />
              ))}
            </div>
          )}

          {total > 30 && (
            <p className="text-center text-sm text-muted mt-4">
              共 {total} 帖 · 显示前 30 帖
            </p>
          )}
        </div>

        {/* Sidebar — categories */}
        <div className="space-y-4">
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-3">版块</h3>
            <div className="space-y-1.5">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/forum/${cat.slug}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: cat.color || undefined }}
                  >
                    {cat.icon ? `${cat.icon} ` : ""}
                    {cat.name}
                  </span>
                  <span className="text-xs text-muted">{cat._count.posts}</span>
                </Link>
              ))}
              {categories.length === 0 && (
                <p className="text-sm text-muted">暂无版块</p>
              )}
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-3">论坛统计</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">总帖数</span>
                <span className="text-foreground">{total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">版块数</span>
                <span className="text-foreground">{categories.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Type helper for ThreadCard
type ThreadCardProps = React.ComponentProps<typeof ThreadCard>;
