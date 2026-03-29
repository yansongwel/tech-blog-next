"use client";

import { useState, useEffect, useMemo } from "react";
import createDOMPurify from "dompurify";
import ReadingProgress from "@/components/blog/ReadingProgress";
import TableOfContents from "@/components/blog/TableOfContents";
import { PostDetailSkeleton } from "@/components/blog/Skeleton";
import {
  Heart,
  Bookmark,
  Share2,
  MessageCircle,
  Eye,
  Clock,
  ArrowLeft,
  Lock,
  Send,
  Check,
} from "lucide-react";
import Link from "next/link";

// NOTE: dangerouslySetInnerHTML is used ONLY with DOMPurify-sanitized content (line ~100)
// All user content goes through DOMPurify.sanitize() before rendering

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: { name: string; slug: string };
  author: { name: string; avatar: string | null };
  tags: { tag: { name: string; slug: string } }[];
  viewCount: number;
  isLocked: boolean;
  publishedAt: string;
  relatedPosts?: { id: string; title: string; slug: string; excerpt: string | null; coverImage: string | null; viewCount: number; publishedAt: string; category: { name: string; slug: string } }[];
  _count: { likes: number; comments: number };
}

interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  replies: { id: string; content: string; author: string; createdAt: string }[];
}

function getVisitorId() {
  let id = localStorage.getItem("visitorId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("visitorId", id);
  }
  return id;
}

export default function PostDetail({ slug }: { slug: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentAuthor, setCommentAuthor] = useState("");
  const [commentEmail, setCommentEmail] = useState("");
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentMsg, setCommentMsg] = useState("");
  const [liking, setLiking] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [unlockCode, setUnlockCode] = useState("");
  const [shared, setShared] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/posts/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setPost(data);
        setLikeCount(data._count?.likes || 0);
        if (data.isLocked) setShowUnlock(true);
      })
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!post) return;
    fetch(`/api/comments?postId=${post.id}`)
      .then((res) => res.json())
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [post]);

  // Sanitize HTML content using DOMPurify to prevent XSS attacks
  const sanitizedContent = useMemo(() => {
    if (!post || typeof window === "undefined") return "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const purify = (createDOMPurify as any).default ?? createDOMPurify;
    const sanitizer = typeof purify === "function" ? purify(window) : purify;
    return sanitizer.sanitize(post.content);
  }, [post]);

  // Add copy buttons to code blocks + render Mermaid diagrams
  useEffect(() => {
    if (!post) return;
    const timer = setTimeout(async () => {
      // Copy buttons for code blocks (skip mermaid)
      document.querySelectorAll("article pre").forEach((pre) => {
        const code = pre.querySelector("code");
        if (code?.classList.contains("language-mermaid")) return;
        if (pre.querySelector(".copy-btn")) return;
        const btn = document.createElement("button");
        btn.className = "copy-btn absolute top-2 right-2 px-2 py-1 text-xs bg-white/10 hover:bg-white/20 text-white/70 rounded cursor-pointer transition-colors";
        btn.textContent = "复制";
        btn.onclick = () => {
          const codeText = pre.querySelector("code")?.textContent || pre.textContent || "";
          navigator.clipboard.writeText(codeText);
          btn.textContent = "已复制!";
          setTimeout(() => { btn.textContent = "复制"; }, 2000);
        };
        (pre as HTMLElement).style.position = "relative";
        pre.appendChild(btn);
      });

      // Render Mermaid diagrams
      const mermaidBlocks = document.querySelectorAll("article pre code.language-mermaid");
      if (mermaidBlocks.length > 0) {
        try {
          const mermaid = (await import("mermaid")).default;
          mermaid.initialize({
            startOnLoad: false,
            theme: "dark",
            themeVariables: {
              primaryColor: "#6366f1",
              primaryTextColor: "#ededed",
              primaryBorderColor: "#818cf8",
              lineColor: "#06b6d4",
              secondaryColor: "#1a1a2e",
              tertiaryColor: "#2a2a4a",
            },
          });
          for (let i = 0; i < mermaidBlocks.length; i++) {
            const block = mermaidBlocks[i];
            const container = block.parentElement;
            if (!container) continue;
            const mermaidCode = block.textContent || "";
            try {
              const { svg } = await mermaid.render(`mermaid-${Date.now()}-${i}`, mermaidCode);
              const wrapper = document.createElement("div");
              wrapper.className = "mermaid-rendered my-6 overflow-x-auto flex justify-center";
              wrapper.innerHTML = svg;
              container.replaceWith(wrapper);
            } catch (err) {
              console.warn("Mermaid render failed:", err);
            }
          }
        } catch {
          console.warn("Failed to load mermaid");
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [post, sanitizedContent]);

  const handleLike = async () => {
    if (!post || liking) return;
    setLiking(true);
    const visitorId = getVisitorId();
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, visitorId }),
      });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikeCount((c) => (data.liked ? c + 1 : c - 1));
      }
    } catch {}
    setLiking(false);
  };

  const handleBookmark = () => { if (post) setBookmarked(!bookmarked); };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !commentText.trim() || !commentAuthor.trim() || !commentEmail.trim()) return;
    setSubmittingComment(true);
    setCommentMsg("");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText, author: commentAuthor, email: commentEmail, postId: post.id }),
      });
      if (res.ok) {
        setCommentText("");
        setCommentMsg("评论已提交，审核通过后显示");
        const commentsRes = await fetch(`/api/comments?postId=${post.id}`);
        const commentsData = await commentsRes.json();
        setComments(Array.isArray(commentsData) ? commentsData : []);
      } else {
        const data = await res.json();
        setCommentMsg(data.error || "评论提交失败");
      }
    } catch { setCommentMsg("网络错误，请重试"); }
    setSubmittingComment(false);
  };

  if (loading) return <PostDetailSkeleton />;

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">文章未找到</h1>
        <Link href="/blog" className="text-primary-light hover:text-primary cursor-pointer">返回文章列表</Link>
      </div>
    );
  }

  // Content is sanitized by DOMPurify above (line ~100) before being set here
  const safeHtml = sanitizedContent;

  return (
    <>
      <ReadingProgress />
      <TableOfContents />
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-8">
        <Link href="/blog" className="inline-flex items-center gap-1 text-muted hover:text-foreground mb-6 text-sm cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> 返回文章列表
        </Link>

        <header className="mb-8">
          <span className="inline-block px-3 py-1 text-xs font-semibold bg-primary/80 text-white rounded-full mb-4">{post.category.name}</span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-muted">
            {post.author?.name && <span>{post.author.name}</span>}
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("zh-CN") : ""}</span>
            <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{post.viewCount} 阅读</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{Math.max(1, Math.ceil(post.content.replace(/<[^>]*>/g, "").length / 400))} 分钟</span>
          </div>
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {post.tags.map(({ tag }) => (
                <span key={tag.slug} className="px-2 py-0.5 text-xs bg-accent/10 text-accent-light border border-accent/20 rounded-full">#{tag.name}</span>
              ))}
            </div>
          )}
        </header>

        <article className="glass rounded-2xl p-4 sm:p-6 md:p-10 mb-8">
          <div
            className="prose max-w-none
              [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-4
              [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-3
              [&_p]:text-foreground/80 [&_p]:leading-relaxed [&_p]:mb-4
              [&_pre]:bg-surface [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:mb-4
              [&_code]:font-mono [&_code]:text-accent-light [&_code]:text-sm
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:text-foreground/80
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:text-foreground/80
              [&_li]:mb-1 [&_li]:text-foreground/80
              [&_a]:text-primary-light [&_a]:underline
              [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted
              [&_img]:rounded-xl [&_img]:max-w-full
              [&_table]:w-full [&_table]:border-collapse [&_table]:mb-4
              [&_th]:bg-surface [&_th]:px-4 [&_th]:py-2 [&_th]:border [&_th]:border-border [&_th]:text-foreground [&_th]:text-left [&_th]:text-sm [&_th]:font-semibold
              [&_td]:px-4 [&_td]:py-2 [&_td]:border [&_td]:border-border [&_td]:text-foreground/80 [&_td]:text-sm
              [&_hr]:border-border [&_hr]:my-8
            "
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />

          {showUnlock && post.isLocked && (
            <div className="relative mt-8 p-6 sm:p-8 glass rounded-xl text-center">
              <Lock className="w-8 h-8 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">关注公众号解锁全文</h3>
              <p className="text-sm text-muted mb-4">扫码关注公众号，获取验证码</p>
              <div className="w-32 h-32 mx-auto mb-4 bg-surface rounded-xl border border-border flex items-center justify-center text-muted text-xs">[公众号二维码]</div>
              <div className="flex gap-2 max-w-xs mx-auto">
                <input type="text" placeholder="输入验证码" value={unlockCode} onChange={(e) => setUnlockCode(e.target.value)} className="flex-1 px-4 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary" />
                <button className="px-4 py-2 bg-primary text-white rounded-lg cursor-pointer hover:bg-primary-light transition-colors">解锁</button>
              </div>
            </div>
          )}
        </article>

        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 glass rounded-xl p-3 sm:p-4 mb-8">
          <button onClick={handleLike} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${liked ? "bg-red-500/20 text-red-400" : "hover:bg-white/5 text-muted"}`}>
            <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} /><span className="text-sm">{likeCount}</span>
          </button>
          <button onClick={handleBookmark} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${bookmarked ? "bg-yellow-500/20 text-yellow-400" : "hover:bg-white/5 text-muted"}`}>
            <Bookmark className={`w-5 h-5 ${bookmarked ? "fill-current" : ""}`} /><span className="text-sm hidden sm:inline">收藏</span>
          </button>
          <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 text-muted transition-colors cursor-pointer">
            {shared ? <Check className="w-5 h-5 text-green-400" /> : <Share2 className="w-5 h-5" />}<span className="text-sm hidden sm:inline">{shared ? "已复制" : "分享"}</span>
          </button>
        </div>

        {/* Related Posts */}
        {post.relatedPosts && post.relatedPosts.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-foreground mb-4">相关文章</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {post.relatedPosts.map((rp) => (
                <Link key={rp.id} href={`/blog/${rp.slug}`} className="glass rounded-xl p-4 card-hover cursor-pointer block">
                  <span className="text-xs text-primary-light">{rp.category.name}</span>
                  <h4 className="text-sm font-medium text-foreground mt-1 line-clamp-2">{rp.title}</h4>
                  {rp.excerpt && <p className="text-xs text-muted mt-1 line-clamp-2">{rp.excerpt}</p>}
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted">
                    <span>{rp.viewCount} 阅读</span>
                    <span>{rp.publishedAt ? new Date(rp.publishedAt).toLocaleDateString("zh-CN") : ""}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <section className="glass rounded-2xl p-4 sm:p-6 md:p-8">
          <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2"><MessageCircle className="w-5 h-5" />评论区 ({comments.length})</h3>
          <form onSubmit={handleComment} className="mb-8">
            <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="写下你的评论..." rows={3} required className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors resize-none mb-3" />
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input type="text" placeholder="昵称" value={commentAuthor} onChange={(e) => setCommentAuthor(e.target.value)} required className="px-3 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary text-sm" />
              <input type="email" placeholder="邮箱" value={commentEmail} onChange={(e) => setCommentEmail(e.target.value)} required className="px-3 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary text-sm" />
              <button type="submit" disabled={submittingComment} className="sm:ml-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-light disabled:opacity-50 text-white rounded-lg text-sm cursor-pointer transition-colors">
                <Send className="w-4 h-4" />{submittingComment ? "提交中..." : "发表评论"}
              </button>
            </div>
          </form>
          {commentMsg && <p className={`text-sm mb-4 ${commentMsg.includes("失败") || commentMsg.includes("错误") ? "text-red-400" : "text-primary-light"}`}>{commentMsg}</p>}
          <div className="space-y-6">
            {comments.length === 0 ? (
              <p className="text-center text-muted py-4">暂无评论，来留下第一条评论吧</p>
            ) : comments.map((comment) => (
              <div key={comment.id}>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shrink-0">{comment.author[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">{comment.author}</span>
                      <span className="text-xs text-muted">{new Date(comment.createdAt).toLocaleDateString("zh-CN")}</span>
                    </div>
                    <p className="text-sm text-foreground/80 break-words">{comment.content}</p>
                  </div>
                </div>
                {comment.replies?.map((reply) => (
                  <div key={reply.id} className="flex gap-3 ml-8 sm:ml-11 mt-3">
                    <div className="w-6 h-6 rounded-full bg-accent/30 flex items-center justify-center text-accent text-xs font-bold shrink-0">{reply.author[0]}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-foreground">{reply.author}</span>
                        <span className="text-xs text-muted">{new Date(reply.createdAt).toLocaleDateString("zh-CN")}</span>
                      </div>
                      <p className="text-xs text-foreground/80 break-words">{reply.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
