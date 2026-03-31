import { NextResponse } from "next/server";
import { checkUsernameAvailable } from "@/lib/services/memberService";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const allowed = await rateLimit(`check-username:${ip}`, 30, 60);
  if (!allowed) {
    return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ available: false, error: "请提供用户名" });
  }

  const available = await checkUsernameAvailable(username);
  return NextResponse.json({ available });
}
