import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/stats - Dashboard statistics
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  return NextResponse.json({
    stats: {
      totalPosts,
      totalViews: totalViews._sum.viewCount || 0,
      totalLikes,
      totalComments,
      totalSubscribers,
    },
    recentPosts,
  });
}
