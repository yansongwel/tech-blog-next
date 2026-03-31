"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const PATH_LABELS: Record<string, string> = {
  dashboard: "仪表盘",
  posts: "文章管理",
  new: "新建文章",
  edit: "编辑文章",
  comments: "评论管理",
  "forum-manage": "论坛管理",
  users: "用户管理",
  media: "媒体库",
  categories: "分类管理",
  "tag-manager": "标签管理",
  "friend-links": "友情链接",
  subscribers: "订阅管理",
  settings: "设置",
};

export default function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    // Skip dynamic segments like [id]
    const label = PATH_LABELS[seg] || (seg.length > 20 ? "..." : seg);
    const isLast = i === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav className="flex items-center gap-1.5 text-xs text-muted mb-4">
      <Link href="/dashboard" className="hover:text-foreground transition-colors cursor-pointer">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3 text-border" />
          {crumb.isLast ? (
            <span className="text-foreground/70">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-foreground transition-colors cursor-pointer">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
