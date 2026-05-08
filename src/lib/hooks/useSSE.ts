"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface SSEOptions {
  tournamentId?: string;
  onEvent?: (event: string, data: unknown) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export function useSSE(options: SSEOptions = {}) {
  const { tournamentId } = options;
  const eventSourceRef = useRef<EventSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // Store callbacks in refs to avoid reconnect loops
  const onEventRef = useRef(options.onEvent);
  const onConnectRef = useRef(options.onConnect);
  const onDisconnectRef = useRef(options.onDisconnect);
  const onErrorRef = useRef(options.onError);
  onEventRef.current = options.onEvent;
  onConnectRef.current = options.onConnect;
  onDisconnectRef.current = options.onDisconnect;
  onErrorRef.current = options.onError;

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = tournamentId
      ? `/api/sse/tournaments/${tournamentId}`
      : "/api/sse/global";

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("connected", () => {
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      onConnectRef.current?.();
    });

    const eventTypes = [
      "tournament-update",
      "stage-update",
      "game-result",
      "bracket-update",
      "standings-update",
      "registration-update",
      "announcement",
    ];

    eventTypes.forEach((eventType) => {
      eventSource.addEventListener(eventType, (event) => {
        try {
          const data = JSON.parse((event as MessageEvent).data);
          onEventRef.current?.(eventType, data);
        } catch (error) {
          console.error(`Failed to parse SSE event ${eventType}:`, error);
        }
      });
    });

    eventSource.onerror = (error) => {
      setIsConnected(false);
      onDisconnectRef.current?.();
      onErrorRef.current?.(error);

      const maxReconnectAttempts = 10;
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current++;

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      }
    };
  }, [tournamentId]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    disconnect,
    reconnect: connect,
  };
}
