"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PostCard from "@/components/blog/PostCard";
import { PostGridSkeleton } from "@/components/blog/Skeleton";
import { Search, Loader2, ChevronLeft, ChevronRight, X } from "lucide-react";

interface Category {
  name: string;
  slug: string;
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

interface Pagination {
  page: number;
  pages: number;
  total: number;
}

export default function BlogListPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <BlogListContent />
    </Suspense>
  );
}

function BlogListContent() {
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") || "";
  const [activeSlug, setActiveSlug] = useState("");
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [searchInput, setSearchInput] = useState(urlSearch);
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCategories(data); })
      .catch(() => {});
  }, []);

  const fetchPosts = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "12" });
    if (activeSlug) params.set("category", activeSlug);
    if (searchQuery) params.set("search", searchQuery);
    if (sortBy !== "latest") params.set("sort", sortBy);

    try {
      const res = await fetch(`/api/posts?${params}`);
      const data = await res.json();
      setPosts(data.posts || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
      if (page > 1) window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [activeSlug, searchQuery, sortBy]);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">所有文章</h1>
        <p className="text-muted">探索技术世界的每一个角落</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="搜索文章..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
          />
          {searchInput && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-muted hover:text-foreground cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Category tabs - dynamic from API */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSlug("")}
            className={`px-3 py-1.5 text-sm rounded-lg transition-all cursor-pointer ${
              !activeSlug
                ? "bg-primary text-white"
                : "bg-surface text-muted hover:text-foreground border border-border"
            }`}
          >
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setActiveSlug(cat.slug)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all cursor-pointer ${
                activeSlug === cat.slug
                  ? "bg-primary text-white"
                  : "bg-surface text-muted hover:text-foreground border border-border"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sort + result count */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-muted">
          {searchQuery ? (
            <span>找到 <span className="text-foreground font-medium">{pagination.total}</span> 篇关于「<span className="text-primary-light">{searchQuery}</span>」的文章</span>
          ) : (
            <span>共 <span className="text-foreground font-medium">{pagination.total}</span> 篇文章</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs">
          {(["latest", "popular"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                sortBy === s ? "bg-primary/10 text-primary-light" : "text-muted hover:text-foreground hover:bg-surface"
              }`}
            >
              {s === "latest" ? "最新" : "最热"}
            </button>
          ))}
        </div>
      </div>

      {/* Post grid */}
      {loading ? (
        <PostGridSkeleton count={12} />
      ) : posts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} searchQuery={searchQuery || undefined} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => fetchPosts(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2.5 rounded-lg text-muted hover:text-foreground hover:bg-white/5 disabled:opacity-30 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === pagination.pages || Math.abs(p - pagination.page) <= 2)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-muted">...</span>}
                    <button
                      onClick={() => fetchPosts(p)}
                      className={`w-10 h-10 rounded-lg text-sm transition-colors cursor-pointer ${
                        p === pagination.page
                          ? "bg-primary text-white"
                          : "bg-surface text-muted hover:text-foreground border border-border"
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
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
        <div className="text-center py-20 glass rounded-2xl">
          <Search className="w-12 h-12 mx-auto mb-4 text-muted/40" />
          <p className="text-lg text-muted">
            {searchQuery ? `未找到关于「${searchQuery}」的文章` : "暂无相关文章"}
          </p>
          {searchQuery && (
            <button onClick={clearSearch} className="mt-4 px-4 py-2 text-sm text-primary-light hover:text-primary cursor-pointer">
              清除搜索条件
            </button>
          )}
        </div>
      )}
    </div>
  );
}
