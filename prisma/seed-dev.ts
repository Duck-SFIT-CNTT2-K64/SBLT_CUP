import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🎮 Seeding dev prediction data...\n");

  // ── 1. Tạo users + players ────────────────────────────────────────────────
  const password = await bcrypt.hash("Test123456", 10);

  const testUser = await prisma.user.upsert({
    where: { email: "user@test.com" },
    update: {},
    create: { email: "user@test.com", name: "Test User", password, role: "USER" },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {},
    create: { email: "admin@test.com", name: "Admin", password, role: "ADMIN" },
  });

  // Tạo thêm users cho 16 players
  const users = [testUser, adminUser];
  for (let i = 3; i <= 16; i++) {
    const u = await prisma.user.upsert({
      where: { email: `player${i}@test.com` },
      update: {},
      create: {
        email: `player${i}@test.com`,
        name: `Player ${i}`,
        password,
        role: "USER",
      },
    });
    users.push(u);
  }

  const ranks = ["SILVER", "GOLD", "PLATINUM", "DIAMOND"];
  const players = [];
  for (let i = 0; i < 16; i++) {
    const p = await prisma.player.upsert({
      where: { ign: `TestPlayer${i + 1}` },
      update: {},
      create: {
        ign: `TestPlayer${i + 1}`,
        rank: ranks[i % 4],
        isGuest: false,
        userId: users[i].id,
      },
    });
    players.push(p);
  }
  console.log(`  ✓ ${players.length} players created`);

  // ── 2. Tạo tournament ─────────────────────────────────────────────────────
  const now = new Date();
  const tournament = await prisma.tournament.create({
    data: {
      name: "SBLT CUP Test Predictions",
      season: 99,
      description: "Tournament test cho clip hướng dẫn dự đoán",
      status: "IN_PROGRESS",
      regStart: new Date(now.getTime() - 7 * 86400000),
      regEnd: new Date(now.getTime() - 1 * 86400000),
      startDate: now,
      endDate: new Date(now.getTime() + 7 * 86400000),
      maxPlayers: 16,
      prizePool: 500000,
    },
  });
  console.log(`  ✓ Tournament "${tournament.name}" (ID: ${tournament.id})`);

  // ── 3. Stage SEMI_1 — ngày = hôm nay (cửa sổ dự đoán sẽ mở) ──────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const semi1 = await prisma.stage.create({
    data: {
      name: "Bán Kết 1",
      stageType: "SEMI_1",
      stageOrder: 1,
      date: today,
      startTime: "19:00",
      totalGames: 2,
      status: "SCHEDULED",
      tournamentId: tournament.id,
    },
  });

  const groupNames = ["Bảng A", "Bảng B", "Bảng C", "Bảng D"];
  for (let g = 0; g < 4; g++) {
    const group = await prisma.group.create({
      data: { name: groupNames[g], groupOrder: g + 1, stageId: semi1.id },
    });
    for (let p = 0; p < 4; p++) {
      await prisma.groupPlayer.create({
        data: { groupId: group.id, playerId: players[g * 4 + p].id },
      });
    }
  }
  console.log(`  ✓ Stage "${semi1.name}" — 4 groups × 4 players (ngày: hôm nay)`);

  // ── 4. Stage FINAL — ngày = ngày mai ──────────────────────────────────────
  const tomorrow = new Date(today.getTime() + 86400000);

  const finalStage = await prisma.stage.create({
    data: {
      name: "Chung Kết",
      stageType: "FINAL",
      stageOrder: 2,
      date: tomorrow,
      startTime: "19:00",
      totalGames: 3,
      status: "SCHEDULED",
      tournamentId: tournament.id,
    },
  });

  const finalGroup = await prisma.group.create({
    data: { name: "Chung Kết", groupOrder: 1, stageId: finalStage.id },
  });
  for (let p = 0; p < 4; p++) {
    await prisma.groupPlayer.create({
      data: { groupId: finalGroup.id, playerId: players[p].id },
    });
  }
  console.log(`  ✓ Stage "${finalStage.name}" — 1 group × 4 players (ngày: ngày mai)`);

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log("\n✅ Seed hoàn tất!");
  console.log("\n📋 Tài khoản test:");
  console.log("  User:  user@test.com / Test123456");
  console.log("  Admin: admin@test.com / Test123456");
  console.log(`\n🔗 Tournament ID: ${tournament.id}`);
  console.log(`   /tournaments/${tournament.id}/predictions`);
  console.log("\n⚠️  Lưu ý: Prediction window mở 09:00-19:30 giờ VN.");
  console.log("   Nếu test ngoài giờ, sửa PREDICTION_WINDOW trong src/lib/constants.ts:");
  console.log("   OPEN_HOUR: 0, CLOSE_HOUR: 23");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
