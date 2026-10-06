import assert from "node:assert/strict";
import test from "node:test";
import { airlocks, MAP_SCALE, WORLD, canWalk, corridorPath, corridorRoutes, moveCharacter, rooms, stationDoors } from "./station-world.ts";

function isOnRoute(point: { x: number; y: number }, route: readonly { x: number; y: number }[]) {
  return route.slice(1).some((end, index) => {
    const start = route[index];
    return start.x === end.x
      ? point.x === start.x && point.y >= Math.min(start.y, end.y) && point.y <= Math.max(start.y, end.y)
      : point.y === start.y && point.x >= Math.min(start.x, end.x) && point.x <= Math.max(start.x, end.x);
  });
}

test("project route starts at the center of its visible airlock", () => {
  assert.ok(corridorRoutes.some((route) => route.some(({ x, y }) => x === 356 && y === 460)));
  const expectedPath = corridorRoutes.map((route) => `M${route.map(({ x, y }) => `${x} ${y}`).join("L")}`).join("");
  assert.equal(corridorPath, expectedPath);
});

test("every airlock center is joined to the shared corridor network", () => {
  for (const airlock of airlocks) {
    const center = { x: airlock.x + airlock.width / 2, y: airlock.y + airlock.height / 2 };
    assert.ok(corridorRoutes.some((route) => isOnRoute(center, route)), `airlock at ${center.x},${center.y} has no corridor connection`);
  }
});

test("avatar remains inside room interiors and outside solid consoles", () => {
  const room = rooms.contact;
  assert.equal(canWalk({ x: room.x + 8, y: room.y + room.height / 2 }), false);
  assert.equal(canWalk({ x: room.x + 165 * room.width / 240, y: room.y + 84 * room.width / 240 }), false);
});

test("avatar can move from a corridor through the open project airlock", () => {
  const beforeDoor = { x: 390 * MAP_SCALE, y: 460 * MAP_SCALE };
  const after = moveCharacter(beforeDoor, -120 * MAP_SCALE, 0);
  assert.ok(after.x < 320 * MAP_SCALE);
  assert.ok(after.x > 300 * MAP_SCALE);
  assert.ok(after.y === beforeDoor.y);
});

test("closed airlock stops movement while a corridor bend stays traversable", () => {
  const door = stationDoors.find(({ id }) => id === "airlock-4");
  assert.ok(door);
  const blocked = moveCharacter({ x: 390 * MAP_SCALE, y: 460 * MAP_SCALE }, -120 * MAP_SCALE, 0, [door]);
  assert.ok(blocked.x > 370 * MAP_SCALE);

  const corner = moveCharacter({ x: 400 * MAP_SCALE, y: 460 * MAP_SCALE }, 30 * MAP_SCALE, 0);
  const aroundBend = moveCharacter(corner, 0, -60 * MAP_SCALE);
  assert.ok(aroundBend.x > 420 * MAP_SCALE);
  assert.ok(aroundBend.y < 410 * MAP_SCALE);
});

test("the command-deck spawn is walkable and outer space is blocked", () => {
  assert.equal(canWalk(WORLD.spawn), true);
  assert.equal(canWalk({ x: rooms.about.x - 100, y: rooms.about.y }), false);
});
