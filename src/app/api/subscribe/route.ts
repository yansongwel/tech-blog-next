import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// POST /api/subscribe
export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const existing = await prisma.subscription.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ message: "Already subscribed" });
  }

  const confirmToken = crypto.randomBytes(32).toString("hex");

  await prisma.subscription.create({
    data: {
      email,
      confirmToken,
    },
  });

  // TODO: Send confirmation email with token

  return NextResponse.json({ message: "Please check your email to confirm" }, { status: 201 });
}
