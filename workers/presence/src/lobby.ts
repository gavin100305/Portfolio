import { DurableObject } from "cloudflare:workers";
import { isGuestTicket, isSuitPalette, isWalkableMovement, MAX_ROOM_MEMBERS, MOVEMENT_INTERVAL_MS, parseMovementFrame, verifyGuestTicket } from "./protocol";
import { WORLD } from "../../../src/data/station-world.ts";
import type { Direction, SuitPalette } from "../../../src/data/astronauts.ts";
import type { Env } from "./env";

type AvatarState = {
  guestId: string;
  palette: SuitPalette;
  x: number;
  y: number;
  facing: Direction;
  sequence: number;
  updateTimes: number[];
};
type Reservation = { guestId: string; expiresAt: number };
type MemberLease = { expiresAt: number };

export class Lobby extends DurableObject<Env> {
  private broadcastTimer: ReturnType<typeof setTimeout> | null = null;

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/reserve") return this.reserve(request);
    if (request.method === "GET" && url.pathname === "/connect") return this.acceptConnection(request);
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  private async reserve(request: Request): Promise<Response> {
    let body: { ticketId?: unknown; guestId?: unknown; expiresAt?: unknown };
    try { body = await request.json(); } catch { return new Response(null, { status: 400 }); }
    if (typeof body.ticketId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.ticketId) ||
      typeof body.guestId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.guestId) ||
      typeof body.expiresAt !== "number" || !Number.isSafeInteger(body.expiresAt) ||
      body.expiresAt <= Date.now() || body.expiresAt > Date.now() + 65_000) return new Response(null, { status: 400 });

    const reserved = await this.ctx.storage.transaction(async (transaction) => {
      const now = Date.now();
      const reservations = await transaction.list<Reservation>({ prefix: "reservation:" });
      const members = await transaction.list<MemberLease>({ prefix: "member:" });
      for (const [key, value] of reservations) if (value.expiresAt <= now) await transaction.delete(key);
      for (const [key, value] of members) if (value.expiresAt <= now) await transaction.delete(key);
      const activeReservations = [...reservations.values()].filter((item) => item.expiresAt > now).length;
      const activeMembers = [...members.values()].filter((item) => item.expiresAt > now).length;
      const existing = await transaction.get<Reservation>(`reservation:${body.ticketId}`);
      if (existing) return existing.guestId === body.guestId;
      if (activeReservations + activeMembers >= MAX_ROOM_MEMBERS) return false;
      await transaction.put(`reservation:${body.ticketId}`, { guestId: body.guestId, expiresAt: body.expiresAt });
      return true;
    });
    if (!reserved) return new Response(null, { status: 409 });
    await this.refreshAlarm();
    return new Response(null, { status: 204 });
  }

  private async acceptConnection(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket" ||
      request.headers.get("Sec-WebSocket-Protocol") !== "ship-v1") return new Response("WebSocket required", { status: 426 });
    const token = request.headers.get("X-Guest-Ticket") ?? "";
    const ticket = await verifyGuestTicket(token, this.env.PRESENCE_TICKET_SECRET);
    if (!ticket || !isGuestTicket(ticket) || this.env.LOBBIES.idFromName(ticket.lobbyId).toString() !== this.ctx.id.toString()) {
      return new Response("Invalid ticket", { status: 401 });
    }

    const approved = await this.ctx.storage.transaction(async (transaction) => {
      const now = Date.now();
      const reservation = await transaction.get<Reservation>(`reservation:${ticket.ticketId}`);
      const memberKey = `member:${ticket.guestId}`;
      const existingMember = await transaction.get<MemberLease>(memberKey);
      if (existingMember && existingMember.expiresAt > now) {
        await transaction.put(memberKey, { expiresAt: now + 90_000 });
        return true;
      }
      if (!reservation || reservation.guestId !== ticket.guestId || reservation.expiresAt <= now) return false;
      const members = await transaction.list<MemberLease>({ prefix: "member:" });
      const reservations = await transaction.list<Reservation>({ prefix: "reservation:" });
      const activeMembers = [...members.values()].filter((item) => item.expiresAt > now).length;
      const activeReservations = [...reservations.entries()].filter(([key, item]) => key !== `reservation:${ticket.ticketId}` && item.expiresAt > now).length;
      if (activeMembers + activeReservations >= MAX_ROOM_MEMBERS) return false;
      await transaction.delete(`reservation:${ticket.ticketId}`);
      await transaction.put(memberKey, { expiresAt: now + 90_000 });
      return true;
    });
    if (!approved) return new Response("Lobby full or ticket expired", { status: 409 });

    const existing = this.ctx.getWebSockets().find((socket) => this.avatarFor(socket)?.guestId === ticket.guestId);
    const savedState = existing ? this.avatarFor(existing) : null;
    const previousState = savedState && isWalkableMovement(savedState, savedState) ? savedState : null;
    existing?.close(4000, "Session reconnected");

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment(previousState ?? {
      guestId: ticket.guestId,
      palette: ticket.palette,
      x: WORLD.spawn.x,
      y: WORLD.spawn.y,
      facing: "down",
      sequence: -1,
      updateTimes: [],
    } satisfies AvatarState);
    server.send(JSON.stringify({ type: "sync", visitors: this.currentVisitors() }));
    this.broadcastSnapshot();
    await this.refreshAlarm();
    return new Response(null, { status: 101, webSocket: client, headers: { "Sec-WebSocket-Protocol": "ship-v1" } });
  }

  async webSocketMessage(socket: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const avatar = this.avatarFor(socket);
    if (!avatar) { socket.close(1008, "Session expired"); return; }

    if (typeof message === "string" && message === "ping") {
      await this.refreshMemberLease(avatar.guestId);
      socket.send("pong");
      return;
    }
    const snapshot = parseMovementFrame(message);
    if (!snapshot || snapshot.sequence <= avatar.sequence ||
      Math.hypot(snapshot.x - avatar.x, snapshot.y - avatar.y) > WORLD.speed * 0.45) {
      socket.close(1008, "Invalid movement update");
      return;
    }
    // A position can be in bounds yet lie behind a hull wall or inside a console.
    // Ignore that snapshot while keeping the valid session and last position.
    if (!isWalkableMovement(avatar, snapshot)) return;
    const now = Date.now();
    const recentUpdates = avatar.updateTimes.filter((time) => time > now - 1000);
    if (recentUpdates.length >= 5) { socket.close(1008, "Movement rate exceeded"); return; }
    avatar.x = snapshot.x;
    avatar.y = snapshot.y;
    avatar.facing = snapshot.facing;
    avatar.sequence = snapshot.sequence;
    avatar.updateTimes = [...recentUpdates, now];
    socket.serializeAttachment(avatar);
    await this.refreshMemberLease(avatar.guestId);
    this.scheduleSnapshot();
  }

  async webSocketClose(socket: WebSocket): Promise<void> {
    const avatar = this.avatarFor(socket);
    if (!avatar) return;
    const replacement = this.ctx.getWebSockets().some((candidate) => candidate !== socket && this.avatarFor(candidate)?.guestId === avatar.guestId);
    if (!replacement) await this.ctx.storage.delete(`member:${avatar.guestId}`);
    await this.refreshAlarm();
    this.broadcastSnapshot();
  }

  async webSocketError(socket: WebSocket): Promise<void> {
    await this.webSocketClose(socket);
  }

  async alarm(): Promise<void> {
    const now = Date.now();
    const sockets = this.ctx.getWebSockets();
    const active = new Set(sockets.map((socket) => this.avatarFor(socket)?.guestId).filter((id): id is string => Boolean(id)));
    const reservations = await this.ctx.storage.list<Reservation>({ prefix: "reservation:" });
    const members = await this.ctx.storage.list<MemberLease>({ prefix: "member:" });
    for (const [key, item] of reservations) if (item.expiresAt <= now) await this.ctx.storage.delete(key);
    for (const [key, item] of members) {
      if (item.expiresAt > now) continue;
      const guestId = key.slice("member:".length);
      if (active.has(guestId)) {
        for (const socket of sockets) if (this.avatarFor(socket)?.guestId === guestId) socket.close(1001, "Presence expired");
      } else await this.ctx.storage.delete(key);
    }
    await this.refreshAlarm();
    if (sockets.length) this.broadcastSnapshot();
  }

  private avatarFor(socket: WebSocket): AvatarState | null {
    const value = socket.deserializeAttachment() as Partial<AvatarState> | null;
    if (!value || typeof value.guestId !== "string" || !isSuitPalette(value.palette) ||
      typeof value.x !== "number" || typeof value.y !== "number" || typeof value.facing !== "string" ||
      !("up down left right".split(" ").includes(value.facing)) || typeof value.sequence !== "number") return null;
    return value as AvatarState;
  }

  private currentVisitors() {
    return this.ctx.getWebSockets().map((socket) => this.avatarFor(socket)).filter((avatar): avatar is AvatarState => avatar !== null)
      .map(({ guestId, palette, x, y, facing, sequence }) => ({ guestId, palette, x, y, facing, sequence }));
  }

  private scheduleSnapshot() {
    if (this.broadcastTimer) return;
    this.broadcastTimer = setTimeout(() => {
      this.broadcastTimer = null;
      this.broadcastSnapshot();
    }, MOVEMENT_INTERVAL_MS);
  }

  private broadcastSnapshot() {
    const message = JSON.stringify({ type: "sync", visitors: this.currentVisitors() });
    for (const socket of this.ctx.getWebSockets()) {
      try { socket.send(message); } catch { socket.close(1011, "Presence unavailable"); }
    }
  }

  private async refreshMemberLease(guestId: string) {
    await this.ctx.storage.put(`member:${guestId}`, { expiresAt: Date.now() + 90_000 } satisfies MemberLease);
    await this.refreshAlarm();
  }

  private async refreshAlarm() {
    const [reservations, members] = await Promise.all([
      this.ctx.storage.list<Reservation>({ prefix: "reservation:" }),
      this.ctx.storage.list<MemberLease>({ prefix: "member:" }),
    ]);
    const expiring = [...reservations.values(), ...members.values()].map((item) => item.expiresAt).filter((time) => time > Date.now());
    if (!expiring.length) await this.ctx.storage.deleteAlarm();
    else await this.ctx.storage.setAlarm(Math.min(...expiring));
  }
}
