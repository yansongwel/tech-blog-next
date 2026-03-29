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
} from "lucide-react";
import { useState, useEffect } from "react";
import { ToastProvider } from "@/components/admin/Toast";
import NotificationBell from "@/components/admin/NotificationBell";

const sidebarLinks = [
  { href: "/dashboard", label: "仪表盘", icon: LayoutDashboard },
  { href: "/posts", label: "文章管理", icon: FileText },
  { href: "/comments", label: "评论管理", icon: MessageSquare },
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
  const [userName, setUserName] = useState("");

  // Skip auth check for login page
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (isLoginPage) return;

    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (!data?.user) {
          router.push("/login");
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
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xs">
              T
            </div>
            <span className="font-bold gradient-text">TechBlog Admin</span>
          </Link>
          <button
            className="lg:hidden text-muted cursor-pointer"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                pathname === link.href
                  ? "bg-primary/10 text-primary-light"
                  : "text-muted hover:text-foreground hover:bg-white/5"
              }`}
            >
              <link.icon className="w-5 h-5" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            退出登录
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
