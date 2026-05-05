import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(entityType ? { entityType } : {}),
      ...(entityId ? { entityId } : {}),
    },
    include: {
      user: { select: { name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  const total = await prisma.auditLog.count({
    where: {
      ...(entityType ? { entityType } : {}),
      ...(entityId ? { entityId } : {}),
    },
  });

  return NextResponse.json({ logs, total, page, limit });
}
