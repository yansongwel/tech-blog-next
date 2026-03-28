import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const siteUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    select: {
      title: true,
      slug: true,
      excerpt: true,
      publishedAt: true,
      category: { select: { name: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });

  const siteName = (
    await prisma.siteConfig.findUnique({ where: { key: "site_name" } })
  )?.value || "TechBlog";

  const siteDesc = (
    await prisma.siteConfig.findUnique({ where: { key: "site_description" } })
  )?.value || "";

  const items = posts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerpt || ""}]]></description>
      <category>${post.category.name}</category>
      <pubDate>${post.publishedAt ? new Date(post.publishedAt).toUTCString() : ""}</pubDate>
    </item>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteName}</title>
    <link>${siteUrl}</link>
    <description>${siteDesc}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
