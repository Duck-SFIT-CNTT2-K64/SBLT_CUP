import Redis from "ioredis";
import { logger } from "@/lib/logger";

let redis: Redis | null = null;
let redisAvailable = false;

export function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (redis) return redis;

  try {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      retryStrategy(times) {
        if (times > 3) {
          redisAvailable = false;
          logger.warn("[REDIS] Max retries exceeded — falling back to in-memory");
          return null;
        }
        return Math.min(times * 200, 2000);
      },
    });

    redis.on("error", (err) => {
      if (redisAvailable) {
        logger.warn("[REDIS] Connection error", { error: err.message });
        redisAvailable = false;
      }
    });

    redis.on("ready", () => {
      redisAvailable = true;
      logger.info("[REDIS] Connected");
    });

    redis.on("end", () => {
      redisAvailable = false;
    });

    return redis;
  } catch (err) {
    logger.warn("[REDIS] Failed to create client", { error: String(err) });
    redis = null;
    return null;
  }
}

export function isRedisAvailable(): boolean {
  return redisAvailable;
}

/**
 * Force reconnect after recovery. Call this from health check or admin endpoint.
 */
export function resetRedisConnection(): void {
  redis?.disconnect();
  redis = null;
  redisAvailable = false;
}
