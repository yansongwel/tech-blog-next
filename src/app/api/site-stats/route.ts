import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

// GET /api/site-stats - Public site statistics
export async function GET() {
  const [viewsResult, totalPosts, totalLikes, siteVisits, startDateConfig] = await Promise.all([
    prisma.post.aggregate({ _sum: { viewCount: true } }),
    prisma.post.count({ where: { status: "PUBLISHED" } }),
    prisma.like.count(),
    redis.incr("site:visits"),
    prisma.siteConfig.findUnique({ where: { key: "site_start_date" } }),
  ]);

  return NextResponse.json({
    totalViews: viewsResult._sum.viewCount || 0,
    totalPosts,
    totalLikes,
    siteVisits,
    startDate: startDateConfig?.value || new Date().toISOString().slice(0, 10),
  });
}
