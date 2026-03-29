import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/friend-links - List all friend links
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const links = await prisma.friendLink.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(links);
  } catch (err) {
    console.error("GET /api/admin/friend-links error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/friend-links - Create friend link
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.name || !body.url) {
      return NextResponse.json({ error: "名称和链接必填" }, { status: 400 });
    }

    const link = await prisma.friendLink.create({
      data: {
        name: body.name,
        url: body.url,
        description: body.description || null,
        logo: body.logo || null,
        sortOrder: body.sortOrder || 0,
        visible: body.visible !== false,
      },
    });

    return NextResponse.json(link, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/friend-links error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/admin/friend-links - Update friend link
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const existing = await prisma.friendLink.findUnique({ where: { id: body.id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const link = await prisma.friendLink.update({
      where: { id: body.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.url !== undefined && { url: body.url }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.logo !== undefined && { logo: body.logo || null }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
        ...(body.visible !== undefined && { visible: body.visible }),
      },
    });

    return NextResponse.json(link);
  } catch (err) {
    console.error("PUT /api/admin/friend-links error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/friend-links?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const existing = await prisma.friendLink.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.friendLink.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/friend-links error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
