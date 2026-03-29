"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Archive, Calendar, Eye, FileText } from "lucide-react";

interface ArchivePost {
  id: string;
  title: string;
  slug: string;
  publishedAt: string;
  viewCount: number;
  category: { name: string; slug: string };
  _count: { likes: number; comments: number };
}

interface ArchiveGroup {
  month: string;
  posts: ArchivePost[];
  count: number;
}

function formatMonth(key: string): string {
  const [year, month] = key.split("-");
  const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
  return `${year} 年 ${monthNames[parseInt(month) - 1]}`;
}

export default function ArchivePage() {
  const [groups, setGroups] = useState<ArchiveGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/archive")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setGroups(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalPosts = groups.reduce((sum, g) => sum + g.count, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold gradient-text mb-2 flex items-center justify-center gap-3">
          <Archive className="w-8 h-8" />
          文章归档
        </h1>
        <p className="text-muted">共 {totalPosts} 篇文章，记录技术成长的每一步</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted">加载中...</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20 text-muted glass rounded-xl">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted/40" />
          暂无文章
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-accent to-primary/20" />

          {groups.map((group) => (
            <div key={group.month} className="mb-10">
              {/* Month header */}
              <div className="flex items-center gap-4 mb-4 relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center z-10 shrink-0 shadow-lg shadow-primary/30">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{formatMonth(group.month)}</h2>
                  <span className="text-xs text-muted">{group.count} 篇文章</span>
                </div>
              </div>

              {/* Posts */}
              <div className="ml-[19px] pl-8 border-l-0 space-y-2">
                {group.posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="block glass rounded-xl p-4 card-hover cursor-pointer group relative"
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-[25px] top-5 w-2.5 h-2.5 rounded-full bg-primary/60 border-2 border-background group-hover:bg-primary group-hover:scale-150 transition-all" />

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-foreground group-hover:text-primary-light transition-colors line-clamp-1">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
                          <span className="px-1.5 py-0.5 bg-primary/10 text-primary-light rounded">{post.category.name}</span>
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.viewCount}</span>
                          <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("zh-CN") : ""}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
