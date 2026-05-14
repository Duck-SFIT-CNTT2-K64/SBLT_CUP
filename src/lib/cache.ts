import { getRedis } from "@/lib/redis";
import { logger } from "@/lib/logger";

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
