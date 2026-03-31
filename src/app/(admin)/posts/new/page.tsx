"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Save, Upload, Loader2, FileUp, AlertCircle } from "lucide-react";
import { marked } from "marked";
import { importHtmlDocument, importMarkdownDocument } from "@/lib/importDocument";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NovelEditor } from "@/components/editor";

interface Category {
  id: string;
  name: string;
  slug: string;
  children?: { id: string; name: string; slug: string }[];
}

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [lockType, setLockType] = useState<"none" | "wechat" | "password">("none");
  const [lockPassword, setLockPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [lastSaveTime, setLastSaveTime] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
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

  const handleFileImport = (file: File) => {
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
      if (result.excerpt && !excerpt) setExcerpt(result.excerpt);
      // Set content via initialContent to trigger editor update
      setInitialContent(result.content);
      editorContentRef.current = result.content;
      setImportMsg(`已导入: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      setTimeout(() => setImportMsg(""), 4000);
    };
    reader.readAsText(file);
  };

  // Fetch categories
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  // Restore draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem("post_draft");
    if (draft) {
      try {
        const d = JSON.parse(draft);
        if (d.title) setTitle(d.title);
        if (d.excerpt) setExcerpt(d.excerpt);
        if (d.categoryId) setCategoryId(d.categoryId);
        if (d.tags) setTags(d.tags);
        if (d.content) {
          setInitialContent(d.content);
          editorContentRef.current = d.content;
        }
      } catch {
        // invalid draft, ignore
      }
    }
  }, []);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (!title && !editorContentRef.current) return;
      setAutoSaveStatus("saving");
      const draft = {
        title,
        excerpt,
        categoryId,
        tags,
        content: editorContentRef.current,
      };
      localStorage.setItem("post_draft", JSON.stringify(draft));
      const now = new Date();
      setLastSaveTime(`${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`);
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus("idle"), 3000);
    }, 30000);
    return () => clearInterval(timer);
  }, [title, excerpt, categoryId, tags]);

  const handleSave = async (status: "DRAFT" | "PUBLISHED") => {
    if (!title.trim()) {
      setError("请输入文章标题");
      return;
    }
    if (!categoryId) {
      setError("请选择分类");
      return;
    }
    const content = editorContentRef.current;
    if (!content || content === "<p></p>") {
      setError("请输入文章内容");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          excerpt: excerpt || null,
          coverImage: coverImage || null,
          categoryId,
          status,
          isLocked: lockType !== "none",
          lockType,
          lockPassword: lockType === "password" ? lockPassword : null,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (res.ok) {
        localStorage.removeItem("post_draft");
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

  // Flatten categories for select
  const allCategories: { id: string; name: string; isChild: boolean }[] = [];
  for (const cat of categories) {
    allCategories.push({ id: cat.id, name: cat.name, isChild: false });
    if (cat.children) {
      for (const child of cat.children) {
        allCategories.push({ id: child.id, name: child.name, isChild: true });
      }
    }
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
          <h1 className="text-2xl font-bold text-foreground">新建文章</h1>
          {autoSaveStatus === "saving" && (
            <span className="text-xs text-muted ml-2 animate-pulse">保存中...</span>
          )}
          {autoSaveStatus === "saved" && lastSaveTime && (
            <span className="text-xs text-green-400 ml-2">已保存 {lastSaveTime}</span>
          )}
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
                if (file) handleFileImport(file);
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
            {saving ? "发布中..." : "发布"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
          {error}
        </div>
      )}
      {importMsg && (
        <div className="mb-4 flex items-center gap-2 p-2.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5" /> {importMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main editor area */}
        <div
          className={`lg:col-span-2 space-y-4 ${dragOver ? "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-xl" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file && /\.(md|markdown|txt|html|htm)$/i.test(file.name)) {
              handleFileImport(file);
            }
          }}
        >
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

        {/* Sidebar settings */}
        <div className="space-y-4">
          {/* Category */}
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

          {/* Tags */}
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

          {/* Excerpt */}
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-3">摘要</h3>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="文章摘要（可选，用于列表展示）"
              rows={3}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary text-sm resize-none"
            />
          </div>

          {/* Cover image */}
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-3">封面图</h3>
            {coverImage ? (
              <div className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImage}
                  alt="封面图"
                  className="w-full rounded-lg object-cover max-h-40"
                />
                <button
                  onClick={() => setCoverImage("")}
                  className="absolute top-2 right-2 p-1 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  &times;
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors block">
                {uploadingCover ? (
                  <Loader2 className="w-6 h-6 mx-auto text-primary mb-2 animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 mx-auto text-muted mb-2" />
                )}
                <p className="text-xs text-muted">
                  {uploadingCover ? "上传中..." : "点击上传封面图"}
                </p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingCover}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingCover(true);
                    try {
                      const url = await handleImageUpload(file);
                      setCoverImage(url);
                    } catch {
                      setError("封面图上传失败");
                    }
                    setUploadingCover(false);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
            {!coverImage && (
              <input
                type="text"
                placeholder="或粘贴图片 URL"
                className="w-full mt-2 px-3 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary text-xs"
                onBlur={(e) => {
                  if (e.target.value.trim()) setCoverImage(e.target.value.trim());
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const input = e.target as HTMLInputElement;
                    if (input.value.trim()) setCoverImage(input.value.trim());
                  }
                }}
              />
            )}
          </div>

          {/* Content Lock */}
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-3">内容解锁</h3>
            <div className="space-y-2">
              {(
                [
                  { key: "none", label: "公开", desc: "所有人可阅读" },
                  {
                    key: "wechat",
                    label: "微信解锁",
                    desc: "关注公众号获取验证码",
                  },
                  {
                    key: "password",
                    label: "密码解锁",
                    desc: "输入密码查看全文",
                  },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.key}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    lockType === opt.key
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-surface border border-transparent"
                  }`}
                >
                  <input
                    type="radio"
                    name="lockType"
                    value={opt.key}
                    checked={lockType === opt.key}
                    onChange={() => setLockType(opt.key)}
                    className="accent-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      {opt.label}
                    </span>
                    <p className="text-xs text-muted">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            {lockType === "password" && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-foreground mb-1">
                  文章密码
                </label>
                <input
                  type="text"
                  value={lockPassword}
                  onChange={(e) => setLockPassword(e.target.value)}
                  placeholder="设置阅读密码"
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary text-sm"
                />
              </div>
            )}
            {lockType === "wechat" && (
              <p className="text-xs text-muted mt-3">
                提示文案和公众号二维码在「设置 → 社交与联系」中配置
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
