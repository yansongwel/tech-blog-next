"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  Heart,
  MessageCircle,
  Users,
  FileText,
  Loader2,
} from "lucide-react";

interface Stats {
  totalPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalSubscribers: number;
}

interface RecentPost {
  id: string;
  title: string;
  status: string;
  viewCount: number;
  category: { name: string };
  _count: { likes: number; comments: number };
  createdAt: string;
}

const statConfig = [
  { key: "totalViews", label: "总浏览量", icon: Eye },
  { key: "totalLikes", label: "总点赞数", icon: Heart },
  { key: "totalComments", label: "总评论数", icon: MessageCircle },
  { key: "totalSubscribers", label: "订阅用户", icon: Users },
  { key: "totalPosts", label: "文章总数", icon: FileText },
] as const;

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setStats(data.stats);
        setRecentPosts(data.recentPosts || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">仪表盘</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statConfig.map((item) => (
          <div
            key={item.key}
            className="glass rounded-xl p-5 card-hover"
          >
            <div className="flex items-center justify-between mb-3">
              <item.icon className="w-5 h-5 text-primary-light" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {stats ? stats[item.key].toLocaleString() : "—"}
            </p>
            <p className="text-xs text-muted mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Recent posts table */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">最近文章</h2>
          <a
            href="/posts"
            className="text-sm text-primary-light hover:text-primary cursor-pointer"
          >
            查看全部
          </a>
        </div>
        {recentPosts.length === 0 ? (
          <p className="text-center text-muted py-8">暂无文章</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-border">
                  <th className="pb-3 font-medium">标题</th>
                  <th className="pb-3 font-medium">分类</th>
                  <th className="pb-3 font-medium">浏览</th>
                  <th className="pb-3 font-medium">点赞</th>
                  <th className="pb-3 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {recentPosts.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-3 text-foreground">{post.title}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary-light rounded-full">
                        {post.category.name}
                      </span>
                    </td>
                    <td className="py-3 text-muted">{post.viewCount}</td>
                    <td className="py-3 text-muted">{post._count.likes}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          post.status === "PUBLISHED"
                            ? "bg-green-500/10 text-green-400"
                            : post.status === "ARCHIVED"
                              ? "bg-gray-500/10 text-gray-400"
                              : "bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {post.status === "PUBLISHED" ? "已发布" : post.status === "ARCHIVED" ? "已归档" : "草稿"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
