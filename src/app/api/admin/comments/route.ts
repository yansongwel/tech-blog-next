import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  listAdminComments,
  approveComment,
  deleteComment,
} from "@/lib/services/commentService";

export const dynamic = "force-dynamic";

// GET /api/admin/comments - List all comments for admin
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const approvedParam = searchParams.get("approved");

    const result = await listAdminComments({
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      approved:
        approvedParam !== null && approvedParam !== ""
          ? approvedParam === "true"
          : null,
      search: searchParams.get("search") || undefined,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/admin/comments error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/admin/comments - Approve a comment
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "Comment ID required" }, { status: 400 });
    }

    const comment = await approveComment(body.id, Boolean(body.approved));
    return NextResponse.json(comment);
  } catch (err) {
    if (err instanceof Error && err.message === "COMMENT_NOT_FOUND") {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }
    console.error("PUT /api/admin/comments error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/comments?id=xxx - Delete a comment
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Comment ID required" }, { status: 400 });
    }

    await deleteComment(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "COMMENT_NOT_FOUND") {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }
    console.error("DELETE /api/admin/comments error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
