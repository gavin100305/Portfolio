import type { SectionId } from "./sections";

export type Point = { x: number; y: number };
export type Rect = Point & { width: number; height: number };
// Preserve the original illustration at 3× scale; extend its east wing for the arena.
export const MAP_SCALE = 3;
const enlarge = (rect: Rect): Rect => ({ x: rect.x * MAP_SCALE, y: rect.y * MAP_SCALE, width: rect.width * MAP_SCALE, height: rect.height * MAP_SCALE });
export const WORLD = { width: 1656 * MAP_SCALE, height: 800 * MAP_SCALE, radius: 10, speed: 330, spawn: { x: 552 * MAP_SCALE, y: 448 * MAP_SCALE } };
export const rooms: Record<SectionId, Rect> = {
  stack: enlarge({ x: 120, y: 96, width: 252, height: 184.8 }),
  achievements: enlarge({ x: 828, y: 80, width: 252, height: 184.8 }),
  projects: enlarge({ x: 72, y: 368, width: 300, height: 220 }),
  about: enlarge({ x: 456, y: 272, width: 288, height: 211.2 }),
  contact: enlarge({ x: 876, y: 400, width: 252, height: 184.8 }),
  experience: enlarge({ x: 480, y: 576, width: 288, height: 211.2 }),
  football: enlarge({ x: 1260, y: 400, width: 300, height: 220 }),
};

// Native room coordinates shared by the playable ball, astronaut and camera.
const footballScale = rooms.football.width / 240;
export const footballBall = { x: rooms.football.x + 118 * footballScale, y: rooms.football.y + 96 * footballScale };
export const footballKicker = { x: footballBall.x, y: footballBall.y + 14 * footballScale };
export function nearFootball(point: Point) { return Math.hypot(point.x - footballBall.x, point.y - footballBall.y) < 90; }

// Theme console reuses the left-hand cockpit instrument, without moving artwork.
export const cockpitConsole = { x: rooms.about.x + 36 * 3.6, y: rooms.about.y + 60 * 3.6, width: 44 * 3.6, height: 24 * 3.6 };
export const cockpitApproach = { x: cockpitConsole.x + cockpitConsole.width / 2, y: cockpitConsole.y + cockpitConsole.height + 32 };
export function nearCockpit(point: Point) { return Math.hypot(point.x - cockpitApproach.x, point.y - cockpitApproach.y) < 105; }

// Extend the original corridors through airlocks into the room floors.
export const corridorRoutes: Point[][] = [
  [{ x: 1113, y: 508 }, { x: 1280, y: 508 }, { x: 1280, y: 520 }],
  [{ x: 246, y: 246 }, { x: 246, y: 270 }, { x: 246, y: 300 }, { x: 482, y: 300 }],
  [{ x: 954, y: 234 }, { x: 954, y: 253 }, { x: 954, y: 300 }, { x: 720, y: 300 }],
  [{ x: 356, y: 460 }, { x: 430, y: 460 }, { x: 430, y: 400 }, { x: 476, y: 400 }],
  [{ x: 891, y: 478 }, { x: 804, y: 478 }, { x: 804, y: 404 }, { x: 724, y: 404 }],
  [{ x: 624, y: 589 }, { x: 624, y: 466 }],
];
export const corridorPath = corridorRoutes.map((route) => `M${route.map(({ x, y }) => `${x} ${y}`).join("L")}`).join("");
export const airlocks: Rect[] = [
  { x: 238, y: 258, width: 16, height: 24 },
  { x: 946, y: 241, width: 16, height: 24 },
  { x: 456, y: 292, width: 52, height: 16 },
  { x: 696, y: 292, width: 48, height: 16 },
  { x: 340, y: 452, width: 32, height: 16 },
  { x: 456, y: 392, width: 40, height: 16 },
  { x: 704, y: 396, width: 40, height: 16 },
  { x: 876, y: 470, width: 30, height: 16 },
  { x: 616, y: 448, width: 16, height: 36 },
  { x: 616, y: 576, width: 16, height: 26 },
  { x: 1098, y: 500, width: 30, height: 16 },
  { x: 1260, y: 500, width: 40, height: 16 },
];


// The Command Deck has open thresholds; sliding doors remain at the other room entrances.
const openCommandDeckAirlocks = new Set([2, 3, 5, 6, 8]);
export const stationDoors: (Rect & { id: string; axis: "x" | "y" })[] = airlocks
  .map((rect, index) => ({ rect, index }))
  .filter(({ index }) => !openCommandDeckAirlocks.has(index))
  .map(({ rect, index }) => ({ ...enlarge(rect), id: `airlock-${index}`, axis: rect.width > rect.height ? "y" as const : "x" as const }));
export const roomSigns = ([
  { id: "stack", x: 265, y: 264, width: 88 }, { id: "achievements", x: 820, y: 266, width: 112 },
  { id: "projects", x: 333, y: 431, width: 92 }, { id: "about", x: 550, y: 252, width: 100 },
  { id: "contact", x: 946, y: 382, width: 112 }, { id: "experience", x: 644, y: 540, width: 118 },
  { id: "football", x: 1148, y: 474, width: 108 },
 ] satisfies { id: SectionId; x: number; y: number; width: number }[]).map((sign) => ({ ...sign, x: sign.x * MAP_SCALE, y: sign.y * MAP_SCALE, width: sign.width * MAP_SCALE }));


function inRoom(room: Rect, box: Rect): Rect {
  const scale = room.width / 240;
  return { x: room.x + box.x * scale, y: room.y + box.y * scale, width: box.width * scale, height: box.height * scale };
}
export const walkways: Rect[] = [
  ...corridorRoutes.flatMap((route) => route.slice(1).map((end, i) => {
    const start = route[i];
    return enlarge({ x: Math.min(start.x, end.x) - 8, y: Math.min(start.y, end.y) - 8, width: Math.abs(end.x - start.x) + 16, height: Math.abs(end.y - start.y) + 16 });
  })),
  // Portals bridge room floor polygons and hallway lanes; closed doors still block them in moveCharacter.
  ...airlocks.map((airlock) => enlarge(airlock)),
  ...Object.values(rooms).flatMap((room) => [
    inRoom(room, { x: 24, y: 30, width: 192, height: 110 }),
    inRoom(room, { x: 38, y: 20, width: 164, height: 136 }),
  ]),
];

// Solid equipment footprints in native room coordinates. Shadows and screen light are walkable.
const furniture: Record<SectionId, Rect[]> = {
  football: [{ x: 88, y: 34, width: 64, height: 16 }],
  about: [{ x: 36, y: 60, width: 44, height: 24 }, { x: 98, y: 52, width: 44, height: 24 }, { x: 160, y: 60, width: 44, height: 24 }, { x: 84, y: 102, width: 68, height: 28 }, { x: 96, y: 94, width: 44, height: 44 }, { x: 104, y: 92, width: 26, height: 48 }, { x: 56, y: 104, width: 16, height: 20 }, { x: 168, y: 104, width: 16, height: 20 }],
  projects: [{ x: 74, y: 60, width: 10, height: 12 }, { x: 66, y: 72, width: 26, height: 34 }, { x: 54, y: 106, width: 50, height: 26 }, { x: 70, y: 132, width: 18, height: 10 }, { x: 146, y: 68, width: 42, height: 24 }, { x: 146, y: 104, width: 42, height: 24 }, { x: 26, y: 58, width: 10, height: 66 }],
  achievements: [40, 96, 152].map((x) => ({ x, y: 68, width: 44, height: 50 })).concat([{ x: 46, y: 132, width: 146, height: 10 }]),
  stack: [{ x: 38, y: 62, width: 68, height: 24 }, { x: 134, y: 62, width: 68, height: 24 }, { x: 42, y: 94, width: 52, height: 44 }, { x: 138, y: 94, width: 52, height: 44 }, { x: 114, y: 106, width: 12, height: 24 }],
  experience: [{ x: 38, y: 62, width: 160, height: 68 }, { x: 86, y: 140, width: 64, height: 8 }],
  contact: [{ x: 42, y: 60, width: 60, height: 74 }, { x: 130, y: 72, width: 70, height: 24 }, { x: 136, y: 110, width: 56, height: 24 }],
};

export const obstacles = Object.entries(furniture).flatMap(([id, boxes]) => {
  const room = rooms[id as SectionId];
  return boxes.map((box) => inRoom(room, box));
});

export function contains(rect: Rect, point: Point) {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}

export function roomAt(point: Point): SectionId | null {
  return (Object.keys(rooms) as SectionId[]).find((id) => contains(rooms[id], point)) ?? null;
}

const footprintOffsets = Array.from({ length: 16 }, (_, i) => ({
  x: Math.cos(i * Math.PI / 8) * WORLD.radius,
  y: Math.sin(i * Math.PI / 8) * WORLD.radius,
}));

export function canWalk(point: Point) {
  const r = WORLD.radius;
  // A round footprint can pass equipment corners without a square invisible margin.
  const samples = [{ ...point }, ...footprintOffsets.map((offset) => ({ x: point.x + offset.x, y: point.y + offset.y }))];
  return samples.every((sample) => walkways.some((rect) => contains(rect, sample))) &&
    !obstacles.some((box) => {
      const nearestX = Math.max(box.x, Math.min(box.x + box.width, point.x));
      const nearestY = Math.max(box.y, Math.min(box.y + box.height, point.y));
      return Math.hypot(point.x - nearestX, point.y - nearestY) < r;
    });
}

export function moveCharacter(point: Point, dx: number, dy: number, closedDoors: Rect[] = []): Point {
  const clearDoor = (point: Point) => !closedDoors.some((door) => {
    const x = Math.max(door.x, Math.min(door.x + door.width, point.x));
    const y = Math.max(door.y, Math.min(door.y + door.height, point.y));
    return Math.hypot(point.x - x, point.y - y) < WORLD.radius;
  });
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 4));
  let next = { ...point };
  for (let i = 0; i < steps; i++) {
    const horizontal = { x: next.x + dx / steps, y: next.y };
    if (canWalk(horizontal) && clearDoor(horizontal)) next = horizontal;
    const vertical = { x: next.x, y: next.y + dy / steps };
    if (canWalk(vertical) && clearDoor(vertical)) next = vertical;
  }
  return next;
}

export function cameraFor(point: Point, width: number, height: number, scale: number): Point {
  return {
    x: Math.max(0, Math.min(WORLD.width - width / scale, point.x - width / scale / 2)),
    y: Math.max(0, Math.min(WORLD.height - height / scale, point.y - height / scale / 2)),
  };
}
