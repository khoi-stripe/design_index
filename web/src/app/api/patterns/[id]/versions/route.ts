import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const FIGMA_SCREENSHOT_URL = "/api/figma/screenshot";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { figmaUrl, label, description, tags } = body;

  if (!figmaUrl) {
    return NextResponse.json({ error: "Figma URL is required" }, { status: 400 });
  }

  let screenshotUrl = "";
  let thumbnailUrl = "";
  let dominantColor = "";

  try {
    const origin = request.nextUrl.origin;
    const screenshotRes = await fetch(`${origin}${FIGMA_SCREENSHOT_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ figmaUrl }),
    });

    if (screenshotRes.ok) {
      const screenshotData = await screenshotRes.json();
      screenshotUrl = screenshotData.screenshotUrl;
      thumbnailUrl = screenshotData.thumbnailUrl;
      dominantColor = screenshotData.dominantColor;
    }
  } catch {
    // Screenshot fetch failed — continue without it
  }

  const maxVersion = await prisma.patternVersion.aggregate({
    where: { patternId: id },
    _max: { versionNumber: true },
  });
  const versionNumber = (maxVersion._max.versionNumber || 0) + 1;

  const tagConnects: { tagId: string }[] = [];
  if (tags?.length) {
    for (const tagSlug of tags as string[]) {
      const tag = await prisma.tag.upsert({
        where: { slug: tagSlug },
        update: {},
        create: {
          name: tagSlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
          slug: tagSlug,
        },
      });
      tagConnects.push({ tagId: tag.id });
    }
  }

  const version = await prisma.patternVersion.create({
    data: {
      patternId: id,
      versionNumber,
      figmaUrl,
      label: label || `v${versionNumber}`,
      description: description || "",
      screenshotUrl,
      thumbnailUrl,
      dominantColor,
      tags: tagConnects.length ? { create: tagConnects.map((t) => ({ tagId: t.tagId })) } : undefined,
    },
    include: { tags: { include: { tag: true } } },
  });

  const figmaDeepLink = figmaUrl.startsWith("http") ? figmaUrl : "";
  await prisma.pattern.update({
    where: { id },
    data: {
      ...(screenshotUrl ? { screenshotUrl } : {}),
      ...(thumbnailUrl ? { thumbnailUrl } : {}),
      ...(dominantColor ? { dominantColor } : {}),
      ...(figmaDeepLink ? { figmaDeepLink } : {}),
    },
  });

  return NextResponse.json(version, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { searchParams } = new URL(request.url);
  const versionId = searchParams.get("versionId");

  if (!versionId) {
    return NextResponse.json({ error: "versionId is required" }, { status: 400 });
  }

  await prisma.patternVersion.delete({ where: { id: versionId } });
  return NextResponse.json({ success: true });
}
