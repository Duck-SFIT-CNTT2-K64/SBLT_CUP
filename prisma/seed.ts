import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "admin@sbltcup.com")
  .split(",")
  .map((e: string) => e.trim().toLowerCase());

// 16 khách mời — KHÔNG đăng ký vào tournament (chỉ tham gia từ Vòng 2)
// 49 tuyển thủ thường — đăng ký vào tournament (64 slot cho regular players)
const GUEST_PLAYERS = [
  "5van", "Koi", "Stillness", "Em Dứa TFT", "Ngọc 6 Múi",
  "Mai Hương Day", "Dizzyland", "Luckyboiz", "Linhbodoi", "Mezino",
  "Phương GB", ".Furyy TFT", "Trâu TV", "Trần Duyên TFT", "Tiger1 Bố Già TFT",
  "KhachMoi16",
];

const REGULAR_PLAYERS = [
  "DragonSlayer", "NightWolf", "ShadowBlade", "IronFist", "StormRider",
  "FrostBite", "ThunderBolt", "CrimsonKing", "SilverArrow", "GoldenEagle",
  "DarkMatter", "LightBringer", "VoidWalker", "StarForge", "MoonShadow",
  "SunBurst", "TidalWave", "EarthShaker", "WindRunner", "FireStorm",
  "IceDrake", "LightningBolt", "StoneCrusher", "WaterSpirit", "AirBender",
  "BloodRaven", "SoulReaper", "MindBreaker", "HeartSeeker", "BoneBreaker",
  "SkullCrusher", "GhostRider", "PhantomBlade", "ShadowStep", "NightCrawler",
  "DawnBreaker", "DuskFaller", "TwilightSage", "MidnightHunter", "NoonStriker",
  "ChaosLord", "OrderKeeper", "BalanceSeeker", "TruthFinder", "JusticeBringer",
  "MercyGiver", "WrathBringer", "PeaceMaker", "WarMonger",
];

async function main() {
  console.log("Seeding database...");

  // Admin
  const adminEmail = ADMIN_EMAILS[0];
  const hashedPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: "Admin SBLT",
      role: "ADMIN",
      player: {
        create: { ign: "Admin", isGuest: false },
      },
    },
    include: { player: true },
  });
  console.log(`Admin: ${admin.email}`);

  // Tournament
  const tournament = await prisma.tournament.upsert({
    where: { season: 1 },
    update: {},
    create: {
      name: "SBLT CUP Mùa 1",
      season: 1,
      description: "Giải đấu Đấu Trường Chân Lý SBLT CUP Mùa 1 - Team 5van & Koi tổ chức",
      status: "REGISTRATION_OPEN",
      regStart: new Date("2025-05-01"),
      regEnd: new Date("2025-05-18"),
      startDate: new Date("2025-05-19"),
      endDate: new Date("2025-05-22"),
      maxPlayers: 64,
      prizePool: 10000000,
    },
  });
  console.log(`Tournament: ${tournament.name}`);

  // Stages
  const stagesData = [
    { name: "Vòng Loại", stageType: "QUALIFIER" as const, stageOrder: 1, date: new Date("2025-05-19"), startTime: "18:00", totalGames: 3 },
    { name: "Vòng 2",    stageType: "SEMI_1"    as const, stageOrder: 2, date: new Date("2025-05-20"), startTime: "18:00", totalGames: 3 },
    { name: "Vòng 3",    stageType: "SEMI_2"    as const, stageOrder: 3, date: new Date("2025-05-21"), startTime: "18:00", totalGames: 3 },
    { name: "Chung Kết", stageType: "FINAL"     as const, stageOrder: 4, date: new Date("2025-05-22"), startTime: "18:00", totalGames: 3 },
  ];

  for (const stage of stagesData) {
    await prisma.stage.upsert({
      where: { id: `${tournament.id}-stage-${stage.stageOrder}` },
      update: {},
      create: { id: `${tournament.id}-stage-${stage.stageOrder}`, tournamentId: tournament.id, ...stage },
    });
  }
  console.log("Stages created");

  // Prizes
  const existingPrizes = await prisma.prize.count({ where: { tournamentId: tournament.id } });
  if (existingPrizes === 0) {
    await prisma.prize.createMany({
      data: [
        { tournamentId: tournament.id, rank: 1, amount: 5000000, description: "Quán quân" },
        { tournamentId: tournament.id, rank: 2, amount: 2000000, description: "Á quân" },
        { tournamentId: tournament.id, rank: 3, amount: 1000000, description: "Hạng 3" },
        { tournamentId: tournament.id, rank: 4, amount: 800000,  description: "Hạng 4" },
        { tournamentId: tournament.id, rank: 5, amount: 300000,  description: "Hạng 5-8" },
        { tournamentId: tournament.id, rank: 6, amount: 300000,  description: "Hạng 5-8" },
        { tournamentId: tournament.id, rank: 7, amount: 300000,  description: "Hạng 5-8" },
        { tournamentId: tournament.id, rank: 8, amount: 300000,  description: "Hạng 5-8" },
      ],
    });
  }
  console.log("Prizes created");

  // Guest players (16) — Tạo User + Player nhưng KHÔNG đăng ký vào tournament
  // Khách mời chỉ tham gia từ Vòng 2 (SEMI_1), được admin bốc thăm sau
  for (let i = 0; i < GUEST_PLAYERS.length; i++) {
    const email = `guest${i + 1}@sbltcup.com`;
    const pw = await bcrypt.hash("guest123", 12);
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: pw,
        name: GUEST_PLAYERS[i],
        role: "PLAYER",
        player: { create: { ign: GUEST_PLAYERS[i], isGuest: true } },
      },
    });
  }
  console.log(`${GUEST_PLAYERS.length} guest players created (no tournament registration — join from Round 2)`);

  // Regular players (49)
  for (let i = 0; i < REGULAR_PLAYERS.length; i++) {
    const email = `player${i + 1}@sbltcup.com`;
    const pw = await bcrypt.hash("player123", 12);
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: pw,
        name: REGULAR_PLAYERS[i],
        role: "PLAYER",
        player: { create: { ign: REGULAR_PLAYERS[i], isGuest: false } },
      },
      include: { player: true },
    });
    if (user.player) {
      await prisma.registration.upsert({
        where: { tournamentId_playerId: { tournamentId: tournament.id, playerId: user.player.id } },
        update: {},
        create: { tournamentId: tournament.id, playerId: user.player.id, status: "APPROVED" },
      });
    }
  }
  console.log(`${REGULAR_PLAYERS.length} regular players created`);

  // Announcement
  const existingAnn = await prisma.announcement.count({ where: { tournamentId: tournament.id } });
  if (existingAnn === 0) {
    await prisma.announcement.create({
      data: {
        tournamentId: tournament.id,
        title: "Chào mừng đến với SBLT CUP Mùa 1!",
        content: "Giải đấu SBLT CUP Mùa 1 chính thức mở đăng ký. Hãy đăng ký tài khoản và tham gia ngay!",
        type: "GENERAL",
      },
    });
  }

  const total = 1 + GUEST_PLAYERS.length + REGULAR_PLAYERS.length; // admin + 16 + 49 = 66
  console.log(`\nSeeding completed! Total users: ${total} (1 admin + ${GUEST_PLAYERS.length} guests + ${REGULAR_PLAYERS.length} players)`);
  console.log(`Registered for tournament: ${REGULAR_PLAYERS.length} players (guests join from Round 2)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
