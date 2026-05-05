import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
  });

  if (!player) {
    return NextResponse.json({ error: "Player profile not found" }, { status: 404 });
  }

  const results = await prisma.gameResult.findMany({
    where: { playerId: player.id },
    include: {
      game: {
        select: {
          gameNumber: true,
          status: true,
          group: {
            select: {
              name: true,
              stage: {
                select: {
                  name: true,
                  tournament: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { game: { group: { stage: { stageOrder: "asc" } } } },
  });

  const formatted = results.map((r) => ({
    id: r.id,
    placement: r.placement,
    points: r.points,
    game: {
      gameNumber: r.game.gameNumber,
      group: {
        name: r.game.group.name,
        stage: {
          name: r.game.group.stage.name,
        },
      },
    },
  }));

  return NextResponse.json(formatted);
}
