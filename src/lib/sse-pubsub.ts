import Redis from "ioredis";
import { logger } from "@/lib/logger";

const SSE_CHANNEL = "sse:broadcast";

export interface SSEPubSubMessage {
  type: "broadcastToTournament" | "broadcastToAll" | "sendToUser";
  tournamentId?: string;
  userId?: string;
  event: string;
  data: unknown;
  /** Instance ID to skip (don't re-broadcast to sender) */
  instanceId: string;
}

let pubClient: Redis | null = null;
let subClient: Redis | null = null;
const instanceId = `sse-${process.pid}-${Date.now()}`;
let messageHandler: ((msg: SSEPubSubMessage) => void) | null = null;
let subscribed = false;

function createRedisClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    return new Redis(url, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
    });
  } catch {
    return null;
  }
}

// NOTE: SSE pub/sub needs 2 separate connections (pub + sub) because
// Redis subscriptions block the connection. Cannot use shared getRedis().

export function getInstanceId(): string {
  return instanceId;
}

export function initPubSub(handler: (msg: SSEPubSubMessage) => void): void {
  if (subscribed) return;

  pubClient = createRedisClient();
  subClient = createRedisClient();

  if (!pubClient || !subClient) {
    logger.warn("[SSE_PUBSUB] Redis not available — SSE will only work on local instance");
    return;
  }

  messageHandler = handler;

  subClient.subscribe(SSE_CHANNEL, (err) => {
    if (err) {
      logger.error("[SSE_PUBSUB] Failed to subscribe", err instanceof Error ? err : new Error(String(err)));
      return;
    }
    subscribed = true;
    logger.info("[SSE_PUBSUB] Subscribed to SSE channel");
  });

  subClient.on("message", (_channel, message) => {
    try {
      const msg: SSEPubSubMessage = JSON.parse(message);
      // Skip messages from this instance (already handled locally)
      if (msg.instanceId === instanceId) return;
      messageHandler?.(msg);
    } catch (err) {
      logger.error("[SSE_PUBSUB] Failed to parse message", err instanceof Error ? err : new Error(String(err)));
    }
  });

  subClient.on("error", (err) => {
    logger.error("[SSE_PUBSUB] Subscriber error", err instanceof Error ? err : new Error(String(err)));
  });

  pubClient.on("error", (err) => {
    logger.error("[SSE_PUBSUB] Publisher error", err instanceof Error ? err : new Error(String(err)));
  });
}

export function publish(message: Omit<SSEPubSubMessage, "instanceId">): void {
  if (!pubClient) return;

  try {
    const fullMsg: SSEPubSubMessage = { ...message, instanceId };
    pubClient.publish(SSE_CHANNEL, JSON.stringify(fullMsg)).catch((err) => {
      logger.error("[SSE_PUBSUB] Failed to publish", err instanceof Error ? err : new Error(String(err)));
    });
  } catch (err) {
    logger.error("[SSE_PUBSUB] Publish error", err instanceof Error ? err : new Error(String(err)));
  }
}

export function isAvailable(): boolean {
  return subscribed && !!pubClient;
}
