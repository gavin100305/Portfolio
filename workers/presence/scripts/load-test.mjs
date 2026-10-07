import WebSocket from "ws";

const ticketUrl = process.env.PRESENCE_TICKET_URL;
const wsUrl = process.env.PRESENCE_WS_URL;
const origin = process.env.PRESENCE_ORIGIN;
const clientsRequested = Math.max(1, Number.parseInt(process.env.PRESENCE_CLIENTS ?? "1000", 10));
const durationMs = Math.max(1000, Number.parseInt(process.env.PRESENCE_DURATION_MS ?? "10000", 10));
if (!ticketUrl || !wsUrl || !origin) {
  console.error("Set PRESENCE_TICKET_URL, PRESENCE_WS_URL, and PRESENCE_ORIGIN before running the load test.");
  process.exit(2);
}
if (!Number.isSafeInteger(clientsRequested) || clientsRequested > 2048) {
  console.error("PRESENCE_CLIENTS must be an integer from 1 to 2048.");
  process.exit(2);
}

const started = Date.now();
const sockets = [];
let connected = 0;
let errors = 0;
let reconnects = 0;
let receivedFrames = 0;
let stopping = false;

async function ticketForClient() {
  const response = await fetch(ticketUrl, { method: "POST", headers: { Origin: origin } });
  if (!response.ok) throw new Error(`Ticket request failed (${response.status})`);
  const ticket = await response.json();
  if (typeof ticket.token !== "string" || typeof ticket.guestId !== "string") throw new Error("Ticket response was invalid");
  return ticket;
}

async function connectClient(index, reconnectAttempt = 0) {
  const ticket = await ticketForClient();
  const socket = new WebSocket(wsUrl, ["ship-v1", `ticket.${ticket.token}`], { origin });
  sockets.push(socket);
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("WebSocket open timed out")), 15_000);
    socket.once("open", () => { clearTimeout(timeout); connected += 1; resolve(); });
    socket.once("error", (error) => { clearTimeout(timeout); reject(error); });
  });
  socket.on("message", () => { receivedFrames += 1; });
  socket.on("error", () => { errors += 1; });
  socket.on("close", () => {
    if (stopping) return;
    reconnects += 1;
    setTimeout(() => {
      if (!stopping) connectClient(index, reconnectAttempt + 1).catch(() => { errors += 1; });
    }, Math.min(1000 * 2 ** Math.min(reconnectAttempt, 4), 15_000));
  });
  let sequence = 0;
  let x = 552 * 3;
  const y = 448 * 3;
  const timer = setInterval(() => {
    if (socket.readyState !== WebSocket.OPEN) return;
    x = Math.min(1200 * 3, x + 4);
    socket.send(JSON.stringify({ x, y, facing: "right", sequence: sequence++ }));
  }, 200);
  socket.once("close", () => clearInterval(timer));
  const heartbeat = setInterval(() => { if (socket.readyState === WebSocket.OPEN) socket.send("ping"); }, 30_000);
  socket.once("close", () => clearInterval(heartbeat));
  return index;
}

await Promise.all(Array.from({ length: clientsRequested }, (_, index) => connectClient(index).catch(() => { errors += 1; })));
await new Promise((resolve) => setTimeout(resolve, durationMs));
stopping = true;
for (const socket of sockets) socket.close(1000, "Load test complete");
await new Promise((resolve) => setTimeout(resolve, 100));
console.log(JSON.stringify({ requested: clientsRequested, connected, errors, reconnects, receivedFrames, elapsedMs: Date.now() - started }, null, 2));
