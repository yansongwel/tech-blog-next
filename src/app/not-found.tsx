import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        {/* Glitch 404 */}
        <h1 className="text-[8rem] md:text-[12rem] font-bold leading-none gradient-text select-none">
          404
        </h1>
        <div className="relative -mt-6 mb-8">
          <p className="text-xl md:text-2xl font-mono text-muted">
            PAGE_NOT_FOUND
          </p>
          <div className="w-24 h-0.5 mx-auto mt-4 bg-gradient-to-r from-primary to-accent" />
        </div>
        <p className="text-muted mb-8 max-w-md mx-auto">
          你访问的页面不存在或已被移除。请检查 URL 是否正确，或返回首页浏览更多内容。
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="px-6 py-3 bg-primary hover:bg-primary-light text-white rounded-xl font-medium transition-colors cursor-pointer"
          >
            返回首页
          </Link>
          <Link
            href="/blog"
            className="px-6 py-3 bg-surface border border-border hover:bg-white/5 text-foreground rounded-xl font-medium transition-colors cursor-pointer"
          >
            浏览文章
          </Link>
        </div>
      </div>
    </div>
  );
}
