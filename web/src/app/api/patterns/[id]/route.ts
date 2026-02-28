import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const pattern = await prisma.pattern.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
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
  const body = await request.json();
  const { title, description, status, featured, tags } = body;

  const updateData: Record<string, unknown> = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (status !== undefined) updateData.status = status;
  if (featured !== undefined) updateData.featured = featured;

  if (tags) {
    await prisma.patternTag.deleteMany({ where: { patternId: id } });

    for (const tagSlug of tags) {
      const tag = await prisma.tag.upsert({
        where: { slug: tagSlug },
        update: {},
        create: {
          name: tagSlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
          slug: tagSlug,
        },
      });
      await prisma.patternTag.create({
        data: { patternId: id, tagId: tag.id },
      });
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
