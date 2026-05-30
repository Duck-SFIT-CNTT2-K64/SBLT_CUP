import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const predictions = await prisma.prediction.findMany({
    where: {
      createdAt: {
        gte: new Date("2026-05-20T00:00:00+07:00"),
      },
    },
    include: {
      user: { select: { id: true, name: true } },
      stage: { select: { name: true, stageType: true, status: true } },
      entries: {
        include: {
          rank1Player: { select: { ign: true } },
          rank2Player: { select: { ign: true } },
          rank3Player: { select: { ign: true } },
          rank4Player: { select: { ign: true } },
          group: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (predictions.length === 0) {
    console.log("Không có dự đoán nào hôm nay.");
  } else {
    console.log(`Tổng số dự đoán hôm nay: ${predictions.length}\n`);
    for (const pred of predictions) {
      const vnTime = new Date(pred.createdAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
      console.log(`👤 ${pred.user.name || "Ẩn danh"}`);
      console.log(`   Stage: ${pred.stage.name} (${pred.stage.stageType}) | Status: ${pred.status}`);
      console.log(`   Thời gian: ${vnTime}`);
      for (const e of pred.entries) {
        console.log(`   ${e.group.name}: ${e.rank1Player.ign}, ${e.rank2Player.ign}, ${e.rank3Player.ign}, ${e.rank4Player.ign}`);
      }
      console.log("");
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e.message); process.exit(1); });
