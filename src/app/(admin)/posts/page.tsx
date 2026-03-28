"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Eye, Loader2 } from "lucide-react";

interface Post {
  id: string;
  title: string;
  slug: string;
  status: string;
  viewCount: number;
  category: { name: string; slug: string };
  _count: { likes: number; comments: number };
  createdAt: string;
  publishedAt: string | null;
}

export default function PostsManagePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = () => {
    setLoading(true);
    fetch("/api/admin/posts")
      .then((res) => res.json())
      .then((data) => setPosts(data.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`确定要删除文章「${title}」吗？此操作不可撤销。`)) return;
    try {
      const res = await fetch(`/api/admin/posts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchPosts();
      }
    } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">文章管理</h1>
        <Link
          href="/posts/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg text-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> 新建文章
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : posts.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <p className="text-muted mb-4">暂无文章</p>
          <Link
            href="/posts/new"
            className="text-primary-light hover:text-primary cursor-pointer"
          >
            创建第一篇文章
          </Link>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-border bg-surface/50">
                <th className="px-6 py-3 font-medium">标题</th>
                <th className="px-6 py-3 font-medium">分类</th>
                <th className="px-6 py-3 font-medium">状态</th>
                <th className="px-6 py-3 font-medium">浏览</th>
                <th className="px-6 py-3 font-medium">创建时间</th>
                <th className="px-6 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-border/50 last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="px-6 py-4 text-foreground font-medium">
                    {post.title}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary-light rounded-full">
                      {post.category.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        post.status === "PUBLISHED"
                          ? "bg-green-500/10 text-green-400"
                          : post.status === "ARCHIVED"
                            ? "bg-gray-500/10 text-gray-400"
                            : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {post.status === "PUBLISHED" ? "已发布" : post.status === "ARCHIVED" ? "已归档" : "草稿"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted">{post.viewCount}</td>
                  <td className="px-6 py-4 text-muted">
                    {new Date(post.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="p-1.5 text-muted hover:text-foreground hover:bg-white/5 rounded-lg cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/posts/${post.id}/edit`}
                        className="p-1.5 text-muted hover:text-primary-light hover:bg-primary/10 rounded-lg cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id, post.title)}
                        className="p-1.5 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
