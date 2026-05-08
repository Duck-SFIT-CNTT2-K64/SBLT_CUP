import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReactionType } from "@prisma/client";

const VALID_TYPES: ReactionType[] = ["LIKE", "FIRE", "TROPHY", "CLAP"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; entityId: string }> }
) {
  const { type, entityId } = await params;
  const session = await auth();

  // Get reaction counts
  const reactions = await prisma.reaction.groupBy({
    by: ["type"],
    where: {
      entityType: type,
      entityId,
    },
    _count: true,
  });

  // Get user's reactions if authenticated
  let userReactions: ReactionType[] = [];
  if (session?.user?.id) {
    const userReactionRecords = await prisma.reaction.findMany({
      where: {
        userId: session.user.id,
        entityType: type,
        entityId,
      },
      select: { type: true },
    });
    userReactions = userReactionRecords.map((r) => r.type);
  }

  const reactionCounts: Record<string, number> = {};
  for (const r of reactions) {
    reactionCounts[r.type] = r._count;
  }

  return NextResponse.json({
    counts: reactionCounts,
    userReactions,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; entityId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, entityId } = await params;
  const body = await req.json();
  const { reactionType } = body;

  if (!VALID_TYPES.includes(reactionType)) {
    return NextResponse.json({ error: "Loại reaction không hợp lệ" }, { status: 400 });
  }

  // Toggle reaction
  const existing = await prisma.reaction.findUnique({
    where: {
      userId_entityType_entityId_type: {
        userId: session.user.id,
        entityType: type,
        entityId,
        type: reactionType,
      },
    },
  });

  if (existing) {
    // Remove reaction
    await prisma.reaction.delete({
      where: { id: existing.id },
    });
    return NextResponse.json({ action: "removed", type: reactionType });
  } else {
    // Add reaction
    await prisma.reaction.create({
      data: {
        userId: session.user.id,
        entityType: type,
        entityId,
        type: reactionType,
      },
    });
    return NextResponse.json({ action: "added", type: reactionType });
  }
}
