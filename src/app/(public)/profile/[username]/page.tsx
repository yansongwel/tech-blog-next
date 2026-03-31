"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  MessageSquare,
  Globe,
  ExternalLink,
  Calendar,
  CheckCircle,
} from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  name?: string | null;
  avatar?: string | null;
  bio?: string | null;
  website?: string | null;
  github?: string | null;
  points: number;
  level: number;
  createdAt: string;
  votesReceived: number;
  _count: { forumPosts: number; forumReplies: number };
  recentPosts: {
    id: string;
    title: string;
    slug: string;
    voteScore: number;
    replyCount: number;
    createdAt: string;
    category: { name: string; slug: string };
  }[];
  recentReplies: {
    id: string;
    content: string;
    voteScore: number;
    isAccepted: boolean;
    createdAt: string;
    post: { title: string; slug: string };
  }[];
}

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"posts" | "replies">("posts");

  useEffect(() => {
    fetch(`/api/users/${encodeURIComponent(username)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-muted text-lg">用户不存在</p>
        <Link href="/" className="text-primary-light hover:underline mt-2 inline-block cursor-pointer">返回首页</Link>
      </div>
    );
  }

  const joinDate = new Date(user.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-3xl text-primary-light font-bold shrink-0 overflow-hidden">
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              user.username[0]?.toUpperCase()
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-foreground">{user.name || user.username}</h1>
            <p className="text-muted text-sm">@{user.username}</p>
            {user.bio && <p className="text-foreground/70 mt-2 text-sm">{user.bio}</p>}

            {/* Social links */}
            <div className="flex items-center gap-4 mt-3 justify-center sm:justify-start">
              {user.website && (
                <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-foreground text-sm flex items-center gap-1 cursor-pointer">
                  <Globe className="w-3.5 h-3.5" /> 网站
                </a>
              )}
              {user.github && (
                <a href={`https://github.com/${user.github}`} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-foreground text-sm flex items-center gap-1 cursor-pointer">
                  <ExternalLink className="w-3.5 h-3.5" /> {user.github}
                </a>
              )}
              <span className="text-muted text-sm flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {joinDate}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6 pt-6 border-t border-border">
          <StatCard label="帖子" value={user._count.forumPosts} />
          <StatCard label="回复" value={user._count.forumReplies} />
          <StatCard label="获赞" value={user.votesReceived} />
          <StatCard label="积分" value={user.points} />
          <StatCard label="等级" value={`Lv.${user.level}`} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 glass rounded-lg w-fit">
        <button
          onClick={() => setTab("posts")}
          className={`px-4 py-1.5 rounded text-sm transition-colors cursor-pointer ${tab === "posts" ? "bg-primary/15 text-primary-light" : "text-muted hover:text-foreground"}`}
        >
          帖子 ({user._count.forumPosts})
        </button>
        <button
          onClick={() => setTab("replies")}
          className={`px-4 py-1.5 rounded text-sm transition-colors cursor-pointer ${tab === "replies" ? "bg-primary/15 text-primary-light" : "text-muted hover:text-foreground"}`}
        >
          回复 ({user._count.forumReplies})
        </button>
      </div>

      {/* Content */}
      {tab === "posts" && (
        <div className="space-y-2">
          {user.recentPosts.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center text-muted">暂无帖子</div>
          ) : (
            user.recentPosts.map((post) => (
              <Link key={post.id} href={`/forum/post/${post.slug}`} className="block glass rounded-xl p-4 hover:bg-white/[0.02] transition-colors cursor-pointer">
                <h3 className="text-foreground font-medium">{post.title}</h3>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
                  <span>{post.category.name}</span>
                  <span>▲ {post.voteScore}</span>
                  <span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3" /> {post.replyCount}</span>
                  <span>{new Date(post.createdAt).toLocaleDateString("zh-CN")}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {tab === "replies" && (
        <div className="space-y-2">
          {user.recentReplies.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center text-muted">暂无回复</div>
          ) : (
            user.recentReplies.map((reply) => (
              <Link key={reply.id} href={`/forum/post/${reply.post.slug}`} className="block glass rounded-xl p-4 hover:bg-white/[0.02] transition-colors cursor-pointer">
                <p className="text-xs text-muted mb-1">
                  回复了 <span className="text-foreground/70">{reply.post.title}</span>
                  {reply.isAccepted && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 text-green-400">
                      <CheckCircle className="w-3 h-3" /> 已采纳
                    </span>
                  )}
                </p>
                <p className="text-foreground/80 text-sm line-clamp-2">{reply.content.replace(/<[^>]*>/g, "").slice(0, 150)}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
                  <span>▲ {reply.voteScore}</span>
                  <span>{new Date(reply.createdAt).toLocaleDateString("zh-CN")}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
