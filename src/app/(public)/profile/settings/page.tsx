"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Upload, User } from "lucide-react";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [github, setGithub] = useState("");
  const [avatar, setAvatar] = useState("");
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Load session + profile via API (no SessionProvider needed)
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((session) => {
        if (cancelled) return;
        if (!session?.user) {
          router.push("/auth/login");
          return;
        }
        const uname = session.user.username;
        if (!uname) {
          setLoading(false);
          return;
        }
        setUsername(uname);
        return fetch(`/api/users/${encodeURIComponent(uname)}`);
      })
      .then((r) => r?.ok ? r.json() : null)
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setName(data.name || "");
          setBio(data.bio || "");
          setWebsite(data.website || "");
          setGithub(data.github || "");
          setAvatar(data.avatar || "");
        }
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/users/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio, website, github }),
    });

    if (res.ok) {
      setMessage("保存成功");
      setTimeout(() => setMessage(""), 3000);
    } else {
      setMessage("保存失败");
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/users/avatar", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      setAvatar(data.url);
    }
    setUploading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <User className="w-6 h-6" /> 编辑个人资料
      </h1>

      <div className="glass rounded-2xl p-6 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl text-primary-light font-bold overflow-hidden shrink-0">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="头像" className="w-full h-full object-cover" />
            ) : (
              (username || "U")[0]?.toUpperCase()
            )}
          </div>
          <label className="flex items-center gap-2 px-4 py-2 bg-surface border border-border hover:bg-white/5 text-foreground rounded-lg text-sm transition-colors cursor-pointer">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "上传中..." : "更换头像"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarUpload(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1.5">显示名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="你希望别人怎么称呼你"
            maxLength={50}
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1.5">个人简介</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="用一两句话介绍自己"
            maxLength={200}
            rows={3}
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary resize-none"
          />
          <p className="text-xs text-muted mt-1">{bio.length}/200</p>
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1.5">个人网站</label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://your-website.com"
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
          />
        </div>

        {/* GitHub */}
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1.5">GitHub 用户名</label>
          <input
            type="text"
            value={github}
            onChange={(e) => setGithub(e.target.value)}
            placeholder="your-github-username"
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
          />
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-light text-white rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "保存中..." : "保存修改"}
          </button>
          {message && (
            <span className={`text-sm ${message === "保存成功" ? "text-green-400" : "text-red-400"}`}>
              {message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
