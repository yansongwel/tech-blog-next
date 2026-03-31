import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { isPinned, isFeatured, isLocked } = body;

  const data: Record<string, boolean> = {};
  if (typeof isPinned === "boolean") data.isPinned = isPinned;
  if (typeof isFeatured === "boolean") data.isFeatured = isFeatured;
  if (typeof isLocked === "boolean") data.isLocked = isLocked;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "无有效操作" }, { status: 400 });
  }

  const post = await prisma.forumPost.update({
    where: { id },
    data,
    select: { id: true, title: true, isPinned: true, isFeatured: true, isLocked: true },
  });

  return NextResponse.json(post);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.forumPost.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
