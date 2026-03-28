import Link from "next/link";
import { GitBranch, Mail, Rss } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-border bg-surface/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <h3 className="text-xl font-bold gradient-text mb-3">TechBlog</h3>
            <p className="text-muted text-sm leading-relaxed">
              专注 DBA、SRE、AI、大数据等技术领域的深度内容分享
            </p>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-foreground mb-3">技术分类</h4>
            <ul className="space-y-2">
              {["DBA", "SRE/DevOps", "AI", "大数据"].map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/categories/${cat.toLowerCase().replace("/", "-")}`}
                    className="text-sm text-muted hover:text-foreground transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Languages */}
          <div>
            <h4 className="font-semibold text-foreground mb-3">编程语言</h4>
            <ul className="space-y-2">
              {["Python", "Golang", "前端开发"].map((lang) => (
                <li key={lang}>
                  <Link
                    href={`/categories/${lang.toLowerCase()}`}
                    className="text-sm text-muted hover:text-foreground transition-colors"
                  >
                    {lang}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-3">链接</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  关于我
                </Link>
              </li>
              <li>
                <Link
                  href="/album"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  相册
                </Link>
              </li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a
                href="#"
                className="text-muted hover:text-foreground transition-colors"
              >
                <GitBranch className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-muted hover:text-foreground transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-muted hover:text-foreground transition-colors"
              >
                <Rss className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted">
          &copy; {new Date().getFullYear()} TechBlog. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
