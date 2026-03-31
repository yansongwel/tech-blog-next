import { NextResponse } from "next/server";
import { getForumPost } from "@/lib/services/forumService";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const post = await getForumPost(slug);
    if (!post) {
      return NextResponse.json({ error: "帖子不存在" }, { status: 404 });
    }
    return NextResponse.json(post);
  } catch {
    return NextResponse.json({ error: "获取帖子失败" }, { status: 500 });
  }
}
