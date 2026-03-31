import { NextResponse } from "next/server";
import { getForumCategories } from "@/lib/services/forumService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await getForumCategories();
    return NextResponse.json(categories);
  } catch {
    return NextResponse.json({ error: "获取版块失败" }, { status: 500 });
  }
}
