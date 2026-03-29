import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

// POST /api/posts/[slug] - Verify password for locked posts
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const post = await prisma.post.findUnique({
      where: { slug },
      select: { lockType: true, lockPassword: true },
    });

    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    if (post.lockType !== "password") return NextResponse.json({ error: "Not password locked" }, { status: 400 });
    if (!body.password || body.password !== post.lockPassword) {
      return NextResponse.json({ error: "密码不正确" }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/posts/[slug] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
