import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/posts - List all posts for admin (includes drafts)
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status");

  const where = {
    ...(status && { status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" }),
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        category: { select: { name: true, slug: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  return NextResponse.json({
    posts,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

// DELETE /api/admin/posts?id=xxx - Delete a post
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Post ID required" }, { status: 400 });
  }

  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
