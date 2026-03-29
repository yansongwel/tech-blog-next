import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/posts - List posts with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 50);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where = {
      status: "PUBLISHED" as const,
      ...(category && { category: { slug: category } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { content: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          category: { select: { name: true, slug: true } },
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("GET /api/posts error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/posts - Create new post (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.title || !body.content || !body.categoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify category exists
    const category = await prisma.category.findUnique({ where: { id: body.categoryId } });
    if (!category) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const slug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const post = await prisma.post.create({
      data: {
        title: body.title,
        slug: `${slug}-${Date.now().toString(36)}`,
        content: body.content,
        excerpt: body.excerpt || null,
        coverImage: body.coverImage || null,
        status: body.status || "DRAFT",
        isLocked: body.isLocked || false,
        authorId: session.user.id,
        categoryId: body.categoryId,
        publishedAt: body.status === "PUBLISHED" ? new Date() : null,
      },
    });

    // Handle tags if provided
    if (body.tags?.length > 0) {
      for (const tagName of body.tags) {
        const tag = await prisma.tag.upsert({
          where: { slug: tagName.toLowerCase().replace(/\s+/g, "-") },
          update: {},
          create: {
            name: tagName,
            slug: tagName.toLowerCase().replace(/\s+/g, "-"),
          },
        });
        await prisma.postTag.create({
          data: { postId: post.id, tagId: tag.id },
        });
      }
    }

    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    console.error("POST /api/posts error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
