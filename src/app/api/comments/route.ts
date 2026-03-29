import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { listApprovedComments, createComment } from "@/lib/services/commentService";

export const dynamic = "force-dynamic";

// GET /api/comments?postId=xxx
export async function GET(request: NextRequest) {
  try {
    const postId = new URL(request.url).searchParams.get("postId");
    if (!postId) {
      return NextResponse.json({ error: "postId required" }, { status: 400 });
    }

    const comments = await listApprovedComments(postId);
    return NextResponse.json(comments);
  } catch (err) {
    console.error("GET /api/comments error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/comments - Create comment (rate limited: 5 per minute per IP)
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const allowed = await rateLimit(`rl:comment:${ip}`, 5, 60);
    if (!allowed) {
      return NextResponse.json({ error: "操作过于频繁，请稍后再试" }, { status: 429 });
    }

    const body = await request.json();
    if (!body.content || !body.author || !body.email || !body.postId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const comment = await createComment({
      content: body.content,
      author: body.author,
      email: body.email,
      website: body.website,
      postId: body.postId,
      parentId: body.parentId,
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "INVALID_EMAIL") {
        return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
      }
      if (err.message === "POST_NOT_FOUND") {
        return NextResponse.json({ error: "文章不存在" }, { status: 400 });
      }
    }
    console.error("POST /api/comments error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
