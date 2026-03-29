import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { prisma } from "@/lib/prisma";
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

async function getSiteConfig() {
  try {
    const configs = await prisma.siteConfig.findMany();
    const map: Record<string, string> = {};
    for (const c of configs) map[c.key] = c.value;
    return map;
  } catch {
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  const siteName = config.site_name || "TechBlog";
  const siteDesc = config.site_description || "探索技术的无限可能";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${siteName} - ${siteDesc}`,
      template: `%s | ${siteName}`,
    },
    description: siteDesc,
    keywords: [
      "DBA", "SRE", "DevOps", "Kubernetes", "AI", "大数据", "Python", "Golang",
      "技术博客", "云原生", "数据库", "运维",
    ],
    openGraph: {
      type: "website",
      locale: "zh_CN",
      siteName,
      title: `${siteName} - ${siteDesc}`,
      description: siteDesc,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await getSiteConfig();
  const themeClass = config.theme_name || "";

  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased ${themeClass}`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
