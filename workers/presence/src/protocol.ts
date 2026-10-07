import { SUIT_PALETTES, type Direction, type SuitPalette } from "../../../src/data/astronauts.ts";
import { canWalkSegment, DOOR_APPROACH_RADIUS, stationDoors, WORLD, type Point } from "../../../src/data/station-world.ts";

export type { Direction, SuitPalette };
export const MAX_ROOM_MEMBERS = 32;
export const MAX_LOBBIES = 64;
export const MOVEMENT_INTERVAL_MS = 200;
export const TICKET_LIFETIME_MS = 60_000;
export const MAX_MESSAGE_BYTES = 512;
export const WORLD_BOUNDS = { width: WORLD.width, height: WORLD.height } as const;

export type MovementSnapshot = { x: number; y: number; facing: Direction; sequence: number };
export type GuestTicket = {
  guestId: string;
  ticketId: string;
  lobbyId: string;
  palette: SuitPalette;
  expiresAt: number;
};

function distanceToRect(point: Point, rect: { x: number; y: number; width: number; height: number }) {
  const x = Math.max(rect.x, Math.min(rect.x + rect.width, point.x));
  const y = Math.max(rect.y, Math.min(rect.y + rect.height, point.y));
  return Math.hypot(point.x - x, point.y - y);
}

/** Server-side movement validation against the exact floor and props used by the client. */
export function isWalkableMovement(from: Point, to: Point) {
  const closedDoors = stationDoors.filter((door) =>
    distanceToRect(from, door) >= DOOR_APPROACH_RADIUS && distanceToRect(to, door) >= DOOR_APPROACH_RADIUS,
  );
  return canWalkSegment(from, to, closedDoors);
}

export function parseMovementSnapshot(value: unknown): MovementSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (keys.join(",") !== "facing,sequence,x,y") return null;
  if (typeof record.x !== "number" || !Number.isFinite(record.x) || record.x < 0 || record.x > WORLD_BOUNDS.width) return null;
  if (typeof record.y !== "number" || !Number.isFinite(record.y) || record.y < 0 || record.y > WORLD_BOUNDS.height) return null;
  if (record.facing !== "up" && record.facing !== "down" && record.facing !== "left" && record.facing !== "right") return null;
  if (typeof record.sequence !== "number" || !Number.isSafeInteger(record.sequence) || record.sequence < 0) return null;
  return { x: record.x, y: record.y, facing: record.facing, sequence: record.sequence };
}

export function parseMovementFrame(message: string | ArrayBuffer): MovementSnapshot | null {
  const size = typeof message === "string" ? new TextEncoder().encode(message).byteLength : message.byteLength;
  if (size > MAX_MESSAGE_BYTES) return null;
  try {
    return parseMovementSnapshot(JSON.parse(typeof message === "string" ? message : new TextDecoder().decode(message)));
  } catch {
    return null;
  }
}

export function isSuitPalette(value: unknown): value is SuitPalette {
  return typeof value === "string" && (SUIT_PALETTES as readonly string[]).includes(value);
}

export function isAllowedOrigin(requestOrigin: string | null, allowedOrigin: string): boolean {
  if (!requestOrigin) return false;
  try { return new URL(requestOrigin).origin === new URL(allowedOrigin).origin; } catch { return false; }
}

export function isGuestTicket(value: unknown, now = Date.now()): value is GuestTicket {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const ticket = value as Partial<GuestTicket>;
  return typeof ticket.guestId === "string" && /^[0-9a-f-]{36}$/i.test(ticket.guestId) &&
    typeof ticket.ticketId === "string" && /^[0-9a-f-]{36}$/i.test(ticket.ticketId) &&
    typeof ticket.lobbyId === "string" && /^lobby-[0-9]{1,2}$/.test(ticket.lobbyId) &&
    isSuitPalette(ticket.palette) && Number.isSafeInteger(ticket.expiresAt) &&
    (ticket.expiresAt as number) > now && (ticket.expiresAt as number) <= now + TICKET_LIFETIME_MS + 5_000;
}

function encodeBase64Url(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function importSigningKey(secret: string, usage: KeyUsage[]): Promise<CryptoKey> {
  if (secret.length < 32) throw new Error("Presence ticket secret must be at least 32 characters");
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, usage);
}

export async function signGuestTicket(ticket: GuestTicket, secret: string): Promise<string> {
  if (!isGuestTicket(ticket, ticket.expiresAt - TICKET_LIFETIME_MS)) throw new Error("Invalid guest ticket claims");
  const payload = encodeBase64Url(new TextEncoder().encode(JSON.stringify(ticket)));
  const key = await importSigningKey(secret, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function verifyGuestTicket(token: string, secret: string, now = Date.now()): Promise<GuestTicket | null> {
  if (token.length > 1024) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  try {
    const key = await importSigningKey(secret, ["verify"]);
    if (!await crypto.subtle.verify("HMAC", key, decodeBase64Url(signature), new TextEncoder().encode(payload))) return null;
    const ticket = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload)));
    return isGuestTicket(ticket, now) ? ticket : null;
  } catch {
    return null;
  }
}

export function lobbyHintFromTicket(token: string): string | null {
  if (token.length > 1024) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  try {
    const claims = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload))) as { lobbyId?: unknown };
    return typeof claims.lobbyId === "string" && /^lobby-[0-9]{1,2}$/.test(claims.lobbyId) ? claims.lobbyId : null;
  } catch {
    return null;
  }
}
