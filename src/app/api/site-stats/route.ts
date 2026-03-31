import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

// GET /api/site-stats - Public site statistics
export async function GET() {
  try {
    const [viewsResult, totalPosts, totalLikes, siteVisitsRaw, startDateConfig, hotPosts, recentComments] = await Promise.all([
      prisma.post.aggregate({ _sum: { viewCount: true } }),
      prisma.post.count({ where: { status: "PUBLISHED" } }),
      prisma.like.count(),
      redis.get("site:visits"),
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
      siteVisits: parseInt(siteVisitsRaw || "0"),
      startDate: startDateConfig?.value || new Date().toISOString().slice(0, 10),
      hotPosts,
      recentComments,
    }, {
      headers: { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (err) {
    console.error("GET /api/site-stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
