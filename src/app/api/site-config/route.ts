import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/site-config - Public site config (no auth needed)
export async function GET() {
  const configs = await prisma.siteConfig.findMany();
  const settings: Record<string, string> = {};
  for (const c of configs) {
    settings[c.key] = c.value;
  }
  return NextResponse.json(settings);
}
