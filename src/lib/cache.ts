import { getRedis } from "@/lib/redis";
import { logger } from "@/lib/logger";

// Tiered TTLs
export const CACHE_TTL = {
  SHORT: 30,      // Notifications, real-time data
  MEDIUM: 120,    // Tournament data, game results
  LONG: 300,      // Leaderboards, stats
} as const;

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    const data = await r.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    logger.warn("[CACHE] Failed to set", { key, error: String(err) });
  }
}

/**
 * Cache-aside with stampede protection.
 * Uses SETNX lock to prevent multiple concurrent rebuilds.
 */
export async function cacheGetOrSet<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const r = getRedis();
  const lockKey = `${key}:lock`;

  // Try to acquire lock (SETNX with 30s expiry)
  if (r) {
    try {
      const acquired = await r.set(lockKey, "1", "EX", 30, "NX");
      if (!acquired) {
        // Another process is rebuilding — retry from cache with backoff
        for (let i = 0; i < 3; i++) {
          await new Promise((res) => setTimeout(res, 200 * (i + 1)));
          const retry = await cacheGet<T>(key);
          if (retry !== null) return retry;
        }
        // All retries failed, proceed to fetch anyway
      }
    } catch {
      // Lock failed, proceed without lock
    }
  }

  try {
    const value = await fetcher();
    await cacheSet(key, value, ttlSeconds);
    return value;
  } finally {
    if (r) {
      try { await r.del(lockKey); } catch { /* ignore */ }
    }
  }
}

export async function cacheDelete(key: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.del(key);
  } catch {
    // Silently handle
  }
}

export async function cacheDeletePattern(pattern: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    // Use SCAN instead of KEYS to avoid blocking Redis in production
    let cursor = "0";
    do {
      const [nextCursor, keys] = await r.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await r.del(...keys);
      }
    } while (cursor !== "0");
  } catch {
    // Silently handle
  }
}
