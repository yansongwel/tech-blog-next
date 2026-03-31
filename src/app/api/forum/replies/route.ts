import { NextResponse } from "next/server";
import { createForumReply } from "@/lib/services/forumService";
import { auth } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const ip = getClientIp(request);
  const allowed = await rateLimit(`forum-reply:${ip}`, 20, 600);
  if (!allowed) {
    return NextResponse.json({ error: "回复过于频繁，请稍后再试" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { content, postId, parentId } = body;

    if (!content?.trim() || !postId) {
      return NextResponse.json({ error: "回复内容和帖子 ID 不能为空" }, { status: 400 });
    }

    const reply = await createForumReply({
      content,
      postId,
      authorId: session.user.id,
      parentId,
    });

    return NextResponse.json(reply, { status: 201 });
  } catch {
    return NextResponse.json({ error: "回复失败" }, { status: 500 });
  }
}
