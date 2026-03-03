import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { demoGuard } from "@/lib/demo-guard";
import { ensureTags } from "@/lib/tags";

const FIGMA_SCREENSHOT_URL = "/api/figma/screenshot";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = demoGuard(); if (guard) return guard;
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { figmaUrl, label, description, tags } = body;

  let screenshotUrl = body.screenshotUrl || "";
  let thumbnailUrl = body.thumbnailUrl || "";
  let dominantColor = body.dominantColor || "";

  if (!screenshotUrl && !figmaUrl) {
    return NextResponse.json({ error: "Figma URL or screenshot URL is required" }, { status: 400 });
  }

  if (!screenshotUrl && figmaUrl) {
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
  }

  const maxVersion = await prisma.patternVersion.aggregate({
    where: { patternId: id },
    _max: { versionNumber: true },
  });
  const versionNumber = (maxVersion._max.versionNumber || 0) + 1;

  const tagConnects = tags?.length ? await ensureTags(tags as string[]) : [];

  const version = await prisma.patternVersion.create({
    data: {
      patternId: id,
      versionNumber,
      figmaUrl: figmaUrl || "",
      label: label || `v${versionNumber}`,
      description: description || "",
      screenshotUrl,
      thumbnailUrl,
      dominantColor,
      tags: tagConnects.length ? { create: tagConnects.map((t) => ({ tagId: t.tagId })) } : undefined,
    },
    include: { tags: { include: { tag: true } } },
  });

  const figmaDeepLink = figmaUrl && figmaUrl.startsWith("http") ? figmaUrl : "";
  await prisma.pattern.update({
    where: { id },
    data: {
      ...(screenshotUrl ? { screenshotUrl } : {}),
      ...(thumbnailUrl ? { thumbnailUrl } : {}),
      ...(dominantColor ? { dominantColor } : {}),
      ...(figmaDeepLink ? { figmaDeepLink } : {}),
    },
  });

  const additionalImages = body.additionalImages;
  if (additionalImages?.length) {
    for (let i = 0; i < additionalImages.length; i++) {
      const img = additionalImages[i];
      await prisma.patternImage.create({
        data: {
          patternId: id,
          screenshotUrl: img.screenshotUrl,
          thumbnailUrl: img.thumbnailUrl || img.screenshotUrl,
          dominantColor: img.dominantColor || "",
          label: img.label || "",
          nodeId: img.nodeId || "",
          nodeName: img.nodeName || "",
          sortOrder: img.sortOrder ?? i + 1,
        },
      });
    }
  }

  return NextResponse.json(version, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = demoGuard(); if (guard) return guard;
  const { searchParams } = new URL(request.url);
  const versionId = searchParams.get("versionId");

  if (!versionId) {
    return NextResponse.json({ error: "versionId is required" }, { status: 400 });
  }

  await prisma.patternVersion.delete({ where: { id: versionId } });
  return NextResponse.json({ success: true });
}
