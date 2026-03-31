"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Image,
  Settings,
  LogOut,
  Menu,
  X,
  Link2,
  FolderTree,
  Mail,
  Tag,
  Users,
  MessageCircle,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { ToastProvider } from "@/components/admin/Toast";
import NotificationBell from "@/components/admin/NotificationBell";
import CommandPalette from "@/components/admin/CommandPalette";
import ThemeApplier from "@/components/ThemeApplier";

const sidebarLinks = [
  { href: "/dashboard", label: "仪表盘", icon: LayoutDashboard },
  { href: "/posts", label: "文章管理", icon: FileText },
  { href: "/comments", label: "评论管理", icon: MessageSquare },
  { href: "/forum-manage", label: "论坛管理", icon: MessageCircle },
  { href: "/users", label: "用户管理", icon: Users },
  { href: "/media", label: "媒体库", icon: Image },
  { href: "/categories", label: "分类管理", icon: FolderTree },
  { href: "/tag-manager", label: "标签管理", icon: Tag },
  { href: "/friend-links", label: "友情链接", icon: Link2 },
  { href: "/subscribers", label: "订阅管理", icon: Mail },
  { href: "/settings", label: "设置", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userName, setUserName] = useState("");
  const [cmdOpen, setCmdOpen] = useState(false);

  // Restore collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("admin_sidebar_collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  // Ctrl+K / Cmd+K to open command palette
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setCmdOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Skip auth check for login page
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (isLoginPage) return;

    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (!data?.user) {
          router.push("/login");
        } else if (data.user.role === "MEMBER") {
          // MEMBER users cannot access admin panel
          router.push("/");
        } else {
          setUserName(data.user.name || data.user.email || "Admin");
        }
      })
      .catch(() => router.push("/login"));
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    const { signOut } = await import("next-auth/react");
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <ThemeApplier />
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-surface border-r border-border transform transition-all duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "lg:w-16" : "lg:w-64"} w-64`}
      >
        <div className={`flex items-center h-16 border-b border-border ${collapsed ? "justify-center px-2" : "justify-between px-6"}`}>
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xs shrink-0">
              T
            </div>
            {!collapsed && <span className="font-bold gradient-text">TechBlog Admin</span>}
          </Link>
          <button
            className="lg:hidden text-muted cursor-pointer"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className={`space-y-1 ${collapsed ? "p-2" : "p-4"}`}>
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              title={collapsed ? link.label : undefined}
              className={`flex items-center gap-3 rounded-lg text-sm transition-colors cursor-pointer ${
                collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
              } ${
                pathname === link.href
                  ? "bg-primary/10 text-primary-light"
                  : "text-muted hover:text-foreground hover:bg-white/5"
              }`}
            >
              <link.icon className="w-5 h-5 shrink-0" />
              {!collapsed && link.label}
            </Link>
          ))}
        </nav>

        <div className={`absolute bottom-4 ${collapsed ? "left-2 right-2" : "left-4 right-4"} space-y-1`}>
          {/* Collapse toggle (desktop only) */}
          <button
            onClick={() => {
              const next = !collapsed;
              setCollapsed(next);
              localStorage.setItem("admin_sidebar_collapsed", String(next));
            }}
            className={`hidden lg:flex items-center gap-3 w-full rounded-lg text-sm text-muted hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer ${
              collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
            }`}
            title={collapsed ? "展开侧边栏" : "折叠侧边栏"}
          >
            <Menu className={`w-5 h-5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
            {!collapsed && "折叠"}
          </button>
          <button
            onClick={handleLogout}
            title={collapsed ? "退出登录" : undefined}
            className={`flex items-center gap-3 w-full rounded-lg text-sm text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer ${
              collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
            }`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && "退出登录"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-border flex items-center px-6 gap-4">
          <button
            className="lg:hidden text-muted cursor-pointer"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link
              href="/"
              className="text-xs text-muted hover:text-foreground cursor-pointer"
            >
              访问前台 &rarr;
            </Link>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
              {userName ? userName[0].toUpperCase() : "A"}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <ToastProvider>{children}</ToastProvider>
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
