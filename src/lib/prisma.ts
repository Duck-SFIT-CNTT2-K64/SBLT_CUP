import "@/lib/env";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as Sentry from "@sentry/nextjs";

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

const SLOW_QUERY_MS = 100;

function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  const adapter = new PrismaPg(pool, {
    disposeExternalPool: true,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  }).$extends({
    query: {
      $allModels: {
        $allOperations: async ({ model, operation, args, query }) => {
          const start = Date.now();
          const result = await query(args);
          const duration = Date.now() - start;

          if (duration > SLOW_QUERY_MS) {
            const message = `Slow query: ${model}.${operation} (${duration}ms)`;
            console.warn(message);

            Sentry.addBreadcrumb({
              category: "db.query",
              message,
              level: "warning",
              data: { model, operation, duration },
            });

            if (duration > SLOW_QUERY_MS * 5) {
              Sentry.captureMessage(message, "warning");
            }
          }

          return result;
        },
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
