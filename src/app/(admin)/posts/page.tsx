"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Eye, Loader2, ChevronLeft, ChevronRight, Search, CheckSquare, Square, Download } from "lucide-react";

interface Post {
  id: string;
  title: string;
  slug: string;
  status: string;
  viewCount: number;
  category: { name: string; slug: string };
  _count: { likes: number; comments: number };
  createdAt: string;
  publishedAt: string | null;
}

const STATUS_FILTERS = [
  { key: "", label: "全部" },
  { key: "PUBLISHED", label: "已发布" },
  { key: "DRAFT", label: "草稿" },
  { key: "ARCHIVED", label: "已归档" },
] as const;

export default function PostsManagePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);

  const fetchPosts = (p?: number, status?: string) => {
    setLoading(true);
    const currentPage = p ?? page;
    const currentStatus = status ?? statusFilter;
    const params = new URLSearchParams({ page: String(currentPage), limit: "15" });
    if (currentStatus) params.set("status", currentStatus);

    fetch(`/api/admin/posts?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setPosts(data.posts || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotal(data.pagination?.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosts();
  }, [page, statusFilter]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`确定要删除文章「${title}」吗？此操作不可撤销。`)) return;
    try {
      const res = await fetch(`/api/admin/posts?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchPosts();
      else alert("删除失败，请重试");
    } catch { alert("网络错误，请重试"); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPosts.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredPosts.map((p) => p.id)));
  };

  const handleBatchAction = async (action: "PUBLISHED" | "DRAFT" | "ARCHIVED" | "DELETE") => {
    if (selectedIds.size === 0) return;
    const label = action === "DELETE" ? "删除" : action === "PUBLISHED" ? "发布" : action === "DRAFT" ? "转为草稿" : "归档";
    if (!confirm(`确定要${label} ${selectedIds.size} 篇文章吗？`)) return;
    setBatchLoading(true);
    for (const id of selectedIds) {
      if (action === "DELETE") {
        await fetch(`/api/admin/posts?id=${id}`, { method: "DELETE" });
      } else {
        await fetch("/api/admin/posts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: action }),
        });
      }
    }
    setSelectedIds(new Set());
    setBatchLoading(false);
    fetchPosts();
  };

  const filteredPosts = searchQuery
    ? posts.filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : posts;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">文章管理</h1>
          <p className="text-sm text-muted mt-1">共 {total} 篇文章</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const csvRows = ["标题,分类,状态,浏览量,创建时间,链接"];
              posts.forEach((p) => {
                csvRows.push(`"${p.title}","${p.category.name}","${p.status}",${p.viewCount},"${new Date(p.createdAt).toLocaleDateString("zh-CN")}","/blog/${p.slug}"`);
              });
              const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `posts-export-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-surface border border-border hover:bg-white/5 text-foreground rounded-lg text-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" /> 导出
          </button>
          <Link
            href="/posts/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg text-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> 新建文章
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => { setStatusFilter(f.key); setPage(1); }}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all cursor-pointer ${
                statusFilter === f.key
                  ? "bg-primary text-white"
                  : "bg-surface text-muted hover:text-foreground border border-border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="搜索标题..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary w-full sm:w-56"
          />
        </div>
      </div>

      {/* Batch actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 glass rounded-lg animate-fade-in">
          <span className="text-sm text-foreground">已选 {selectedIds.size} 篇</span>
          <button onClick={() => handleBatchAction("PUBLISHED")} disabled={batchLoading} className="px-3 py-1 text-xs bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg cursor-pointer disabled:opacity-50">批量发布</button>
          <button onClick={() => handleBatchAction("DRAFT")} disabled={batchLoading} className="px-3 py-1 text-xs bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 rounded-lg cursor-pointer disabled:opacity-50">转为草稿</button>
          <button onClick={() => handleBatchAction("ARCHIVED")} disabled={batchLoading} className="px-3 py-1 text-xs bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 rounded-lg cursor-pointer disabled:opacity-50">批量归档</button>
          <button onClick={() => handleBatchAction("DELETE")} disabled={batchLoading} className="px-3 py-1 text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg cursor-pointer disabled:opacity-50">批量删除</button>
          {batchLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <p className="text-muted mb-4">{searchQuery ? "未找到匹配文章" : "暂无文章"}</p>
          {!searchQuery && (
            <Link href="/posts/new" className="text-primary-light hover:text-primary cursor-pointer">
              创建第一篇文章
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted border-b border-border bg-surface/50">
                    <th className="w-10 px-3 py-3">
                      <button onClick={toggleSelectAll} className="text-muted hover:text-foreground cursor-pointer">
                        {selectedIds.size === filteredPosts.length && filteredPosts.length > 0 ? <CheckSquare className="w-4 h-4 text-primary-light" /> : <Square className="w-4 h-4" />}
                      </button>
                    </th>
                    <th className="px-4 sm:px-6 py-3 font-medium">标题</th>
                    <th className="px-4 sm:px-6 py-3 font-medium hidden sm:table-cell">分类</th>
                    <th className="px-4 sm:px-6 py-3 font-medium">状态</th>
                    <th className="px-4 sm:px-6 py-3 font-medium hidden md:table-cell">浏览</th>
                    <th className="px-4 sm:px-6 py-3 font-medium hidden lg:table-cell">创建时间</th>
                    <th className="px-4 sm:px-6 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map((post) => (
                    <tr key={post.id} className={`border-b border-border/50 last:border-0 hover:bg-white/[0.02] ${selectedIds.has(post.id) ? "bg-primary/5" : ""}`}>
                      <td className="w-10 px-3 py-4">
                        <button onClick={() => toggleSelect(post.id)} className="text-muted hover:text-foreground cursor-pointer">
                          {selectedIds.has(post.id) ? <CheckSquare className="w-4 h-4 text-primary-light" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-foreground font-medium max-w-xs truncate">
                        {post.title}
                      </td>
                      <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                        <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary-light rounded-full">
                          {post.category.name}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          post.status === "PUBLISHED"
                            ? "bg-green-500/10 text-green-400"
                            : post.status === "ARCHIVED"
                              ? "bg-gray-500/10 text-gray-400"
                              : "bg-yellow-500/10 text-yellow-400"
                        }`}>
                          {post.status === "PUBLISHED" ? "已发布" : post.status === "ARCHIVED" ? "已归档" : "草稿"}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-muted hidden md:table-cell">{post.viewCount}</td>
                      <td className="px-4 sm:px-6 py-4 text-muted hidden lg:table-cell">
                        {new Date(post.createdAt).toLocaleDateString("zh-CN")}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/blog/${post.slug}`} target="_blank" className="p-1.5 text-muted hover:text-foreground hover:bg-white/5 rounded-lg cursor-pointer" title="预览">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link href={`/posts/${post.id}/edit`} className="p-1.5 text-muted hover:text-primary-light hover:bg-primary/10 rounded-lg cursor-pointer" title="编辑">
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button onClick={() => handleDelete(post.id, post.title)} className="p-1.5 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer" title="删除">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 text-muted hover:text-foreground disabled:opacity-30 cursor-pointer rounded-lg hover:bg-white/5"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-muted px-3">
                第 {page} / {totalPages} 页
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 text-muted hover:text-foreground disabled:opacity-30 cursor-pointer rounded-lg hover:bg-white/5"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
