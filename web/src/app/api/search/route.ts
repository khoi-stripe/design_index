import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const [patterns, tags, authors] = await Promise.all([
    prisma.pattern.findMany({
      where: { title: { contains: q } },
      select: { id: true, title: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.tag.findMany({
      where: { name: { contains: q }, patterns: { some: {} } },
      select: { name: true, slug: true },
      take: 5,
    }),
    prisma.pattern.findMany({
      where: { authorName: { contains: q } },
      select: { authorName: true, authorAvatar: true },
      distinct: ["authorName"],
      take: 5,
    }),
  ]);

  const suggestions: { type: string; label: string; value: string; avatar?: string }[] = [];

  for (const t of tags) {
    suggestions.push({ type: "tag", label: t.name, value: t.slug });
  }
  for (const p of patterns) {
    suggestions.push({ type: "pattern", label: p.title, value: p.title });
  }
  for (const a of authors) {
    if (a.authorName) {
      suggestions.push({ type: "author", label: a.authorName, value: a.authorName, avatar: a.authorAvatar || undefined });
    }
  }

  return NextResponse.json(suggestions.slice(0, 10));
}
