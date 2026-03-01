import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";
import sharp from "sharp";

const THUMB_SIZE = 800;

function parseFigmaUrl(url: string): { fileKey: string; nodeId: string } | null {
  const fileMatch = url.match(
    /figma\.com\/(?:design|file|proto)\/([a-zA-Z0-9]+)/
  );
  if (!fileMatch) return null;

  const fileKey = fileMatch[1];

  const nodeMatch = url.match(/node-id=([^&]+)/);
  if (!nodeMatch) return null;

  const nodeId = decodeURIComponent(nodeMatch[1]);
  return { fileKey, nodeId };
}

export async function POST(request: NextRequest) {
  const { figmaUrl } = await request.json();

  if (!figmaUrl) {
    return NextResponse.json({ error: "figmaUrl is required" }, { status: 400 });
  }

  const token = process.env.FIGMA_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "FIGMA_API_TOKEN not configured" },
      { status: 500 }
    );
  }

  const parsed = parseFigmaUrl(figmaUrl);
  if (!parsed) {
    return NextResponse.json(
      { error: "Could not parse Figma URL. Ensure it includes a node-id parameter." },
      { status: 400 }
    );
  }

  const { fileKey, nodeId } = parsed;

  const imgApiUrl = `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&format=png&scale=2`;
  const imgRes = await fetch(imgApiUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!imgRes.ok) {
    const text = await imgRes.text();
    return NextResponse.json(
      { error: `Figma API error: ${imgRes.status} ${text}` },
      { status: 502 }
    );
  }

  const imgData = await imgRes.json();
  const images = imgData.images as Record<string, string | null>;
  const renderUrl = Object.values(images).find((v) => v);

  if (!renderUrl) {
    return NextResponse.json(
      { error: "Figma returned no image for this node" },
      { status: 502 }
    );
  }

  const pngRes = await fetch(renderUrl);
  if (!pngRes.ok) {
    return NextResponse.json(
      { error: "Failed to download rendered image from Figma" },
      { status: 502 }
    );
  }

  const buffer = Buffer.from(await pngRes.arrayBuffer());

  const id = uuid();
  const filename = `${id}.png`;
  const thumbFilename = `${id}-thumb.png`;

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
    screenshotUrl: `/uploads/${filename}`,
    thumbnailUrl: `/uploads/${thumbFilename}`,
    dominantColor,
  });
}
