import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  };
  timestamp: number;
}

export async function GET() {
  const checks: HealthResponse["checks"] = {
    database: { status: "ok" },
    schema: { status: "ok" },
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
      const tables = await prisma.$queryRaw<{ table_name: string }[]>`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN (${CRITICAL_TABLES.join(",")})
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

  const overallStatus =
    checks.database.status === "ok" && checks.schema.status === "ok"
      ? "healthy"
      : "unhealthy";

  const statusCode = overallStatus === "healthy" ? 200 : 503;

  const response: HealthResponse = {
    status: overallStatus,
    checks,
    timestamp: Date.now(),
  };

  return NextResponse.json(response, { status: statusCode });
}
