import { DurableObject } from "cloudflare:workers";
import { MAX_LOBBIES, TICKET_LIFETIME_MS, signGuestTicket } from "./protocol";
import { paletteForGuest } from "../../../src/data/astronauts.ts";
import type { Env } from "./env";

export class Coordinator extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST" || new URL(request.url).pathname !== "/ticket") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    if (this.env.PRESENCE_TICKET_SECRET.length < 32) {
      return Response.json({ error: "Presence unavailable" }, { status: 503 });
    }

    const cursor = (await this.ctx.storage.get<number>("lobby-cursor")) ?? 0;
    for (let offset = 0; offset < MAX_LOBBIES; offset += 1) {
      const index = (cursor + offset) % MAX_LOBBIES;
      const lobbyId = `lobby-${index}`;
      const ticket: ReturnType<typeof makeTicket> = makeTicket(lobbyId);
      const lobby = this.env.LOBBIES.get(this.env.LOBBIES.idFromName(lobbyId));
      const reservation = await lobby.fetch("https://lobby.internal/reserve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticketId: ticket.ticketId, guestId: ticket.guestId, expiresAt: ticket.expiresAt }),
      });
      if (!reservation.ok) continue;
      // Keep admitting into this lobby until it reports full; this gives
      // visitors a nearby crowd instead of scattering early guests alone.
      await this.ctx.storage.put("lobby-cursor", index);
      const token = await signGuestTicket(ticket, this.env.PRESENCE_TICKET_SECRET);
      return Response.json({ token, guestId: ticket.guestId, lobbyId, palette: ticket.palette, expiresAt: ticket.expiresAt });
    }
    return Response.json({ error: "Lobby capacity reached" }, { status: 503 });
  }
}

function makeTicket(lobbyId: string) {
  const guestId = crypto.randomUUID();
  return {
    guestId,
    ticketId: crypto.randomUUID(),
    lobbyId,
    palette: paletteForGuest(guestId),
    expiresAt: Date.now() + TICKET_LIFETIME_MS,
  };
}
