import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // S-02: Exclude password field explicitly
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      player: {
        select: {
          ign: true,
          isGuest: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}
