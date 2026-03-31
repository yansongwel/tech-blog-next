"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  FileText,
  MessageSquare,
  Users,
  Settings,
  Plus,
  FolderTree,
  Tag,
  Link2,
  Mail,
  MessageCircle,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  section: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<{ title: string; slug: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const navigate = useCallback(
    (path: string) => {
      onClose();
      router.push(path);
    },
    [onClose, router],
  );

  const commands: CommandItem[] = [
    // Quick actions
    { id: "new-post", label: "新建文章", description: "创建新的博客文章", icon: <Plus className="w-4 h-4" />, action: () => navigate("/posts/new"), section: "快捷操作" },
    { id: "new-forum", label: "新建帖子", description: "在论坛发布帖子", icon: <Plus className="w-4 h-4" />, action: () => navigate("/forum/new"), section: "快捷操作" },
    // Pages
    { id: "dashboard", label: "仪表盘", icon: <LayoutDashboard className="w-4 h-4" />, action: () => navigate("/dashboard"), section: "页面导航" },
    { id: "posts", label: "文章管理", icon: <FileText className="w-4 h-4" />, action: () => navigate("/posts"), section: "页面导航" },
    { id: "comments", label: "评论管理", icon: <MessageSquare className="w-4 h-4" />, action: () => navigate("/comments"), section: "页面导航" },
    { id: "forum-manage", label: "论坛管理", icon: <MessageCircle className="w-4 h-4" />, action: () => navigate("/forum-manage"), section: "页面导航" },
    { id: "users", label: "用户管理", icon: <Users className="w-4 h-4" />, action: () => navigate("/users"), section: "页面导航" },
    { id: "media", label: "媒体库", icon: <FolderTree className="w-4 h-4" />, action: () => navigate("/media"), section: "页面导航" },
    { id: "categories", label: "分类管理", icon: <FolderTree className="w-4 h-4" />, action: () => navigate("/categories"), section: "页面导航" },
    { id: "tags", label: "标签管理", icon: <Tag className="w-4 h-4" />, action: () => navigate("/tag-manager"), section: "页面导航" },
    { id: "friend-links", label: "友情链接", icon: <Link2 className="w-4 h-4" />, action: () => navigate("/friend-links"), section: "页面导航" },
    { id: "subscribers", label: "订阅管理", icon: <Mail className="w-4 h-4" />, action: () => navigate("/subscribers"), section: "页面导航" },
    { id: "settings", label: "设置", icon: <Settings className="w-4 h-4" />, action: () => navigate("/settings"), section: "页面导航" },
  ];

  // Filter commands by query
  const filtered = query
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.description?.toLowerCase().includes(query.toLowerCase()),
      )
    : commands;

  // Search posts when query is longer
  useEffect(() => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/admin/posts?search=${encodeURIComponent(query)}&limit=5`)
        .then((r) => r.json())
        .then((data) => {
          if (data.posts) setSearchResults(data.posts.map((p: { title: string; slug: string }) => ({ title: p.title, slug: p.slug })));
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // All items: commands + search results
  const allItems = useMemo(() => [
    ...filtered,
    ...searchResults.map((r) => ({
      id: `post-${r.slug}`,
      label: r.title,
      description: "文章",
      icon: <FileText className="w-4 h-4" />,
      action: () => navigate(`/posts`),
      section: "搜索结果",
    })),
  ], [filtered, searchResults, navigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelectedIndex(0);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && allItems[selectedIndex]) {
        e.preventDefault();
        allItems[selectedIndex].action();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, allItems, selectedIndex, onClose]);

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  // Group items by section
  const sections = new Map<string, typeof allItems>();
  for (const item of allItems) {
    const list = sections.get(item.section) || [];
    list.push(item);
    sections.set(item.section, list);
  }

  let globalIndex = 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg mx-4 glass rounded-2xl border border-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索页面、文章，或输入命令..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted focus:outline-none text-sm"
          />
          <kbd className="hidden sm:inline text-[10px] text-muted border border-border rounded px-1.5 py-0.5 font-mono">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto py-2">
          {allItems.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted text-center">没有匹配结果</p>
          ) : (
            Array.from(sections.entries()).map(([section, items]) => (
              <div key={section}>
                <p className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-muted/60 font-medium">{section}</p>
                {items.map((item) => {
                  const idx = globalIndex++;
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                        idx === selectedIndex
                          ? "bg-primary/10 text-foreground"
                          : "text-foreground/80 hover:bg-white/5"
                      }`}
                    >
                      <span className="text-muted">{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      {item.description && (
                        <span className="text-xs text-muted">{item.description}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border text-[10px] text-muted">
          <span>↑↓ 导航</span>
          <span>↵ 打开</span>
          <span>ESC 关闭</span>
        </div>
      </div>
    </div>
  );
}
