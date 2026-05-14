import Redis from "ioredis";

let redis: Redis | null = null;
let redisFailed = false;

export function getRedis(): Redis | null {
  if (redisFailed) return null;
  if (redis) return redis;

  const url = process.env.REDIS_URL;
  if (!url) {
    redisFailed = true;
    return null;
  }

  try {
    redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) {
          redisFailed = true;
          return null;
        }
        return Math.min(times * 200, 2000);
      },
    });

    redis.on("error", () => {
      // Silently handle — fallback kicks in
    });

    return redis;
  } catch {
    redisFailed = true;
    return null;
  }
}

export function isRedisAvailable(): boolean {
  return !redisFailed && !!redis;
}
