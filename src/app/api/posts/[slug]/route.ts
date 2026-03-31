import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { getPostBySlug } from "@/lib/services/postService";

export const dynamic = "force-dynamic";

// GET /api/posts/[slug] - Get single post by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const result = await getPostBySlug(slug);

    if (!result) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/posts/[slug] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/posts/[slug] - Verify password for locked posts (rate limited: 5 per minute)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const ip = getClientIp(request);
    const allowed = await rateLimit(`rl:post-unlock:${ip}`, 5, 60);
    if (!allowed) {
      return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
    }

    const { slug } = await params;
    const body = await request.json();

    const post = await prisma.post.findUnique({
      where: { slug },
      select: { lockType: true, lockPassword: true },
    });

    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    if (post.lockType !== "password") return NextResponse.json({ error: "Not password locked" }, { status: 400 });
    if (!body.password || !post.lockPassword) {
      return NextResponse.json({ error: "密码不正确" }, { status: 403 });
    }
    // Support both bcrypt hashed and legacy plaintext passwords
    const isHashed = post.lockPassword.startsWith("$2");
    const match = isHashed
      ? await compare(body.password, post.lockPassword)
      : body.password === post.lockPassword;
    if (!match) {
      return NextResponse.json({ error: "密码不正确" }, { status: 403 });
    }

    // Return full content upon successful unlock
    const fullPost = await prisma.post.findUnique({
      where: { slug },
      select: { content: true },
    });

    return NextResponse.json({ success: true, content: fullPost?.content || "" });
  } catch (err) {
    console.error("POST /api/posts/[slug] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
