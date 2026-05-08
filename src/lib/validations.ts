import { z } from "zod";

// =============================================================
// SHARED ZOD SCHEMAS — Reusable across all API routes
// =============================================================

// --- Auth ---
export const passwordSchema = z
  .string()
  .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
  .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
  .regex(/[a-z]/, "Mật khẩu phải có ít nhất 1 chữ thường")
  .regex(/[0-9]/, "Mật khẩu phải có ít nhất 1 chữ số");

export const registerSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: passwordSchema,
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
  ign: z.string().min(2, "Tên ingame phải có ít nhất 2 ký tự"),
});

// --- Tournament ---
export const tournamentCreateSchema = z.object({
  name: z.string().min(2).max(200),
  season: z.number().int().positive(),
  description: z.string().max(2000).optional(),
  maxPlayers: z.number().int().min(2).max(1024),
  prizePool: z.number().min(0).optional(),
  registrationStart: z.string().datetime().optional(),
  registrationEnd: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const tournamentUpdateSchema = tournamentCreateSchema.partial();

// --- Registration ---
export const registrationSchema = z.object({
  notes: z.string().max(500).optional(),
});

// --- Dispute ---
export const disputeCreateSchema = z.object({
  tournamentId: z.string().min(1),
  gameId: z.string().optional(),
  reason: z.enum(["SCORING_ERROR", "UNSPORTSMANLIKE_CONDUCT", "TECHNICAL_ISSUE", "RULE_VIOLATION", "OTHER"]),
  description: z.string().min(10, "Mô tả phải có ít nhất 10 ký tự").max(2000),
  attachments: z.array(z.string().url()).max(3).optional(),
});

export const disputeUpdateSchema = z.object({
  status: z.enum(["PENDING", "REVIEWING", "RESOLVED", "REJECTED"]).optional(),
  adminNote: z.string().max(2000).optional(),
});

// --- Announcement ---
export const announcementCreateSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  type: z.enum(["GENERAL", "SCHEDULE_CHANGE", "RULE_UPDATE", "RESULT"]),
  tournamentId: z.string().optional(),
});

export const announcementUpdateSchema = announcementCreateSchema.partial();

// --- Comment ---
export const commentCreateSchema = z.object({
  content: z.string().min(1, "Nội dung không được để trống").max(1000),
  parentId: z.string().optional(),
});

// --- Game Result ---
export const gameResultSchema = z.object({
  results: z
    .array(
      z.object({
        playerId: z.string().min(1),
        placement: z.number().int().min(1).max(8),
      })
    )
    .min(2, "Cần ít nhất 2 kết quả")
    .max(8, "Tối đa 8 kết quả"),
});

// --- Prediction ---
export const predictionEntrySchema = z.object({
  groupId: z.string().min(1),
  rank1PlayerId: z.string().min(1),
  rank2PlayerId: z.string().min(1),
  rank3PlayerId: z.string().min(1),
  rank4PlayerId: z.string().min(1),
});

export const predictionSchema = z.object({
  entries: z.array(predictionEntrySchema).min(1),
});

// --- Notification ---
export const notificationReadSchema = z.object({
  id: z.string().min(1).optional(),
  all: z.boolean().optional(),
});

// --- User/Admin ---
export const userUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(["ADMIN", "PLAYER"]).optional(),
});

// --- Pagination ---
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
