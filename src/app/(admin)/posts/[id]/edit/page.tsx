"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Save, Upload, Loader2, FileUp } from "lucide-react";
import { marked } from "marked";
import { importHtmlDocument, importMarkdownDocument } from "@/lib/importDocument";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { NovelEditor } from "@/components/editor";

interface Category {
  id: string;
  name: string;
  slug: string;
  children?: { id: string; name: string; slug: string }[];
}

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState("DRAFT");
  const [initialContent, setInitialContent] = useState("");

  // Track editor content via onChange callback
  const editorContentRef = useRef("");
  const handleEditorChange = useCallback((html: string) => {
    editorContentRef.current = html;
  }, []);

  // Image upload handler for the editor
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/media", { method: "POST", body: formData });
    if (!res.ok) throw new Error("上传失败");
    const media = await res.json();
    return media.url;
  }, []);

  // Fetch post data and categories
  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/posts/${postId}`).then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ])
      .then(([post, catsData]) => {
        if (post && !post.error) {
          setTitle(post.title);
          setExcerpt(post.excerpt || "");
          setCategoryId(post.categoryId);
          setIsLocked(post.isLocked);
          setCurrentStatus(post.status);
          setTags(
            post.tags
              ?.map((t: { tag: { name: string } }) => t.tag.name)
              .join(", ") || "",
          );
          setInitialContent(post.content);
          editorContentRef.current = post.content;
        }
        if (Array.isArray(catsData)) setCategories(catsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  const handleSave = async (status: "DRAFT" | "PUBLISHED") => {
    if (!title.trim()) {
      setError("请输入文章标题");
      return;
    }
    if (!categoryId) {
      setError("请选择分类");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: postId,
          title,
          content: editorContentRef.current,
          excerpt: excerpt || null,
          categoryId,
          status,
          isLocked,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (res.ok) {
        router.push("/posts");
      } else {
        const data = await res.json();
        setError(data.error || "保存失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSaving(false);
    }
  };

  const allCategories: { id: string; name: string; isChild: boolean }[] = [];
  for (const cat of categories) {
    allCategories.push({ id: cat.id, name: cat.name, isChild: false });
    if (cat.children) {
      for (const child of cat.children) {
        allCategories.push({ id: child.id, name: child.name, isChild: true });
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/posts"
            className="p-2 text-muted hover:text-foreground hover:bg-white/5 rounded-lg cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">编辑文章</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Import button */}
          <label className="flex items-center gap-2 px-4 py-2 bg-surface border border-border hover:bg-white/5 text-foreground rounded-lg text-sm transition-colors cursor-pointer">
            <FileUp className="w-4 h-4" /> 导入
            <input
              type="file"
              accept=".md,.markdown,.txt,.html,.htm"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  const text = reader.result as string;
                  const ext = file.name.split(".").pop()?.toLowerCase();
                  let result;
                  if (ext === "html" || ext === "htm") {
                    result = importHtmlDocument(text);
                  } else {
                    result = importMarkdownDocument(text, (input) =>
                      marked.parse(input, { async: false }) as string,
                    );
                  }
                  if (result.title && !title) setTitle(result.title);
                  setInitialContent(result.content);
                  editorContentRef.current = result.content;
                };
                reader.readAsText(file);
                e.target.value = "";
              }}
            />
          </label>
          <button
            onClick={() => handleSave("DRAFT")}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border hover:bg-white/5 text-foreground rounded-lg text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "保存中..." : "存草稿"}
          </button>
          <button
            onClick={() => handleSave("PUBLISHED")}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {saving ? "发布中..." : currentStatus === "PUBLISHED" ? "更新" : "发布"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <input
            type="text"
            placeholder="文章标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-xl font-semibold placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
          />

          <NovelEditor
            content={initialContent}
            onChange={handleEditorChange}
            onImageUpload={handleImageUpload}
            placeholder="输入 / 打开命令菜单，或直接开始写作..."
          />
        </div>

        <div className="space-y-4">
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-3">分类</h3>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="">选择分类</option>
              {allCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.isChild ? `  └ ${cat.name}` : cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-3">标签</h3>
            <input
              type="text"
              placeholder="用逗号分隔多个标签"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary text-sm"
            />
          </div>

          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-3">摘要</h3>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="文章摘要（可选）"
              rows={3}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary text-sm resize-none"
            />
          </div>

          <div className="glass rounded-xl p-5">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-semibold text-foreground">微信解锁</span>
              <div
                className={`relative w-10 h-5 rounded-full transition-colors ${isLocked ? "bg-primary" : "bg-border"}`}
                onClick={() => setIsLocked(!isLocked)}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isLocked ? "translate-x-5" : "translate-x-0.5"}`}
                />
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
