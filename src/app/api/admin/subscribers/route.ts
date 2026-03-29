import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/subscribers - List subscribers with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const status = searchParams.get("status"); // "confirmed" | "unconfirmed" | null
    const search = searchParams.get("search");

    const where = {
      ...(status === "confirmed" && { confirmed: true }),
      ...(status === "unconfirmed" && { confirmed: false }),
      ...(search && {
        email: { contains: search, mode: "insensitive" as const },
      }),
    };

    const [subscribers, total, confirmedCount] = await Promise.all([
      prisma.subscription.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.subscription.count({ where }),
      prisma.subscription.count({ where: { confirmed: true } }),
    ]);

    const totalAll = await prisma.subscription.count();

    return NextResponse.json({
      subscribers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: {
        total: totalAll,
        confirmed: confirmedCount,
        unconfirmed: totalAll - confirmedCount,
        confirmRate: totalAll > 0 ? Math.round((confirmedCount / totalAll) * 100) : 0,
      },
    });
  } catch (err) {
    console.error("GET /api/admin/subscribers error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/subscribers - Manually add subscriber
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
    }

    const existing = await prisma.subscription.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "该邮箱已订阅" }, { status: 409 });
    }

    const subscriber = await prisma.subscription.create({
      data: { email, confirmed: true }, // Admin-added = auto-confirmed
    });

    return NextResponse.json(subscriber, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/subscribers error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/subscribers?id=xxx or ?ids=a,b,c (batch)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const ids = searchParams.get("ids");

    if (ids) {
      // Batch delete
      const idList = ids.split(",").filter(Boolean);
      await prisma.subscription.deleteMany({ where: { id: { in: idList } } });
      return NextResponse.json({ success: true, deleted: idList.length });
    }

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await prisma.subscription.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/subscribers error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
