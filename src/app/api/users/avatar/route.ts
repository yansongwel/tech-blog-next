import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "请选择文件" }, { status: 400 });
  }

  // Upload to MinIO via existing media API
  const uploadForm = new FormData();
  uploadForm.append("file", file);

  const mediaRes = await fetch(new URL("/api/admin/media", request.url).toString(), {
    method: "POST",
    body: uploadForm,
    headers: {
      cookie: request.headers.get("cookie") || "",
    },
  });

  if (!mediaRes.ok) {
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }

  const media = await mediaRes.json();

  // Update user avatar
  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatar: media.url },
  });

  return NextResponse.json({ url: media.url });
}
