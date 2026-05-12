// Số khách mời tham gia từ Vòng 2 (SEMI_1). Không tính vào slot 64 của giải.
export const GUEST_COUNT = 16;

import linhbodoiImage from "../../assets/linhbodoi-removebg-preview.png";
import duongThieuNguImage from "../../assets/duong_thieu_ngu-removebg-preview.png";
import giayCoDongImage from "../../assets/giay_co_dong-removebg-preview.png";

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

export const CELEBRITY_GUESTS = [
  { name: "5van",          role: "Host",      confirmed: true,  image: "/guests/5van.webp" },
  { name: "Koi",           role: "Host",      confirmed: true,  image: "/guests/koi.webp" },
  { name: "Stillness",     role: "Khách mời", confirmed: true,  image: "/guests/stillness.webp" },
  { name: "Em Dứa TFT",   role: "Khách mời", confirmed: true,  image: "/guests/emduatft.webp" },
  { name: "Ngọc 6 Múi",   role: "Khách mời", confirmed: true,  image: "/guests/ngoc6mui.webp" },
  { name: "Mai Hương Day", role: "Khách mời", confirmed: true,  image: "/guests/maihuongday.webp" },
  { name: "Dizzyland",     role: "Khách mời", confirmed: true,  image: "/guests/dizzyland.webp" },
  { name: "Luckyboiz",     role: "Khách mời", confirmed: true,  image: "/guests/luckyboiz.webp" },
  { name: "Linhbodoi",     role: "Khách mời", confirmed: true,  image: linhbodoiImage.src },
  { name: "Mezino",        role: "Khách mời", confirmed: true,  image: "/guests/mezino.webp" },
  { name: "Phương GB",     role: "Khách mời", confirmed: true,  image: "/guests/phuonggb.webp" },
  { name: ".Furyy TFT",   role: "Khách mời", confirmed: true,  image: "/guests/furyy.webp" },
  { name: "Trâu TV",       role: "Khách mời", confirmed: true,  image: "/guests/trautft.webp" },
  { name: "Trần Duyên TFT",role: "Khách mời", confirmed: true,  image: "/guests/tranduyentft.webp" },
  { name: "Dương Thiếu Ngủ", role: "Khách mời", confirmed: false, image: duongThieuNguImage.src },
  { name: "Giày Cơ Động",   role: "Khách mời", confirmed: false, image: giayCoDongImage.src },
];

export const COMMENTATORS = [
  { name: "RRQ MidFeed", role: "BLV", confirmed: true },
];

// Điểm dự đoán: đúng top 1-4 đều được 10đ. Chung kết x2 (20đ/rank).
export const PREDICTION_SCORING: Record<number, number> = {
  1: 10,
  2: 10,
  3: 10,
  4: 10,
};

// Các vòng được phép dự đoán (vòng 2 trở đi)
export const PREDICTABLE_STAGES: string[] = ["SEMI_1", "SEMI_2", "FINAL"];

export const TOURNAMENT_FORMAT = {
  qualifier: {
    name: "Vòng Loại",
    stageType: "QUALIFIER",
    totalPlayers: 64,
    groups: 8,
    playersPerGroup: 8,
    gamesPerGroup: 3,
    advancingPerGroup: 2,
    totalAdvancing: 16,
  },
  semi1: {
    name: "Vòng 2",
    stageType: "SEMI_1",
    totalPlayers: 32,
    groups: 4,
    playersPerGroup: 8,
    gamesPerGroup: 3,
    advancingPerGroup: 4,
    totalAdvancing: 16,
    // 16 advancing from qualifier + 16 guest players = 32
    qualifierSlots: 4,  // 4 qualifier players per group
    guestSlots: 4,      // 4 guest players per group
  },
  semi2: {
    name: "Vòng 3",
    stageType: "SEMI_2",
    totalPlayers: 16,
    groups: 2,
    playersPerGroup: 8,
    gamesPerGroup: 3,
    advancingPerGroup: 4,
    totalAdvancing: 8,
  },
  final: {
    name: "Chung Kết Tổng",
    stageType: "FINAL",
    totalPlayers: 8,
    groups: 1,
    playersPerGroup: 8,
    gamesPerGroup: 3,
  },
};

/** Cửa sổ dự đoán (giờ Việt Nam, UTC+7) */
export const PREDICTION_WINDOW = {
  OPEN_HOUR: 9,
  OPEN_MINUTE: 0,
  CLOSE_HOUR: 19,
  CLOSE_MINUTE: 30,
  TIMEZONE_OFFSET_HOURS: 7,
} as const;
