import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

/**
 * POST /api/admin/predictions/[predictionId]/lock
 * Admin khóa/mở khóa một prediction thủ công.
 * Body: { action: "lock" | "unlock" }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ predictionId: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { predictionId } = await params;
  const { action } = await req.json();

  if (!["lock", "unlock"].includes(action)) {
    return NextResponse.json({ error: "Hành động không hợp lệ" }, { status: 400 });
  }

  const prediction = await prisma.prediction.findUnique({
    where: { id: predictionId },
    include: { stage: { select: { id: true, name: true } } },
  });

  if (!prediction) {
    return NextResponse.json({ error: "Không tìm thấy dự đoán" }, { status: 404 });
  }

  const newStatus = action === "lock" ? "LOCKED" : "OPEN";

  if (prediction.status === "SCORED") {
    return NextResponse.json(
      { error: "Không thể thay đổi dự đoán đã được chấm điểm" },
      { status: 400 }
    );
  }

  const updated = await prisma.prediction.update({
    where: { id: predictionId },
    data: { status: newStatus },
  });

  await auditLog({
    userId: session.user.id,
    action: `PREDICTION_${action.toUpperCase()}`,
    entityType: "Prediction",
    entityId: predictionId,
    before: { status: prediction.status },
    after: { status: newStatus },
  });

  return NextResponse.json({
    message: `Dự đoán đã được ${action === "lock" ? "khóa" : "mở khóa"}`,
    status: updated.status,
  });
}
