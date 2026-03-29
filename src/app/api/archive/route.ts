import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/archive - All published posts grouped by year-month
export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        publishedAt: true,
        viewCount: true,
        category: { select: { name: true, slug: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { publishedAt: "desc" },
    });

    const groups: Record<string, typeof posts> = {};
    for (const post of posts) {
      const date = post.publishedAt ? new Date(post.publishedAt) : new Date();
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(post);
    }

    return NextResponse.json(
      Object.entries(groups).map(([month, posts]) => ({ month, posts, count: posts.length })),
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
    );
  } catch (err) {
    console.error("GET /api/archive error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
