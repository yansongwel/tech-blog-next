"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, Check, Monitor, MousePointer, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/admin/Toast";

const LOADING_TEMPLATES = [
  { key: "matrix", label: "黑客帝国", description: "经典矩阵代码雨", colors: ["#6366f1", "#06b6d4"] },
  { key: "cyber", label: "赛博网格", description: "六边形脉冲波纹", colors: ["#6366f1", "#818cf8"] },
  { key: "terminal", label: "终端启动", description: "模拟系统引导日志", colors: ["#22c55e", "#06b6d4"] },
  { key: "radar", label: "雷达扫描", description: "环形雷达探测动画", colors: ["#06b6d4", "#6366f1"] },
  { key: "glitch", label: "故障艺术", description: "数字噪点和扫描线", colors: ["#f43f5e", "#6366f1"] },
];

const MOUSE_SKINS = [
  { key: "indigo", label: "靛蓝星轨", colors: ["#6366f1", "#06b6d4"] },
  { key: "emerald", label: "翡翠流光", colors: ["#10b981", "#34d399"] },
  { key: "flame", label: "烈焰追踪", colors: ["#f97316", "#ef4444"] },
  { key: "starlight", label: "星光金尘", colors: ["#fbbf24", "#f59e0b"] },
  { key: "neon", label: "霓虹幻彩", colors: ["#a855f7", "#ec4899"] },
  { key: "aurora", label: "北极极光", colors: ["#22d3ee", "#10b981"] },
  { key: "sakura", label: "樱花飞舞", colors: ["#f472b6", "#fbcfe8"] },
  { key: "ocean", label: "深海之光", colors: ["#0ea5e9", "#38bdf8"] },
  { key: "cyber", label: "赛博朋克", colors: ["#00ff88", "#00c8ff"] },
  { key: "galaxy", label: "银河漫游", colors: ["#8b5cf6", "#d946ef"] },
];

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
  const [pwForm, setPwForm] = useState({ current: "", new: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const toast = useToast();

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
      if (res.ok) {
        setSaved(true);
        toast.success("保存成功");
      } else toast.error("保存失败，请重试");
    } catch { toast.error("网络错误，请重试"); }
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePasswordChange = async () => {
    if (!pwForm.current || !pwForm.new) { toast.error("请填写当前密码和新密码"); return; }
    if (pwForm.new.length < 6) { toast.error("新密码至少需要 6 个字符"); return; }
    if (pwForm.new !== pwForm.confirm) { toast.error("两次输入的新密码不一致"); return; }
    setPwSaving(true);
    try {
      const res = await fetch("/api/admin/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.new }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("密码修改成功");
        setPwForm({ current: "", new: "", confirm: "" });
      } else {
        toast.error(data.error || "修改失败");
      }
    } catch { toast.error("网络错误"); }
    setPwSaving(false);
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

      {/* Loading Template Selector */}
      <div className="glass rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
          <Monitor className="w-5 h-5 text-primary-light" /> 加载动画模板
        </h2>
        <p className="text-sm text-muted mb-4">首次访问时的加载动画样式（含访客 IP 欢迎信息）。加载完成后显示欢迎按钮，用户点击进入。</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {LOADING_TEMPLATES.map((tpl) => {
            const isActive = (settings.loading_template || "matrix") === tpl.key;
            return (
              <button
                key={tpl.key}
                onClick={() => updateField("loading_template", tpl.key)}
                className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${
                  isActive
                    ? "border-primary shadow-lg shadow-primary/20 scale-105"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex gap-1 mb-2 justify-center">
                  {tpl.colors.map((color, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border border-white/10"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <p className="text-xs text-center text-foreground font-medium">{tpl.label}</p>
                <p className="text-[10px] text-center text-muted mt-0.5">{tpl.description}</p>
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

      {/* Loading Behavior Control */}
      <div className="glass rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
          <Monitor className="w-5 h-5 text-primary-light" /> 加载页行为
        </h2>
        <p className="text-sm text-muted mb-4">控制加载完成后是否自动进入首页</p>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-surface/50 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">自动进入</p>
              <p className="text-xs text-muted mt-0.5">开启后，加载完成将在指定秒数后自动进入首页</p>
            </div>
            <button
              onClick={() => updateField("loading_auto_enter", settings.loading_auto_enter === "true" ? "false" : "true")}
              className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
                settings.loading_auto_enter === "true" ? "bg-primary" : "bg-border"
              }`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                settings.loading_auto_enter === "true" ? "translate-x-6" : ""
              }`} />
            </button>
          </div>
          {settings.loading_auto_enter === "true" && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                自动进入延迟（秒）
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.loading_duration || "10"}
                onChange={(e) => updateField("loading_duration", e.target.value)}
                className="w-32 px-4 py-2.5 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-xs text-muted mt-1">建议 5-15 秒，加载完成后开始倒计时</p>
            </div>
          )}
        </div>
      </div>

      {/* Mouse Skin Selector */}
      <div className="glass rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
          <MousePointer className="w-5 h-5 text-primary-light" /> 鼠标特效皮肤
        </h2>
        <p className="text-sm text-muted mb-4">自定义鼠标粒子轨迹和光标颜色</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {MOUSE_SKINS.map((ms) => {
            const isActive = (settings.mouse_skin || "indigo") === ms.key;
            return (
              <button
                key={ms.key}
                onClick={() => updateField("mouse_skin", ms.key)}
                className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  isActive
                    ? "border-primary shadow-lg shadow-primary/20 scale-105"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex gap-1 mb-2 justify-center">
                  {ms.colors.map((color, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border border-white/10"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <p className="text-xs text-center text-foreground font-medium">{ms.label}</p>
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

      {/* AI Character Toggle */}
      <div className="glass rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">AI 悬浮角色</h2>
            <p className="text-sm text-muted">桌面端右下角的交互式全息 AI 角色（移动端自动隐藏）</p>
          </div>
          <button
            onClick={() => updateField("dancing_character", settings.dancing_character === "off" ? "on" : "off")}
            className={`relative w-12 h-7 rounded-full transition-colors cursor-pointer ${
              settings.dancing_character === "off" ? "bg-border" : "bg-primary"
            }`}
          >
            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
              settings.dancing_character === "off" ? "left-0.5" : "left-[1.375rem]"
            }`} />
          </button>
        </div>
      </div>

      {/* Password Change */}
      <div className="glass rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary-light" /> 修改密码
        </h2>
        <p className="text-sm text-muted mb-4">修改管理员登录密码</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">当前密码</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={pwForm.current}
                onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                placeholder="输入当前密码"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">新密码</label>
            <input
              type={showPw ? "text" : "password"}
              value={pwForm.new}
              onChange={(e) => setPwForm({ ...pwForm, new: e.target.value })}
              placeholder="至少 6 个字符"
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">确认新密码</label>
            <input
              type={showPw ? "text" : "password"}
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              placeholder="再次输入新密码"
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={handlePasswordChange}
            disabled={pwSaving || !pwForm.current || !pwForm.new || !pwForm.confirm}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-light disabled:opacity-50 text-white rounded-lg text-sm transition-colors cursor-pointer"
          >
            {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            修改密码
          </button>
        </div>
      </div>
    </div>
  );
}
