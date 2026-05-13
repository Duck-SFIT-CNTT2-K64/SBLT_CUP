import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

interface AuditOptions {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
}

/**
 * Ghi lại một hành động vào AuditLog.
 * Gọi sau mỗi thao tác quan trọng của admin (sửa kết quả, duyệt đăng ký, v.v.)
 */
export async function auditLog(opts: AuditOptions) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: opts.userId,
        action: opts.action,
        entityType: opts.entityType,
        entityId: opts.entityId,
        before: opts.before ? (opts.before as object) : undefined,
        after: opts.after ? (opts.after as object) : undefined,
        ip: opts.ip,
      },
    });
  } catch (err) {
    // Never throw — audit failure should not break the main operation
    logger.error("[AUDIT LOG ERROR]", err instanceof Error ? err : new Error(String(err)));
  }
}
