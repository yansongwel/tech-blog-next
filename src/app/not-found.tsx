"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/blog?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        {/* Glitch 404 */}
        <h1 className="text-[8rem] md:text-[12rem] font-bold leading-none gradient-text select-none">
          404
        </h1>
        <div className="relative -mt-6 mb-8">
          <p className="text-xl md:text-2xl font-mono text-muted">
            PAGE_NOT_FOUND
          </p>
          <div className="w-24 h-0.5 mx-auto mt-4 bg-gradient-to-r from-primary to-accent" />
        </div>
        <p className="text-muted mb-6 max-w-md mx-auto">
          你访问的页面不存在或已被移除。试试搜索你想找的内容：
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} className="max-w-sm mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="搜索文章..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </form>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="px-6 py-3 bg-primary hover:bg-primary-light text-white rounded-xl font-medium transition-colors cursor-pointer"
          >
            返回首页
          </Link>
          <Link
            href="/blog"
            className="px-6 py-3 bg-surface border border-border hover:bg-white/5 text-foreground rounded-xl font-medium transition-colors cursor-pointer"
          >
            浏览文章
          </Link>
        </div>
      </div>
    </div>
  );
}
