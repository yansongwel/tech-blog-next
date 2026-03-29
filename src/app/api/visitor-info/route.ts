import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

// GET /api/visitor-info - Get visitor IP and geolocation
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);

  // Skip geolocation for private/unknown IPs
  if (ip === "unknown" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
    return NextResponse.json(
      { ip, city: "", region: "", country: "" },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    // Use ip-api.com free geolocation service (no key required, 45 req/min)
    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city&lang=zh-CN`, {
      signal: AbortSignal.timeout(3000),
    });
    if (geoRes.ok) {
      const geo = await geoRes.json();
      if (geo.status === "success") {
        return NextResponse.json(
          { ip, city: geo.city, region: geo.regionName, country: geo.country },
          { headers: { "Cache-Control": "no-store" } }
        );
      }
    }
  } catch {
    // Geolocation failed, return IP only
  }

  return NextResponse.json(
    { ip, city: "", region: "", country: "" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
