import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TechBlog - 探索技术的无限可能",
    template: "%s | TechBlog",
  },
  description:
    "专注 DBA、SRE、AI、大数据、Python、Golang、前端等技术领域的深度内容分享",
  keywords: [
    "DBA", "SRE", "DevOps", "Kubernetes", "AI", "大数据", "Python", "Golang",
    "技术博客", "云原生", "数据库", "运维",
  ],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "TechBlog",
    title: "TechBlog - 探索技术的无限可能",
    description: "专注 DBA、SRE、AI、大数据、Python、Golang、前端等技术领域的深度内容分享",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
