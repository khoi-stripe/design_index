import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { demoGuard } from "@/lib/demo-guard";

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const team = searchParams.get("team");

  const where: Record<string, unknown> = {};
  if (team) where.team = team;

  const libraries = await prisma.library.findMany({
    where,
    include: { _count: { select: { patterns: true } } },
    orderBy: [{ team: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(libraries);
}

export async function POST(request: NextRequest) {
  const guard = demoGuard(); if (guard) return guard;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, team, description, status } = body;
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const slug = slugify(name);
  const existing = await prisma.library.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "A library with this name already exists" }, { status: 409 });
  }

  const library = await prisma.library.create({
    data: {
      name,
      slug,
      team: team || "",
      description: description || "",
      status: status || "concept",
    },
    include: { _count: { select: { patterns: true } } },
  });

  return NextResponse.json(library, { status: 201 });
}
