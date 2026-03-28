import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/comments - List all comments for admin
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const approved = searchParams.get("approved");

  const where = {
    ...(approved !== null && approved !== undefined && approved !== ""
      ? { approved: approved === "true" }
      : {}),
  };

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      include: {
        post: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.comment.count({ where }),
  ]);

  return NextResponse.json({
    comments,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

// PUT /api/admin/comments - Approve a comment
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, approved } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Comment ID required" }, { status: 400 });
  }

  const comment = await prisma.comment.update({
    where: { id },
    data: { approved },
  });

  return NextResponse.json(comment);
}

// DELETE /api/admin/comments?id=xxx - Delete a comment
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Comment ID required" }, { status: 400 });
  }

  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
