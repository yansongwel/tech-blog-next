import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

// GET /api/admin/stats - Dashboard statistics
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [
      totalPosts,
      totalViews,
      totalLikes,
      totalComments,
      totalSubscribers,
      recentPosts,
    ] = await Promise.all([
      prisma.post.count(),
      prisma.post.aggregate({ _sum: { viewCount: true } }),
      prisma.like.count(),
      prisma.comment.count(),
      prisma.subscription.count(),
      prisma.post.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { name: true } },
          _count: { select: { likes: true, comments: true } },
        },
      }),
    ]);

    // Get 7-day trend data from Redis
    const trend: { date: string; views: number; visits: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const [views, visits] = await Promise.all([
        redis.get(`stats:views:${dateKey}`).then((v) => parseInt(v || "0")),
        redis.get(`stats:visits:${dateKey}`).then((v) => parseInt(v || "0")),
      ]);
      trend.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        views,
        visits,
      });
    }

    // Record today's stats
    const today = new Date().toISOString().slice(0, 10);
    await redis.set(`stats:views:${today}`, String(totalViews._sum.viewCount || 0));
    await redis.incr(`stats:visits:${today}`);

    // Category distribution
    const categoryStats = await prisma.category.findMany({
      where: { parentId: null },
      include: { _count: { select: { posts: true } } },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({
      stats: {
        totalPosts,
        totalViews: totalViews._sum.viewCount || 0,
        totalLikes,
        totalComments,
        totalSubscribers,
      },
      recentPosts,
      trend,
      categoryStats: categoryStats.map((c) => ({
        name: c.name,
        count: c._count.posts,
      })),
    });
  } catch (err) {
    console.error("GET /api/admin/stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
