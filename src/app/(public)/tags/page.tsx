"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { Tag, Hash, ArrowLeft, Eye, Heart, Clock } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface TagItem {
  id: string;
  name: string;
  slug: string;
  _count: { posts: number };
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  viewCount: number;
  publishedAt: string;
  category: { name: string; slug: string };
  _count: { likes: number; comments: number };
}

// Color palette for tag cloud
const tagColors = [
  "from-primary to-accent",
  "from-pink-500 to-rose-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-violet-500 to-purple-500",
  "from-cyan-500 to-blue-500",
  "from-red-500 to-pink-500",
  "from-sky-500 to-indigo-500",
];

export default function TagsPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-20 text-center text-muted">加载中...</div>}>
      <TagsContent />
    </Suspense>
  );
}

function TagsContent() {
  const searchParams = useSearchParams();
  const activeSlug = searchParams.get("slug");
  const [tags, setTags] = useState<TagItem[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTag, setActiveTag] = useState<{ name: string; slug: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTags(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!activeSlug) { setPosts([]); setActiveTag(null); return; }
    setLoading(true);
    fetch(`/api/tags?slug=${activeSlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.tag) setActiveTag(data.tag);
        if (data.posts) setPosts(data.posts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeSlug]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const maxCount = Math.max(...tags.map((t) => t._count.posts), 1);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2 flex items-center gap-3">
          <Tag className="w-8 h-8" />
          {activeTag ? `# ${activeTag.name}` : "标签云"}
        </h1>
        <p className="text-muted">
          {activeTag
            ? `共 ${posts.length} 篇相关文章`
            : `共 ${tags.length} 个标签`}
        </p>
      </div>

      {activeTag ? (
        <>
          <Link
            href="/tags"
            className="inline-flex items-center gap-1.5 text-sm text-primary-light hover:text-primary mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> 返回标签云
          </Link>

          <div className="space-y-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="block glass rounded-xl p-5 card-hover cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary-light transition-colors line-clamp-1">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-muted mt-1 line-clamp-2">{post.excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary-light rounded-md">{post.category.name}</span>
                      <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{post.viewCount}</span>
                      <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{post._count.likes}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(post.publishedAt).toLocaleDateString("zh-CN")}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {posts.length === 0 && !loading && (
              <div className="text-center py-16 text-muted glass rounded-xl">暂无文章</div>
            )}
          </div>
        </>
      ) : (
        <div className="glass rounded-2xl p-8">
          {loading ? (
            <div className="text-center py-16 text-muted">加载中...</div>
          ) : tags.length === 0 ? (
            <div className="text-center py-16 text-muted">暂无标签</div>
          ) : (
            <div className="flex flex-wrap gap-3 justify-center">
              {tags.map((tag, i) => {
                const size = 0.8 + (tag._count.posts / maxCount) * 0.8;
                const color = tagColors[i % tagColors.length];
                return (
                  <Link
                    key={tag.id}
                    href={`/tags?slug=${tag.slug}`}
                    className="group cursor-pointer"
                    style={{ fontSize: `${size}rem` }}
                  >
                    <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r ${color} bg-opacity-10 border border-transparent hover:border-primary/30 text-foreground hover:text-white transition-all hover:scale-110 hover:shadow-lg hover:shadow-primary/20`}>
                      <Hash className="w-3.5 h-3.5 opacity-60" />
                      {tag.name}
                      <span className="text-xs opacity-60">({tag._count.posts})</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
