import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";
import sharp from "sharp";

const THUMB_SIZE = 800;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const id = uuid();
  const ext = file.name.split(".").pop() || "png";
  const filename = `${id}.${ext}`;
  const thumbFilename = `${id}-thumb.${ext}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  await writeFile(path.join(uploadDir, filename), buffer);

  const thumbBuffer = await sharp(buffer)
    .resize({
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png({ quality: 85 })
    .toBuffer();

  await writeFile(path.join(uploadDir, thumbFilename), thumbBuffer);

  const { dominant } = await sharp(thumbBuffer).stats();
  const r = dominant.r, g = dominant.g, b = dominant.b;
  const dominantColor = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

  return NextResponse.json({
    url: `/uploads/${filename}`,
    thumbnailUrl: `/uploads/${thumbFilename}`,
    dominantColor,
    filename,
  });
}
