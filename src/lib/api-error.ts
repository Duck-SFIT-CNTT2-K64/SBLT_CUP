import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export function apiError(message: string, status: number, code?: string) {
  const body: Record<string, unknown> = { error: message };
  if (code) body.code = code;
  return NextResponse.json(body, { status });
}

export function handleApiError(err: unknown) {
  if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string"
  ) {
    const prismaErr = err as { code: string; message: string };

    switch (prismaErr.code) {
      // Record not found
      case "P2025":
        return apiError("Không tìm thấy dữ liệu", 404, "NOT_FOUND");
      
      // Unique constraint failed
      case "P2002":
        return apiError("Dữ liệu trùng lặp", 409, "DUPLICATE");
      
      // Foreign key constraint failed
      case "P2003":
        return apiError("Tham chiếu dữ liệu không hợp lệ", 409, "FOREIGN_KEY_CONSTRAINT_FAILED");
      
      // Required relation violation
      case "P2014":
        return apiError("Vi phạm ràng buộc quan hệ", 400, "REQUIRED_RELATION_VIOLATION");
      
      // Invalid field value for type
      case "P2005":
        return apiError("Giá trị trường dữ liệu không hợp lệ", 400, "INVALID_FIELD_VALUE");
      
      // Database connection error
      case "P2013":
        return apiError("Lỗi kết nối cơ sở dữ liệu", 503, "DATABASE_CONNECTION_ERROR");
      
      // Transaction timeout
      case "P2026":
        return apiError("Giao dịch hết hạn", 408, "TRANSACTION_TIMEOUT");
      
      // Default database error
      default:
        logger.error(`Prisma error ${prismaErr.code}`, new Error(prismaErr.message));
        return apiError("Lỗi cơ sở dữ liệu", 500, "DATABASE_ERROR");
    }
  }

  logger.error("Unhandled API error", err instanceof Error ? err : new Error(String(err)));
  return apiError("Đã xảy ra lỗi hệ thống", 500, "INTERNAL_ERROR");
}
