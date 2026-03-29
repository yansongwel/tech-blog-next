"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, Link2, GripVertical, Eye, EyeOff, Pencil, X, Check } from "lucide-react";
import { useToast } from "@/components/admin/Toast";
import ConfirmModal from "@/components/admin/ConfirmModal";

interface FriendLink {
  id: string;
  name: string;
  url: string;
  description: string | null;
  logo: string | null;
  sortOrder: number;
  visible: boolean;
}

export default function FriendLinksPage() {
  const [links, setLinks] = useState<FriendLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", url: "", description: "", logo: "", sortOrder: 0 });
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const [confirmModal, setConfirmModal] = useState<{open: boolean, title: string, message: string, onConfirm: () => void}>({open: false, title: "", message: "", onConfirm: () => {}});

  const fetchLinks = () => {
    setLoading(true);
    fetch("/api/admin/friend-links")
      .then((res) => res.json())
      .then((data) => setLinks(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { fetchLinks(); }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const resetForm = () => {
    setForm({ name: "", url: "", description: "", logo: "", sortOrder: 0 });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.url.trim()) return;
    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const body = editingId ? { id: editingId, ...form } : form;
      const res = await fetch("/api/admin/friend-links", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        resetForm();
        fetchLinks();
        toast.success("保存成功");
      } else {
        toast.error("保存失败");
      }
    } catch { toast.error("网络错误"); }
    setSaving(false);
  };

  const handleEdit = (link: FriendLink) => {
    setForm({
      name: link.name,
      url: link.url,
      description: link.description || "",
      logo: link.logo || "",
      sortOrder: link.sortOrder,
    });
    setEditingId(link.id);
    setShowForm(true);
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmModal({
      open: true,
      title: "删除友链",
      message: `确定删除友链「${name}」？`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/friend-links?id=${id}`, { method: "DELETE" });
          if (res.ok) fetchLinks();
          else toast.error("删除失败");
        } catch { toast.error("网络错误"); }
      },
    });
  };

  const handleToggleVisible = async (link: FriendLink) => {
    await fetch("/api/admin/friend-links", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: link.id, visible: !link.visible }),
    });
    fetchLinks();
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">友情链接</h1>
          <p className="text-sm text-muted mt-1">管理站点友情链接，显示在页面底部</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg text-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> 添加友链
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="glass rounded-xl p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">{editingId ? "编辑友链" : "添加友链"}</h2>
            <button onClick={resetForm} className="p-1 text-muted hover:text-foreground cursor-pointer"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">名称 *</label>
              <input
                type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="站点名称"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">链接 *</label>
              <input
                type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://example.com"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">描述</label>
              <input
                type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="简短描述"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Logo URL</label>
              <input
                type="text" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">排序</label>
              <input
                type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:border-primary text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={resetForm} className="px-4 py-2 text-sm text-muted hover:text-foreground border border-border rounded-lg cursor-pointer">取消</button>
            <button onClick={handleSave} disabled={saving || !form.name || !form.url} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-light disabled:opacity-50 text-white rounded-lg text-sm cursor-pointer">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      )}

      {/* Links list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : links.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Link2 className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-muted">暂无友链</p>
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((link) => (
            <div key={link.id} className={`glass rounded-xl p-4 flex items-center gap-4 ${!link.visible ? "opacity-50" : ""}`}>
              <GripVertical className="w-4 h-4 text-muted shrink-0" />
              {link.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={link.logo} alt={link.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {link.name[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{link.name}</span>
                  <span className="text-xs text-muted truncate">{link.url}</span>
                </div>
                {link.description && <p className="text-xs text-muted mt-0.5">{link.description}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleToggleVisible(link)} className="p-1.5 text-muted hover:text-foreground hover:bg-white/5 rounded-lg cursor-pointer" title={link.visible ? "隐藏" : "显示"}>
                  {link.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => handleEdit(link)} className="p-1.5 text-muted hover:text-primary-light hover:bg-primary/10 rounded-lg cursor-pointer" title="编辑">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(link.id, link.name)} className="p-1.5 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer" title="删除">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmModal open={confirmModal.open} title={confirmModal.title} message={confirmModal.message} danger onConfirm={() => { confirmModal.onConfirm(); setConfirmModal(prev => ({...prev, open: false})); }} onCancel={() => setConfirmModal(prev => ({...prev, open: false}))} />
    </div>
  );
}
