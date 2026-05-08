import "@/lib/env"; // Validate env vars at startup — crash fast if missing
import { PrismaClient } from ".prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Singleton PrismaClient — dùng đúng 1 connection pool duy nhất trên toàn bộ app.
// globalThis không bị reset khi Next.js hot-reload trong dev, và luôn giữ 1 instance trong production.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,                    // Tối đa 10 kết nối trong pool (đủ cho 1 Next.js process)
    idleTimeoutMillis: 30_000,  // Giải phóng kết nối nhàn rỗi sau 30s
    connectionTimeoutMillis: 5_000, // Timeout nếu không lấy được kết nối trong 5s
  });

  const adapter = new PrismaPg(pool, {
    disposeExternalPool: true, // Prisma sẽ gọi pool.end() khi dispose
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Chỉ cache vào globalThis trong development để tránh leak khi hot-reload.
// Trong production, instance được tạo đúng 1 lần rồi reuse.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
