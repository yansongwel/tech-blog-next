import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDashboardStats } from "@/lib/services/statsService";

export const dynamic = "force-dynamic";

// GET /api/admin/stats - Dashboard statistics
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const range = (searchParams.get("range") || "7d") as "1d" | "7d" | "30d" | "90d";
    const data = await getDashboardStats(range);
    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/admin/stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
