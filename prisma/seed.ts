import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ── Deterministic PRNG (Mulberry32) ─────────────────────────────────────────
function createRng(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// TFT scoring: placement 1→8 points, 2→7, ..., 8→1
const POINTS_BY_PLACEMENT = [8, 7, 6, 5, 4, 3, 2, 1];

// ── Player data ─────────────────────────────────────────────────────────────
const GUEST_PLAYERS = [
  { ign: "5van", rank: "Challenger", discord: "5van#0001" },
  { ign: "Koi", rank: "Grandmaster", discord: "koi_tft#1234" },
  { ign: "Stillness", rank: "Challenger", discord: "stillness#5678" },
  { ign: "Em Dứa TFT", rank: "Master", discord: "emdua#9012" },
  { ign: "Ngọc 6 Múi", rank: "Grandmaster", discord: "ngoc6mui#3456" },
  { ign: "Mai Hương Day", rank: "Master", discord: "maihtuong#7890" },
  { ign: "Dizzyland", rank: "Diamond", discord: "dizzy#1111" },
  { ign: "Luckyboiz", rank: "Master", discord: "luckyboiz#2222" },
  { ign: "Linhbodoi", rank: "Diamond", discord: "linhbodoi#3333" },
  { ign: "Mezino", rank: "Grandmaster", discord: "mezino#4444" },
  { ign: "Phương GB", rank: "Master", discord: "phuonggb#5555" },
  { ign: ".Furyy TFT", rank: "Challenger", discord: "furyy#6666" },
  { ign: "Trâu TV", rank: "Diamond", discord: "trautv#7777" },
  { ign: "Trần Duyên TFT", rank: "Master", discord: "tranduyen#8888" },
  { ign: "Tiger1 Bố Già TFT", rank: "Grandmaster", discord: "tiger1#9999" },
  { ign: "KhachMoi16", rank: "Diamond", discord: "khachmoi16#0000" },
];

const REGULAR_PLAYERS = [
  { ign: "DragonSlayer", rank: "Challenger" },
  { ign: "NightWolf", rank: "Grandmaster" },
  { ign: "ShadowBlade", rank: "Master" },
  { ign: "IronFist", rank: "Diamond" },
  { ign: "StormRider", rank: "Master" },
  { ign: "FrostBite", rank: "Grandmaster" },
  { ign: "ThunderBolt", rank: "Challenger" },
  { ign: "CrimsonKing", rank: "Diamond" },
  { ign: "SilverArrow", rank: "Master" },
  { ign: "GoldenEagle", rank: "Platinum" },
  { ign: "DarkMatter", rank: "Diamond" },
  { ign: "LightBringer", rank: "Master" },
  { ign: "VoidWalker", rank: "Grandmaster" },
  { ign: "StarForge", rank: "Diamond" },
  { ign: "MoonShadow", rank: "Platinum" },
  { ign: "SunBurst", rank: "Master" },
  { ign: "TidalWave", rank: "Diamond" },
  { ign: "EarthShaker", rank: "Gold" },
  { ign: "WindRunner", rank: "Platinum" },
  { ign: "FireStorm", rank: "Diamond" },
  { ign: "IceDrake", rank: "Master" },
  { ign: "LightningBolt", rank: "Gold" },
  { ign: "StoneCrusher", rank: "Platinum" },
  { ign: "WaterSpirit", rank: "Diamond" },
  { ign: "AirBender", rank: "Gold" },
  { ign: "BloodRaven", rank: "Master" },
  { ign: "SoulReaper", rank: "Platinum" },
  { ign: "MindBreaker", rank: "Diamond" },
  { ign: "HeartSeeker", rank: "Gold" },
  { ign: "BoneBreaker", rank: "Platinum" },
  { ign: "SkullCrusher", rank: "Diamond" },
  { ign: "GhostRider", rank: "Gold" },
  { ign: "PhantomBlade", rank: "Platinum" },
  { ign: "ShadowStep", rank: "Diamond" },
  { ign: "NightCrawler", rank: "Gold" },
  { ign: "DawnBreaker", rank: "Platinum" },
  { ign: "DuskFaller", rank: "Diamond" },
  { ign: "TwilightSage", rank: "Gold" },
  { ign: "MidnightHunter", rank: "Platinum" },
  { ign: "NoonStriker", rank: "Gold" },
  { ign: "ChaosLord", rank: "Platinum" },
  { ign: "OrderKeeper", rank: "Diamond" },
  { ign: "BalanceSeeker", rank: "Gold" },
  { ign: "TruthFinder", rank: "Platinum" },
  { ign: "JusticeBringer", rank: "Gold" },
  { ign: "MercyGiver", rank: "Platinum" },
  { ign: "WrathBringer", rank: "Diamond" },
  { ign: "PeaceMaker", rank: "Gold" },
  { ign: "WarMonger", rank: "Platinum" },
];

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "admin@sbltcup.com")
  .split(",")
  .map((e: string) => e.trim().toLowerCase());

// ── Helpers ─────────────────────────────────────────────────────────────────
type PlayerWithId = { id: string; ign: string; userId: string };

async function createGroupWithResults(
  stageId: string,
  name: string,
  order: number,
  players: PlayerWithId[],
  rng: () => number,
  baseDate: Date,
  totalGames: number,
) {
  const group = await prisma.group.create({
    data: { stageId, name, groupOrder: order },
  });

  const groupPlayers: { id: string; playerId: string }[] = [];
  for (const p of players) {
    const gp = await prisma.groupPlayer.create({
      data: { groupId: group.id, playerId: p.id, totalPoints: 0 },
    });
    groupPlayers.push(gp);
  }

  const games: { id: string; groupPlayerIdMap: Map<string, string> }[] = [];
  const gpMap = new Map(groupPlayers.map((gp) => [gp.playerId, gp.id]));

  for (let g = 1; g <= totalGames; g++) {
    const startTime = new Date(baseDate);
    startTime.setHours(18 + g - 1, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setMinutes(40);

    const game = await prisma.game.create({
      data: {
        groupId: group.id,
        gameNumber: g,
        status: "COMPLETED",
        startTime,
        endTime,
      },
    });

    const shuffled = shuffle(players, rng);
    await prisma.gameResult.createMany({
      data: shuffled.map((p, idx) => ({
        gameId: game.id,
        playerId: p.id,
        placement: idx + 1,
        points: POINTS_BY_PLACEMENT[idx],
      })),
    });

    games.push({ id: game.id, groupPlayerIdMap: gpMap });
  }

  // Tally totalPoints per group player
  const totals = new Map<string, number>();
  for (const p of players) {
    const results = await prisma.gameResult.findMany({
      where: { playerId: p.id, game: { groupId: group.id } },
    });
    totals.set(p.id, results.reduce((s, r) => s + r.points, 0));
  }

  for (const [playerId, gpId] of gpMap) {
    await prisma.groupPlayer.update({
      where: { id: gpId },
      data: { totalPoints: totals.get(playerId) ?? 0 },
    });
  }

  // Assign finalRank
  const ranked = [...gpMap.entries()]
    .map(([pid, gpid]) => ({ pid, gpid, pts: totals.get(pid) ?? 0 }))
    .sort((a, b) => b.pts - a.pts);

  for (let i = 0; i < ranked.length; i++) {
    await prisma.groupPlayer.update({
      where: { id: ranked[i].gpid },
      data: { finalRank: i + 1 },
    });
  }

  return { group, gpMap, totals };
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("Seeding full demo database...");
  const rng = createRng(42);

  // Clean all tables (FK-safe order)
  await prisma.auditLog.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.gameResult.deleteMany();
  await prisma.game.deleteMany();
  await prisma.groupPlayer.deleteMany();
  await prisma.group.deleteMany();
  await prisma.stage.deleteMany();
  await prisma.prize.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.player.deleteMany();
  await prisma.user.deleteMany();

  // ── Admin ───────────────────────────────────────────────────────────────
  const hashedAdminPw = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.create({
    data: {
      email: ADMIN_EMAILS[0],
      password: hashedAdminPw,
      name: "Admin SBLT",
      role: "ADMIN",
      player: { create: { ign: "Admin", isGuest: false } },
    },
    include: { player: true },
  });
  console.log(`Admin: ${admin.email}`);

  // ── Guest players ───────────────────────────────────────────────────────
  const hashedGuestPw = await bcrypt.hash("guest123", 12);
  const guestPlayers: PlayerWithId[] = [];
  for (let i = 0; i < GUEST_PLAYERS.length; i++) {
    const g = GUEST_PLAYERS[i];
    const u = await prisma.user.create({
      data: {
        email: `guest${i + 1}@sbltcup.com`,
        password: hashedGuestPw,
        name: g.ign,
        role: "PLAYER",
        player: {
          create: {
            ign: g.ign,
            isGuest: true,
            rank: g.rank,
            discord: g.discord,
            phone: `090${String(1000000 + i).slice(-7)}`,
          },
        },
      },
      include: { player: true },
    });
    guestPlayers.push({
      id: u.player!.id,
      ign: u.player!.ign,
      userId: u.id,
    });
  }

  // ── Regular players ─────────────────────────────────────────────────────
  const hashedPlayerPw = await bcrypt.hash("player123", 12);
  const regularPlayers: PlayerWithId[] = [];
  for (let i = 0; i < REGULAR_PLAYERS.length; i++) {
    const p = REGULAR_PLAYERS[i];
    const u = await prisma.user.create({
      data: {
        email: `player${i + 1}@sbltcup.com`,
        password: hashedPlayerPw,
        name: p.ign,
        role: "PLAYER",
        player: {
          create: {
            ign: p.ign,
            isGuest: false,
            rank: p.rank,
            discord: `${p.ign.toLowerCase()}#${1000 + i}`,
            phone: `091${String(2000000 + i).slice(-7)}`,
          },
        },
      },
      include: { player: true },
    });
    regularPlayers.push({
      id: u.player!.id,
      ign: u.player!.ign,
      userId: u.id,
    });
  }

  const allPlayers = [...regularPlayers, ...guestPlayers];
  console.log(`Players: ${regularPlayers.length} regular + ${guestPlayers.length} guests`);

  // ════════════════════════════════════════════════════════════════════════
  //  TOURNAMENT 1 — SBLT CUP Mùa 1 (COMPLETED)
  // ════════════════════════════════════════════════════════════════════════
  const t1 = await prisma.tournament.create({
    data: {
      name: "SBLT CUP Mùa 1",
      season: 1,
      description: "Giải đấu Đấu Trường Chân Lý SBLT CUP Mùa 1 — Team 5van & Koi tổ chức",
      status: "COMPLETED",
      regStart: new Date("2025-05-01"),
      regEnd: new Date("2025-05-18"),
      startDate: new Date("2025-05-19"),
      endDate: new Date("2025-05-22"),
      maxPlayers: 64,
      prizePool: 10_000_000,
    },
  });
  console.log(`Tournament 1: ${t1.name} (COMPLETED)`);

  // Stages
  const stageConfigs = [
    { name: "Vòng Loại", type: "QUALIFIER" as const, order: 1, date: "2025-05-19" },
    { name: "Vòng 2", type: "SEMI_1" as const, order: 2, date: "2025-05-20" },
    { name: "Vòng 3", type: "SEMI_2" as const, order: 3, date: "2025-05-21" },
    { name: "Chung Kết", type: "FINAL" as const, order: 4, date: "2025-05-22" },
  ];
  const stages: Record<string, { id: string; date: string }> = {};
  for (const s of stageConfigs) {
    const st = await prisma.stage.create({
      data: {
        tournamentId: t1.id,
        name: s.name,
        stageType: s.type,
        stageOrder: s.order,
        date: new Date(s.date),
        startTime: "18:00",
        totalGames: 3,
        status: "COMPLETED",
      },
    });
    stages[s.type] = { id: st.id, date: s.date };
  }

  // Prizes
  const prizeDefs = [
    { rank: 1, amount: 5_000_000, desc: "Quán quân" },
    { rank: 2, amount: 2_000_000, desc: "Á quân" },
    { rank: 3, amount: 1_000_000, desc: "Hạng 3" },
    { rank: 4, amount: 800_000, desc: "Hạng 4" },
    { rank: 5, amount: 300_000, desc: "Hạng 5-8" },
    { rank: 6, amount: 300_000, desc: "Hạng 5-8" },
    { rank: 7, amount: 300_000, desc: "Hạng 5-8" },
    { rank: 8, amount: 300_000, desc: "Hạng 5-8" },
  ];
  await prisma.prize.createMany({
    data: prizeDefs.map((p) => ({
      tournamentId: t1.id,
      rank: p.rank,
      amount: p.amount,
      description: p.desc,
    })),
  });

  // ── Register regular players (all checked in) ───────────────────────────
  for (const p of regularPlayers) {
    await prisma.registration.create({
      data: {
        tournamentId: t1.id,
        playerId: p.id,
        status: "APPROVED",
        checkedIn: true,
        checkInTime: new Date("2025-05-19T17:30:00"),
      },
    });
  }
  // Admin registers too
  if (admin.player) {
    await prisma.registration.create({
      data: {
        tournamentId: t1.id,
        playerId: admin.player.id,
        status: "APPROVED",
        checkedIn: true,
        checkInTime: new Date("2025-05-19T17:30:00"),
      },
    });
  }

  // ── STAGE 1: QUALIFIER (49 players → 8 groups, top 4 each → 32) ────────
  const qualifierPlayers = shuffle([...regularPlayers], rng);
  const qualifierGroups: PlayerWithId[][] = [];
  const qBase = Math.floor(qualifierPlayers.length / 8); // 6
  const qRem = qualifierPlayers.length % 8;               // 1
  let qOffset = 0;
  for (let i = 0; i < 8; i++) {
    const size = qBase + (i < qRem ? 1 : 0);
    qualifierGroups.push(qualifierPlayers.slice(qOffset, qOffset + size));
    qOffset += size;
  }

  const qAdvancers: PlayerWithId[] = [];
  for (let i = 0; i < qualifierGroups.length; i++) {
    const { totals } = await createGroupWithResults(
      stages.QUALIFIER.id,
      `Bảng ${String.fromCharCode(65 + i)}`,
      i + 1,
      qualifierGroups[i],
      rng,
      new Date(stages.QUALIFIER.date),
      3,
    );
    const sorted = qualifierGroups[i]
      .slice()
      .sort((a, b) => (totals.get(b.id) ?? 0) - (totals.get(a.id) ?? 0));
    qAdvancers.push(...sorted.slice(0, 4));
  }
  console.log(`Qualifier: ${qualifierGroups.length} groups, ${qAdvancers.length} advancing`);

  // ── STAGE 2: SEMI_1 (32 qualifiers + 16 guests = 48 → 8 groups of 6, top 2 each → 16) ─
  const semi1Pool = shuffle([...qAdvancers, ...guestPlayers], rng);
  const semi1Groups: PlayerWithId[][] = [];
  const s1Base = Math.floor(semi1Pool.length / 8);
  const s1Rem = semi1Pool.length % 8;
  let s1Offset = 0;
  for (let i = 0; i < 8; i++) {
    const size = s1Base + (i < s1Rem ? 1 : 0);
    semi1Groups.push(semi1Pool.slice(s1Offset, s1Offset + size));
    s1Offset += size;
  }

  const s1Advancers: PlayerWithId[] = [];
  for (let i = 0; i < semi1Groups.length; i++) {
    const { totals } = await createGroupWithResults(
      stages.SEMI_1.id,
      `Lobby ${i + 1}`,
      i + 1,
      semi1Groups[i],
      rng,
      new Date(stages.SEMI_1.date),
      3,
    );
    const sorted = semi1Groups[i]
      .slice()
      .sort((a, b) => (totals.get(b.id) ?? 0) - (totals.get(a.id) ?? 0));
    s1Advancers.push(...sorted.slice(0, 2));
  }
  console.log(`Semi 1: ${semi1Groups.length} groups, ${s1Advancers.length} advancing`);

  // ── STAGE 3: SEMI_2 (16 → 2 groups of 8, top 4 each → 8) ─────────────
  const semi2Pool = shuffle([...s1Advancers], rng);
  const semi2Groups: PlayerWithId[][] = [];
  for (let i = 0; i < 2; i++) semi2Groups.push(semi2Pool.slice(i * 8, (i + 1) * 8));

  const s2Advancers: PlayerWithId[] = [];
  for (let i = 0; i < semi2Groups.length; i++) {
    const { totals } = await createGroupWithResults(
      stages.SEMI_2.id,
      `Bảng ${String.fromCharCode(65 + i)}`,
      i + 1,
      semi2Groups[i],
      rng,
      new Date(stages.SEMI_2.date),
      3,
    );
    const sorted = semi2Groups[i]
      .slice()
      .sort((a, b) => (totals.get(b.id) ?? 0) - (totals.get(a.id) ?? 0));
    s2Advancers.push(...sorted.slice(0, 4));
  }
  console.log(`Semi 2: ${semi2Groups.length} groups, ${s2Advancers.length} advancing to Finals`);

  // ── STAGE 4: FINAL (8 → 1 group, determine champion) ────────────────────
  const finalPool = shuffle([...s2Advancers], rng);
  const { totals: finalTotals } = await createGroupWithResults(
    stages.FINAL.id,
    "Chung Kết",
    1,
    finalPool,
    rng,
    new Date(stages.FINAL.date),
    3,
  );
  const finalRanking = finalPool
    .slice()
    .sort((a, b) => (finalTotals.get(b.id) ?? 0) - (finalTotals.get(a.id) ?? 0));
  console.log(`Finals: Champion = ${finalRanking[0].ign}`);

  // ── Assign prizes to finalists ──────────────────────────────────────────
  const prizeRecords = await prisma.prize.findMany({
    where: { tournamentId: t1.id },
    orderBy: { rank: "asc" },
  });
  for (const prize of prizeRecords) {
    const player = finalRanking[prize.rank - 1];
    if (player) {
      await prisma.prize.update({
        where: { id: prize.id },
        data: { playerId: player.id, paid: prize.rank <= 4, paidAt: prize.rank <= 4 ? new Date("2025-05-23") : null },
      });
    }
  }

  // ── Announcements (all 4 types) ─────────────────────────────────────────
  await prisma.announcement.createMany({
    data: [
      {
        tournamentId: t1.id,
        title: "Chào mừng đến với SBLT CUP Mùa 1!",
        content: "Giải đấu SBLT CUP Mùa 1 chính thức mở đăng ký từ 01/05 đến 18/05. Hãy đăng ký tài khoản và tham gia ngay! Thể thức: 64 tuyển thủ, 4 vòng đấu, tổng giải thưởng 10.000.000 VNĐ.",
        type: "GENERAL",
        createdAt: new Date("2025-05-01T09:00:00"),
      },
      {
        tournamentId: t1.id,
        title: "Thay đổi lịch thi đấu Vòng Loại",
        content: "Lịch thi đấu Vòng Loại ngày 19/05 được dời từ 19:00 xuống 18:00 để thuận tiện cho thí thi. Vui lòng check-in trước 17:45. Xin lỗi vì sự bất tiện này!",
        type: "SCHEDULE_CHANGE",
        createdAt: new Date("2025-05-17T14:00:00"),
      },
      {
        tournamentId: t1.id,
        title: "Cập nhật quy tắc cấm streamer mode",
        content: "Quy tắc mới: Tất cả tuyển thủ BẮT BUỘC tắt streamer mode trong suốt quá trình thi đấu. Vi phạm sẽ bị cảnh cáo lần 1, lần 2 sẽ bị xử thua. BTC sẽ kiểm tra ngẫu nhiên qua replay.",
        type: "RULE_UPDATE",
        createdAt: new Date("2025-05-15T10:00:00"),
      },
      {
        tournamentId: t1.id,
        title: "Kết quả Vòng Loại — Danh sách vào Vòng 2",
        content: `Kết quả Vòng Loại ngày 19/05: 32 tuyển thủ xuất sắc nhất đã giành vé vào Vòng 2. Xem chi tiết tại mục Brackets/Standing. Chúc mừng các thí sinh đi tiếp!`,
        type: "RESULT",
        createdAt: new Date("2025-05-19T22:00:00"),
      },
      {
        tournamentId: t1.id,
        title: "Kết quả Chung Kết — SBLT CUP Mùa 1",
        content: `Chúc mừng ${finalRanking[0].ign} đã trở thành Quán quân SBLT CUP Mùa 1 với tổng ${finalTotals.get(finalRanking[0].id) ?? 0} điểm! Cảm ơn tất cả 65 tuyển thủ đã tham gia. Hẹn gặp lại ở Mùa 2!`,
        type: "RESULT",
        createdAt: new Date("2025-05-22T23:00:00"),
      },
    ],
  });

  // ── Disputes (2: 1 resolved, 1 pending) ─────────────────────────────────
  // Find a game in qualifier for the dispute
  const qGames = await prisma.game.findMany({
    where: { group: { stageId: stages.QUALIFIER.id } },
    take: 2,
    orderBy: { gameNumber: "asc" },
  });
  const disputingPlayers = qualifierGroups[0].slice(0, 2);

  if (qGames[0] && disputingPlayers[0]) {
    await prisma.dispute.create({
      data: {
        tournamentId: t1.id,
        gameId: qGames[0].id,
        submittedBy: disputingPlayers[0].id,
        reason: "Wrong Result",
        description: "Tôi nghĩ kết quả Game 1 bị ghi sai — tôi nhớ mình về Top 3 nhưng hệ thống ghi Top 6. Vui lòng kiểm tra lại replay.",
        status: "RESOLVED",
        adminNote: "Đã kiểm tra replay. Kết quả ban đầu là chính xác. Tuyển thủ về Top 6.",
        resolvedBy: admin.id,
        resolvedAt: new Date("2025-05-20T10:00:00"),
      },
    });
  }
  if (qGames[1] && disputingPlayers[1]) {
    await prisma.dispute.create({
      data: {
        tournamentId: t1.id,
        gameId: qGames[1].id,
        submittedBy: disputingPlayers[1].id,
        reason: "Disconnect",
        description: "Bị disconnect giữa trận Game 2 do lỗi server. Xin được tính lại trận hoặc bù điểm.",
        status: "PENDING",
      },
    });
  }

  // ── Audit logs ──────────────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id, action: "TOURNAMENT_CREATE", entityType: "Tournament", entityId: t1.id, ip: "192.168.1.1", createdAt: new Date("2025-05-01T08:00:00") },
      { userId: admin.id, action: "STAGE_DRAW", entityType: "Stage", entityId: stages.QUALIFIER.id, after: { groups: 8, players: 49 }, ip: "192.168.1.1", createdAt: new Date("2025-05-19T17:00:00") },
      { userId: admin.id, action: "PLAYER_ADVANCE", entityType: "Stage", entityId: stages.SEMI_1.id, after: { advanced: 32, guests: 16 }, ip: "192.168.1.1", createdAt: new Date("2025-05-19T22:30:00") },
      { userId: admin.id, action: "TOURNAMENT_COMPLETE", entityType: "Tournament", entityId: t1.id, after: { champion: finalRanking[0].ign }, ip: "192.168.1.1", createdAt: new Date("2025-05-22T23:30:00") },
    ],
  });

  // ════════════════════════════════════════════════════════════════════════
  //  TOURNAMENT 2 — SBLT CUP Mùa 2 (REGISTRATION_OPEN)
  // ════════════════════════════════════════════════════════════════════════
  const t2 = await prisma.tournament.create({
    data: {
      name: "SBLT CUP Mùa 2",
      season: 2,
      description: "Giải đấu Đấu Trường Chân Lý SBLT CUP Mùa 2 — Lần này gay cấn hơn! Đăng ký ngay!",
      status: "REGISTRATION_OPEN",
      regStart: new Date("2025-06-01"),
      regEnd: new Date("2025-06-20"),
      startDate: new Date("2025-06-23"),
      endDate: new Date("2025-06-26"),
      maxPlayers: 64,
      prizePool: 15_000_000,
    },
  });

  await prisma.announcement.create({
    data: {
      tournamentId: t2.id,
      title: "SBLT CUP Mùa 2 chính thức mở đăng ký!",
      content: "Giải đấu Mùa 2 đã quay trở lại với tổng giải thưởng 15.000.000 VNĐ! Đăng ký từ 01/06 đến 20/06. Nhanh tay kẻo hết slot!",
      type: "GENERAL",
      createdAt: new Date("2025-06-01T09:00:00"),
    },
  });

  // Some early registrations for Tournament 2 (mix of statuses)
  const t2Regs = [
    ...regularPlayers.slice(0, 8).map((p, i) => ({
      tournamentId: t2.id,
      playerId: p.id,
      status: "APPROVED" as const,
      checkedIn: false,
    })),
    ...regularPlayers.slice(8, 12).map((p) => ({
      tournamentId: t2.id,
      playerId: p.id,
      status: "PENDING" as const,
      checkedIn: false,
    })),
    ...regularPlayers.slice(12, 15).map((p) => ({
      tournamentId: t2.id,
      playerId: p.id,
      status: "APPROVED" as const,
      checkedIn: true,
      checkInTime: new Date("2025-06-23T17:30:00"),
    })),
  ];
  await prisma.registration.createMany({ data: t2Regs });
  console.log(`Tournament 2: ${t2.name} (REGISTRATION_OPEN, ${t2Regs.length} registrations)`);

  // ── Summary ─────────────────────────────────────────────────────────────
  const totalUsers = 1 + guestPlayers.length + regularPlayers.length;
  console.log(`\n=== DEMO SEED COMPLETE ===`);
  console.log(`Users: ${totalUsers} (1 admin + ${guestPlayers.length} guests + ${regularPlayers.length} regular)`);
  console.log(`Tournament 1: ${t1.name} — COMPLETED (4 stages, 8+8+2+1 groups, all results)`);
  console.log(`Tournament 2: ${t2.name} — REGISTRATION_OPEN (${t2Regs.length} registrations)`);
  console.log(`Prizes: ${prizeDefs.length} (assigned to finalists)`);
  console.log(`Announcements: 6 (all types: GENERAL, SCHEDULE_CHANGE, RULE_UPDATE, RESULT)`);
  console.log(`Disputes: 2 (1 resolved, 1 pending)`);
  console.log(`Audit logs: 4`);
  console.log(`\nLogin accounts:`);
  console.log(`  Admin: admin@sbltcup.com / admin123`);
  console.log(`  Guest: guest1@sbltcup.com / guest123`);
  console.log(`  Player: player1@sbltcup.com / player123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
