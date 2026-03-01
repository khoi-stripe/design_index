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

  const meta = await sharp(buffer).metadata();
  const w = meta.width || THUMB_SIZE;
  const h = meta.height || THUMB_SIZE;
  const side = Math.min(w, h);

  const thumbBuffer = await sharp(buffer)
    .extract({
      left: Math.floor((w - side) / 2),
      top: 0,
      width: side,
      height: side,
    })
    .resize(THUMB_SIZE, THUMB_SIZE)
    .png({ quality: 85 })
    .toBuffer();

  await writeFile(path.join(uploadDir, thumbFilename), thumbBuffer);

  return NextResponse.json({
    url: `/uploads/${filename}`,
    thumbnailUrl: `/uploads/${thumbFilename}`,
    filename,
  });
}
