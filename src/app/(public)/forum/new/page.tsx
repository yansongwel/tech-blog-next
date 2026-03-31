"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { NovelEditor } from "@/components/editor";

interface ForumCategory {
  id: string;
  name: string;
  slug: string;
}

export default function NewForumPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const editorContentRef = useRef("");
  const handleEditorChange = useCallback((html: string) => {
    editorContentRef.current = html;
  }, []);

  useEffect(() => {
    fetch("/api/forum/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("请输入标题");
      return;
    }
    if (!categoryId) {
      setError("请选择版块");
      return;
    }
    const content = editorContentRef.current;
    if (!content || content === "<p></p>") {
      setError("请输入内容");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/forum/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          categoryId,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (res.status === 401) {
        router.push("/auth/login");
        return;
      }

      if (res.ok) {
        const post = await res.json();
        router.push(`/forum/post/${post.slug}`);
      } else {
        const data = await res.json();
        setError(data.error || "发帖失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/forum"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-4 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> 返回论坛
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-6">发布新帖</h1>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Title */}
        <input
          type="text"
          placeholder="帖子标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-lg font-semibold placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
        />

        {/* Category + Tags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="px-3 py-2.5 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="">选择版块</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="标签（用逗号分隔，可选）"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="px-3 py-2.5 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
          />
        </div>

        {/* Editor */}
        <NovelEditor
          onChange={handleEditorChange}
          placeholder="输入 / 打开命令菜单，描述你的问题或分享..."
        />

        {/* Submit */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-light text-white rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {submitting ? "发布中..." : "发布帖子"}
          </button>
        </div>
      </div>
    </div>
  );
}
