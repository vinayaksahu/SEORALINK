import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN" && session.role !== "SUPER_ROOT_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized administrative access" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided in request" }, { status: 400 });
    }

    // Validate mime type
    const mimeType = file.type || "";
    const allowedMime = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif", "image/svg+xml"];
    if (!allowedMime.includes(mimeType.toLowerCase()) && !file.name.match(/\.(png|jpe?g|webp|gif|svg)$/i)) {
      return NextResponse.json(
        { error: "Invalid file format. Please upload PNG, JPG, WebP, or GIF." },
        { status: 400 }
      );
    }

    const maxSizeBytes = 10 * 1024 * 1024; // 10MB limit
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: "Image file exceeds maximum allowable size (10MB)." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.promises.mkdir(uploadsDir, { recursive: true });

    const rawExt = file.name.split(".").pop()?.toLowerCase() || "png";
    const cleanExt = rawExt.replace(/[^a-z0-9]/g, "") || "png";
    const filename = `announcement_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${cleanExt}`;
    const destinationPath = path.join(uploadsDir, filename);

    await fs.promises.writeFile(destinationPath, buffer);

    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
    });
  } catch (error: any) {
    console.error("[Notice Image Upload Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to process image upload" },
      { status: 500 }
    );
  }
}
