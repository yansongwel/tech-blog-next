"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, FolderTree, Pencil, X, Check, ChevronRight } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  children: { id: string; name: string; slug: string; description: string | null; sortOrder: number }[];
  _count: { posts: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", sortOrder: 0 });
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchCategories = () => {
    setLoading(true);
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const resetForm = () => {
    setForm({ name: "", slug: "", description: "", sortOrder: 0 });
    setShowForm(false);
    setEditingId(null);
    setParentId(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const body = editingId
        ? { id: editingId, ...form }
        : { ...form, parentId };
      const res = await fetch("/api/admin/categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        resetForm();
        fetchCategories();
      } else {
        const data = await res.json();
        alert(data.error || "保存失败");
      }
    } catch { alert("网络错误"); }
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定删除分类「${name}」？`)) return;
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchCategories();
      else {
        const data = await res.json();
        alert(data.error || "删除失败");
      }
    } catch { alert("网络错误"); }
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startAddChild = (parentCatId: string) => {
    resetForm();
    setParentId(parentCatId);
    setShowForm(true);
  };

  const startEdit = (cat: { id: string; name: string; slug: string; description: string | null; sortOrder: number }) => {
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || "", sortOrder: cat.sortOrder });
    setEditingId(cat.id);
    setParentId(null);
    setShowForm(true);
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">分类管理</h1>
          <p className="text-sm text-muted mt-1">管理文章分类和子分类</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg text-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> 新建分类
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass rounded-xl p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              {editingId ? "编辑分类" : parentId ? "添加子分类" : "新建分类"}
            </h2>
            <button onClick={resetForm} className="p-1 text-muted hover:text-foreground cursor-pointer"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">名称 *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || e.target.value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-") })} placeholder="分类名称" className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Slug</label>
              <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="url-slug" className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">描述</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="分类描述" className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">排序</label>
              <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:border-primary text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={resetForm} className="px-4 py-2 text-sm text-muted hover:text-foreground border border-border rounded-lg cursor-pointer">取消</button>
            <button onClick={handleSave} disabled={saving || !form.name} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-light disabled:opacity-50 text-white rounded-lg text-sm cursor-pointer">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              保存
            </button>
          </div>
        </div>
      )}

      {/* Categories list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : categories.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <FolderTree className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-muted">暂无分类</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id}>
              <div className="glass rounded-xl p-4 flex items-center gap-3">
                {cat.children.length > 0 ? (
                  <button onClick={() => toggleExpand(cat.id)} className="p-1 text-muted hover:text-foreground cursor-pointer">
                    <ChevronRight className={`w-4 h-4 transition-transform ${expanded.has(cat.id) ? "rotate-90" : ""}`} />
                  </button>
                ) : <div className="w-6" />}
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {cat.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{cat.name}</span>
                    <span className="text-xs text-muted">/{cat.slug}</span>
                    <span className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary-light rounded">{cat._count.posts} 篇</span>
                  </div>
                  {cat.description && <p className="text-xs text-muted mt-0.5">{cat.description}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => startAddChild(cat.id)} className="p-1.5 text-muted hover:text-accent hover:bg-accent/10 rounded-lg cursor-pointer" title="添加子分类">
                    <Plus className="w-4 h-4" />
                  </button>
                  <button onClick={() => startEdit(cat)} className="p-1.5 text-muted hover:text-primary-light hover:bg-primary/10 rounded-lg cursor-pointer" title="编辑">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(cat.id, cat.name)} className="p-1.5 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer" title="删除">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {/* Children */}
              {expanded.has(cat.id) && cat.children.length > 0 && (
                <div className="ml-8 mt-1 space-y-1 animate-fade-in">
                  {cat.children.map((child) => (
                    <div key={child.id} className="glass rounded-lg p-3 flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-surface flex items-center justify-center text-muted text-xs font-bold shrink-0">
                        {child.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-foreground">{child.name}</span>
                        <span className="text-xs text-muted ml-2">/{child.slug}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => startEdit(child)} className="p-1 text-muted hover:text-primary-light hover:bg-primary/10 rounded cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(child.id, child.name)} className="p-1 text-muted hover:text-red-400 hover:bg-red-500/10 rounded cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
