import { NextRequest, NextResponse } from "next/server";
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
