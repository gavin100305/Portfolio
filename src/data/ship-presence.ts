import { SUIT_PALETTES, type Direction, type SuitPalette } from "./astronauts.ts";
import { WORLD } from "./station-world.ts";

export type RemoteVisitor = {
  guestId: string;
  palette: SuitPalette;
  x: number;
  y: number;
  facing: Direction;
  sequence: number;
};

export function parsePresenceSyncFrame(value: unknown): RemoteVisitor[] | null {
  if (typeof value !== "string" || value.length > 32_768) return null;
  let decoded: unknown;
  try { decoded = JSON.parse(value); } catch { return null; }
  if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) return null;
  const frame = decoded as Record<string, unknown>;
  if (frame.type !== "sync" || !Array.isArray(frame.visitors) || frame.visitors.length > 32) return null;
  const ids = new Set<string>();
  const visitors: RemoteVisitor[] = [];
  for (const value of frame.visitors) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const v = value as Record<string, unknown>;
    if (Object.keys(v).sort().join(",") !== "facing,guestId,palette,sequence,x,y") return null;
    if (typeof v.guestId !== "string" || !/^[0-9a-f-]{36}$/i.test(v.guestId) || ids.has(v.guestId)) return null;
    if (typeof v.x !== "number" || !Number.isFinite(v.x) || v.x < 0 || v.x > WORLD.width) return null;
    if (typeof v.y !== "number" || !Number.isFinite(v.y) || v.y < 0 || v.y > WORLD.height) return null;
    if (v.facing !== "up" && v.facing !== "down" && v.facing !== "left" && v.facing !== "right") return null;
    if (typeof v.palette !== "string" || !(SUIT_PALETTES as readonly string[]).includes(v.palette)) return null;
    if (typeof v.sequence !== "number" || !Number.isSafeInteger(v.sequence) || v.sequence < 0) return null;
    ids.add(v.guestId);
    visitors.push({ guestId: v.guestId, palette: v.palette as SuitPalette, x: v.x, y: v.y, facing: v.facing as Direction, sequence: v.sequence });
  }
  return visitors;
}
