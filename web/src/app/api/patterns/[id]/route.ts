import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { demoGuard } from "@/lib/demo-guard";
import { ensureTags } from "@/lib/tags";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const pattern = await prisma.pattern.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
      versions: {
        orderBy: { createdAt: "desc" },
        include: { tags: { include: { tag: true } } },
      },
      images: { orderBy: { sortOrder: "asc" } },
      library: true,
      _count: { select: { upvotes: true } },
      collectionPatterns: {
        include: { collection: true },
      },
    },
  });

  if (!pattern) {
    return NextResponse.json({ error: "Pattern not found" }, { status: 404 });
  }

  const visitorId = new URL(_request.url).searchParams.get("visitorId");
  let upvotedByVisitor = false;
  if (visitorId) {
    const vote = await prisma.upvote.findUnique({
      where: { patternId_visitorId: { patternId: id, visitorId } },
    });
    upvotedByVisitor = !!vote;
  }

  const relatedPatterns = await prisma.pattern.findMany({
    where: {
      id: { not: id },
      tags: {
        some: {
          tagId: { in: pattern.tags.map((t: any) => t.tagId) },
        },
      },
    },
    include: { tags: { include: { tag: true } }, library: true },
    take: 6,
  });

  const effectiveStatus = pattern.status || "concept";

  return NextResponse.json({
    pattern: { ...pattern, effectiveStatus, upvotedByVisitor },
    relatedPatterns,
  });
}

export async function PUT(
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
  const { title, description, category, status, featured, tags, libraryId } = body;

  const updateData: Record<string, unknown> = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (category !== undefined) updateData.category = category;
  if (status !== undefined) updateData.status = status;
  if (featured !== undefined) updateData.featured = featured;
  if (libraryId !== undefined) updateData.libraryId = libraryId || null;

  if (tags) {
    await prisma.patternTag.deleteMany({ where: { patternId: id } });
    const resolved = await ensureTags(tags as string[]);
    for (const { tagId } of resolved) {
      await prisma.patternTag.create({ data: { patternId: id, tagId } });
    }
  }

  const pattern = await prisma.pattern.update({
    where: { id },
    data: updateData,
    include: { tags: { include: { tag: true } } },
  });

  return NextResponse.json(pattern);
}

export async function PATCH(
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

  // imageOrder: ["primary", "img-id-1", "img-id-2", ...]
  // "primary" = the original primary image. Any other string = a PatternImage ID.
  // First item becomes the new primary.
  const { imageOrder } = body as { imageOrder: string[] };
  if (!imageOrder || !Array.isArray(imageOrder) || imageOrder.length === 0) {
    return NextResponse.json({ error: "imageOrder array is required" }, { status: 400 });
  }

  const patternRecord = await prisma.pattern.findUnique({
    where: { id },
    include: {
      versions: { orderBy: { createdAt: "desc" }, take: 1 },
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!patternRecord) {
    return NextResponse.json({ error: "Pattern not found" }, { status: 404 });
  }

  const newFirstId = imageOrder[0];

  // If a non-primary image was moved to first position, swap it with the primary
  if (newFirstId !== "primary") {
    const promoted = patternRecord.images.find((img: any) => img.id === newFirstId);
    if (promoted) {
      const oldPrimary = {
        screenshotUrl: patternRecord.screenshotUrl,
        thumbnailUrl: patternRecord.thumbnailUrl,
        dominantColor: patternRecord.dominantColor,
      };
      const newPrimary = {
        screenshotUrl: promoted.screenshotUrl,
        thumbnailUrl: promoted.thumbnailUrl,
        dominantColor: promoted.dominantColor,
      };
      // The promoted image record now holds the old primary's data
      await prisma.patternImage.update({ where: { id: promoted.id }, data: oldPrimary });
      // The pattern (and latest version) now holds the promoted image's data
      await prisma.pattern.update({ where: { id }, data: newPrimary });
      if (patternRecord.versions[0]) {
        await prisma.patternVersion.update({ where: { id: patternRecord.versions[0].id }, data: newPrimary });
      }
    }
  }

  // Update sortOrder for all additional images (everything after position 0).
  // After a swap, "primary" in the remaining list refers to the promoted image's
  // DB record (which now holds the old primary data).
  for (let i = 0; i < imageOrder.length - 1; i++) {
    const itemId = imageOrder[i + 1];
    // Resolve "primary" to the image record that received the old primary's data
    const dbId = itemId === "primary" ? newFirstId : itemId;
    if (dbId && dbId !== "primary") {
      await prisma.patternImage.update({ where: { id: dbId }, data: { sortOrder: i + 1 } });
    }
  }

  const updated = await prisma.pattern.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
      versions: { orderBy: { createdAt: "desc" }, include: { tags: { include: { tag: true } } } },
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  return NextResponse.json({ pattern: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = demoGuard(); if (guard) return guard;
  const { id } = await params;

  await prisma.pattern.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
