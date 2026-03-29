import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listAdminPosts, updatePost, deletePost } from "@/lib/services/postService";

export const dynamic = "force-dynamic";

// GET /api/admin/posts - List all posts for admin (includes drafts)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const result = await listAdminPosts({
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      status: (searchParams.get("status") as "DRAFT" | "PUBLISHED" | "ARCHIVED") || undefined,
      search: searchParams.get("search") || undefined,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/admin/posts error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/admin/posts - Update a post
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "Post ID required" }, { status: 400 });
    }

    const post = await updatePost({
      id: body.id,
      title: body.title,
      content: body.content,
      excerpt: body.excerpt,
      coverImage: body.coverImage,
      categoryId: body.categoryId,
      status: body.status,
      isLocked: body.isLocked,
      tags: body.tags,
    });

    return NextResponse.json(post);
  } catch (err) {
    if (err instanceof Error && err.message === "POST_NOT_FOUND") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    console.error("PUT /api/admin/posts error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/posts?id=xxx - Delete a post
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Post ID required" }, { status: 400 });
    }

    await deletePost(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "POST_NOT_FOUND") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    console.error("DELETE /api/admin/posts error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
