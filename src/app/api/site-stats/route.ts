import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

// GET /api/site-stats - Public site statistics
export async function GET() {
  // Total post views from database
  const viewsResult = await prisma.post.aggregate({ _sum: { viewCount: true } });
  const totalViews = viewsResult._sum.viewCount || 0;

  // Site visit counter from Redis (increment on each call)
  const siteVisits = await redis.incr("site:visits");

  // Site start date from SiteConfig
  const startDateConfig = await prisma.siteConfig.findUnique({
    where: { key: "site_start_date" },
  });

  return NextResponse.json({
    totalViews,
    siteVisits,
    startDate: startDateConfig?.value || new Date().toISOString().slice(0, 10),
  });
}
