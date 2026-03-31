import { NextResponse } from "next/server";
import { registerMember } from "@/lib/services/memberService";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Rate limit: 5 registrations per IP per hour
  const ip = getClientIp(request);
  const allowed = await rateLimit(`register:${ip}`, 5, 3600, false);
  if (!allowed) {
    return NextResponse.json(
      { error: "注册请求过于频繁，请稍后再试" },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const { email, username, password } = body;

    const result = await registerMember({ email, username, password });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ user: result.user }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "注册失败，请重试" }, { status: 500 });
  }
}
