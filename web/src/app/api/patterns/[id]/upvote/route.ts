import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: patternId } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { visitorId } = body;
  if (!visitorId) {
    return NextResponse.json({ error: "visitorId is required" }, { status: 400 });
  }

  const existing = await prisma.upvote.findUnique({
    where: { patternId_visitorId: { patternId, visitorId } },
  });

  if (existing) {
    await prisma.upvote.delete({ where: { id: existing.id } });
    const count = await prisma.upvote.count({ where: { patternId } });
    return NextResponse.json({ upvoted: false, count });
  }

  await prisma.upvote.create({ data: { patternId, visitorId } });
  const count = await prisma.upvote.count({ where: { patternId } });
  return NextResponse.json({ upvoted: true, count });
}
