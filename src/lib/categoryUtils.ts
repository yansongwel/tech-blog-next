import {
  Database,
  Server,
  Brain,
  BarChart3,
  Code2,
  Globe,
  Terminal,
  Folder,
  type LucideIcon,
} from "lucide-react";

/**
 * Category display utilities.
 *
 * Priority: DB value (from API) > fallback map > default.
 * The fallback maps provide backward compatibility for categories
 * that haven't been updated in the admin panel yet.
 */

// ─── Icon mapping ────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  database: Database,
  server: Server,
  brain: Brain,
  "bar-chart": BarChart3,
  code: Code2,
  globe: Globe,
  terminal: Terminal,
  folder: Folder,
};

const SLUG_ICON_FALLBACK: Record<string, string> = {
  dba: "database",
  sre: "server",
  ai: "brain",
  bigdata: "bar-chart",
  python: "code",
  golang: "terminal",
  frontend: "globe",
};

export function getCategoryIcon(cat: { slug: string; icon?: string | null }): LucideIcon {
  // 1. DB icon field
  if (cat.icon && ICON_MAP[cat.icon]) return ICON_MAP[cat.icon];
  // 2. Slug fallback
  const fallbackKey = SLUG_ICON_FALLBACK[cat.slug];
  if (fallbackKey && ICON_MAP[fallbackKey]) return ICON_MAP[fallbackKey];
  // 3. Default
  return Folder;
}

/** All available icon keys for admin dropdown */
export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

// ─── Color mapping ───────────────────────────────

const DEFAULT_COLOR = "from-gray-500 to-slate-500";

const SLUG_COLOR_FALLBACK: Record<string, string> = {
  dba: "from-orange-500 to-red-500",
  sre: "from-indigo-500 to-purple-500",
  ai: "from-cyan-500 to-blue-500",
  bigdata: "from-green-500 to-emerald-500",
  python: "from-yellow-500 to-orange-500",
  golang: "from-sky-400 to-blue-500",
  frontend: "from-pink-500 to-rose-500",
};

export function getCategoryColor(cat: { slug: string; color?: string | null }): string {
  // 1. DB color field (Tailwind gradient class)
  if (cat.color) return cat.color;
  // 2. Slug fallback
  return SLUG_COLOR_FALLBACK[cat.slug] || DEFAULT_COLOR;
}

/** Predefined color options for admin dropdown */
export const AVAILABLE_COLORS = [
  { label: "靛蓝紫", value: "from-indigo-500 to-purple-500" },
  { label: "橙红", value: "from-orange-500 to-red-500" },
  { label: "青蓝", value: "from-cyan-500 to-blue-500" },
  { label: "绿翠", value: "from-green-500 to-emerald-500" },
  { label: "黄橙", value: "from-yellow-500 to-orange-500" },
  { label: "天蓝", value: "from-sky-400 to-blue-500" },
  { label: "粉玫", value: "from-pink-500 to-rose-500" },
  { label: "紫粉", value: "from-purple-500 to-pink-500" },
  { label: "蓝绿", value: "from-teal-500 to-cyan-500" },
  { label: "琥珀", value: "from-amber-500 to-orange-500" },
];

// ─── Description ─────────────────────────────────

const SLUG_DESC_FALLBACK: Record<string, string> = {
  dba: "MySQL · PostgreSQL · Redis · MongoDB",
  sre: "DevOps · K8s · Docker · 监控",
  ai: "机器学习 · 深度学习 · LLM",
  bigdata: "Spark · Flink · Hadoop",
  python: "Web · 爬虫 · 自动化",
  golang: "微服务 · 云原生 · 高并发",
  frontend: "React · Vue · TypeScript",
};

export function getCategoryDesc(cat: { slug: string; description?: string | null }): string {
  if (cat.description) return cat.description;
  return SLUG_DESC_FALLBACK[cat.slug] || "技术文章";
}
