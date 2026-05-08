import { NextResponse } from "next/server";

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
      case "P2025":
        return apiError("Không tìm thấy dữ liệu", 404, "NOT_FOUND");
      case "P2002":
        return apiError("Dữ liệu trùng lặp", 409, "DUPLICATE");
      default:
        console.error(`Prisma error ${prismaErr.code}:`, prismaErr.message);
        return apiError("Lỗi cơ sở dữ liệu", 500, "DATABASE_ERROR");
    }
  }

  console.error("Unhandled API error:", err);
  return apiError("Đã xảy ra lỗi hệ thống", 500, "INTERNAL_ERROR");
}
