import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const tags = await prisma.tag.findMany({
    include: {
      _count: { select: { patterns: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(tags);
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
