"use client";

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

export default function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/blog/${post.slug}`} className="block group cursor-pointer">
      <article className="glass rounded-2xl overflow-hidden card-hover">
        {/* Cover image */}
        <div className="relative h-48 overflow-hidden">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 group-hover:scale-110 transition-transform duration-500" />
          )}
          <div className="absolute top-3 left-3 z-10">
            <span className="px-2.5 py-1 text-xs font-medium bg-primary/80 text-white rounded-lg">
              {post.category.name}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary-light transition-colors line-clamp-2 mb-2">
            {post.title}
          </h3>
          <p className="text-sm text-muted line-clamp-2 mb-4">
            {post.excerpt}
          </p>

          {/* Meta */}
          <div className="flex items-center justify-between text-xs text-muted">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {post.viewCount}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" />
                {post._count?.likes || 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                {post._count?.comments || 0}
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date(post.publishedAt).toLocaleDateString("zh-CN")}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
