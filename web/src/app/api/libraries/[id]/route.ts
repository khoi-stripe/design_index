import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { demoGuard } from "@/lib/demo-guard";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const library = await prisma.library.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: { _count: { select: { patterns: true } } },
  });

  if (!library) {
    return NextResponse.json({ error: "Library not found" }, { status: 404 });
  }

  return NextResponse.json(library);
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

  const { name, team, description, status } = body;
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (team !== undefined) updateData.team = team;
  if (description !== undefined) updateData.description = description;
  if (status !== undefined) updateData.status = status;

  const library = await prisma.library.update({
    where: { id },
    data: updateData,
    include: { _count: { select: { patterns: true } } },
  });

  return NextResponse.json(library);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = demoGuard(); if (guard) return guard;
  const { id } = await params;

  await prisma.library.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
