import { getRedis } from "@/lib/redis";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

interface RateLimitOptions {
  key: string;
  limit: number;
  windowSeconds: number;
}

// In-memory fallback store
const memoryStore = new Map<string, { count: number; expiresAt: number }>();

function cleanupMemoryStore() {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (entry.expiresAt <= now) memoryStore.delete(key);
  }
}

async function rateLimitInMemory(opts: RateLimitOptions): Promise<RateLimitResult> {
  cleanupMemoryStore();
  const now = Date.now();
  const windowMs = opts.windowSeconds * 1000;
  const entry = memoryStore.get(opts.key);

  if (!entry || entry.expiresAt <= now) {
    memoryStore.set(opts.key, { count: 1, expiresAt: now + windowMs });
    return { allowed: true, remaining: opts.limit - 1 };
  }

  if (entry.count >= opts.limit) {
    const retryAfter = Math.ceil((entry.expiresAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter };
  }

  entry.count++;
  return { allowed: true, remaining: opts.limit - entry.count };
}

async function rateLimitRedis(opts: RateLimitOptions): Promise<RateLimitResult> {
  const client = getRedis();
  if (!client) return rateLimitInMemory(opts);

  try {
    const key = `rl:${opts.key}`;
    const multi = client.multi();
    multi.incr(key);
    multi.ttl(key);
    const results = await multi.exec();

    if (!results) return rateLimitInMemory(opts);

    const count = results[0][1] as number;
    const ttl = results[1][1] as number;

    // Set expiry if key is new (ttl === -1 means no expiry)
    if (ttl === -1) {
      await client.expire(key, opts.windowSeconds);
    }

    if (count > opts.limit) {
      const retryAfter = ttl > 0 ? ttl : opts.windowSeconds;
      return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter };
    }

    return { allowed: true, remaining: opts.limit - count };
  } catch {
    // Redis error — fall back silently
    return rateLimitInMemory(opts);
  }
}

/**
 * Check rate limit using Redis (persistent) with in-memory fallback.
 * Use this in API route handlers, NOT in edge middleware.
 */
export async function checkRateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  return rateLimitRedis(opts);
}

/**
 * Pre-defined rate limit configs for common route types.
 */
export const RATE_LIMITS = {
  /** Auth routes: 10 attempts per 5 minutes */
  AUTH: { limit: 10, windowSeconds: 5 * 60 },
  /** General API: 200 requests per minute */
  API: { limit: 200, windowSeconds: 60 },
  /** Public routes: 300 requests per minute */
  PUBLIC: { limit: 300, windowSeconds: 60 },
  /** Admin routes: 100 requests per minute */
  ADMIN: { limit: 100, windowSeconds: 60 },
} as const;
