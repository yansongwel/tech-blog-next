"use client";

import Link from "next/link";
import { MessageSquare, Eye, Pin, Star, CheckCircle, Lock } from "lucide-react";
import VoteButton from "./VoteButton";

interface ThreadCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    viewCount: number;
    voteScore: number;
    replyCount: number;
    isPinned: boolean;
    isFeatured: boolean;
    isSolved: boolean;
    isLocked: boolean;
    createdAt: string;
    lastReplyAt?: string | null;
    author: {
      username?: string | null;
      name?: string | null;
      avatar?: string | null;
    };
    category: {
      name: string;
      slug: string;
      color?: string | null;
    };
    tags?: { tag: { name: string; slug: string } }[];
    _count?: { replies: number; votes: number };
  };
}

export default function ThreadCard({ post }: ThreadCardProps) {
  const authorName = post.author.username || post.author.name || "匿名";
  const displayReplyCount = post._count?.replies ?? post.replyCount;
  const timeAgo = getTimeAgo(post.createdAt);

  return (
    <div className="glass rounded-xl p-4 hover:bg-white/[0.02] transition-colors">
      <div className="flex gap-3">
        {/* Vote */}
        <div className="hidden sm:block">
          <VoteButton score={post.voteScore} postId={post.id} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Status badges */}
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
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
            {post.isLocked && (
              <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
                <Lock className="w-3 h-3" /> 已锁定
              </span>
            )}
            <Link
              href={`/forum/${post.category.slug}`}
              className="text-xs px-1.5 py-0.5 rounded text-foreground/70 hover:text-foreground cursor-pointer"
              style={{
                backgroundColor: post.category.color ? `${post.category.color}15` : undefined,
                color: post.category.color || undefined,
              }}
            >
              {post.category.name}
            </Link>
          </div>

          {/* Title */}
          <Link
            href={`/forum/post/${post.slug}`}
            className="text-foreground font-medium hover:text-primary-light transition-colors line-clamp-1 cursor-pointer"
          >
            {post.title}
          </Link>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {post.tags.map(({ tag }) => (
                <span
                  key={tag.slug}
                  className="text-xs px-1.5 py-0.5 rounded bg-surface text-muted"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted">
            <span>{authorName}</span>
            <span>{timeAgo}</span>
            <span className="flex items-center gap-0.5">
              <MessageSquare className="w-3 h-3" /> {displayReplyCount}
            </span>
            <span className="flex items-center gap-0.5">
              <Eye className="w-3 h-3" /> {post.viewCount}
            </span>
            {/* Mobile vote display */}
            <span className="sm:hidden flex items-center gap-0.5 text-primary-light">
              ▲ {post.voteScore}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  const months = Math.floor(days / 30);
  return `${months} 个月前`;
}
