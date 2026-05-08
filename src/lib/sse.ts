// Simple SSE (Server-Sent Events) manager for real-time updates

type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController;
  userId?: string;
  tournamentId?: string;
};

class SSEManager {
  private clients: Map<string, SSEClient> = new Map();
  private tournamentIndex: Map<string, Set<string>> = new Map();
  private userIndex: Map<string, Set<string>> = new Map();
  private static instance: SSEManager;

  static getInstance(): SSEManager {
    if (!SSEManager.instance) {
      SSEManager.instance = new SSEManager();
    }
    return SSEManager.instance;
  }

  addClient(
    id: string,
    controller: ReadableStreamDefaultController,
    options?: { userId?: string; tournamentId?: string }
  ) {
    this.clients.set(id, {
      id,
      controller,
      userId: options?.userId,
      tournamentId: options?.tournamentId,
    });

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
    } catch (error) {
      console.error(`Failed to send SSE to client ${clientId}:`, error);
      this.removeClient(clientId);
    }
  }

  broadcastToTournament(tournamentId: string, event: string, data: unknown) {
    const clientIds = this.tournamentIndex.get(tournamentId);
    if (!clientIds) return;
    for (const id of clientIds) {
      this.sendToClient(id, event, data);
    }
  }

  broadcastToAll(event: string, data: unknown) {
    for (const [id] of this.clients) {
      this.sendToClient(id, event, data);
    }
  }

  sendToUser(userId: string, event: string, data: unknown) {
    const clientIds = this.userIndex.get(userId);
    if (!clientIds) return;
    for (const id of clientIds) {
      this.sendToClient(id, event, data);
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export const sseManager = SSEManager.getInstance();

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
