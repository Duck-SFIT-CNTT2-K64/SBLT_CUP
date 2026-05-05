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

  const groupPlayers = await prisma.groupPlayer.findMany({
    where: { playerId: player.id },
    include: {
      group: {
        include: {
          stage: {
            include: {
              tournament: {
                select: { id: true, name: true, season: true },
              },
            },
          },
          games: {
            select: {
              id: true,
              gameNumber: true,
              status: true,
              startTime: true,
            },
            orderBy: { gameNumber: "asc" },
          },
        },
      },
    },
  });

  // Flatten into a list of games with context
  const games = groupPlayers.flatMap((gp) =>
    gp.group.games.map((game) => ({
      id: game.id,
      gameNumber: game.gameNumber,
      status: game.status,
      startTime: game.startTime,
      group: {
        name: gp.group.name,
        stage: {
          name: gp.group.stage.name,
          date: gp.group.stage.date,
          startTime: gp.group.stage.startTime,
          tournament: gp.group.stage.tournament,
        },
      },
    }))
  );

  return NextResponse.json(games);
}
