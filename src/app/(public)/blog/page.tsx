"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PostCard from "@/components/blog/PostCard";
import { PostGridSkeleton } from "@/components/blog/Skeleton";
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const allCategories = [
  "全部", "DBA", "SRE", "AI", "大数据", "Python", "Golang", "前端",
];

const categorySlugMap: Record<string, string> = {
  "DBA": "dba",
  "SRE": "sre",
  "AI": "ai",
  "大数据": "bigdata",
  "Python": "python",
  "Golang": "golang",
  "前端": "frontend",
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
  const [activeCategory, setActiveCategory] = useState("全部");
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [searchInput, setSearchInput] = useState(urlSearch);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "12" });
    if (activeCategory !== "全部") {
      params.set("category", categorySlugMap[activeCategory] || activeCategory.toLowerCase());
    }
    if (searchQuery) {
      params.set("search", searchQuery);
    }

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
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
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
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
          />
        </form>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all cursor-pointer ${
                activeCategory === cat
                  ? "bg-primary text-white"
                  : "bg-surface text-muted hover:text-foreground border border-border"
              }`}
            >
              {cat}
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
              <PostCard key={post.id} post={post} />
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
        <div className="text-center py-20 text-muted">
          <p className="text-lg">暂无相关文章</p>
        </div>
      )}
    </div>
  );
}
