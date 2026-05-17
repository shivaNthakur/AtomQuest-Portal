"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./useAuth";

type EventHandler = (payload: unknown) => void;

export function useRealTimeSync(
  events: Record<string, EventHandler>,
  onConnect?: () => void
) {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(events);
  handlersRef.current = events;

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function connect() {
      const res = await fetch("/api/socket-token");
      if (!res.ok || cancelled) return;
      const { token } = await res.json();

      const socket = io({
        path: "/api/socket",
        auth: { token },
        transports: ["websocket", "polling"],
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        onConnect?.();
      });

      Object.keys(handlersRef.current).forEach((event) => {
        socket.on(event, (payload) => {
          handlersRef.current[event]?.(payload);
        });
      });
    }

    connect();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, onConnect]);
}
