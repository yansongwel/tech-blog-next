"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, Check } from "lucide-react";

const THEMES = [
  { key: "theme-dark-indigo", label: "暗夜靛蓝", colors: ["#6366f1", "#06b6d4", "#0a0a0f"] },
  { key: "theme-dark-emerald", label: "暗夜翡翠", colors: ["#10b981", "#06b6d4", "#050f0a"] },
  { key: "theme-dark-rose", label: "暗夜玫瑰", colors: ["#f43f5e", "#e879f9", "#0f0508"] },
  { key: "theme-dark-amber", label: "暗夜琥珀", colors: ["#f59e0b", "#f97316", "#0f0a05"] },
  { key: "theme-light", label: "浅色模式", colors: ["#4f46e5", "#0891b2", "#f8fafc"] },
];

interface FieldDef {
  key: string;
  label: string;
  placeholder: string;
  type: "text" | "textarea" | "url" | "email";
}

const settingsSections: { title: string; description: string; fields: FieldDef[] }[] = [
  {
    title: "站点信息",
    description: "基本站点标识和描述",
    fields: [
      { key: "site_name", label: "站点名称", placeholder: "TechBlog", type: "text" },
      { key: "site_logo", label: "Logo 文字", placeholder: "T", type: "text" },
      { key: "site_description", label: "站点描述", placeholder: "探索技术的无限可能", type: "text" },
      { key: "site_subtitle", label: "副标题", placeholder: "深耕技术领域...", type: "text" },
      { key: "site_start_date", label: "建站日期", placeholder: "2026-01-01", type: "text" },
    ],
  },
  {
    title: "博主信息",
    description: "关于页面和个人简介",
    fields: [
      { key: "author_name", label: "博主名称", placeholder: "TechBlog 博主", type: "text" },
      { key: "author_bio", label: "博主简介", placeholder: "资深 SRE / DBA 工程师", type: "textarea" },
      { key: "author_avatar", label: "头像文字", placeholder: "Dev", type: "text" },
      { key: "author_skills", label: "技能标签", placeholder: "Kubernetes,Docker,MySQL (逗号分隔)", type: "text" },
    ],
  },
  {
    title: "社交与联系",
    description: "链接和联系方式",
    fields: [
      { key: "github_url", label: "GitHub 链接", placeholder: "https://github.com/...", type: "url" },
      { key: "email", label: "联系邮箱", placeholder: "admin@example.com", type: "email" },
      { key: "wechat_qr_url", label: "公众号二维码 URL", placeholder: "/images/wechat-qr.png", type: "url" },
    ],
  },
  {
    title: "其他配置",
    description: "音乐和备案信息",
    fields: [
      { key: "music_url", label: "背景音乐 URL", placeholder: "https://example.com/music.mp3", type: "url" },
      { key: "icp_number", label: "ICP 备案号", placeholder: "京ICP备XXXXXXXX号", type: "text" },
    ],
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => { if (data && !data.error) setSettings(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) setSaved(true);
      else alert("保存失败，请重试");
    } catch { alert("网络错误，请重试"); }
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateField = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">站点设置</h1>
          <p className="text-sm text-muted mt-1">管理站点外观和内容配置</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-light disabled:opacity-50 text-white rounded-lg text-sm transition-colors cursor-pointer"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? "保存中..." : saved ? "已保存" : "保存设置"}
        </button>
      </div>

      {/* Theme Selector */}
      <div className="glass rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">主题外观</h2>
        <p className="text-sm text-muted mb-4">选择站点配色方案</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {THEMES.map((theme) => {
            const isActive = (settings.theme_name || "theme-dark-indigo") === theme.key;
            return (
              <button
                key={theme.key}
                onClick={() => updateField("theme_name", theme.key)}
                className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  isActive
                    ? "border-primary shadow-lg shadow-primary/20 scale-105"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex gap-1 mb-3 justify-center">
                  {theme.colors.map((color, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border border-white/10"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <p className="text-xs text-center text-foreground font-medium">{theme.label}</p>
                {isActive && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings Sections */}
      {settingsSections.map((section) => (
        <div key={section.title} className="glass rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">{section.title}</h2>
          <p className="text-sm text-muted mb-5">{section.description}</p>
          <div className="space-y-5">
            {section.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {field.label}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    value={settings[field.key] || ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                ) : (
                  <input
                    type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
                    value={settings[field.key] || ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
