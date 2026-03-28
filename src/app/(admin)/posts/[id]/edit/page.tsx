"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Upload, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { all, createLowlight } from "lowlight";
import { useRouter, useParams } from "next/navigation";

const lowlight = createLowlight(all);

interface Category {
  id: string;
  name: string;
  slug: string;
  children?: { id: string; name: string; slug: string }[];
}

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  categoryId: string;
  status: string;
  isLocked: boolean;
  tags: { tag: { name: string; slug: string } }[];
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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      ImageExtension,
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: "plaintext" }),
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

  // Fetch post data and categories
  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/posts`).then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ])
      .then(([postsData, catsData]) => {
        const post = (postsData.posts as Post[])?.find((p) => p.id === postId);
        if (post) {
          setTitle(post.title);
          setExcerpt(post.excerpt || "");
          setCategoryId(post.categoryId);
          setIsLocked(post.isLocked);
          setCurrentStatus(post.status);
          setTags(post.tags?.map((t) => t.tag.name).join(", ") || "");
          editor?.commands.setContent(post.content);
        }
        if (Array.isArray(catsData)) setCategories(catsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId, editor]);

  const handleSave = async (status: "DRAFT" | "PUBLISHED") => {
    if (!title.trim()) { setError("请输入文章标题"); return; }
    if (!categoryId) { setError("请选择分类"); return; }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: postId,
          title,
          content: editor?.getHTML() || "",
          excerpt: excerpt || null,
          categoryId,
          status,
          isLocked,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
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
          <Link href="/posts" className="p-2 text-muted hover:text-foreground hover:bg-white/5 rounded-lg cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">编辑文章</h1>
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

          <div className="glass rounded-xl overflow-hidden">
            {editor && (
              <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-surface/50 flex-wrap">
                <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>B</ToolbarButton>
                <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>I</ToolbarButton>
                <ToolbarButton active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>S</ToolbarButton>
                <span className="w-px h-5 bg-border mx-1" />
                <ToolbarButton active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolbarButton>
                <ToolbarButton active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</ToolbarButton>
                <span className="w-px h-5 bg-border mx-1" />
                <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>UL</ToolbarButton>
                <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>OL</ToolbarButton>
                <ToolbarButton active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>Code</ToolbarButton>
                <ToolbarButton active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>Quote</ToolbarButton>
                <span className="w-px h-5 bg-border mx-1" />
                <ToolbarButton active={false} onClick={() => { const url = prompt("输入图片 URL:"); if (url) editor.chain().focus().setImage({ src: url }).run(); }}>Img</ToolbarButton>
              </div>
            )}
            {editor ? (
              <EditorContent editor={editor} />
            ) : (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-3">分类</h3>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:border-primary cursor-pointer">
              <option value="">选择分类</option>
              {allCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.isChild ? `  └ ${cat.name}` : cat.name}</option>
              ))}
            </select>
          </div>

          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-3">标签</h3>
            <input type="text" placeholder="用逗号分隔多个标签" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary text-sm" />
          </div>

          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-3">摘要</h3>
            <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="文章摘要（可选）" rows={3} className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary text-sm resize-none" />
          </div>

          <div className="glass rounded-xl p-5">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-semibold text-foreground">微信解锁</span>
              <div className={`relative w-10 h-5 rounded-full transition-colors ${isLocked ? "bg-primary" : "bg-border"}`} onClick={() => setIsLocked(!isLocked)}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isLocked ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`px-2 py-1 text-xs rounded transition-colors cursor-pointer ${active ? "bg-primary/20 text-primary-light" : "text-muted hover:text-foreground hover:bg-white/5"}`}>
      {children}
    </button>
  );
}
