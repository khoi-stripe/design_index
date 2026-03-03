import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { processAndStoreImage } from "@/lib/image";
import { demoGuard } from "@/lib/demo-guard";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];

export async function POST(request: NextRequest) {
  const guard = demoGuard(); if (guard) return guard;
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 400 });
  }

  if (file.type && !ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type. Allowed: PNG, JPEG, WebP, GIF" }, { status: 400 });
  }

  let bytes: ArrayBuffer;
  try {
    bytes = await file.arrayBuffer();
  } catch {
    return NextResponse.json({ error: "Failed to read file" }, { status: 400 });
  }
  const buffer = Buffer.from(bytes);

  const id = uuid();
  const ext = file.name.split(".").pop() || "png";
  const filename = `${id}.${ext}`;
  const thumbFilename = `${id}-thumb.${ext}`;

  try {
    const { dominantColor } = await processAndStoreImage(buffer, filename, thumbFilename);

    return NextResponse.json({
      url: `/uploads/${filename}`,
      thumbnailUrl: `/uploads/${thumbFilename}`,
      dominantColor,
      filename,
    });
  } catch {
    return NextResponse.json({ error: "Failed to process image" }, { status: 422 });
  }
}
