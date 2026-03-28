import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// GET /api/comments?postId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json({ error: "postId required" }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { postId, approved: true, parentId: null },
      include: {
        replies: {
          where: { approved: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

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

    const comment = await prisma.comment.create({
      data: {
        content: body.content.slice(0, 2000),
        author: body.author.slice(0, 50),
        email: body.email.slice(0, 100),
        website: body.website?.slice(0, 200) || null,
        postId: body.postId,
        parentId: body.parentId || null,
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    console.error("POST /api/comments error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
