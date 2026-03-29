"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Upload, Loader2, FileUp, Eye, AlertCircle } from "lucide-react";
import { marked } from "marked";
import { importHtmlDocument, importMarkdownDocument } from "@/lib/importDocument";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import LinkExtension from "@tiptap/extension-link";
import { all, createLowlight } from "lowlight";
import { useRouter } from "next/navigation";

const lowlight = createLowlight(all);

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
  const [showPreview, setShowPreview] = useState(false);
  const [coverImage, setCoverImage] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [autoSaved, setAutoSaved] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleFileImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "html" || ext === "htm") {
        const result = importHtmlDocument(text);
        if (result.title && !title) setTitle(result.title);
        if (result.excerpt && !excerpt) setExcerpt(result.excerpt);
        editor?.commands.setContent(result.content);
        setImportMsg(`已导入: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      } else {
        const result = importMarkdownDocument(text, (input) => marked.parse(input, { async: false }) as string);
        if (result.title && !title) setTitle(result.title);
        if (result.excerpt && !excerpt) setExcerpt(result.excerpt);
        editor?.commands.setContent(result.content);
        setImportMsg(`已导入: ${file.name}`);
      }
      setTimeout(() => setImportMsg(""), 4000);
    };
    reader.readAsText(file);
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      ImageExtension,
      LinkExtension.configure({ openOnClick: false }),
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: "plaintext",
      }),
    ],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none min-h-[400px] px-6 py-4 focus:outline-none text-foreground/80 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_p]:leading-relaxed [&_pre]:bg-surface [&_pre]:rounded-xl [&_pre]:p-4 [&_code]:font-mono [&_code]:text-accent-light [&_code]:text-sm [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic",
      },
    },
  });

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
        if (d.content && editor) editor.commands.setContent(d.content);
      } catch {}
    }
  }, [editor]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (!title && !editor?.getHTML()) return;
      const draft = {
        title,
        excerpt,
        categoryId,
        tags,
        content: editor?.getHTML() || "",
      };
      localStorage.setItem("post_draft", JSON.stringify(draft));
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    }, 30000);
    return () => clearInterval(timer);
  }, [title, excerpt, categoryId, tags, editor]);

  const handleSave = async (status: "DRAFT" | "PUBLISHED") => {
    if (!title.trim()) {
      setError("请输入文章标题");
      return;
    }
    if (!categoryId) {
      setError("请选择分类");
      return;
    }
    if (!editor?.getHTML() || editor.isEmpty) {
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
          content: editor.getHTML(),
          excerpt: excerpt || null,
          coverImage: coverImage || null,
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
          {autoSaved && <span className="text-xs text-green-400 ml-2">已自动保存</span>}
        </div>
        <div className="flex items-center gap-2">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main editor */}
        <div className="lg:col-span-2 space-y-4">
          <input
            type="text"
            placeholder="文章标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-xl font-semibold placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
          />

          {/* Import status */}
          {importMsg && (
            <div className="flex items-center gap-2 p-2.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg animate-fade-in">
              <AlertCircle className="w-3.5 h-3.5" /> {importMsg}
            </div>
          )}

          {/* Tiptap editor */}
          <div
            className={`glass rounded-xl overflow-hidden transition-colors ${dragOver ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
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
            {editor && (
              <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-surface/50 flex-wrap">
                <ToolbarButton
                  active={editor.isActive("bold")}
                  onClick={() => editor.chain().focus().toggleBold().run()}
                >
                  B
                </ToolbarButton>
                <ToolbarButton
                  active={editor.isActive("italic")}
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                  I
                </ToolbarButton>
                <ToolbarButton
                  active={editor.isActive("strike")}
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                >
                  S
                </ToolbarButton>
                <span className="w-px h-5 bg-border mx-1" />
                <ToolbarButton
                  active={editor.isActive("heading", { level: 2 })}
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                >
                  H2
                </ToolbarButton>
                <ToolbarButton
                  active={editor.isActive("heading", { level: 3 })}
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 3 }).run()
                  }
                >
                  H3
                </ToolbarButton>
                <span className="w-px h-5 bg-border mx-1" />
                <ToolbarButton
                  active={editor.isActive("bulletList")}
                  onClick={() =>
                    editor.chain().focus().toggleBulletList().run()
                  }
                >
                  UL
                </ToolbarButton>
                <ToolbarButton
                  active={editor.isActive("orderedList")}
                  onClick={() =>
                    editor.chain().focus().toggleOrderedList().run()
                  }
                >
                  OL
                </ToolbarButton>
                <ToolbarButton
                  active={editor.isActive("codeBlock")}
                  onClick={() =>
                    editor.chain().focus().toggleCodeBlock().run()
                  }
                >
                  Code
                </ToolbarButton>
                <ToolbarButton
                  active={editor.isActive("blockquote")}
                  onClick={() =>
                    editor.chain().focus().toggleBlockquote().run()
                  }
                >
                  Quote
                </ToolbarButton>
                <span className="w-px h-5 bg-border mx-1" />
                <ToolbarButton
                  active={false}
                  onClick={() => {
                    const url = prompt("输入链接 URL:");
                    if (url) editor.chain().focus().setLink({ href: url }).run();
                  }}
                >
                  Link
                </ToolbarButton>
                <ToolbarButton
                  active={false}
                  onClick={() => editor.chain().focus().setHorizontalRule().run()}
                >
                  HR
                </ToolbarButton>
                <ToolbarButton
                  active={false}
                  onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                >
                  Table
                </ToolbarButton>
                <span className="w-px h-5 bg-border mx-1" />
                <ToolbarButton
                  active={false}
                  onClick={() => {
                    const url = prompt("输入图片 URL:");
                    if (url) editor.chain().focus().setImage({ src: url }).run();
                  }}
                >
                  Img
                </ToolbarButton>
                <span className="w-px h-5 bg-border mx-1" />
                <label className="px-2 py-1 text-xs text-muted hover:text-foreground hover:bg-white/5 rounded transition-colors cursor-pointer flex items-center gap-1">
                  <FileUp className="w-3 h-3" /> 导入
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
              </div>
            )}
            {/* Preview toggle - admin-only, content from Tiptap editor (trusted) */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setShowPreview(false)}
                className={`px-4 py-2 text-sm transition-colors cursor-pointer ${!showPreview ? "text-primary-light border-b-2 border-primary" : "text-muted hover:text-foreground"}`}
              >
                编辑
              </button>
              <button
                onClick={() => setShowPreview(true)}
                className={`px-4 py-2 text-sm transition-colors cursor-pointer flex items-center gap-1 ${showPreview ? "text-primary-light border-b-2 border-primary" : "text-muted hover:text-foreground"}`}
              >
                <Eye className="w-3.5 h-3.5" /> 预览
              </button>
            </div>
            {showPreview ? (
              <div className="prose max-w-none px-6 py-4 min-h-[400px] text-foreground/90
                [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mt-10 [&_h1]:mb-4
                [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-border/50
                [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-3
                [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-foreground [&_h4]:mt-4 [&_h4]:mb-2
                [&_p]:leading-[1.8] [&_p]:mb-4
                [&_pre]:bg-surface [&_pre]:border [&_pre]:border-border [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:mb-4
                [&_code]:font-mono [&_code]:text-sm
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4
                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4
                [&_li]:mb-2 [&_li]:leading-[1.8]
                [&_a]:text-primary-light [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-primary/30
                [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-5 [&_blockquote]:py-3 [&_blockquote]:my-6 [&_blockquote]:not-italic [&_blockquote]:text-foreground/80 [&_blockquote]:bg-primary/5 [&_blockquote]:rounded-r-xl
                [&_table]:w-full [&_table]:border-collapse [&_table]:mb-6 [&_table]:text-sm [&_table]:overflow-hidden [&_table]:rounded-xl
                [&_th]:bg-surface [&_th]:px-4 [&_th]:py-3 [&_th]:border [&_th]:border-border [&_th]:text-foreground [&_th]:text-left [&_th]:font-semibold
                [&_td]:px-4 [&_td]:py-3 [&_td]:border [&_td]:border-border [&_td]:text-foreground/90
                [&_img]:rounded-xl [&_img]:max-w-full [&_img]:mx-auto [&_img]:my-6
                [&_hr]:border-border [&_hr]:my-8"
                dangerouslySetInnerHTML={{ __html: editor?.getHTML() || "<p class='text-muted'>暂无内容</p>" }}
              />
            ) : editor ? (
              <EditorContent editor={editor} />
            ) : (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
            {/* Word count bar */}
            {editor && (
              <div className="flex items-center justify-between px-4 py-2 border-t border-border text-xs text-muted">
                <span>{editor.storage.characterCount?.characters?.() ?? editor.getText().length} 字符</span>
                <span>约 {Math.max(1, Math.ceil((editor.getText().length) / 400))} 分钟阅读</span>
              </div>
            )}
          </div>
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
                <img src={coverImage} alt="封面图" className="w-full rounded-lg object-cover max-h-40" />
                <button
                  onClick={() => setCoverImage("")}
                  className="absolute top-2 right-2 p-1 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Loader2 className="w-3 h-3" style={{ display: "none" }} />
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
                <p className="text-xs text-muted">{uploadingCover ? "上传中..." : "点击上传封面图"}</p>
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
                      const formData = new FormData();
                      formData.append("file", file);
                      const res = await fetch("/api/admin/media", { method: "POST", body: formData });
                      if (res.ok) {
                        const media = await res.json();
                        setCoverImage(media.url);
                      } else {
                        setError("封面图上传失败");
                      }
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
                onBlur={(e) => { if (e.target.value.trim()) setCoverImage(e.target.value.trim()); }}
                onKeyDown={(e) => { if (e.key === "Enter") { const input = e.target as HTMLInputElement; if (input.value.trim()) setCoverImage(input.value.trim()); } }}
              />
            )}
          </div>

          {/* WeChat lock */}
          <div className="glass rounded-xl p-5">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-semibold text-foreground">
                微信解锁
              </span>
              <div
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  isLocked ? "bg-primary" : "bg-border"
                }`}
                onClick={() => setIsLocked(!isLocked)}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    isLocked ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </div>
            </label>
            {isLocked && (
              <p className="text-xs text-muted mt-2">
                开启后，访客需关注公众号获取验证码才能阅读全文
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-xs rounded transition-colors cursor-pointer ${
        active
          ? "bg-primary/20 text-primary-light"
          : "text-muted hover:text-foreground hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}
