import { NextRequest, NextResponse } from "next/server";

export interface RequestLog {
  timestamp: string;
  method: string;
  path: string;
  status: number;
  duration: number;
  userId?: string;
  error?: string;
}

// Simple in-memory log store (in production, use ELK, Datadog, or CloudWatch)
const logs: RequestLog[] = [];

export function addLog(log: RequestLog) {
  logs.push(log);
  
  // Keep only last 1000 logs in memory
  if (logs.length > 1000) {
    logs.shift();
  }

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[${log.timestamp}] ${log.method} ${log.path} → ${log.status} (${log.duration}ms)${
        log.userId ? ` [userId: ${log.userId}]` : ""
      }${log.error ? ` ERROR: ${log.error}` : ""}`
    );
  }
}

export function getLogs(limit: number = 100): RequestLog[] {
  return logs.slice(-limit);
}

export function createLoggingMiddleware() {
  return async (req: NextRequest) => {
    const start = Date.now();
    const { pathname, searchParams } = new URL(req.url);
    const userId = req.headers.get("X-User-ID") || undefined;

    try {
      // Continue to next middleware/route
      const response = NextResponse.next();

      const duration = Date.now() - start;
      addLog({
        timestamp: new Date().toISOString(),
        method: req.method,
        path: pathname,
        status: response.status,
        duration,
        userId,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - start;
      addLog({
        timestamp: new Date().toISOString(),
        method: req.method,
        path: pathname,
        status: 500,
        duration,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  };
}
