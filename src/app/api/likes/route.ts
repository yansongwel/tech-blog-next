import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

// POST /api/likes - Toggle like
export async function POST(request: NextRequest) {
  const { postId, visitorId } = await request.json();

  if (!postId || !visitorId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const existing = await prisma.like.findUnique({
    where: { postId_visitorId: { postId, visitorId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    await redis.decr(`likes:${postId}`);
    return NextResponse.json({ liked: false });
  }

  await prisma.like.create({ data: { postId, visitorId } });
  await redis.incr(`likes:${postId}`);
  return NextResponse.json({ liked: true });
}
