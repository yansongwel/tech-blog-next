import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/tags - List all tags with post counts
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tags = await prisma.tag.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(tags);
  } catch (err) {
    console.error("GET /api/admin/tags error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/admin/tags - Rename a tag
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    if (!body.id || !body.name) {
      return NextResponse.json({ error: "ID and name required" }, { status: 400 });
    }

    const slug = body.name.toLowerCase().replace(/\s+/g, "-");
    const existing = await prisma.tag.findFirst({ where: { slug, id: { not: body.id } } });
    if (existing) return NextResponse.json({ error: "标签名已存在" }, { status: 400 });

    const tag = await prisma.tag.update({
      where: { id: body.id },
      data: { name: body.name, slug },
    });
    return NextResponse.json(tag);
  } catch (err) {
    console.error("PUT /api/admin/tags error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/tags?id=xxx - Delete a tag
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.$transaction([
      prisma.postTag.deleteMany({ where: { tagId: id } }),
      prisma.tag.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/tags error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
