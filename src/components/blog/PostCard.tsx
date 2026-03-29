"use client";

import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, Heart, MessageCircle, Clock } from "lucide-react";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    coverImage?: string;
    category: { name: string; slug: string };
    viewCount: number;
    _count?: { likes: number; comments: number };
    publishedAt: string;
  };
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return `${diffDays} 天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} 周前`;
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

export default memo(function PostCard({ post }: PostCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="block group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl"
    >
      <article className="glass rounded-2xl overflow-hidden card-hover card-glow h-full flex flex-col">
        {/* Cover image */}
        <div className="relative h-48 overflow-hidden">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              loading="lazy"
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-500" />
          )}
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-3 left-3 z-10">
            <span className="px-2.5 py-1 text-xs font-semibold bg-primary/90 text-white rounded-lg backdrop-blur-sm">
              {post.category.name}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary-light transition-colors line-clamp-2 mb-2">
            {post.title}
          </h3>
          <p className="text-sm text-muted line-clamp-2 mb-4 flex-1">
            {post.excerpt}
          </p>

          {/* Meta */}
          <div className="flex items-center justify-between text-xs text-muted pt-3 border-t border-border/30">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1" title="浏览量">
                <Eye className="w-3.5 h-3.5" />
                {post.viewCount}
              </span>
              <span className="flex items-center gap-1" title="点赞数">
                <Heart className="w-3.5 h-3.5" />
                {post._count?.likes || 0}
              </span>
              <span className="flex items-center gap-1" title="评论数">
                <MessageCircle className="w-3.5 h-3.5" />
                {post._count?.comments || 0}
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(post.publishedAt)}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
});
