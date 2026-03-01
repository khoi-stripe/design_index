import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const tags = await prisma.tag.findMany({
    where: {
      patterns: { some: {} },
    },
    include: {
      _count: { select: { patterns: true } },
      patterns: {
        select: { pattern: { select: { createdAt: true } } },
        orderBy: { pattern: { createdAt: "desc" } },
        take: 1,
      },
    },
  });

  const sorted = tags
    .map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      category: tag.category,
      _count: tag._count,
      latestAt: tag.patterns[0]?.pattern.createdAt ?? new Date(0),
    }))
    .sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime());

  return NextResponse.json(sorted);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, category } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const tag = await prisma.tag.upsert({
    where: { slug },
    update: { category: category || "general" },
    create: { name, slug, category: category || "general" },
  });

  return NextResponse.json(tag, { status: 201 });
}
