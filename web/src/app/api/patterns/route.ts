import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag");
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const status = searchParams.get("status") || "published";
  const featured = searchParams.get("featured");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  const where: Record<string, unknown> = {};

  if (status !== "all") {
    where.status = status;
  }

  if (featured === "true") {
    where.featured = true;
  }

  if (category) {
    where.category = category;
  }

  if (tag) {
    where.tags = {
      some: { tag: { slug: tag } },
    };
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { authorName: { contains: search } },
      { tags: { some: { tag: { name: { contains: search } } } } },
    ];
  }

  const [patterns, total] = await Promise.all([
    prisma.pattern.findMany({
      where,
      include: {
        tags: { include: { tag: true } },
        images: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.pattern.count({ where }),
  ]);

  return NextResponse.json({ patterns, total, limit, offset });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, figmaFileKey, figmaNodeId, figmaPageName, screenshotUrl, thumbnailUrl, dominantColor, authorName, authorAvatar, tags, category, additionalImages } = body;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const figmaDeepLink =
    figmaFileKey && figmaNodeId
      ? `https://www.figma.com/design/${figmaFileKey}?node-id=${encodeURIComponent(figmaNodeId)}`
      : "";

  const resolvedTags: { tagId: string }[] = [];
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
      resolvedTags.push({ tagId: tag.id });
    }
  }

  const pattern = await prisma.pattern.create({
    data: {
      title,
      description: description || "",
      category: category || "flow",
      dominantColor: dominantColor || "",
      figmaFileKey: figmaFileKey || "",
      figmaNodeId: figmaNodeId || "",
      figmaDeepLink,
      figmaPageName: figmaPageName || "",
      screenshotUrl: screenshotUrl || "",
      thumbnailUrl: thumbnailUrl || screenshotUrl || "",
      authorName: authorName || "",
      authorAvatar: authorAvatar || "",
      tags: resolvedTags.length
        ? { create: resolvedTags.map((t) => ({ tagId: t.tagId })) }
        : undefined,
    },
    include: { tags: { include: { tag: true } } },
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
