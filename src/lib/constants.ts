export const SCORING: Record<number, number> = {
  1: 8,
  2: 7,
  3: 6,
  4: 5,
  5: 4,
  6: 3,
  7: 2,
  8: 1,
};

export const PRIZES = [
  { rank: 1, amount: 5000000, description: "Quán quân" },
  { rank: 2, amount: 2000000, description: "Á quân" },
  { rank: 3, amount: 1000000, description: "Hạng 3" },
  { rank: 4, amount: 800000, description: "Hạng 4" },
  { rank: 5, amount: 300000, description: "Hạng 5-8" },
  { rank: 6, amount: 300000, description: "Hạng 5-8" },
  { rank: 7, amount: 300000, description: "Hạng 5-8" },
  { rank: 8, amount: 300000, description: "Hạng 5-8" },
];

export const TOURNAMENT_FORMAT = {
  qualifier: {
    name: "Vòng Loại",
    totalPlayers: 64,
    groups: 8,
    playersPerGroup: 8,
    gamesPerGroup: 3,
    advancingPerGroup: 2,
    totalAdvancing: 16,
  },
  semi1: {
    name: "Vòng 2",
    totalPlayers: 24,
    groups: 4,
    playersPerGroup: 8,
    gamesPerGroup: 3,
    advancingPerGroup: 4,
    totalAdvancing: 16,
    guestSlots: 4,
    qualifierSlots: 4,
  },
  semi2: {
    name: "Vòng 3",
    totalPlayers: 16,
    groups: 2,
    playersPerGroup: 8,
    gamesPerGroup: 3,
    advancingPerGroup: 4,
    totalAdvancing: 8,
  },
  final: {
    name: "Chung Kết Tổng",
    totalPlayers: 8,
    groups: 1,
    playersPerGroup: 8,
    gamesPerGroup: 3,
  },
};
