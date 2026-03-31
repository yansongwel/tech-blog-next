import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      avatar: true,
      bio: true,
      website: true,
      github: true,
      points: true,
      level: true,
      createdAt: true,
      _count: {
        select: {
          forumPosts: true,
          forumReplies: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  // Get vote count received
  const votesReceived = await prisma.forumVote.count({
    where: {
      value: 1,
      OR: [
        { post: { authorId: user.id } },
        { reply: { authorId: user.id } },
      ],
    },
  });

  // Get recent forum posts
  const recentPosts = await prisma.forumPost.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      slug: true,
      voteScore: true,
      replyCount: true,
      createdAt: true,
      category: { select: { name: true, slug: true } },
    },
  });

  // Get recent replies
  const recentReplies = await prisma.forumReply.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      content: true,
      voteScore: true,
      isAccepted: true,
      createdAt: true,
      post: { select: { title: true, slug: true } },
    },
  });

  return NextResponse.json({
    ...user,
    votesReceived,
    recentPosts,
    recentReplies,
  });
}
