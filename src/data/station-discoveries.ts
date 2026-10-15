import { rooms, type Point } from "./station-world";

function inRoom(id: keyof typeof rooms, x: number, y: number): Point {
  const room = rooms[id], scale = room.width / 240;
  return { x: room.x + x * scale, y: room.y + y * scale };
}
export const discoveries = {
  airlock: { ...inRoom("contact", 110, 145), label: "Airlock · spacewalk" },
  signal: { ...inRoom("contact", 180, 58), label: "Unidentified signal" },
  robot: { ...inRoom("stack", 120, 148), label: "Sleeping maintenance robot" },
} as const;
export type DiscoveryId = keyof typeof discoveries;
export function discoveryNear(point: Point): DiscoveryId | null {
  return (Object.keys(discoveries) as DiscoveryId[]).find(id => Math.hypot(point.x - discoveries[id].x, point.y - discoveries[id].y) < 95) ?? null;
}
