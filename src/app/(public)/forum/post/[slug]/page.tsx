"use client";

// Forum post detail page
// Note: All HTML content rendered via dangerouslySetInnerHTML is sanitized with DOMPurify.sanitize()

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquare,
  Eye,
  CheckCircle,
  Pin,
  Star,
  Send,
  Loader2,
} from "lucide-react";
import DOMPurify from "dompurify";
import VoteButton from "@/components/forum/VoteButton";

interface Author {
  id: string;
  username?: string | null;
  name?: string | null;
  avatar?: string | null;
  level?: number;
}

interface Reply {
  id: string;
  content: string;
  author: Author;
  voteScore: number;
  isAccepted: boolean;
  createdAt: string;
  _count: { replies: number; votes: number };
}

interface ForumPostDetail {
  id: string;
  title: string;
  slug: string;
  content: string;
  viewCount: number;
  voteScore: number;
  replyCount: number;
  isPinned: boolean;
  isFeatured: boolean;
  isSolved: boolean;
  isLocked: boolean;
  solvedReplyId?: string | null;
  createdAt: string;
  author: Author & { points?: number };
  category: { id: string; name: string; slug: string; color?: string | null };
  tags: { tag: { name: string; slug: string } }[];
  replies: Reply[];
  _count: { replies: number; votes: number };
}

export default function ForumPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<ForumPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/forum/posts/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setPost(null);
        else setPost(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !post) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/forum/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent, postId: post.id }),
      });

      if (res.status === 401) {
        window.location.href = "/auth/login";
        return;
      }

      if (res.ok) {
        setReplyContent("");
        const updated = await fetch(`/api/forum/posts/${slug}`).then((r) => r.json());
        setPost(updated);
      } else {
        const data = await res.json();
        setError(data.error || "回复失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-muted text-lg">帖子不存在或已被删除</p>
        <Link href="/forum" className="text-primary-light hover:underline mt-2 inline-block cursor-pointer">
          返回论坛
        </Link>
      </div>
    );
  }

  const authorName = post.author.username || post.author.name || "匿名";
  const timeAgo = getTimeAgo(post.createdAt);
  // Sanitize post content to prevent XSS
  const sanitizedContent = DOMPurify.sanitize(post.content);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/forum"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-4 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> 返回论坛
      </Link>

      {/* Post */}
      <div className="glass rounded-xl p-6">
        <div className="flex gap-4">
          <div className="hidden sm:block pt-1">
            <VoteButton score={post.voteScore} postId={post.id} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              {post.isPinned && (
                <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400">
                  <Pin className="w-3 h-3" /> 置顶
                </span>
              )}
              {post.isFeatured && (
                <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary-light">
                  <Star className="w-3 h-3" /> 精华
                </span>
              )}
              {post.isSolved && (
                <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">
                  <CheckCircle className="w-3 h-3" /> 已解决
                </span>
              )}
              <Link
                href={`/forum/${post.category.slug}`}
                className="text-xs px-1.5 py-0.5 rounded cursor-pointer"
                style={{
                  backgroundColor: post.category.color ? `${post.category.color}15` : "var(--surface)",
                  color: post.category.color || undefined,
                }}
              >
                {post.category.name}
              </Link>
            </div>

            <h1 className="text-2xl font-bold text-foreground mb-3">{post.title}</h1>

            <div className="flex items-center gap-3 mb-4 text-sm text-muted">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary-light">
                  {authorName[0]?.toUpperCase()}
                </div>
                <span className="text-foreground/80">{authorName}</span>
                {post.author.level && (
                  <span className="text-xs px-1 py-0.5 rounded bg-surface text-muted">
                    Lv.{post.author.level}
                  </span>
                )}
              </div>
              <span>{timeAgo}</span>
              <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {post.viewCount}</span>
              <span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3" /> {post.replyCount}</span>
            </div>

            {/* Content — sanitized with DOMPurify */}
            <div
              className="prose prose-invert max-w-none text-foreground/90
                [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-semibold
                [&_p]:leading-[1.8] [&_p]:mb-3
                [&_pre]:bg-surface [&_pre]:border [&_pre]:border-border [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto
                [&_code]:font-mono [&_code]:text-sm
                [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6
                [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:my-4 [&_blockquote]:text-foreground/80 [&_blockquote]:bg-primary/5 [&_blockquote]:rounded-r-xl
                [&_img]:rounded-xl [&_img]:max-w-full [&_img]:my-4
                [&_a]:text-primary-light [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />

            {post.tags.length > 0 && (
              <div className="flex gap-1.5 mt-4 flex-wrap">
                {post.tags.map(({ tag }) => (
                  <span key={tag.slug} className="text-xs px-2 py-1 rounded bg-surface text-muted border border-border">
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          {post.replies.length} 条回复
        </h2>

        {post.replies.length > 0 && (
          <div className="space-y-3">
            {post.replies.map((reply) => {
              const replySanitized = DOMPurify.sanitize(reply.content);
              return (
                <div key={reply.id} className={`glass rounded-xl p-4 ${reply.isAccepted ? "ring-1 ring-green-500/30" : ""}`}>
                  <div className="flex gap-3">
                    <div className="hidden sm:block">
                      <VoteButton score={reply.voteScore} replyId={reply.id} />
                    </div>
                    <div className="flex-1 min-w-0">
                      {reply.isAccepted && (
                        <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 mb-2">
                          <CheckCircle className="w-3 h-3" /> 最佳回复
                        </span>
                      )}
                      {/* Reply content — sanitized with DOMPurify */}
                      <div
                        className="prose prose-invert prose-sm max-w-none text-foreground/85 [&_p]:leading-[1.7] [&_pre]:bg-surface [&_pre]:rounded-lg [&_pre]:p-3 [&_code]:font-mono [&_code]:text-xs"
                        dangerouslySetInnerHTML={{ __html: replySanitized }}
                      />
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                        <span>{reply.author.username || reply.author.name || "匿名"}</span>
                        {reply.author.level && <span>Lv.{reply.author.level}</span>}
                        <span>{getTimeAgo(reply.createdAt)}</span>
                        <span className="sm:hidden text-primary-light">▲ {reply.voteScore}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reply form */}
        {!post.isLocked && (
          <div className="mt-6 glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-3">写回复</h3>
            {error && (
              <div className="mb-3 p-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>
            )}
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="写下你的回复..."
              rows={4}
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary resize-none"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handleSubmitReply}
                disabled={submitting || !replyContent.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? "提交中..." : "提交回复"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return `${Math.floor(days / 30)} 个月前`;
}
