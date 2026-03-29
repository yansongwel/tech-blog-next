import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/friend-links - Public list of visible friend links
export async function GET() {
  try {
    const links = await prisma.friendLink.findMany({
      where: { visible: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, url: true, description: true, logo: true },
    });

    return NextResponse.json(links, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (err) {
    console.error("GET /api/friend-links error:", err);
    return NextResponse.json([], { status: 500 });
  }
}
