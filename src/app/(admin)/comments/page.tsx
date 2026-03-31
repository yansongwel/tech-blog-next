"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Trash2, Loader2, MessageSquare, Reply, Send, X, ChevronLeft, ChevronRight, Search, CheckSquare, Square } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/admin/Toast";
import ConfirmModal from "@/components/admin/ConfirmModal";

interface Comment {
  id: string;
  content: string;
  author: string;
  email: string;
  approved: boolean;
  createdAt: string;
  post: { id: string; title: string; slug: string };
}

export default function CommentsManagePage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toast = useToast();
  const [confirmModal, setConfirmModal] = useState<{open: boolean, title: string, message: string, onConfirm: () => void}>({open: false, title: "", message: "", onConfirm: () => {}});

  const fetchComments = useCallback((p?: number, f?: string, search?: string) => {
    setLoading(true);
    setError("");
    const currentFilter = f ?? filter;
    const currentPage = p ?? page;
    const currentSearch = search ?? searchQuery;
    const params = new URLSearchParams({ page: String(currentPage), limit: "20" });
    if (currentFilter === "pending") params.set("approved", "false");
    if (currentFilter === "approved") params.set("approved", "true");
    if (currentSearch) params.set("search", currentSearch);

    fetch(`/api/admin/comments?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("加载失败");
        return res.json();
      })
      .then((data) => {
        setComments(data.comments || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotal(data.pagination?.total || 0);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filter, page, searchQuery]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchComments(1);
    setPage(1);
  }, [filter, fetchComments]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Debounced server-side search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchComments(1, undefined, searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchComments]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBatchApprove = () => {
    if (selectedIds.size === 0) return;
    setConfirmModal({
      open: true,
      title: "批量审核",
      message: `确定审核通过 ${selectedIds.size} 条评论？`,
      onConfirm: async () => {
        for (const id of selectedIds) {
          await fetch("/api/admin/comments", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, approved: true }),
          });
        }
        toast.success(`已审核 ${selectedIds.size} 条评论`);
        setSelectedIds(new Set());
        fetchComments();
      },
    });
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    setConfirmModal({
      open: true,
      title: "批量删除",
      message: `确定删除 ${selectedIds.size} 条评论？此操作不可撤销。`,
      onConfirm: async () => {
        for (const id of selectedIds) {
          await fetch(`/api/admin/comments?id=${id}`, { method: "DELETE" });
        }
        toast.success(`已删除 ${selectedIds.size} 条评论`);
        setSelectedIds(new Set());
        fetchComments();
      },
    });
  };

  const handleApprove = async (id: string) => {
    await fetch("/api/admin/comments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, approved: true }),
    });
    toast.success("已审核");
    fetchComments();
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      open: true,
      title: "删除评论",
      message: "确定删除该评论？",
      onConfirm: async () => {
        await fetch(`/api/admin/comments?id=${id}`, { method: "DELETE" });
        toast.success("评论已删除");
        fetchComments();
      },
    });
  };

  const handleReply = async (comment: Comment) => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyText,
          author: "博主",
          email: "admin@techblog.com",
          postId: comment.post.id,
          parentId: comment.id,
        }),
      });
      if (res.ok) {
        // Auto-approve admin reply
        const reply = await res.json();
        await fetch("/api/admin/comments", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: reply.id, approved: true }),
        });
        toast.success("回复成功");
        setReplyText("");
        setReplyingTo(null);
        fetchComments();
      }
    } catch { toast.error("回复失败"); }
    setReplying(false);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">评论管理</h1>
          <p className="text-sm text-muted mt-1">共 {total} 条评论</p>
        </div>
        <div className="flex gap-2">
          {(["all", "pending", "approved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all cursor-pointer ${
                filter === f
                  ? "bg-primary text-white"
                  : "bg-surface text-muted hover:text-foreground border border-border"
              }`}
            >
              {f === "all" ? "全部" : f === "pending" ? "待审核" : "已通过"}
            </button>
          ))}
        </div>
      </div>

      {/* Search + Batch Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="搜索评论内容、作者、邮箱..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
          />
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 animate-fade-in">
            <span className="text-sm text-foreground">已选 {selectedIds.size}</span>
            <button onClick={handleBatchApprove} className="px-3 py-1 text-xs bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg cursor-pointer">批量通过</button>
            <button onClick={handleBatchDelete} className="px-3 py-1 text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg cursor-pointer">批量删除</button>
            <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1 text-xs text-muted hover:text-foreground cursor-pointer">取消选择</button>
          </div>
        )}
      </div>

      {error ? (
        <div className="text-center py-20">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => fetchComments(page)} className="px-4 py-2 bg-primary text-white rounded-lg cursor-pointer hover:bg-primary-light transition-colors">重新加载</button>
        </div>
      ) : loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-surface rounded-full" />
                <div className="h-3 bg-surface rounded w-24" />
                <div className="h-3 bg-surface rounded w-16 ml-auto" />
              </div>
              <div className="h-3 bg-surface rounded w-full mb-2" />
              <div className="h-3 bg-surface rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="glass rounded-xl p-16 text-center">
          <MessageSquare className="w-16 h-16 text-muted/30 mx-auto mb-4" />
          <p className="text-lg text-foreground/70 mb-2">还没有评论</p>
          <p className="text-sm text-muted">读者们还没有留下评论，文章发布后他们就会来啦</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="glass rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <button onClick={() => toggleSelect(comment.id)} className="mt-1 shrink-0 cursor-pointer text-muted hover:text-foreground">
                  {selectedIds.has(comment.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {comment.author[0]}
                    </div>
                    <span className="text-sm font-medium text-foreground">{comment.author}</span>
                    <span className="text-xs text-muted">{comment.email}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      comment.approved
                        ? "bg-green-500/10 text-green-400"
                        : "bg-yellow-500/10 text-yellow-400"
                    }`}>
                      {comment.approved ? "已通过" : "待审核"}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 mb-2">{comment.content}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                    <span>{new Date(comment.createdAt).toLocaleString("zh-CN")}</span>
                    <span>文章：
                      <Link href={`/blog/${comment.post.slug}`} target="_blank" className="text-primary-light hover:underline cursor-pointer">
                        {comment.post.title}
                      </Link>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { setReplyingTo(replyingTo === comment.id ? null : comment.id); setReplyText(""); }}
                    className={`p-2 rounded-lg cursor-pointer transition-colors ${replyingTo === comment.id ? "text-primary-light bg-primary/10" : "text-muted hover:text-primary-light hover:bg-primary/10"}`}
                    title="回复"
                  >
                    <Reply className="w-4 h-4" />
                  </button>
                  {!comment.approved && (
                    <button
                      onClick={() => handleApprove(comment.id)}
                      className="p-2 text-muted hover:text-green-400 hover:bg-green-500/10 rounded-lg cursor-pointer"
                      title="审核通过"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="p-2 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Reply form */}
              {replyingTo === comment.id && (
                <div className="mt-3 pt-3 border-t border-border/50 animate-fade-in">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="输入回复内容..."
                      className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
                      onKeyDown={(e) => { if (e.key === "Enter" && replyText.trim()) handleReply(comment); }}
                      autoFocus
                    />
                    <button
                      onClick={() => handleReply(comment)}
                      disabled={replying || !replyText.trim()}
                      className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-light disabled:opacity-50 text-white rounded-lg text-sm cursor-pointer transition-colors"
                    >
                      {replying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      回复
                    </button>
                    <button
                      onClick={() => { setReplyingTo(null); setReplyText(""); }}
                      className="p-2 text-muted hover:text-foreground cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => { setPage((p) => Math.max(1, p - 1)); fetchComments(Math.max(1, page - 1)); }}
            disabled={page <= 1}
            className="p-2 text-muted hover:text-foreground disabled:opacity-30 cursor-pointer rounded-lg hover:bg-white/5"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted px-3">第 {page} / {totalPages} 页</span>
          <button
            onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); fetchComments(Math.min(totalPages, page + 1)); }}
            disabled={page >= totalPages}
            className="p-2 text-muted hover:text-foreground disabled:opacity-30 cursor-pointer rounded-lg hover:bg-white/5"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
      <ConfirmModal open={confirmModal.open} title={confirmModal.title} message={confirmModal.message} danger onConfirm={() => { confirmModal.onConfirm(); setConfirmModal(prev => ({...prev, open: false})); }} onCancel={() => setConfirmModal(prev => ({...prev, open: false}))} />
    </div>
  );
}
