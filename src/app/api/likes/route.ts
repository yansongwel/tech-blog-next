import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// POST /api/likes - Toggle like (rate limited: 30 per minute per IP)
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const allowed = await rateLimit(`rl:like:${ip}`, 30, 60);
    if (!allowed) {
      return NextResponse.json({ error: "操作过于频繁，请稍后再试" }, { status: 429 });
    }

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
  } catch (err) {
    console.error("POST /api/likes error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
