"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <span className="text-2xl">!</span>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">出了点问题</h2>
        <p className="text-muted mb-6">
          页面加载时遇到了错误，请尝试刷新页面。如果问题持续存在，请联系管理员。
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-6 py-3 bg-primary hover:bg-primary-light text-white rounded-xl font-medium transition-colors cursor-pointer"
          >
            重试
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Error boundary avoids router dependency */}
          <a
            href="/"
            className="px-6 py-3 bg-surface border border-border hover:bg-white/5 text-foreground rounded-xl font-medium transition-colors cursor-pointer"
          >
            返回首页
          </a>
        </div>
      </div>
    </div>
  );
}
