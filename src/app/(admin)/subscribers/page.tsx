"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Mail, Loader2, Search, Trash2, Plus, Download, CheckSquare, Square,
  ChevronLeft, ChevronRight, UserCheck, UserX, Users, X,
} from "lucide-react";
import { useToast } from "@/components/admin/Toast";
import ConfirmModal from "@/components/admin/ConfirmModal";

interface Subscriber {
  id: string;
  email: string;
  confirmed: boolean;
  createdAt: string;
}

interface Stats {
  total: number;
  confirmed: number;
  unconfirmed: number;
  confirmRate: number;
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const toast = useToast();
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({
    open: false, title: "", message: "", onConfirm: () => {},
  });

  const fetchSubscribers = useCallback((p?: number, status?: string, search?: string) => {
    setLoading(true);
    const currentPage = p ?? page;
    const currentStatus = status ?? statusFilter;
    const currentSearch = search ?? searchQuery;
    const params = new URLSearchParams({ page: String(currentPage), limit: "20" });
    if (currentStatus) params.set("status", currentStatus);
    if (currentSearch) params.set("search", currentSearch);

    fetch(`/api/admin/subscribers?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setSubscribers(data.subscribers || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotal(data.pagination?.total || 0);
        if (data.stats) setStats(data.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, statusFilter, searchQuery]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { fetchSubscribers(); }, [fetchSubscribers]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchSubscribers(1, undefined, searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchSubscribers]);

  const handleDelete = (id: string, email: string) => {
    setConfirmModal({
      open: true,
      title: "删除订阅者",
      message: `确定删除「${email}」的订阅？`,
      onConfirm: async () => {
        await fetch(`/api/admin/subscribers?id=${id}`, { method: "DELETE" });
        toast.success("已删除");
        fetchSubscribers();
      },
    });
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    setConfirmModal({
      open: true,
      title: "批量删除",
      message: `确定删除 ${selectedIds.size} 个订阅者？`,
      onConfirm: async () => {
        await fetch(`/api/admin/subscribers?ids=${Array.from(selectedIds).join(",")}`, { method: "DELETE" });
        toast.success(`已删除 ${selectedIds.size} 个订阅者`);
        setSelectedIds(new Set());
        fetchSubscribers();
      },
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === subscribers.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(subscribers.map((s) => s.id)));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });
      if (res.ok) {
        toast.success("添加成功");
        setNewEmail("");
        setShowAddForm(false);
        fetchSubscribers();
      } else {
        const data = await res.json();
        toast.error(data.error || "添加失败");
      }
    } catch { toast.error("网络错误"); }
    setAdding(false);
  };

  const exportCSV = () => {
    const rows = ["邮箱,状态,订阅时间"];
    subscribers.forEach((s) => {
      rows.push(`"${s.email}","${s.confirmed ? "已确认" : "未确认"}","${new Date(s.createdAt).toLocaleDateString("zh-CN")}"`);
    });
    const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("导出成功");
  };

  const STAT_CARDS = [
    { label: "总订阅", value: stats?.total ?? 0, icon: Users, color: "text-primary-light" },
    { label: "已确认", value: stats?.confirmed ?? 0, icon: UserCheck, color: "text-emerald-400" },
    { label: "未确认", value: stats?.unconfirmed ?? 0, icon: UserX, color: "text-amber-400" },
    { label: "确认率", value: `${stats?.confirmRate ?? 0}%`, icon: Mail, color: "text-cyan-400" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">订阅管理</h1>
          <p className="text-sm text-muted mt-1">共 {stats?.total ?? 0} 位订阅者</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 bg-surface border border-border hover:bg-white/5 text-foreground rounded-lg text-sm transition-colors cursor-pointer">
            <Download className="w-4 h-4" /> 导出 CSV
          </button>
          <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg text-sm transition-colors cursor-pointer">
            <Plus className="w-4 h-4" /> 手动添加
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {STAT_CARDS.map((card) => (
            <div key={card.label} className="glass rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted">{card.label}</p>
                  <p className="text-xl font-bold text-foreground">{card.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="glass rounded-xl p-4 mb-4 flex items-center gap-3 animate-fade-in">
          <Mail className="w-5 h-5 text-muted shrink-0" />
          <input
            type="email"
            placeholder="输入邮箱地址..."
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
          />
          <button type="submit" disabled={adding} className="px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg text-sm cursor-pointer disabled:opacity-50">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : "添加"}
          </button>
          <button type="button" onClick={() => setShowAddForm(false)} className="p-2 text-muted hover:text-foreground cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <div className="flex gap-1.5">
          {[
            { key: "", label: "全部" },
            { key: "confirmed", label: "已确认" },
            { key: "unconfirmed", label: "未确认" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => { setStatusFilter(f.key); setPage(1); }}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all cursor-pointer ${
                statusFilter === f.key
                  ? "bg-primary text-white"
                  : "bg-surface text-muted hover:text-foreground border border-border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="搜索邮箱..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary w-full sm:w-56"
          />
        </div>
      </div>

      {/* Batch Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 glass rounded-lg animate-fade-in">
          <span className="text-sm text-foreground">已选 {selectedIds.size}</span>
          <button onClick={handleBatchDelete} className="px-3 py-1 text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg cursor-pointer">批量删除</button>
          <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1 text-xs text-muted hover:text-foreground cursor-pointer">取消选择</button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : subscribers.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Mail className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-muted">暂无订阅者</p>
        </div>
      ) : (
        <>
          <div className="glass rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-3 w-10">
                    <button onClick={toggleSelectAll} className="cursor-pointer text-muted hover:text-foreground">
                      {selectedIds.size === subscribers.length ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <th className="p-3 text-muted font-medium">邮箱</th>
                  <th className="p-3 text-muted font-medium hidden sm:table-cell">状态</th>
                  <th className="p-3 text-muted font-medium hidden md:table-cell">订阅时间</th>
                  <th className="p-3 text-muted font-medium w-20">操作</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub) => (
                  <tr key={sub.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                    <td className="p-3">
                      <button onClick={() => toggleSelect(sub.id)} className="cursor-pointer text-muted hover:text-foreground">
                        {selectedIds.has(sub.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="p-3">
                      <span className="text-foreground font-mono text-xs">{sub.email}</span>
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        sub.confirmed
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {sub.confirmed ? "已确认" : "未确认"}
                      </span>
                    </td>
                    <td className="p-3 hidden md:table-cell text-muted text-xs">
                      {new Date(sub.createdAt).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleDelete(sub.id, sub.email)}
                        className="p-1.5 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted">
                第 {page}/{totalPages} 页，共 {total} 条
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 text-muted hover:text-foreground disabled:opacity-30 cursor-pointer rounded-lg hover:bg-white/5"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 text-muted hover:text-foreground disabled:opacity-30 cursor-pointer rounded-lg hover:bg-white/5"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        danger
        onConfirm={() => { confirmModal.onConfirm(); setConfirmModal((prev) => ({ ...prev, open: false })); }}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
