"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import PostCard from "@/components/blog/PostCard";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const categoryNames: Record<string, string> = {
  dba: "DBA",
  sre: "SRE",
  ai: "AI",
  bigdata: "大数据",
  python: "Python",
  golang: "Golang",
  frontend: "前端",
};

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

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts?category=${slug}&page=${page}&limit=12`);
      const data = await res.json();
      setPosts(data.posts || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  const displayName = categoryNames[slug] || slug;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-muted hover:text-foreground mb-6 text-sm cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> 返回文章列表
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">{displayName}</h1>
        <p className="text-muted">
          共 {pagination.total} 篇文章
        </p>
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
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => fetchPosts(p)}
                  className={`w-10 h-10 rounded-lg text-sm transition-colors cursor-pointer ${
                    p === pagination.page
                      ? "bg-primary text-white"
                      : "bg-surface text-muted hover:text-foreground border border-border"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-muted">
          <p className="text-lg">该分类下暂无文章</p>
        </div>
      )}
    </div>
  );
}
