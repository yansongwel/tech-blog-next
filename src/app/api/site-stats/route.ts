import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

// GET /api/site-stats - Public site statistics
export async function GET() {
  const [viewsResult, totalPosts, totalLikes, siteVisits, startDateConfig, hotPosts, recentComments] = await Promise.all([
    prisma.post.aggregate({ _sum: { viewCount: true } }),
    prisma.post.count({ where: { status: "PUBLISHED" } }),
    prisma.like.count(),
    redis.incr("site:visits"),
    prisma.siteConfig.findUnique({ where: { key: "site_start_date" } }),
    prisma.post.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true, slug: true, viewCount: true, category: { select: { name: true } } },
      orderBy: { viewCount: "desc" },
      take: 5,
    }),
    prisma.comment.findMany({
      where: { approved: true },
      select: { id: true, author: true, content: true, createdAt: true, post: { select: { title: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    totalViews: viewsResult._sum.viewCount || 0,
    totalPosts,
    totalLikes,
    siteVisits,
    startDate: startDateConfig?.value || new Date().toISOString().slice(0, 10),
    hotPosts,
    recentComments,
  });
}
