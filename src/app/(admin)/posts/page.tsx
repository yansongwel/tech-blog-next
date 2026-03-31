"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Eye, Loader2, ChevronLeft, ChevronRight, Search, CheckSquare, Square, Download, FileText } from "lucide-react";
import { useToast } from "@/components/admin/Toast";
import ConfirmModal from "@/components/admin/ConfirmModal";

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
  const [exporting, setExporting] = useState(false);
  const [pageSize, setPageSize] = useState(15);
  const [sortBy, setSortBy] = useState<"createdAt" | "viewCount" | "title">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const toast = useToast();
  const [confirmModal, setConfirmModal] = useState<{open: boolean, title: string, message: string, onConfirm: () => void}>({open: false, title: "", message: "", onConfirm: () => {}});

  const exportPostAsMarkdown = async (postId: string, postTitle: string) => {
    try {
      const res = await fetch(`/api/admin/posts/${postId}`);
      if (!res.ok) return;
      const post = await res.json();
      const TurndownService = (await import("turndown")).default;
      const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
      const markdown = `# ${post.title}\n\n` + td.turndown(post.content || "");
      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${postTitle.replace(/[/\\?%*:|"<>]/g, "-")}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("导出失败，请重试");
    }
  };

  const exportAllAsMarkdown = async () => {
    setExporting(true);
    try {
      // Fetch all posts (no pagination limit)
      const res = await fetch("/api/admin/posts?limit=100");
      const data = await res.json();
      const allPosts = data.posts || [];
      const TurndownService = (await import("turndown")).default;
      const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });

      for (const p of allPosts) {
        const detailRes = await fetch(`/api/admin/posts/${p.id}`);
        if (!detailRes.ok) continue;
        const detail = await detailRes.json();
        const markdown = `# ${detail.title}\n\n` + td.turndown(detail.content || "");
        const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${p.title.replace(/[/\\?%*:|"<>]/g, "-")}.md`;
        a.click();
        URL.revokeObjectURL(url);
        // Small delay to avoid browser blocking multiple downloads
        await new Promise((r) => setTimeout(r, 300));
      }
    } catch {
      toast.error("批量导出失败");
    }
    setExporting(false);
  };

  const fetchPosts = useCallback((p?: number, status?: string, search?: string) => {
    setLoading(true);
    const currentPage = p ?? page;
    const currentStatus = status ?? statusFilter;
    const currentSearch = search ?? searchQuery;
    const params = new URLSearchParams({ page: String(currentPage), limit: String(pageSize) });
    if (currentStatus) params.set("status", currentStatus);
    if (currentSearch) params.set("search", currentSearch);

    fetch(`/api/admin/posts?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setPosts(data.posts || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotal(data.pagination?.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, statusFilter, searchQuery, pageSize]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Debounced server-side search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchPosts(1, undefined, searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchPosts]);

  const handleDelete = (id: string, title: string) => {
    setConfirmModal({
      open: true,
      title: "删除文章",
      message: `确定要删除文章「${title}」吗？此操作不可撤销。`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/posts?id=${id}`, { method: "DELETE" });
          if (res.ok) {
            toast.success("文章已删除");
            fetchPosts();
          } else {
            toast.error("删除失败，请重试");
          }
        } catch {
          toast.error("网络错误，请重试");
        }
      },
    });
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

  const handleBatchAction = (action: "PUBLISHED" | "DRAFT" | "ARCHIVED" | "DELETE") => {
    if (selectedIds.size === 0) return;
    const label = action === "DELETE" ? "删除" : action === "PUBLISHED" ? "发布" : action === "DRAFT" ? "转为草稿" : "归档";
    setConfirmModal({
      open: true,
      title: `批量${label}`,
      message: `确定要${label} ${selectedIds.size} 篇文章吗？`,
      onConfirm: async () => {
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
        toast.success(`已${label} ${selectedIds.size} 篇文章`);
        setSelectedIds(new Set());
        setBatchLoading(false);
        fetchPosts();
      },
    });
  };

  // Client-side sorting on already-fetched posts
  const filteredPosts = [...posts].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortBy === "title") return dir * a.title.localeCompare(b.title);
    if (sortBy === "viewCount") return dir * (a.viewCount - b.viewCount);
    return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  });

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("desc"); }
  };

  const sortIcon = (col: typeof sortBy) =>
    sortBy === col ? (sortDir === "asc" ? " ↑" : " ↓") : "";

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
            <Download className="w-4 h-4" /> 导出 CSV
          </button>
          <button
            onClick={exportAllAsMarkdown}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 bg-surface border border-border hover:bg-white/5 text-foreground rounded-lg text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} 导出 Markdown
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
        <div className="glass rounded-xl overflow-hidden animate-pulse">
          <div className="border-b border-border bg-surface/50 px-4 py-3 flex gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-3 bg-surface rounded w-16" />)}
          </div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-border/30">
              <div className="w-4 h-4 bg-surface rounded" />
              <div className="h-4 bg-surface rounded flex-1" />
              <div className="h-4 bg-surface rounded w-16" />
              <div className="h-5 bg-surface rounded-full w-14" />
              <div className="h-4 bg-surface rounded w-12" />
              <div className="h-4 bg-surface rounded w-20" />
            </div>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="glass rounded-xl p-16 text-center">
          <FileText className="w-16 h-16 text-muted/30 mx-auto mb-4" />
          <p className="text-lg text-foreground/70 mb-2">{searchQuery ? "未找到匹配文章" : "还没有文章"}</p>
          <p className="text-sm text-muted mb-6">{searchQuery ? "试试其他关键词" : "开始创作你的第一篇文章吧"}</p>
          {!searchQuery && (
            <Link href="/posts/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-light text-white rounded-lg font-medium transition-colors cursor-pointer">
              <Plus className="w-4 h-4" /> 新建文章
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
                    <th className="px-4 sm:px-6 py-3 font-medium cursor-pointer hover:text-foreground select-none" onClick={() => handleSort("title")}>标题{sortIcon("title")}</th>
                    <th className="px-4 sm:px-6 py-3 font-medium hidden sm:table-cell">分类</th>
                    <th className="px-4 sm:px-6 py-3 font-medium">状态</th>
                    <th className="px-4 sm:px-6 py-3 font-medium hidden md:table-cell cursor-pointer hover:text-foreground select-none" onClick={() => handleSort("viewCount")}>浏览{sortIcon("viewCount")}</th>
                    <th className="px-4 sm:px-6 py-3 font-medium hidden lg:table-cell cursor-pointer hover:text-foreground select-none" onClick={() => handleSort("createdAt")}>创建时间{sortIcon("createdAt")}</th>
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
                          <button onClick={() => exportPostAsMarkdown(post.id, post.title)} className="p-1.5 text-muted hover:text-accent-light hover:bg-accent/10 rounded-lg cursor-pointer" title="导出 Markdown">
                            <FileText className="w-4 h-4" />
                          </button>
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
          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2 text-xs text-muted">
              <span>每页</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="bg-surface border border-border rounded px-1.5 py-1 text-foreground cursor-pointer focus:outline-none focus:border-primary"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>条 · 共 {total} 篇</span>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 text-muted hover:text-foreground disabled:opacity-30 cursor-pointer rounded-lg hover:bg-white/5"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-muted px-2">
                  {page} / {totalPages}
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
          </div>
        </>
      )}
      <ConfirmModal open={confirmModal.open} title={confirmModal.title} message={confirmModal.message} danger onConfirm={() => { confirmModal.onConfirm(); setConfirmModal(prev => ({...prev, open: false})); }} onCancel={() => setConfirmModal(prev => ({...prev, open: false}))} />
    </div>
  );
}
