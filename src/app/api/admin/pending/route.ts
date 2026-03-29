import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/pending - Count pending items for notification bell
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [pendingComments, draftPosts, unconfirmedSubscribers] = await Promise.all([
      prisma.comment.count({ where: { approved: false } }),
      prisma.post.count({ where: { status: "DRAFT" } }),
      prisma.subscription.count({ where: { confirmed: false } }),
    ]);

    return NextResponse.json({
      pendingComments,
      draftPosts,
      unconfirmedSubscribers,
    }, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  } catch (err) {
    console.error("GET /api/admin/pending error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
