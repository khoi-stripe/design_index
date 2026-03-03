import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { demoGuard } from "@/lib/demo-guard";
import { ensureTags } from "@/lib/tags";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag");
  const tags = searchParams.get("tags");
  const author = searchParams.get("author");
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const status = searchParams.get("status");
  const featured = searchParams.get("featured");
  const libraryId = searchParams.get("libraryId");
  const team = searchParams.get("team");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "50") || 50));
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0") || 0);

  const where: Record<string, unknown> = {};
  const andClauses: unknown[] = [];

  if (status) {
    andClauses.push({ status });
  }

  if (featured === "true") {
    where.featured = true;
  }

  if (category) {
    where.category = category;
  }

  if (libraryId) {
    where.libraryId = libraryId;
  }

  if (team) {
    where.library = { team };
  }

  if (tags) {
    const tagSlugs = tags.split(",").map((t) => t.trim()).filter(Boolean);
    for (const slug of tagSlugs) {
      andClauses.push({ tags: { some: { tag: { slug } } } });
    }
  } else if (tag) {
    where.tags = {
      some: { tag: { slug: tag } },
    };
  }

  if (author) {
    where.authorName = author;
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
    if (dateTo) {
      const to = new Date(dateTo);
      to.setUTCHours(23, 59, 59, 999);
      (where.createdAt as Record<string, unknown>).lte = to;
    }
  }

  if (search) {
    andClauses.push({
      OR: [
        { title: { contains: search } },
        { description: { contains: search } },
        { authorName: { contains: search } },
        { tags: { some: { tag: { name: { contains: search } } } } },
        { library: { name: { contains: search } } },
        { library: { team: { contains: search } } },
      ],
    });
  }

  if (andClauses.length > 0) {
    where.AND = andClauses;
  }

  const [patterns, total] = await Promise.all([
    prisma.pattern.findMany({
      where,
      include: {
        tags: { include: { tag: true } },
        images: { orderBy: { sortOrder: "asc" } },
        library: true,
        _count: { select: { upvotes: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.pattern.count({ where }),
  ]);

  const patternsWithEffectiveStatus = patterns.map((p: any) => ({
    ...p,
    effectiveStatus: p.status || "concept",
  }));

  return NextResponse.json({ patterns: patternsWithEffectiveStatus, total, limit, offset });
}

export async function POST(request: NextRequest) {
  const guard = demoGuard(); if (guard) return guard;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { title, description, figmaFileKey, figmaNodeId, figmaPageName, screenshotUrl, thumbnailUrl, dominantColor, authorName, authorAvatar, tags, category, additionalImages, libraryId, status } = body;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const figmaDeepLink =
    figmaFileKey && figmaNodeId
      ? `https://www.figma.com/design/${figmaFileKey}?node-id=${encodeURIComponent(figmaNodeId)}`
      : "";

  const resolvedTags = tags?.length ? await ensureTags(tags as string[]) : [];

  const pattern = await prisma.pattern.create({
    data: {
      title,
      description: description || "",
      category: category || "flow",
      status: status || "",
      dominantColor: dominantColor || "",
      figmaFileKey: figmaFileKey || "",
      figmaNodeId: figmaNodeId || "",
      figmaDeepLink,
      figmaPageName: figmaPageName || "",
      screenshotUrl: screenshotUrl || "",
      thumbnailUrl: thumbnailUrl || screenshotUrl || "",
      authorName: authorName || "",
      authorAvatar: authorAvatar || "",
      libraryId: libraryId || null,
      tags: resolvedTags.length
        ? { create: resolvedTags.map((t) => ({ tagId: t.tagId })) }
        : undefined,
    },
    include: { tags: { include: { tag: true } }, library: true },
  });

  await prisma.patternVersion.create({
    data: {
      patternId: pattern.id,
      versionNumber: 1,
      label: "v1",
      figmaUrl: figmaDeepLink,
      description: description || "",
      screenshotUrl: screenshotUrl || "",
      thumbnailUrl: thumbnailUrl || screenshotUrl || "",
      dominantColor: dominantColor || "",
      authorName: authorName || "",
      authorAvatar: authorAvatar || "",
      tags: resolvedTags.length
        ? { create: resolvedTags.map((t) => ({ tagId: t.tagId })) }
        : undefined,
    },
  });

  if (additionalImages?.length) {
    for (let i = 0; i < additionalImages.length; i++) {
      const img = additionalImages[i];
      await prisma.patternImage.create({
        data: {
          patternId: pattern.id,
          screenshotUrl: img.screenshotUrl,
          thumbnailUrl: img.thumbnailUrl || img.screenshotUrl,
          dominantColor: img.dominantColor || "",
          label: img.label || "",
          nodeId: img.nodeId || "",
          nodeName: img.nodeName || "",
          sortOrder: i + 1,
        },
      });
    }
  }

  return NextResponse.json(pattern, { status: 201 });
}
