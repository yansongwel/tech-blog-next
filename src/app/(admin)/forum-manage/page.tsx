"use client";

import { useState, useEffect } from "react";
import {
  Search,
  MessageSquare,
  Pin,
  Star,
  Lock,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

interface ForumPostItem {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
  voteScore: number;
  replyCount: number;
  isPinned: boolean;
  isFeatured: boolean;
  isLocked: boolean;
  isSolved: boolean;
  createdAt: string;
  author: { id: string; username?: string | null; name?: string | null };
  category: { id: string; name: string };
  _count: { replies: number; votes: number };
}

export default function ForumManagePage() {
  const [posts, setPosts] = useState<ForumPostItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);

    fetch(`/api/admin/forum?${params}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!cancelled && data) {
          setPosts(data.posts);
          setTotal(data.total);
          setLoading(false);
        }
      })
      .catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [page, search]);

  const toggleFlag = async (id: string, flag: "isPinned" | "isFeatured" | "isLocked", current: boolean) => {
    const res = await fetch(`/api/admin/forum/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [flag]: !current }),
    });
    if (res.ok) {
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [flag]: !current } : p)),
      );
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`确定删除帖子「${title}」？此操作不可恢复。`)) return;
    const res = await fetch(`/api/admin/forum/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setTotal((t) => t - 1);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="w-6 h-6" /> 论坛管理
        </h1>
        <span className="text-sm text-muted">共 {total} 帖</span>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          placeholder="搜索帖子标题或作者..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full sm:w-80 pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
        />
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <th className="text-left px-4 py-3 text-foreground/70 font-medium">帖子</th>
                <th className="text-left px-4 py-3 text-foreground/70 font-medium hidden md:table-cell">版块</th>
                <th className="text-left px-4 py-3 text-foreground/70 font-medium hidden lg:table-cell">数据</th>
                <th className="text-left px-4 py-3 text-foreground/70 font-medium">状态</th>
                <th className="text-left px-4 py-3 text-foreground/70 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td colSpan={5} className="px-4 py-3">
                      <div className="h-4 bg-surface rounded animate-pulse w-3/4" />
                    </td>
                  </tr>
                ))
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">暂无帖子</td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <a
                        href={`/forum/post/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground font-medium hover:text-primary-light line-clamp-1 cursor-pointer"
                      >
                        {post.title}
                      </a>
                      <p className="text-xs text-muted mt-0.5">
                        {post.author.username || post.author.name || "匿名"} · {new Date(post.createdAt).toLocaleDateString("zh-CN")}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted text-xs">{post.category.name}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-3 text-xs text-muted">
                        <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {post.viewCount}</span>
                        <span>▲ {post.voteScore}</span>
                        <span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3" /> {post._count.replies}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {post.isPinned && <span className="text-xs px-1 py-0.5 rounded bg-yellow-500/10 text-yellow-400">置顶</span>}
                        {post.isFeatured && <span className="text-xs px-1 py-0.5 rounded bg-primary/10 text-primary-light">精华</span>}
                        {post.isLocked && <span className="text-xs px-1 py-0.5 rounded bg-red-500/10 text-red-400">锁定</span>}
                        {post.isSolved && <span className="text-xs px-1 py-0.5 rounded bg-green-500/10 text-green-400">已解决</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleFlag(post.id, "isPinned", post.isPinned)}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${post.isPinned ? "text-yellow-400 bg-yellow-500/10" : "text-muted hover:text-foreground hover:bg-white/5"}`}
                          title={post.isPinned ? "取消置顶" : "置顶"}
                        >
                          <Pin className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleFlag(post.id, "isFeatured", post.isFeatured)}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${post.isFeatured ? "text-primary-light bg-primary/10" : "text-muted hover:text-foreground hover:bg-white/5"}`}
                          title={post.isFeatured ? "取消精华" : "精华"}
                        >
                          <Star className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleFlag(post.id, "isLocked", post.isLocked)}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${post.isLocked ? "text-red-400 bg-red-500/10" : "text-muted hover:text-foreground hover:bg-white/5"}`}
                          title={post.isLocked ? "解锁" : "锁定"}
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          className="p-1.5 rounded text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted">第 {page}/{totalPages} 页</span>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded hover:bg-white/5 text-muted disabled:opacity-30 cursor-pointer">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1.5 rounded hover:bg-white/5 text-muted disabled:opacity-30 cursor-pointer">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
