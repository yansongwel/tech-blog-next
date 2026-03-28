import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/comments?postId=xxx
export async function GET(request: NextRequest) {
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
}

// POST /api/comments - Create comment
export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.content || !body.author || !body.email || !body.postId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      content: body.content,
      author: body.author,
      email: body.email,
      website: body.website,
      postId: body.postId,
      parentId: body.parentId || null,
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
