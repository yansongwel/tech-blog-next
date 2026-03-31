import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const { name, bio, website, github } = body;

  // Validate fields
  const data: Record<string, string | null> = {};
  if (typeof name === "string") data.name = name.trim().slice(0, 50) || null;
  if (typeof bio === "string") data.bio = bio.trim().slice(0, 200) || null;
  if (typeof website === "string") data.website = website.trim().slice(0, 200) || null;
  if (typeof github === "string") data.github = github.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 39) || null;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: {
      id: true,
      username: true,
      name: true,
      bio: true,
      website: true,
      github: true,
    },
  });

  return NextResponse.json(user);
}
