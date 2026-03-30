"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, Check, Monitor, MousePointer, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/admin/Toast";
import { applyThemeClass } from "@/components/ThemeApplier";
import { updateSiteConfigCache } from "@/lib/useSiteConfig";

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
      { key: "wechat_qr_url", label: "公众号二维码 URL", placeholder: "https://example.com/qr.png 或 /images/wechat-qr.png", type: "url" },
      { key: "wechat_unlock_tip", label: "微信解锁提示", placeholder: "关注公众号后回复 888 获取解锁码", type: "text" },
      { key: "wechat_unlock_keyword", label: "解锁关键词", placeholder: "888", type: "text" },
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

      {/* Theme Selector — instant preview on click */}
      <div className="glass rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">主题外观</h2>
        <p className="text-sm text-muted mb-4">点击即时预览，保存后生效。切换可对比不同主题效果。</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {THEMES.map((theme) => {
            const isActive = (settings.theme_name || "theme-dark-indigo") === theme.key;
            return (
              <button
                key={theme.key}
                onClick={() => {
                  updateField("theme_name", theme.key);
                  applyThemeClass(theme.key);
                  updateSiteConfigCache("theme_name", theme.key);
                }}
                className={`relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
                  isActive
                    ? "border-primary shadow-lg shadow-primary/20 scale-105"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {/* Mini theme preview */}
                <div className="p-3 text-left" style={{ background: theme.colors[2], color: theme.colors[2] === "#f8fafc" ? "#1e293b" : "#ededed" }}>
                  <div className="flex gap-1 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.colors[0] }} />
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.colors[1] }} />
                  </div>
                  <div className="h-1.5 w-3/4 rounded-full mb-1" style={{ backgroundColor: theme.colors[0] }} />
                  <div className="h-1 w-1/2 rounded-full opacity-40" style={{ backgroundColor: theme.colors[2] === "#f8fafc" ? "#1e293b" : "#ededed" }} />
                </div>
                <div className="px-3 py-2">
                  <p className="text-xs text-center text-foreground font-medium">{theme.label}</p>
                </div>
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

      {/* Loading Template Selector — with mini animated previews */}
      <div className="glass rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
          <Monitor className="w-5 h-5 text-primary-light" /> 加载动画模板
        </h2>
        <p className="text-sm text-muted mb-4">首次访问时的全屏动画效果，含访客 IP 定位和欢迎按钮</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {LOADING_TEMPLATES.map((tpl) => {
            const isActive = (settings.loading_template || "matrix") === tpl.key;
            return (
              <button
                key={tpl.key}
                onClick={() => updateField("loading_template", tpl.key)}
                className={`relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
                  isActive
                    ? "border-primary shadow-lg shadow-primary/20 scale-105"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {/* Mini animation preview */}
                <div className="h-20 relative overflow-hidden" style={{ background: "#0a0a0f" }}>
                  {tpl.key === "matrix" && (
                    <div className="absolute inset-0 flex gap-1 justify-center items-end opacity-60">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="w-1 rounded-t animate-pulse" style={{
                          backgroundColor: tpl.colors[i % 2],
                          height: `${20 + Math.random() * 50}%`,
                          animationDelay: `${i * 0.2}s`,
                        }} />
                      ))}
                    </div>
                  )}
                  {tpl.key === "cyber" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 border border-indigo-500/40 rotate-45 animate-pulse" />
                      <div className="absolute w-6 h-6 border border-indigo-400/60 rotate-45 animate-ping" style={{ animationDuration: "2s" }} />
                    </div>
                  )}
                  {tpl.key === "terminal" && (
                    <div className="absolute inset-0 p-2 text-left font-mono">
                      <div className="text-[7px] text-green-400 opacity-80">$ system boot...</div>
                      <div className="text-[7px] text-green-400 opacity-60">[OK] modules loaded</div>
                      <div className="text-[7px] text-cyan-400 opacity-80">$ detecting IP...</div>
                      <div className="text-[7px] text-green-400 animate-pulse">█</div>
                    </div>
                  )}
                  {tpl.key === "radar" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full border border-cyan-500/30" />
                      <div className="absolute w-8 h-8 rounded-full border border-cyan-500/20" />
                      <div className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    </div>
                  )}
                  {tpl.key === "glitch" && (
                    <div className="absolute inset-0">
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(99,102,241,0.03)_2px,rgba(99,102,241,0.03)_4px)]" />
                      <div className="absolute top-1/3 left-1/4 w-8 h-1 bg-indigo-500/40 animate-pulse" />
                      <div className="absolute top-1/2 left-1/3 w-6 h-1 bg-rose-500/40 animate-pulse" style={{ animationDelay: "0.5s" }} />
                      <div className="absolute top-2/3 left-1/5 w-10 h-0.5 bg-cyan-500/30 animate-pulse" style={{ animationDelay: "1s" }} />
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs text-center text-foreground font-medium">{tpl.label}</p>
                  <p className="text-[10px] text-center text-muted mt-0.5">{tpl.description}</p>
                </div>
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

      {/* Mouse Skin Selector — with particle trail preview */}
      <div className="glass rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
          <MousePointer className="w-5 h-5 text-primary-light" /> 鼠标特效皮肤
        </h2>
        <p className="text-sm text-muted mb-4">自定义鼠标粒子轨迹、光标颜色和点击烟花效果（桌面端可见）</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {MOUSE_SKINS.map((ms) => {
            const isActive = (settings.mouse_skin || "indigo") === ms.key;
            return (
              <button
                key={ms.key}
                onClick={() => updateField("mouse_skin", ms.key)}
                className={`relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
                  isActive
                    ? "border-primary shadow-lg shadow-primary/20 scale-105"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {/* Particle trail preview */}
                <div className="h-16 relative overflow-hidden" style={{ background: "#0a0a0f" }}>
                  {/* Simulated cursor + trail */}
                  <div className="absolute top-3 left-2 w-3 h-3 rounded-full border-2 opacity-70" style={{ borderColor: ms.colors[0] }} />
                  {/* Trail dots */}
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full animate-pulse"
                      style={{
                        width: `${4 - i * 0.5}px`,
                        height: `${4 - i * 0.5}px`,
                        backgroundColor: ms.colors[i % 2],
                        opacity: 0.8 - i * 0.12,
                        left: `${10 + i * 14}px`,
                        top: `${14 + Math.sin(i * 0.8) * 8}px`,
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                  {/* Click burst */}
                  <div className="absolute right-3 bottom-3">
                    <div className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: ms.colors[0], animationDuration: "1.5s" }} />
                    <div className="absolute inset-0 w-2 h-2 rounded-full" style={{ backgroundColor: ms.colors[1] }} />
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-xs text-center text-foreground font-medium">{ms.label}</p>
                </div>
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
