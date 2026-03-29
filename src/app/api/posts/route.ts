import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listPublishedPosts, createPost } from "@/lib/services/postService";

export const dynamic = "force-dynamic";

// GET /api/posts - List posts with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await listPublishedPosts({
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "12"),
      category: searchParams.get("category") || undefined,
      search: searchParams.get("search") || undefined,
    });

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("GET /api/posts error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/posts - Create new post (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.title || !body.content || !body.categoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const post = await createPost({
      title: body.title,
      content: body.content,
      excerpt: body.excerpt,
      coverImage: body.coverImage,
      status: body.status,
      isLocked: body.isLocked,
      categoryId: body.categoryId,
      authorId: session.user.id,
      tags: body.tags,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_CATEGORY") {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    console.error("POST /api/posts error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
