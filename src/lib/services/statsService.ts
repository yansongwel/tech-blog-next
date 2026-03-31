import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const STATS_TTL = 90 * 24 * 3600; // 90 days

export async function getDashboardStats() {
  const [totalPosts, totalViews, totalLikes, totalComments, totalSubscribers, recentPosts] =
    await Promise.all([
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

  // 7-day trend from Redis (batch mget)
  const dates: { key: string; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    dates.push({ key: dateKey, label: `${d.getMonth() + 1}/${d.getDate()}` });
  }

  const redisKeys = dates.flatMap((d) => [`stats:views:${d.key}`, `stats:visits:${d.key}`]);
  const redisValues = await redis.mget(...redisKeys);
  const trend = dates.map((d, i) => ({
    date: d.label,
    views: parseInt(redisValues[i * 2] || "0"),
    visits: parseInt(redisValues[i * 2 + 1] || "0"),
  }));

  // Record today's view snapshot (read-only, no visit increment)
  const today = new Date().toISOString().slice(0, 10);
  await redis.set(`stats:views:${today}`, String(totalViews._sum.viewCount || 0), "EX", STATS_TTL);

  // Category distribution
  const categoryStats = await prisma.category.findMany({
    where: { parentId: null },
    include: { _count: { select: { posts: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return {
    stats: {
      totalPosts,
      totalViews: totalViews._sum.viewCount || 0,
      totalLikes,
      totalComments,
      totalSubscribers,
    },
    recentPosts,
    trend,
    categoryStats: categoryStats.map((c) => ({ name: c.name, count: c._count.posts })),
  };
}
