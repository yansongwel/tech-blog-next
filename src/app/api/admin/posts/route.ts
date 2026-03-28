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
        tags: { include: { tag: true } },
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

// PUT /api/admin/posts - Update a post
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, title, content, excerpt, coverImage, categoryId, status: postStatus, isLocked, tags } = body;

  if (!id) {
    return NextResponse.json({ error: "Post ID required" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  if (excerpt !== undefined) updateData.excerpt = excerpt;
  if (coverImage !== undefined) updateData.coverImage = coverImage;
  if (categoryId !== undefined) updateData.categoryId = categoryId;
  if (postStatus !== undefined) {
    updateData.status = postStatus;
    if (postStatus === "PUBLISHED") updateData.publishedAt = new Date();
  }
  if (isLocked !== undefined) updateData.isLocked = isLocked;

  const post = await prisma.post.update({
    where: { id },
    data: updateData,
  });

  // Handle tags if provided
  if (tags !== undefined) {
    // Remove existing tags
    await prisma.postTag.deleteMany({ where: { postId: id } });
    // Add new tags
    for (const tagName of tags) {
      const tag = await prisma.tag.upsert({
        where: { slug: tagName.toLowerCase().replace(/\s+/g, "-") },
        update: {},
        create: {
          name: tagName,
          slug: tagName.toLowerCase().replace(/\s+/g, "-"),
        },
      });
      await prisma.postTag.create({
        data: { postId: id, tagId: tag.id },
      });
    }
  }

  return NextResponse.json(post);
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
