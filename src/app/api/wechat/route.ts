import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// GET /api/wechat - WeChat server verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const signature = searchParams.get("signature");
  const timestamp = searchParams.get("timestamp");
  const nonce = searchParams.get("nonce");
  const echostr = searchParams.get("echostr");

  const token = process.env.WECHAT_TOKEN || "";
  const arr = [token, timestamp, nonce].sort();
  const hash = crypto.createHash("sha1").update(arr.join("")).digest("hex");

  if (hash === signature) {
    return new NextResponse(echostr);
  }
  return new NextResponse("Verification failed", { status: 403 });
}

// POST /api/wechat - Handle WeChat messages
export async function POST(request: NextRequest) {
  const body = await request.text();

  // Parse XML message from WeChat
  // For simplicity, using regex - in production use xml2js
  const fromUser = body.match(/<FromUserName><!\[CDATA\[(.*?)\]\]>/)?.[1];
  const content = body.match(/<Content><!\[CDATA\[(.*?)\]\]>/)?.[1]?.trim();

  if (!fromUser || !content) {
    return new NextResponse("success");
  }

  // Generate unlock code when user sends a keyword
  const keywords = ["K8S", "AI", "DBA", "SRE", "PYTHON", "GO"];
  const upperContent = content.toUpperCase();

  if (keywords.includes(upperContent)) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // Store code in Redis with 30 min expiry
    await redis.setex(`wechat:unlock:${code}`, 1800, fromUser);

    const replyXml = `<xml>
      <ToUserName><![CDATA[${fromUser}]]></ToUserName>
      <FromUserName><![CDATA[${process.env.WECHAT_APP_ID}]]></FromUserName>
      <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
      <MsgType><![CDATA[text]]></MsgType>
      <Content><![CDATA[您的验证码是：${code}\n有效期30分钟\n请在网站输入此验证码解锁文章]]></Content>
    </xml>`;

    return new NextResponse(replyXml, {
      headers: { "Content-Type": "application/xml" },
    });
  }

  return new NextResponse("success");
}

// POST /api/wechat/verify - Verify unlock code
export async function PUT(request: NextRequest) {
  const { code, postId, visitorId } = await request.json();

  if (!code) {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

  const stored = await redis.get(`wechat:unlock:${code}`);
  if (!stored) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
  }

  // Delete used code
  await redis.del(`wechat:unlock:${code}`);

  // Store unlock record in Redis (24h)
  await redis.setex(`unlock:${visitorId}:${postId}`, 86400, "1");

  return NextResponse.json({ unlocked: true });
}
