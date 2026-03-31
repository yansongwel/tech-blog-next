"use client";

import { useState, useEffect } from "react";
import { Search, Users, Edit3, ChevronLeft, ChevronRight } from "lucide-react";

interface UserItem {
  id: string;
  email: string;
  username?: string | null;
  name?: string | null;
  role: string;
  points: number;
  level: number;
  createdAt: string;
  _count: { posts: number; forumPosts: number; forumReplies: number };
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  ADMIN: { label: "管理员", color: "text-red-400 bg-red-500/10" },
  EDITOR: { label: "编辑", color: "text-yellow-400 bg-yellow-500/10" },
  MEMBER: { label: "成员", color: "text-blue-400 bg-blue-500/10" },
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);

    fetch(`/api/admin/users?${params}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!cancelled && data) {
          setUsers(data.users);
          setTotal(data.total);
          setLoading(false);
        }
      })
      .catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [page, search, roleFilter]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
    }
    setEditingId(null);
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="w-6 h-6" /> 用户管理
        </h1>
        <span className="text-sm text-muted">共 {total} 用户</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="搜索邮箱、用户名..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:border-primary cursor-pointer"
        >
          <option value="">全部角色</option>
          <option value="ADMIN">管理员</option>
          <option value="EDITOR">编辑</option>
          <option value="MEMBER">成员</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <th className="text-left px-4 py-3 text-foreground/70 font-medium">用户</th>
                <th className="text-left px-4 py-3 text-foreground/70 font-medium">角色</th>
                <th className="text-left px-4 py-3 text-foreground/70 font-medium hidden md:table-cell">等级</th>
                <th className="text-left px-4 py-3 text-foreground/70 font-medium hidden lg:table-cell">文章</th>
                <th className="text-left px-4 py-3 text-foreground/70 font-medium hidden lg:table-cell">帖子</th>
                <th className="text-left px-4 py-3 text-foreground/70 font-medium hidden md:table-cell">注册时间</th>
                <th className="text-left px-4 py-3 text-foreground/70 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td colSpan={7} className="px-4 py-3">
                      <div className="h-4 bg-surface rounded animate-pulse w-3/4" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    暂无用户数据
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const roleInfo = ROLE_LABELS[user.role] || ROLE_LABELS.MEMBER;
                  return (
                    <tr key={user.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-foreground font-medium">{user.username || user.name || "—"}</span>
                          <p className="text-xs text-muted">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {editingId === user.id ? (
                          <select
                            defaultValue={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            onBlur={() => setEditingId(null)}
                            autoFocus
                            className="px-2 py-1 bg-surface border border-primary rounded text-foreground text-xs cursor-pointer"
                          >
                            <option value="ADMIN">管理员</option>
                            <option value="EDITOR">编辑</option>
                            <option value="MEMBER">成员</option>
                          </select>
                        ) : (
                          <span className={`text-xs px-2 py-0.5 rounded ${roleInfo.color}`}>
                            {roleInfo.label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-muted">Lv.{user.level}</span>
                        <span className="text-xs text-muted/50 ml-1">({user.points}分)</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted">{user._count.posts}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted">
                        {user._count.forumPosts + user._count.forumReplies}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted text-xs">
                        {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setEditingId(user.id)}
                          className="p-1.5 text-muted hover:text-foreground hover:bg-white/5 rounded transition-colors cursor-pointer"
                          title="修改角色"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted">第 {page}/{totalPages} 页</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded hover:bg-white/5 text-muted disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded hover:bg-white/5 text-muted disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
