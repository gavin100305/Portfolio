import { Coordinator } from "./coordinator";
import { Lobby } from "./lobby";
import { isAllowedOrigin, lobbyHintFromTicket } from "./protocol";
import type { Env } from "./env";

export { Coordinator, Lobby };

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== "/ticket" && url.pathname !== "/connect") return Response.json({ error: "Not found" }, { status: 404 });
    if (!isAllowedOrigin(request.headers.get("Origin"), env.ALLOWED_ORIGIN)) return Response.json({ error: "Origin not allowed" }, { status: 403 });

    if (request.method === "OPTIONS" && url.pathname === "/ticket") {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }
    if (url.pathname === "/ticket") {
      if (request.method !== "POST") return withCors(Response.json({ error: "Method not allowed" }, { status: 405 }), env);
      const coordinator = env.COORDINATOR.get(env.COORDINATOR.idFromName("ship-presence-coordinator"));
      const response = await coordinator.fetch("https://coordinator.internal/ticket", { method: "POST" });
      return withCors(response, env);
    }

    if (request.method !== "GET" || request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("WebSocket upgrade required", { status: 426 });
    }
    const offered = request.headers.get("Sec-WebSocket-Protocol") ?? "";
    if (offered.length > 1500) return new Response("Invalid WebSocket protocols", { status: 400 });
    const protocols = offered.split(",").map((protocol) => protocol.trim());
    const ticketProtocol = protocols.find((protocol) => protocol.startsWith("ticket."));
    const token = ticketProtocol?.slice("ticket.".length) ?? "";
    if (!protocols.includes("ship-v1") || !token) return new Response("Guest ticket required", { status: 401 });
    const lobbyId = lobbyHintFromTicket(token);
    if (!lobbyId) return new Response("Invalid guest ticket", { status: 401 });

    const lobby = env.LOBBIES.get(env.LOBBIES.idFromName(lobbyId));
    const headers = new Headers(request.headers);
    headers.set("Sec-WebSocket-Protocol", "ship-v1");
    headers.set("X-Guest-Ticket", token);
    return lobby.fetch(new Request(request, { headers }));
  },
};

export default worker;

function corsHeaders(env: Env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "600",
    "Vary": "Origin",
  };
}

function withCors(response: Response, env: Env): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(env))) headers.set(key, value);
  return new Response(response.body, { status: response.status, headers });
}
