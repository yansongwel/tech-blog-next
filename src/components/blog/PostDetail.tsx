"use client";

import { useState, useEffect, useMemo } from "react";
import createDOMPurify from "dompurify";
import "highlight.js/styles/github-dark-dimmed.css";
import TableOfContents, { injectHeadingIds, type TocItem } from "@/components/blog/TableOfContents";
import { PostDetailSkeleton } from "@/components/blog/Skeleton";
import {
  Heart,
  Bookmark,
  Share2,
  MessageCircle,
  Eye,
  Clock,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
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
  prevPost?: { title: string; slug: string } | null;
  nextPost?: { title: string; slug: string } | null;
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
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
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
        // Comments now included in post response (no extra fetch needed)
        if (Array.isArray(data.comments)) setComments(data.comments);
      })
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [slug]);

  // Sanitize HTML content using DOMPurify, then inject heading IDs and code toolbars
  const { safeHtml, tocHeadings } = useMemo(() => {
    if (!post || typeof window === "undefined") return { safeHtml: "", tocHeadings: [] as TocItem[] };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const purify = (createDOMPurify as any).default ?? createDOMPurify;
    const sanitizer = typeof purify === "function" ? purify(window) : purify;
    const sanitized = sanitizer.sanitize(post.content);
    // Inject stable id attributes into h2/h3 so TOC links survive re-renders
    const { html, headings } = injectHeadingIds(sanitized);
    // Inject code block toolbars with robust copy (clipboard API + execCommand fallback)
    const copyFn = [
      "(function(b){",
        "var t=b.closest('pre').querySelector('code').textContent;",
        "function ok(){b.textContent='\\u2713 \\u5df2\\u590d\\u5236';b.style.color='#4ade80'}",
        "function fail(){b.textContent='\\u590d\\u5236\\u5931\\u8d25';b.style.color='#f87171'}",
        "function reset(){setTimeout(function(){b.textContent='\\u590d\\u5236';b.style.color='rgba(255,255,255,0.7)'},2000)}",
        "if(navigator.clipboard&&window.isSecureContext){",
          "navigator.clipboard.writeText(t).then(ok,fail).finally(reset)",
        "}else{",
          "var a=document.createElement('textarea');a.value=t;a.style.position='fixed';a.style.opacity='0';",
          "document.body.appendChild(a);a.select();",
          "try{document.execCommand('copy');ok()}catch(e){fail()}",
          "document.body.removeChild(a);reset()",
        "}",
      "})(this)",
    ].join("");
    const withToolbars = html.replace(
      /<pre><code class="language-(\w+)">/g,
      (_, rawLang) => {
        // Defense-in-depth: strip any non-alphanumeric chars (regex already limits to \w)
        const lang = rawLang.replace(/[^a-zA-Z0-9]/g, "");
        return `<pre style="position:relative;padding-top:2.5rem"><div class="code-toolbar" style="position:absolute;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:6px 12px;font-size:12px;color:rgba(255,255,255,0.5);background:rgba(255,255,255,0.05);border-radius:12px 12px 0 0"><span style="font-family:monospace">${lang.toUpperCase()}</span><button class="copy-btn" style="padding:2px 8px;background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.7);border:none;border-radius:4px;cursor:pointer;font-size:12px" onclick="${copyFn}">复制</button></div><code class="language-${lang}">`;
      }
    );
    return { safeHtml: withToolbars, tocHeadings: headings };
  }, [post]);

  // Signal content is rendered (for highlighting)
  const [contentReady, setContentReady] = useState(false);

  // Syntax highlighting, copy buttons, and Mermaid diagrams
  // NOTE: Content rendered via safeHtml is sanitized by DOMPurify (see useMemo above)
  useEffect(() => {
    if (!post || !safeHtml) return;

    // Syntax highlighting (async import, runs after DOM is ready)
    // Copy buttons are already in safeHtml (injected in useMemo above)
    setTimeout(() => {
      import("highlight.js").then((mod) => {
        const hljs = mod.default;
        document.querySelectorAll("article pre code").forEach((block) => {
          if (block.classList.contains("language-mermaid")) return;
          if ((block as HTMLElement).dataset.highlighted) return;
          hljs.highlightElement(block as HTMLElement);
        });
      }).catch(() => {});

      // Render Mermaid diagrams (SVGs generated locally by mermaid.js, not user input)
      const mermaidBlocks = document.querySelectorAll("article pre code.language-mermaid");
      if (mermaidBlocks.length > 0) {
        import("mermaid").then(async (mod) => {
          const mermaid = mod.default;
          const cs = getComputedStyle(document.documentElement);
          const getVar = (v: string, d: string) => cs.getPropertyValue(v).trim() || d;
          mermaid.initialize({
            startOnLoad: false, theme: "base",
            themeVariables: {
              primaryColor: getVar("--surface-light", "#16213e"),
              primaryTextColor: getVar("--foreground", "#ededed"),
              primaryBorderColor: getVar("--primary-light", "#818cf8"),
              lineColor: getVar("--accent", "#06b6d4"),
              secondaryColor: getVar("--surface", "#1a1a2e"),
              tertiaryColor: getVar("--surface", "#1a1a2e"),
              textColor: getVar("--foreground", "#ededed"),
              fontSize: "14px", fontFamily: "inherit",
              nodeBorder: getVar("--primary", "#6366f1"),
              mainBkg: getVar("--surface-light", "#16213e"),
              nodeTextColor: getVar("--foreground", "#ededed"),
            },
          });
          for (let i = 0; i < mermaidBlocks.length; i++) {
            const block = mermaidBlocks[i];
            const container = block.parentElement;
            if (!container) continue;
            try {
              const { svg } = await mermaid.render(`mermaid-${Date.now()}-${i}`, block.textContent || "");
              const wrapper = document.createElement("div");
              wrapper.className = "mermaid-rendered";
              // Mermaid SVGs are generated locally by the library, safe to render
              const tmpl = document.createElement("template");
              tmpl.innerHTML = svg; // eslint-disable-line -- mermaid-generated SVG, not user input
              wrapper.appendChild(tmpl.content);
              container.replaceWith(wrapper);
            } catch (err) { console.warn("Mermaid render failed:", err); }
          }
        }).catch(() => {});
      }

      // Add zoom cursor to article images (lightbox handled via event delegation)
      document.querySelectorAll("article img").forEach((img) => {
        (img as HTMLElement).style.cursor = "zoom-in";
      });

      setContentReady(true);
    });
    // No cleanup needed - setTimeout(0) is fire-and-forget, enhanceCodeBlocks is idempotent
  }, [post, safeHtml]);

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

  const handleShare = async () => {
    const url = window.location.href;
    // Try native share (mobile)
    if (navigator.share) {
      try {
        await navigator.share({ title: post?.title || "", url });
        return;
      } catch { /* user cancelled */ }
    }
    // Fallback: copy to clipboard
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch { /* ignore */ }
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

  return (
    <>
      <TableOfContents headings={tocHeadings} />
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

        <article
          className="glass rounded-2xl p-4 sm:p-6 md:p-10 mb-8"
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === "IMG" && target.closest(".prose")) {
              setLightboxUrl((target as HTMLImageElement).src);
            }
          }}
        >
          <div
            className="prose max-w-none
              [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mt-10 [&_h1]:mb-4
              [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-border/50
              [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-3
              [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-foreground [&_h4]:mt-4 [&_h4]:mb-2
              [&_p]:text-foreground/90 [&_p]:leading-[1.8] [&_p]:mb-4
              [&_pre]:p-4 [&_pre]:mb-4
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:text-foreground/90
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:text-foreground/90
              [&_li]:mb-2 [&_li]:text-foreground/90 [&_li]:leading-[1.8]
              [&_a]:text-primary-light [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-primary/30 hover:[&_a]:decoration-primary
              [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-5 [&_blockquote]:py-3 [&_blockquote]:my-6 [&_blockquote]:not-italic [&_blockquote]:text-foreground/80 [&_blockquote]:bg-primary/5 [&_blockquote]:rounded-r-xl
              [&_img]:rounded-xl [&_img]:max-w-full [&_img]:mx-auto [&_img]:my-6
              [&_table]:w-full [&_table]:border-collapse [&_table]:mb-6 [&_table]:text-sm [&_table]:overflow-hidden [&_table]:rounded-xl
              [&_th]:bg-surface [&_th]:px-4 [&_th]:py-3 [&_th]:border [&_th]:border-border [&_th]:text-foreground [&_th]:text-left [&_th]:font-semibold
              [&_td]:px-4 [&_td]:py-3 [&_td]:border [&_td]:border-border [&_td]:text-foreground/90
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

        {/* Prev / Next navigation */}
        {(post.prevPost || post.nextPost) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {post.prevPost ? (
              <Link href={`/blog/${post.prevPost.slug}`} className="glass rounded-xl p-4 card-hover cursor-pointer group flex items-center gap-3">
                <ChevronLeft className="w-5 h-5 text-muted group-hover:text-primary-light shrink-0 transition-colors" />
                <div className="min-w-0">
                  <span className="text-xs text-muted">上一篇</span>
                  <p className="text-sm font-medium text-foreground group-hover:text-primary-light transition-colors line-clamp-1">{post.prevPost.title}</p>
                </div>
              </Link>
            ) : <div />}
            {post.nextPost ? (
              <Link href={`/blog/${post.nextPost.slug}`} className="glass rounded-xl p-4 card-hover cursor-pointer group flex items-center gap-3 justify-end text-right">
                <div className="min-w-0">
                  <span className="text-xs text-muted">下一篇</span>
                  <p className="text-sm font-medium text-foreground group-hover:text-primary-light transition-colors line-clamp-1">{post.nextPost.title}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted group-hover:text-primary-light shrink-0 transition-colors" />
              </Link>
            ) : <div />}
          </div>
        )}

        <section className="glass rounded-2xl p-4 sm:p-6 md:p-8">
          <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2"><MessageCircle className="w-5 h-5" />评论区 ({comments.length})</h3>
          <form onSubmit={handleComment} className="mb-8">
            <label htmlFor="comment-text" className="sr-only">评论内容</label>
            <textarea id="comment-text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="写下你的评论..." rows={3} required className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors resize-none mb-3" />
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <label htmlFor="comment-author" className="sr-only">昵称</label>
              <input id="comment-author" type="text" placeholder="昵称" value={commentAuthor} onChange={(e) => setCommentAuthor(e.target.value)} required className="px-3 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary text-sm" />
              <label htmlFor="comment-email" className="sr-only">邮箱</label>
              <input id="comment-email" type="email" placeholder="邮箱" value={commentEmail} onChange={(e) => setCommentEmail(e.target.value)} required className="px-3 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary text-sm" />
              <button type="submit" disabled={submittingComment} className="sm:ml-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-light disabled:opacity-50 text-white rounded-lg text-sm cursor-pointer transition-colors">
                <Send className="w-4 h-4" />{submittingComment ? "提交中..." : "发表评论"}
              </button>
            </div>
          </form>
          {commentMsg && <p role="status" aria-live="polite" className={`text-sm mb-4 ${commentMsg.includes("失败") || commentMsg.includes("错误") ? "text-red-400" : "text-primary-light"}`}>{commentMsg}</p>}
          <div className="space-y-6">
            {comments.length === 0 ? (
              <p className="text-center text-muted py-4">暂无评论，来留下第一条评论吧</p>
            ) : comments.map((comment) => (
              <article key={comment.id} aria-label={`${comment.author} 的评论`}>
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
                  <article key={reply.id} className="flex gap-3 ml-8 sm:ml-11 mt-3" aria-label={`${reply.author} 的回复`}>
                    <div className="w-6 h-6 rounded-full bg-accent/30 flex items-center justify-center text-accent text-xs font-bold shrink-0">{reply.author[0]}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-foreground">{reply.author}</span>
                        <span className="text-xs text-muted">{new Date(reply.createdAt).toLocaleDateString("zh-CN")}</span>
                      </div>
                      <p className="text-xs text-foreground/80 break-words">{reply.content}</p>
                    </div>
                  </article>
                ))}
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* Image lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer animate-fade-in"
          onClick={() => setLightboxUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="放大预览"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full glass flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}
    </>
  );
}
