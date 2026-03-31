import { NextResponse } from "next/server";
import { listForumPosts, createForumPost } from "@/lib/services/forumService";
import { auth } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await listForumPosts({
      categorySlug: searchParams.get("category") || undefined,
      sort: (searchParams.get("sort") as "latest" | "hot" | "unanswered") || "latest",
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      search: searchParams.get("search") || undefined,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "获取帖子失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const ip = getClientIp(request);
  const allowed = await rateLimit(`forum-post:${ip}`, 10, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "发帖过于频繁，请稍后再试" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { title, content, categoryId, tags } = body;

    if (!title?.trim() || !content?.trim() || !categoryId) {
      return NextResponse.json({ error: "标题、内容和版块不能为空" }, { status: 400 });
    }

    const post = await createForumPost({
      title,
      content,
      categoryId,
      authorId: session.user.id,
      tags,
    });

    return NextResponse.json(post, { status: 201 });
  } catch {
    return NextResponse.json({ error: "发帖失败" }, { status: 500 });
  }
}
