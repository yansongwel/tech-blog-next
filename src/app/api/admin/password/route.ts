import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// PUT /api/admin/password - Change admin password (rate limited: 5 per 15 min)
export async function PUT(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const allowed = await rateLimit(`rl:pw-change:${ip}`, 5, 900, false);
    if (!allowed) {
      return NextResponse.json({ error: "操作过于频繁，请 15 分钟后再试" }, { status: 429 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "请填写当前密码和新密码" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "新密码至少需要 6 个字符" }, { status: 400 });
    }

    // Verify current password
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "当前密码不正确" }, { status: 400 });
    }

    // Hash and update
    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ success: true, message: "密码修改成功" });
  } catch (err) {
    console.error("PUT /api/admin/password error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
