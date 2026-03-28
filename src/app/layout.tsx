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

export const metadata: Metadata = {
  title: "TechBlog - 探索技术的无限可能",
  description:
    "专注 DBA、SRE、AI、大数据、Python、Golang、前端等技术领域的深度内容分享",
  keywords: [
    "DBA",
    "SRE",
    "DevOps",
    "Kubernetes",
    "AI",
    "大数据",
    "Python",
    "Golang",
  ],
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
