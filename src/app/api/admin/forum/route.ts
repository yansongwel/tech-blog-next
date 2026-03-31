import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { author: { username: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [posts, total] = await Promise.all([
    prisma.forumPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: { id: true, username: true, name: true } },
        category: { select: { id: true, name: true } },
        _count: { select: { replies: true, votes: true } },
      },
    }),
    prisma.forumPost.count({ where }),
  ]);

  return NextResponse.json({ posts, total, page, limit });
}
