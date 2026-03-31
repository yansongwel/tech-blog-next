import { NextResponse } from "next/server";
import { markSolved } from "@/lib/services/forumService";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { slug } = await params;
    const body = await request.json();
    const { replyId } = body;

    if (!replyId) {
      return NextResponse.json({ error: "需要指定回复 ID" }, { status: 400 });
    }

    // Get post ID from slug
    const { prisma } = await import("@/lib/prisma");
    const post = await prisma.forumPost.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!post) {
      return NextResponse.json({ error: "帖子不存在" }, { status: 404 });
    }

    const result = await markSolved(post.id, replyId, session.user.id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "操作失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
