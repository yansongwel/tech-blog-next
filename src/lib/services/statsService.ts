import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const STATS_TTL = 90 * 24 * 3600; // 90 days

type RangeKey = "1d" | "7d" | "30d" | "90d";

function getDaysForRange(range: RangeKey): number {
  switch (range) {
    case "1d": return 1;
    case "7d": return 7;
    case "30d": return 30;
    case "90d": return 90;
  }
}

function getDateRange(days: number) {
  const dates: { key: string; label: string }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    dates.push({ key: dateKey, label: `${d.getMonth() + 1}/${d.getDate()}` });
  }
  return dates;
}

export async function getDashboardStats(range: RangeKey = "7d") {
  const days = getDaysForRange(range);

  // Date boundaries for period comparison
  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - days);
  const prevPeriodStart = new Date(periodStart);
  prevPeriodStart.setDate(prevPeriodStart.getDate() - days);

  const [
    totalPosts, totalViews, totalLikes, totalComments, totalSubscribers,
    recentPosts, totalUsers, totalForumPosts, totalForumReplies,
    // Period comparison counts
    currentPeriodPosts, prevPeriodPosts,
    currentPeriodComments, prevPeriodComments,
    currentPeriodLikes, prevPeriodLikes,
    currentPeriodUsers, prevPeriodUsers,
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
    prisma.user.count(),
    prisma.forumPost.count(),
    prisma.forumReply.count(),
    // Current period
    prisma.post.count({ where: { createdAt: { gte: periodStart } } }),
    prisma.post.count({ where: { createdAt: { gte: prevPeriodStart, lt: periodStart } } }),
    prisma.comment.count({ where: { createdAt: { gte: periodStart } } }),
    prisma.comment.count({ where: { createdAt: { gte: prevPeriodStart, lt: periodStart } } }),
    prisma.like.count({ where: { createdAt: { gte: periodStart } } }),
    prisma.like.count({ where: { createdAt: { gte: prevPeriodStart, lt: periodStart } } }),
    prisma.user.count({ where: { createdAt: { gte: periodStart } } }),
    prisma.user.count({ where: { createdAt: { gte: prevPeriodStart, lt: periodStart } } }),
  ]);

  // Trend from Redis
  const dates = getDateRange(days);
  const redisKeys = dates.flatMap((d) => [`stats:views:${d.key}`, `stats:visits:${d.key}`]);
  const redisValues = await redis.mget(...redisKeys);
  const trend = dates.map((d, i) => ({
    date: d.label,
    views: parseInt(redisValues[i * 2] || "0"),
    visits: parseInt(redisValues[i * 2 + 1] || "0"),
  }));

  // Record today's view snapshot
  const today = new Date().toISOString().slice(0, 10);
  await redis.set(`stats:views:${today}`, String(totalViews._sum.viewCount || 0), "EX", STATS_TTL);

  // Category distribution
  const categoryStats = await prisma.category.findMany({
    where: { parentId: null },
    include: { _count: { select: { posts: true } } },
    orderBy: { sortOrder: "asc" },
  });

  // Calculate percentage changes
  const calcChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return {
    stats: {
      totalPosts,
      totalViews: totalViews._sum.viewCount || 0,
      totalLikes,
      totalComments,
      totalSubscribers,
      totalUsers,
      totalForumPosts,
      totalForumReplies,
    },
    changes: {
      posts: calcChange(currentPeriodPosts, prevPeriodPosts),
      comments: calcChange(currentPeriodComments, prevPeriodComments),
      likes: calcChange(currentPeriodLikes, prevPeriodLikes),
      users: calcChange(currentPeriodUsers, prevPeriodUsers),
    },
    recentPosts,
    trend,
    range,
    categoryStats: categoryStats.map((c) => ({ name: c.name, count: c._count.posts })),
  };
}
