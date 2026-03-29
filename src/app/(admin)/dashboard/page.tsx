"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  Heart,
  MessageCircle,
  Users,
  FileText,
  Loader2,
  Plus,
  Image,
  Settings,
  AlertCircle,
  Mail,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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
}

interface TrendItem {
  date: string;
  views: number;
  visits: number;
}

interface CategoryStat {
  name: string;
  count: number;
}

const statConfig = [
  { key: "totalViews", label: "总浏览量", icon: Eye },
  { key: "totalLikes", label: "总点赞数", icon: Heart },
  { key: "totalComments", label: "总评论数", icon: MessageCircle },
  { key: "totalSubscribers", label: "订阅用户", icon: Users },
  { key: "totalPosts", label: "文章总数", icon: FileText },
] as const;

const PIE_COLORS = ["#f97316", "#6366f1", "#06b6d4", "#22c55e", "#eab308", "#0ea5e9", "#ec4899"];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [trend, setTrend] = useState<TrendItem[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<{ pendingComments: number; draftPosts: number; unconfirmedSubscribers: number } | null>(null);

  const loadStats = () => {
    setLoading(true);
    setError("");
    // Fetch pending items in parallel
    fetch("/api/admin/pending").then((r) => r.json()).then((d) => setPending(d)).catch(() => {});
    fetch("/api/admin/stats")
      .then((res) => {
        if (!res.ok) throw new Error("加载失败");
        return res.json();
      })
      .then((data) => {
        setStats(data.stats);
        setRecentPosts(data.recentPosts || []);
        setTrend(data.trend || []);
        setCategoryStats(data.categoryStats || []);
      })
      .catch((err) => setError(err.message || "加载仪表盘数据失败"))
      .finally(() => setLoading(false));
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { loadStats(); }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={loadStats} className="px-4 py-2 bg-primary text-white rounded-lg cursor-pointer hover:bg-primary-light transition-colors">
          重新加载
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">仪表盘</h1>
        <div className="flex gap-2">
          <Link href="/posts/new" className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-light text-white rounded-lg text-sm transition-colors cursor-pointer">
            <Plus className="w-4 h-4" /> 新建文章
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Link href="/posts/new" className="glass rounded-xl p-4 flex items-center gap-3 card-hover cursor-pointer">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Plus className="w-5 h-5 text-primary-light" /></div>
          <div><p className="text-sm font-medium text-foreground">新建文章</p><p className="text-xs text-muted">创建新内容</p></div>
        </Link>
        <Link href="/comments" className="glass rounded-xl p-4 flex items-center gap-3 card-hover cursor-pointer">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center"><MessageCircle className="w-5 h-5 text-accent-light" /></div>
          <div><p className="text-sm font-medium text-foreground">评论管理</p><p className="text-xs text-muted">审核评论</p></div>
        </Link>
        <Link href="/media" className="glass rounded-xl p-4 flex items-center gap-3 card-hover cursor-pointer">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><Image className="w-5 h-5 text-green-400" /></div>
          <div><p className="text-sm font-medium text-foreground">媒体库</p><p className="text-xs text-muted">管理图片</p></div>
        </Link>
        <Link href="/settings" className="glass rounded-xl p-4 flex items-center gap-3 card-hover cursor-pointer">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center"><Settings className="w-5 h-5 text-yellow-400" /></div>
          <div><p className="text-sm font-medium text-foreground">站点设置</p><p className="text-xs text-muted">外观配置</p></div>
        </Link>
      </div>

      {/* Pending Items */}
      {pending && (pending.pendingComments > 0 || pending.draftPosts > 0 || pending.unconfirmedSubscribers > 0) && (
        <div className="glass rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">待处理</span>
          </div>
          {pending.pendingComments > 0 && (
            <Link href="/comments" className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg text-xs hover:bg-amber-500/20 transition-colors cursor-pointer">
              <MessageCircle className="w-3.5 h-3.5" /> {pending.pendingComments} 条评论待审核
            </Link>
          )}
          {pending.draftPosts > 0 && (
            <Link href="/posts" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-xs hover:bg-blue-500/20 transition-colors cursor-pointer">
              <FileText className="w-3.5 h-3.5" /> {pending.draftPosts} 篇草稿未发布
            </Link>
          )}
          {pending.unconfirmedSubscribers > 0 && (
            <Link href="/subscribers" className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg text-xs hover:bg-cyan-500/20 transition-colors cursor-pointer">
              <Mail className="w-3.5 h-3.5" /> {pending.unconfirmedSubscribers} 位订阅未确认
            </Link>
          )}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statConfig.map((item) => (
          <div key={item.key} className="glass rounded-xl p-5 card-hover">
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

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Trend chart */}
        <div className="lg:col-span-2 glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">近 7 天趋势</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="visitsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#1a1a2e",
                    border: "1px solid #2a2a4a",
                    borderRadius: "8px",
                    color: "#ededed",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#6366f1"
                  fillOpacity={1}
                  fill="url(#viewsGrad)"
                  name="浏览量"
                />
                <Area
                  type="monotone"
                  dataKey="visits"
                  stroke="#06b6d4"
                  fillOpacity={1}
                  fill="url(#visitsGrad)"
                  name="访问量"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category pie chart */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">分类分布</h2>
          <div className="h-64">
            {categoryStats.some((c) => c.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStats.filter((c) => c.count > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="count"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {categoryStats.filter((c) => c.count > 0).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#1a1a2e",
                      border: "1px solid #2a2a4a",
                      borderRadius: "8px",
                      color: "#ededed",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted text-sm">
                暂无数据
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent posts table */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">最近文章</h2>
          <a href="/posts" className="text-sm text-primary-light hover:text-primary cursor-pointer">
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
                  <tr key={post.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 text-foreground">{post.title}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary-light rounded-full">
                        {post.category.name}
                      </span>
                    </td>
                    <td className="py-3 text-muted">{post.viewCount}</td>
                    <td className="py-3 text-muted">{post._count.likes}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        post.status === "PUBLISHED"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-yellow-500/10 text-yellow-400"
                      }`}>
                        {post.status === "PUBLISHED" ? "已发布" : "草稿"}
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
