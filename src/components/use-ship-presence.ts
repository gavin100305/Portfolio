"use client";

import { useEffect, useState } from "react";
import { parsePresenceSyncFrame, type RemoteVisitor } from "@/data/ship-presence";
import type { Direction } from "@/data/astronauts";

type Movement = { x: number; y: number; facing: Direction };
type Ticket = { token: string; guestId: string };

function validTicket(value: unknown): value is Ticket {
  if (!value || typeof value !== "object") return false;
  const ticket = value as Record<string, unknown>;
  return typeof ticket.token === "string" && ticket.token.length < 1500 &&
    typeof ticket.guestId === "string" && /^[0-9a-f-]{36}$/i.test(ticket.guestId);
}

export function useShipPresence(enabled: boolean, getMovement: () => Movement) {
  const [visitors, setVisitors] = useState<RemoteVisitor[]>([]);
  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_PRESENCE_URL?.trim();
    if (!enabled || !baseUrl) return;

    let cancelled = false;
    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let sendTimer: ReturnType<typeof setInterval> | undefined;
    let pingTimer: ReturnType<typeof setInterval> | undefined;
    let retryDelay = 1000;
    let sequence = 0;

    const clearSocketTimers = () => {
      if (sendTimer) clearInterval(sendTimer);
      if (pingTimer) clearInterval(pingTimer);
      sendTimer = undefined;
      pingTimer = undefined;
    };
    const scheduleReconnect = () => {
      clearSocketTimers();
      if (cancelled || retryTimer) return;
      setVisitors([]);
      retryTimer = setTimeout(() => { retryTimer = undefined; void connect(); }, retryDelay);
      retryDelay = Math.min(retryDelay * 2, 30_000);
    };
    const connect = async () => {
      try {
        const endpoint = new URL(baseUrl);
        const ticketResponse = await fetch(new URL("ticket", `${endpoint.toString().replace(/\/$/, "")}/`), { method: "POST" });
        if (!ticketResponse.ok) throw new Error("Presence ticket unavailable");
        const value: unknown = await ticketResponse.json();
        if (!validTicket(value)) throw new Error("Invalid presence ticket");
        if (cancelled) return;
        const wsUrl = new URL("connect", `${endpoint.toString().replace(/\/$/, "")}/`);
        wsUrl.protocol = wsUrl.protocol === "https:" ? "wss:" : "ws:";
        socket = new WebSocket(wsUrl, ["ship-v1", `ticket.${value.token}`]);
        socket.addEventListener("open", () => {
          retryDelay = 1000;
          let lastSent = "";
          sendTimer = setInterval(() => {
            if (socket?.readyState !== WebSocket.OPEN) return;
            const current = getMovement();
            const movementKey = JSON.stringify(current);
            if (movementKey === lastSent) return;
            lastSent = movementKey;
            const encoded = JSON.stringify({ ...current, sequence: sequence++ });
            socket.send(encoded);
          }, 200);
          pingTimer = setInterval(() => { if (socket?.readyState === WebSocket.OPEN) socket.send("ping"); }, 30_000);
        });
        socket.addEventListener("message", (event) => {
          if (typeof event.data !== "string" || event.data === "pong") return;
          try {
            const parsed = parseFrame(event.data);
            if (!parsed) return;
            setVisitors(parsed.filter((visitor) => visitor.guestId !== value.guestId));
          } catch { /* Ignore malformed server messages. */ }
        });
        socket.addEventListener("close", scheduleReconnect, { once: true });
        socket.addEventListener("error", () => socket?.close(), { once: true });
      } catch {
        scheduleReconnect();
      }
    };
    void connect();
    return () => {
      cancelled = true;
      clearSocketTimers();
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close(1000, "Map closed");
    };
  }, [enabled, getMovement]);
  return enabled && Boolean(process.env.NEXT_PUBLIC_PRESENCE_URL?.trim()) ? visitors : [];
}

function parseFrame(message: string): RemoteVisitor[] | null {
  // Keep runtime parsing in the shared data module so malformed network data
  // never reaches the scene renderer.
  return parsePresenceSyncFrame(message);
}
