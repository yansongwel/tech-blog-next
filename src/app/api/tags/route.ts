import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/tags - List all tags with post counts
export async function GET(request: NextRequest) {
  try {
    const slug = new URL(request.url).searchParams.get("slug");

    if (slug) {
      const page = parseInt(new URL(request.url).searchParams.get("page") || "1");
      const limit = 12;
      const tag = await prisma.tag.findUnique({ where: { slug } });
      if (!tag) return NextResponse.json({ error: "Tag not found" }, { status: 404 });

      const [postTags, total] = await Promise.all([
        prisma.postTag.findMany({
          where: { tagId: tag.id, post: { status: "PUBLISHED" } },
          include: {
            post: {
              include: {
                category: { select: { name: true, slug: true } },
                _count: { select: { likes: true, comments: true } },
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { post: { publishedAt: "desc" } },
        }),
        prisma.postTag.count({ where: { tagId: tag.id, post: { status: "PUBLISHED" } } }),
      ]);

      return NextResponse.json({
        tag,
        posts: postTags.map((pt) => pt.post),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    }

    const tags = await prisma.tag.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(tags, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (err) {
    console.error("GET /api/tags error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
