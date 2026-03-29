"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, MessageSquare, FileText, Mail } from "lucide-react";
import Link from "next/link";

interface PendingItems {
  pendingComments: number;
  draftPosts: number;
  unconfirmedSubscribers: number;
}

export default function NotificationBell() {
  const [items, setItems] = useState<PendingItems | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/admin/pending")
      .then((r) => r.json())
      .then((data) => setItems(data))
      .catch(() => {});

    // Refresh every 60s
    const timer = setInterval(() => {
      fetch("/api/admin/pending")
        .then((r) => r.json())
        .then((data) => setItems(data))
        .catch(() => {});
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const totalCount = items
    ? items.pendingComments + items.draftPosts + items.unconfirmedSubscribers
    : 0;

  const notifications = items
    ? [
        items.pendingComments > 0 && {
          icon: MessageSquare,
          label: `${items.pendingComments} 条评论待审核`,
          href: "/comments",
          color: "text-amber-400",
          bg: "bg-amber-500/10",
        },
        items.draftPosts > 0 && {
          icon: FileText,
          label: `${items.draftPosts} 篇草稿未发布`,
          href: "/posts",
          color: "text-blue-400",
          bg: "bg-blue-500/10",
        },
        items.unconfirmedSubscribers > 0 && {
          icon: Mail,
          label: `${items.unconfirmedSubscribers} 位订阅者未确认`,
          href: "/subscribers",
          color: "text-cyan-400",
          bg: "bg-cyan-500/10",
        },
      ].filter(Boolean) as { icon: typeof Bell; label: string; href: string; color: string; bg: string }[]
    : [];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-muted hover:text-foreground transition-colors cursor-pointer rounded-lg hover:bg-white/5"
      >
        <Bell className="w-5 h-5" />
        {totalCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px] px-1">
            {totalCount > 99 ? "99+" : totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 glass rounded-xl shadow-2xl border border-border overflow-hidden z-50 animate-fade-in">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground">待处理事项</p>
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-muted">暂无待处理事项</p>
            </div>
          ) : (
            <div className="py-1">
              {notifications.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className={`w-8 h-8 rounded-lg ${n.bg} flex items-center justify-center ${n.color}`}>
                    <n.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-foreground">{n.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
