import { logger } from "@/lib/logger";
import { initPubSub, publish, isAvailable, type SSEPubSubMessage } from "@/lib/sse-pubsub";

// Simple SSE (Server-Sent Events) manager for real-time updates

type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController;
  userId?: string;
  tournamentId?: string;
  lastActivity: number;
};

const HEARTBEAT_INTERVAL_MS = 30_000;
const CLIENT_TIMEOUT_MS = 120_000;
const MAX_CLIENTS = 5000;

class SSEManager {
  private clients: Map<string, SSEClient> = new Map();
  private tournamentIndex: Map<string, Set<string>> = new Map();
  private userIndex: Map<string, Set<string>> = new Map();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private static instance: SSEManager;

  static getInstance(): SSEManager {
    if (!SSEManager.instance) {
      SSEManager.instance = new SSEManager();
    }
    return SSEManager.instance;
  }

  private startHeartbeat() {
    if (this.heartbeatTimer) return;
    this.heartbeatTimer = setInterval(() => {
      if (this.clients.size === 0) {
        if (this.heartbeatTimer) {
          clearInterval(this.heartbeatTimer);
          this.heartbeatTimer = null;
        }
        return;
      }
      const now = Date.now();
      for (const [id, client] of [...this.clients]) {
        if (now - client.lastActivity > CLIENT_TIMEOUT_MS) {
          this.removeClient(id);
          continue;
        }
        try {
          client.controller.enqueue(new TextEncoder().encode(":keepalive\n\n"));
          client.lastActivity = now;
        } catch {
          this.removeClient(id);
        }
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  addClient(
    id: string,
    controller: ReadableStreamDefaultController,
    options?: { userId?: string; tournamentId?: string }
  ) {
    if (this.clients.size >= MAX_CLIENTS) {
      logger.warn(`[SSE] Max clients reached (${MAX_CLIENTS}), rejecting new connection`);
      try {
        controller.close();
      } catch { /* already closed */ }
      return;
    }

    this.clients.set(id, {
      id,
      controller,
      userId: options?.userId,
      tournamentId: options?.tournamentId,
      lastActivity: Date.now(),
    });
    this.startHeartbeat();

    // Update secondary indexes
    if (options?.tournamentId) {
      let set = this.tournamentIndex.get(options.tournamentId);
      if (!set) {
        set = new Set();
        this.tournamentIndex.set(options.tournamentId, set);
      }
      set.add(id);
    }
    if (options?.userId) {
      let set = this.userIndex.get(options.userId);
      if (!set) {
        set = new Set();
        this.userIndex.set(options.userId, set);
      }
      set.add(id);
    }
  }

  removeClient(id: string) {
    const client = this.clients.get(id);
    if (!client) return;

    // Clean up secondary indexes
    if (client.tournamentId) {
      const set = this.tournamentIndex.get(client.tournamentId);
      if (set) {
        set.delete(id);
        if (set.size === 0) this.tournamentIndex.delete(client.tournamentId);
      }
    }
    if (client.userId) {
      const set = this.userIndex.get(client.userId);
      if (set) {
        set.delete(id);
        if (set.size === 0) this.userIndex.delete(client.userId);
      }
    }

    this.clients.delete(id);
  }

  sendToClient(clientId: string, event: string, data: unknown) {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      client.controller.enqueue(new TextEncoder().encode(message));
      client.lastActivity = Date.now();
    } catch (error) {
      logger.error(`Failed to send SSE to client ${clientId}`, error instanceof Error ? error : new Error(String(error)));
      this.removeClient(clientId);
    }
  }

  broadcastToTournament(tournamentId: string, event: string, data: unknown) {
    // Send to local clients
    const clientIds = this.tournamentIndex.get(tournamentId);
    if (clientIds) {
      for (const id of [...clientIds]) {
        this.sendToClient(id, event, data);
      }
    }
    // Publish to other PM2 instances via Redis
    if (isAvailable()) {
      publish({ type: "broadcastToTournament", tournamentId, event, data });
    }
  }

  broadcastToAll(event: string, data: unknown) {
    // Send to local clients
    for (const [id] of [...this.clients]) {
      this.sendToClient(id, event, data);
    }
    // Publish to other PM2 instances via Redis
    if (isAvailable()) {
      publish({ type: "broadcastToAll", event, data });
    }
  }

  sendToUser(userId: string, event: string, data: unknown) {
    // Send to local clients
    const clientIds = this.userIndex.get(userId);
    if (clientIds) {
      for (const id of [...clientIds]) {
        this.sendToClient(id, event, data);
      }
    }
    // Publish to other PM2 instances via Redis
    if (isAvailable()) {
      publish({ type: "sendToUser", userId, event, data });
    }
  }

  /** Handle incoming pub/sub message from another PM2 instance */
  handlePubSubMessage(msg: SSEPubSubMessage) {
    switch (msg.type) {
      case "broadcastToTournament":
        if (msg.tournamentId) {
          const clientIds = this.tournamentIndex.get(msg.tournamentId);
          if (clientIds) {
            for (const id of [...clientIds]) {
              this.sendToClient(id, msg.event, msg.data);
            }
          }
        }
        break;
      case "broadcastToAll":
        for (const [id] of [...this.clients]) {
          this.sendToClient(id, msg.event, msg.data);
        }
        break;
      case "sendToUser":
        if (msg.userId) {
          const clientIds = this.userIndex.get(msg.userId);
          if (clientIds) {
            for (const id of [...clientIds]) {
              this.sendToClient(id, msg.event, msg.data);
            }
          }
        }
        break;
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export const sseManager = SSEManager.getInstance();

// Initialize Redis pub/sub for cross-instance SSE (PM2 cluster mode)
initPubSub((msg) => sseManager.handlePubSubMessage(msg));

// Event types for tournament updates
export const SSE_EVENTS = {
  TOURNAMENT_UPDATE: "tournament-update",
  STAGE_UPDATE: "stage-update",
  GAME_RESULT: "game-result",
  BRACKET_UPDATE: "bracket-update",
  STANDINGS_UPDATE: "standings-update",
  REGISTRATION_UPDATE: "registration-update",
  ANNOUNCEMENT: "announcement",
} as const;
