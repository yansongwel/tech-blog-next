"use client";

import { useState, useEffect, useCallback } from "react";
import PostCard from "@/components/blog/PostCard";
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

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

interface Pagination {
  page: number;
  pages: number;
  total: number;
}

export default function CategoryPosts({ slug }: { slug: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState(slug);

  // Fetch category name from API
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        for (const cat of data) {
          if (cat.slug === slug) { setCategoryName(cat.name); return; }
          if (cat.children) {
            for (const child of cat.children) {
              if (child.slug === slug) { setCategoryName(child.name); return; }
            }
          }
        }
      })
      .catch(() => {});
  }, [slug]);

  const fetchPosts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts?category=${slug}&page=${page}&limit=12`);
      const data = await res.json();
      setPosts(data.posts || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
      if (page > 1) window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  // Smart pagination: show 1 ... 4 5 6 ... 20
  const getPageNumbers = () => {
    const { page, pages } = pagination;
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    const result: (number | "...")[] = [1];
    if (page > 3) result.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) {
      result.push(i);
    }
    if (page < pages - 2) result.push("...");
    if (pages > 1) result.push(pages);
    return result;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-muted hover:text-foreground mb-6 text-sm cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> 返回文章列表
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">{categoryName}</h1>
        <p className="text-muted">共 {pagination.total} 篇文章</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : posts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => fetchPosts(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2.5 rounded-lg text-muted hover:text-foreground hover:bg-white/5 disabled:opacity-30 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {getPageNumbers().map((p, i) =>
                p === "..." ? (
                  <span key={`e${i}`} className="px-1 text-muted">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => fetchPosts(p as number)}
                    className={`w-10 h-10 rounded-lg text-sm transition-colors cursor-pointer ${
                      p === pagination.page
                        ? "bg-primary text-white"
                        : "bg-surface text-muted hover:text-foreground border border-border"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => fetchPosts(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="p-2.5 rounded-lg text-muted hover:text-foreground hover:bg-white/5 disabled:opacity-30 cursor-pointer transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted ml-2">共 {pagination.total} 篇</span>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-muted">
          <p className="text-lg">该分类下暂无文章</p>
          <Link href="/blog" className="text-sm text-primary-light hover:text-primary mt-2 inline-block cursor-pointer">
            浏览所有文章
          </Link>
        </div>
      )}
    </div>
  );
}
