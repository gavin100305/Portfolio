import { obstacles, rooms, type Point } from "@/data/station-world";
import type { SectionId } from "@/data/sections";

type Polygon = readonly Point[];
const rectangle = (x: number, y: number, w: number, h: number): Polygon => [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }];

/** Only existing equipment footprints gain shallow sides; paths do not move. */
export function equipmentPolygons(id: SectionId): Polygon[] {
  const room = rooms[id], scale = room.width / 240;
  const boxes = obstacles.filter(b => b.x >= room.x && b.y >= room.y && b.x + b.width <= room.x + room.width && b.y + b.height <= room.y + room.height)
    .map(b => ({ x: (b.x - room.x) / scale, y: (b.y - room.y) / scale, w: b.width / scale, h: b.height / scale }));
  const result: Polygon[] = [];
  for (const b of boxes) {
    // Leave foliage on its original art layer; lift its pot with the room art.
    if (Math.abs(b.w - 15) < .01 && Math.abs(b.h - 20) < .01) continue;
    if (id === "projects" && b.x >= 54 && b.x <= 84 && b.w <= 50) continue;
    if (id === "contact" && Math.abs(b.x - 42) < .01) continue;
    result.push(rectangle(b.x, b.y, b.w, b.h));
  }
  if (id === "projects") result.push([[74,60],[84,60],[84,72],[92,72],[92,106],[104,106],[104,132],[88,132],[88,142],[70,142],[70,132],[54,132],[54,106],[66,106],[66,72],[74,72]].map(([x,y]) => ({x,y})));
  if (id === "contact") {
    result.push([[60,60],[84,60],[84,64],[94,64],[94,72],[100,72],[100,108],[94,108],[94,116],[84,116],[84,120],[60,120],[60,116],[50,116],[50,108],[44,108],[44,72],[50,72],[50,64],[60,64]].map(([x,y]) => ({x,y})));
    result.push(rectangle(56,122,32,12));
  }
  return result;
}

