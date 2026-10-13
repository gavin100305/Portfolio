import assert from "node:assert/strict";
import test from "node:test";
import * as stationWorld from "./station-world";
import { MAP_SCALE, WORLD, airlocks, canWalk, canWalkSegment, corridorPath, corridorRoutes, moveCharacter, obstacles, rooms, stationDoors } from "./station-world";

test("corridor artwork stops at aligned doorway centerlines", () => {
  assert.match(corridorPath, /M246 270V300H482/);
  assert.match(corridorPath, /M954 253V300H720/);
  assert.match(corridorPath, /M356 460H430V400H476/);
  assert.match(corridorPath, /M891 478H804V404H724/);
  assert.match(corridorPath, /M624 466V589/);
  assert.match(corridorPath, /M1113 508H1280/);
});

test("corridor routes terminate at the center of their paired doorways", () => {
  const routes = (stationWorld as unknown as { corridorRoutes?: { id: string; points: { x: number; y: number }[]; doorwayIndices: [number, number]; width: number }[] }).corridorRoutes;
  assert.ok(routes, "corridorRoutes must be the shared artwork and collision source");
  assert.equal(routes.length, 6);
  for (const route of routes) {
    assert.equal(route.width, 16, `${route.id} uses the common corridor width`);
    const center = (index: number) => ({ x: airlocks[index].x + airlocks[index].width / 2, y: airlocks[index].y + airlocks[index].height / 2 });
    assert.deepEqual(route.points[0], center(route.doorwayIndices[0]), `${route.id} begins at its doorway center`);
    assert.deepEqual(route.points.at(-1), center(route.doorwayIndices[1]), `${route.id} ends at its doorway center`);
  }
  for (const doorway of airlocks) {
    assert.equal(canWalk({ x: (doorway.x + doorway.width / 2) * MAP_SCALE, y: (doorway.y + doorway.height / 2) * MAP_SCALE }), true, "each doorway center joins a walkable floor");
  }
});

test("movement segment validation rejects crossing the hull and accepts a connected corridor", () => {
  const canWalkSegment = (stationWorld as unknown as { canWalkSegment?: (from: { x: number; y: number }, to: { x: number; y: number }, doors?: typeof stationDoors) => boolean }).canWalkSegment;
  assert.equal(typeof canWalkSegment, "function", "client and presence worker need the same segment validator");
  assert.equal(canWalkSegment!({ x: 390 * MAP_SCALE, y: 460 * MAP_SCALE }, { x: 420 * MAP_SCALE, y: 460 * MAP_SCALE }), true);
  assert.equal(canWalkSegment!({ x: rooms.projects.x + 12, y: rooms.projects.y + 40 }, { x: rooms.projects.x - 80, y: rooms.projects.y + 40 }), false);
});

test("avatar cannot enter the project room's solid outer bulkhead", () => {
  const room = rooms.projects;
  assert.equal(canWalk({ x: room.x + 10 * MAP_SCALE, y: room.y + room.height / 2 }), false);
});

test("avatar remains inside room interiors and outside solid consoles", () => {
  const room = rooms.contact;
  assert.equal(canWalk({ x: room.x + 8, y: room.y + room.height / 2 }), false);
  assert.equal(canWalk({ x: room.x + 165 * room.width / 240, y: room.y + 84 * room.width / 240 }), false);
});

test("avatar can move from the project room through its open corridor approach", () => {
  const beforeDoor = { x: 390 * MAP_SCALE, y: 460 * MAP_SCALE };
  const after = moveCharacter(beforeDoor, -120 * MAP_SCALE, 0);
  assert.ok(after.x < 330 * MAP_SCALE);
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

test("every corridor leg is continuously walkable from threshold to threshold", () => {
  for (const route of corridorRoutes) {
    for (let index = 1; index < route.points.length; index += 1) {
      const from = route.points[index - 1];
      const to = route.points[index];
      assert.equal(canWalkSegment({ x: from.x * MAP_SCALE, y: from.y * MAP_SCALE }, { x: to.x * MAP_SCALE, y: to.y * MAP_SCALE }), true, `${route.id} leg ${index} has a floor gap`);
    }
  }
});

test("the five command-deck openings join the visible room floor", () => {
  const interiorPoints = [
    { x: 510, y: 300 }, { x: 690, y: 300 },
    { x: 500, y: 400 }, { x: 700, y: 404 }, { x: 624, y: 448 },
  ];
  [2, 3, 5, 6, 8].forEach((index, position) => {
    const opening = airlocks[index];
    const inside = interiorPoints[position];
    const center = { x: opening.x + opening.width / 2, y: opening.y + opening.height / 2 };
    assert.equal(canWalkSegment(
      { x: inside.x * MAP_SCALE, y: inside.y * MAP_SCALE },
      { x: center.x * MAP_SCALE, y: center.y * MAP_SCALE },
    ), true, `command-deck opening ${index} joins the room floor`);
  });
});

test("a fast movement segment cannot tunnel through a station wall", () => {
  assert.equal(canWalkSegment(WORLD.spawn, { x: -WORLD.width, y: WORLD.spawn.y }), false);
});

test("all mapped consoles and solid room props block the astronaut", () => {
  for (const obstacle of obstacles) {
    assert.equal(canWalk({ x: obstacle.x + obstacle.width / 2, y: obstacle.y + obstacle.height / 2 }), false, "a solid prop center must not be walkable");
  }
});

test("the navigation table blocks its surface while its clipped corner stays walkable", () => {
  const room = rooms.about;
  const scale = room.width / 240;
  const local = (x: number, y: number) => ({ x: room.x + x * scale, y: room.y + y * scale });
  assert.equal(canWalk(local(118, 116)), false);
  assert.equal(canWalk(local(86, 100)), true);
});

test("each animated door blocks its own room-to-room route until open", () => {
  for (const route of corridorRoutes) {
    const blockedDoor = route.doorwayIndices.map((index) => stationDoors.find((door) => door.id === `airlock-${index}`)).find(Boolean);
    if (!blockedDoor) continue;
    const from = route.points[0];
    const to = route.points.at(-1)!;
    assert.equal(canWalkSegment({ x: from.x * MAP_SCALE, y: from.y * MAP_SCALE }, { x: to.x * MAP_SCALE, y: to.y * MAP_SCALE }, [blockedDoor]), false, `${route.id} crossed a closed door`);
  }
});

test("the command-deck spawn is walkable and outer space is blocked", () => {
  assert.equal(canWalk(WORLD.spawn), true);
  assert.equal(canWalk({ x: rooms.about.x - 100, y: rooms.about.y }), false);
});
