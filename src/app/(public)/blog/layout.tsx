import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "所有文章",
  description: "探索 DBA、SRE、AI、大数据、Python、Golang、前端等技术领域的深度文章",
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
