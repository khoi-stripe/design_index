import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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
      collectionPatterns: {
        include: { collection: true },
      },
    },
  });

  if (!pattern) {
    return NextResponse.json({ error: "Pattern not found" }, { status: 404 });
  }

  const relatedPatterns = await prisma.pattern.findMany({
    where: {
      id: { not: id },
      tags: {
        some: {
          tagId: { in: pattern.tags.map((t) => t.tagId) },
        },
      },
    },
    include: { tags: { include: { tag: true } } },
    take: 6,
  });

  return NextResponse.json({ pattern, relatedPatterns });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { title, description, category, status, featured, tags } = body;

  const updateData: Record<string, unknown> = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (category !== undefined) updateData.category = category;
  if (status !== undefined) updateData.status = status;
  if (featured !== undefined) updateData.featured = featured;

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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.pattern.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
