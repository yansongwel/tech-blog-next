"use client";

import { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";

const settingsFields = [
  { key: "site_name", label: "站点名称", placeholder: "TechBlog", type: "text" },
  { key: "site_description", label: "站点描述", placeholder: "探索技术的无限可能", type: "text" },
  { key: "author_name", label: "博主名称", placeholder: "TechBlog 博主", type: "text" },
  { key: "author_bio", label: "博主简介", placeholder: "资深 SRE / DBA 工程师", type: "textarea" },
  { key: "github_url", label: "GitHub 链接", placeholder: "https://github.com/...", type: "text" },
  { key: "email", label: "联系邮箱", placeholder: "admin@example.com", type: "text" },
  { key: "wechat_qr_url", label: "公众号二维码 URL", placeholder: "/images/wechat-qr.png", type: "text" },
  { key: "icp_number", label: "ICP 备案号", placeholder: "京ICP备XXXXXXXX号", type: "text" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) setSettings(data);
      })
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
    } catch {}
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

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
        <h1 className="text-2xl font-bold text-foreground">站点设置</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-light disabled:opacity-50 text-white rounded-lg text-sm transition-colors cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saving ? "保存中..." : saved ? "已保存" : "保存设置"}
        </button>
      </div>

      <div className="glass rounded-xl p-6 space-y-6">
        {settingsFields.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-foreground mb-2">
              {field.label}
            </label>
            {field.type === "textarea" ? (
              <textarea
                value={settings[field.key] || ""}
                onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                rows={3}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors resize-none"
              />
            ) : (
              <input
                type="text"
                value={settings[field.key] || ""}
                onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
