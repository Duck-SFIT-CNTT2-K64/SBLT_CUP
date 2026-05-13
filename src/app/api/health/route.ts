import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const CRITICAL_TABLES = ["Prediction", "PredictionEntry"];

interface CheckResult {
  status: "ok" | "error";
  latencyMs?: number;
  error?: string;
  tables?: string[];
  missing?: string[];
}

interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  checks: {
    database: CheckResult;
    schema: CheckResult;
    migrations: CheckResult;
  };
  timestamp: number;
}

export async function GET() {
  const checks: HealthResponse["checks"] = {
    database: { status: "ok" },
    schema: { status: "ok" },
    migrations: { status: "ok" },
  };

  // Check 1: Database connectivity
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database.latencyMs = Date.now() - start;
  } catch (err) {
    checks.database = {
      status: "error",
      error: err instanceof Error ? err.message : "Database connection failed",
    };
  }

  // Check 2: Schema verification (only if DB is reachable)
  if (checks.database.status === "ok") {
    try {
      const tableNames = CRITICAL_TABLES.map((t) => Prisma.sql`${t}`);
      const tables = await prisma.$queryRaw<{ table_name: string }[]>`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN (${Prisma.join(tableNames)})
      `;
      const found = tables.map((t) => t.table_name);
      const missing = CRITICAL_TABLES.filter((t) => !found.includes(t));

      if (missing.length > 0) {
        checks.schema = {
          status: "error",
          tables: found,
          missing,
          error: `Missing tables: ${missing.join(", ")}`,
        };
      } else {
        checks.schema = { status: "ok", tables: found };
      }
    } catch (err) {
      checks.schema = {
        status: "error",
        error: err instanceof Error ? err.message : "Schema check failed",
      };
    }
  } else {
    checks.schema = {
      status: "error",
      error: "Skipped — database unavailable",
    };
  }

  // Check 3: Migration status (only if DB is reachable)
  if (checks.database.status === "ok") {
    try {
      const migrations = await prisma.$queryRaw<{ migration_name: string; finished_at: Date | null }[]>`
        SELECT migration_name, finished_at
        FROM _prisma_migrations
        WHERE finished_at IS NULL
        LIMIT 1
      `;

      if (migrations.length > 0) {
        checks.migrations = {
          status: "error",
          error: `Pending migration: ${migrations[0].migration_name}`,
        };
      } else {
        checks.migrations = { status: "ok" };
      }
    } catch {
      // Table might not exist yet (fresh DB) — not an error
      checks.migrations = { status: "ok" };
    }
  } else {
    checks.migrations = {
      status: "error",
      error: "Skipped — database unavailable",
    };
  }

  const overallStatus =
    checks.database.status === "ok" &&
    checks.schema.status === "ok" &&
    checks.migrations.status === "ok"
      ? "healthy"
      : "unhealthy";

  const statusCode = overallStatus === "healthy" ? 200 : 503;

  const response: HealthResponse = {
    status: overallStatus,
    checks,
    timestamp: Date.now(),
  };

  return NextResponse.json(response, {
    status: statusCode,
    headers: { "Cache-Control": "no-store" },
  });
}
