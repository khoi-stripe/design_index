import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { demoGuard } from "@/lib/demo-guard";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authorName = searchParams.get("authorName");

  const patternFilter: Record<string, unknown> = {};
  if (authorName) {
    patternFilter.pattern = { authorName };
  }

  const tags = await prisma.tag.findMany({
    where: {
      patterns: { some: patternFilter },
    },
    include: {
      _count: { select: { patterns: true } },
      patterns: {
        where: patternFilter,
        select: { pattern: { select: { createdAt: true } } },
        orderBy: { pattern: { createdAt: "desc" } },
        take: 1,
      },
    },
  });

  const sorted = tags
    .map((tag: any) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      category: tag.category,
      _count: tag._count,
      latestAt: tag.patterns[0]?.pattern.createdAt ?? new Date(0),
    }))
    .sort((a: any, b: any) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime());

  return NextResponse.json(sorted);
}

export async function POST(request: NextRequest) {
  const guard = demoGuard(); if (guard) return guard;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { name, category } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const slug = slugify(name);

  const tag = await prisma.tag.upsert({
    where: { slug },
    update: { category: category || "general" },
    create: { name, slug, category: category || "general" },
  });

  return NextResponse.json(tag, { status: 201 });
}
