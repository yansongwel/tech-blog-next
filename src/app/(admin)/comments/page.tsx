"use client";

import { useEffect, useState } from "react";
import { Check, Trash2, Loader2, MessageSquare, Reply, Send, X } from "lucide-react";
import Link from "next/link";

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

  const fetchComments = (f?: string) => {
    setLoading(true);
    const currentFilter = f ?? filter;
    const params = new URLSearchParams();
    if (currentFilter === "pending") params.set("approved", "false");
    if (currentFilter === "approved") params.set("approved", "true");

    fetch(`/api/admin/comments?${params}`)
      .then((res) => res.json())
      .then((data) => setComments(data.comments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchComments();
  }, [filter]);

  const handleApprove = async (id: string) => {
    await fetch("/api/admin/comments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, approved: true }),
    });
    fetchComments();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除该评论？")) return;
    await fetch(`/api/admin/comments?id=${id}`, { method: "DELETE" });
    fetchComments();
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
        setReplyText("");
        setReplyingTo(null);
        fetchComments();
      }
    } catch { alert("回复失败"); }
    setReplying(false);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">评论管理</h1>
          <p className="text-sm text-muted mt-1">审核、回复和管理用户评论</p>
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : comments.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <MessageSquare className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-muted">暂无评论</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="glass rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
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
    </div>
  );
}
