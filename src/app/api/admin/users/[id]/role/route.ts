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
  const { role } = body;

  if (!["ADMIN", "EDITOR", "MEMBER"].includes(role)) {
    return NextResponse.json({ error: "无效角色" }, { status: 400 });
  }

  // Prevent self-demotion
  if (id === session.user.id && role !== "ADMIN") {
    return NextResponse.json({ error: "不能修改自己的角色" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, email: true, username: true, role: true },
  });

  return NextResponse.json(user);
}
