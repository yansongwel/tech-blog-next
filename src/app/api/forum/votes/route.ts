import { NextResponse } from "next/server";
import { vote } from "@/lib/services/forumService";
import { auth } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const ip = getClientIp(request);
  const allowed = await rateLimit(`forum-vote:${ip}`, 60, 60);
  if (!allowed) {
    return NextResponse.json({ error: "操作过于频繁" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { value, postId, replyId } = body;

    if (value !== 1 && value !== -1) {
      return NextResponse.json({ error: "投票值无效" }, { status: 400 });
    }
    if (!postId && !replyId) {
      return NextResponse.json({ error: "需要指定帖子或回复" }, { status: 400 });
    }

    const result = await vote({
      userId: session.user.id,
      value,
      postId,
      replyId,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "投票失败" }, { status: 500 });
  }
}
