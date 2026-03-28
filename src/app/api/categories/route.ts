import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/categories - List all categories with post counts
export async function GET() {
  const categories = await prisma.category.findMany({
    include: {
      children: {
        include: {
          _count: { select: { posts: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
      _count: { select: { posts: true } },
    },
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(categories, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}
