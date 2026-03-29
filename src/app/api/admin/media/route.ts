import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { minioClient, BUCKET, ensureBucket } from "@/lib/minio";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// GET /api/admin/media - List media files
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.media.count(),
    ]);

    return NextResponse.json({
      media,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("GET /api/admin/media error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/media - Upload file
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    await ensureBucket();

    const ext = file.name.split(".").pop() || "jpg";
    const hash = crypto.randomBytes(8).toString("hex");
    const objectName = `uploads/${new Date().toISOString().slice(0, 10)}/${hash}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    await minioClient.putObject(BUCKET, objectName, buffer, buffer.length, {
      "Content-Type": file.type,
    });

    const s3Endpoint = process.env.S3_PUBLIC_URL
      || `${process.env.S3_ENDPOINT || "http://localhost"}:${process.env.S3_PORT || "9000"}`;
    const url = `${s3Endpoint}/${BUCKET}/${objectName}`;

    const media = await prisma.media.create({
      data: {
        url,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      },
    });

    return NextResponse.json(media, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/media error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// DELETE /api/admin/media?id=xxx - Delete media
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Media ID required" }, { status: 400 });
    }

    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Extract object name from URL
    try {
      const urlPath = new URL(media.url).pathname;
      const objectName = urlPath.replace(`/${BUCKET}/`, "");
      await minioClient.removeObject(BUCKET, objectName);
    } catch {
      // Object may already be deleted from storage
    }

    await prisma.media.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/media error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
