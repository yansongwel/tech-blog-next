"use client";

import { useEffect, useState } from "react";
import { Trash2, Loader2, Tag, Pencil, X, Check, Hash } from "lucide-react";
import { useToast } from "@/components/admin/Toast";
import ConfirmModal from "@/components/admin/ConfirmModal";

interface TagItem {
  id: string;
  name: string;
  slug: string;
  _count: { posts: number };
}

export default function TagsPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const [confirmModal, setConfirmModal] = useState<{open: boolean; title: string; message: string; onConfirm: () => void}>({open: false, title: "", message: "", onConfirm: () => {}});

  const fetchTags = () => {
    setLoading(true);
    fetch("/api/admin/tags")
      .then((r) => r.json())
      .then((data) => setTags(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { fetchTags(); }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/tags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editName.trim() }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchTags();
        toast.success("重命名成功");
      } else {
        const data = await res.json();
        toast.error(data.error || "重命名失败");
      }
    } catch { toast.error("网络错误"); }
    setSaving(false);
  };

  const handleDelete = (id: string, name: string, postCount: number) => {
    setConfirmModal({
      open: true,
      title: "删除标签",
      message: postCount > 0
        ? `标签「${name}」关联了 ${postCount} 篇文章，删除后将从这些文章中移除。确认删除？`
        : `确定删除标签「${name}」？`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/tags?id=${id}`, { method: "DELETE" });
          if (res.ok) { fetchTags(); toast.success("删除成功"); }
          else toast.error("删除失败");
        } catch { toast.error("网络错误"); }
      },
    });
  };

  const totalPosts = tags.reduce((sum, t) => sum + t._count.posts, 0);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">标签管理</h1>
        <p className="text-sm text-muted mt-1">
          共 {tags.length} 个标签，关联 {totalPosts} 篇文章
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : tags.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Tag className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-muted">暂无标签</p>
          <p className="text-xs text-muted mt-1">标签在创建文章时自动生成</p>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-sm text-muted">
                <th className="text-left px-5 py-3 font-medium">标签名</th>
                <th className="text-left px-5 py-3 font-medium">Slug</th>
                <th className="text-center px-5 py-3 font-medium">文章数</th>
                <th className="text-right px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.id} className="border-b border-border/30 hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3">
                    {editingId === tag.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleRename(tag.id); if (e.key === "Escape") setEditingId(null); }}
                          className="px-2 py-1 bg-surface border border-primary rounded text-sm text-foreground focus:outline-none w-32"
                          autoFocus
                        />
                        <button onClick={() => handleRename(tag.id)} disabled={saving} className="p-1 text-green-400 hover:bg-green-500/10 rounded cursor-pointer">
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-muted hover:text-foreground rounded cursor-pointer">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="flex items-center gap-2 text-sm text-foreground">
                        <Hash className="w-3.5 h-3.5 text-primary-light" />
                        {tag.name}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted font-mono">{tag.slug}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${tag._count.posts > 0 ? "bg-primary/10 text-primary-light" : "bg-surface text-muted"}`}>
                      {tag._count.posts}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditingId(tag.id); setEditName(tag.name); }}
                        className="p-1.5 text-muted hover:text-primary-light hover:bg-primary/10 rounded-lg cursor-pointer"
                        title="重命名"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tag.id, tag.name, tag._count.posts)}
                        className="p-1.5 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer"
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmModal open={confirmModal.open} title={confirmModal.title} message={confirmModal.message} danger onConfirm={() => { confirmModal.onConfirm(); setConfirmModal(prev => ({...prev, open: false})); }} onCancel={() => setConfirmModal(prev => ({...prev, open: false}))} />
    </div>
  );
}
