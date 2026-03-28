import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// POST /api/subscribe (rate limited: 3 per minute per IP)
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const allowed = await rateLimit(`rl:subscribe:${ip}`, 3, 60);
    if (!allowed) {
      return NextResponse.json({ error: "操作过于频繁，请稍后再试" }, { status: 429 });
    }

    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const existing = await prisma.subscription.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ message: "已订阅" });
    }

    const confirmToken = crypto.randomBytes(32).toString("hex");

    await prisma.subscription.create({
      data: { email, confirmToken },
    });

    return NextResponse.json({ message: "订阅成功" }, { status: 201 });
  } catch (err) {
    console.error("POST /api/subscribe error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
