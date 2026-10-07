import test from 'node:test';
import assert from 'node:assert/strict';
import { paletteForGuest, SUIT_PALETTES, suitColors } from '../../../src/data/astronauts.ts';
import { parsePresenceSyncFrame } from '../../../src/data/ship-presence.ts';
import * as protocol from '../src/protocol.ts';
import { parseMovementSnapshot, parseMovementFrame, signGuestTicket, verifyGuestTicket, lobbyHintFromTicket, isAllowedOrigin, TICKET_LIFETIME_MS } from '../src/protocol.ts';
import { MAP_SCALE, WORLD, corridorRoutes, obstacles, rooms } from '../../../src/data/station-world.ts';

test('movement parser accepts an in-bounds snapshot with a known direction', () => {
  assert.deepEqual(parseMovementSnapshot({ x: 100, y: 200, facing: 'right', sequence: 4 }), {
    x: 100, y: 200, facing: 'right', sequence: 4,
  });
});

test('movement parser rejects non-finite, out-of-bounds, and invalid values', () => {
  assert.equal(parseMovementSnapshot({ x: Infinity, y: 200, facing: 'right', sequence: 4 }), null);
  assert.equal(parseMovementSnapshot({ x: -1, y: 200, facing: 'right', sequence: 4 }), null);
  assert.equal(parseMovementSnapshot({ x: 100, y: 99999, facing: 'right', sequence: 4 }), null);
  assert.equal(parseMovementSnapshot({ x: 100, y: 200, facing: 'north-east', sequence: 4 }), null);
  assert.equal(parseMovementSnapshot({ x: 100, y: 200, facing: 'right', sequence: -1 }), null);
});

test('movement frame parser rejects malformed JSON and unexpected fields', () => {
  assert.equal(parseMovementFrame('{'), null);
  assert.equal(parseMovementFrame(JSON.stringify({ x: 1, y: 1, facing: 'up', sequence: 0, name: 'Visitor' })), null);
});

test('presence movement accepts connected station routes and rejects walls and solid props', () => {
  const isWalkableMovement = protocol.isWalkableMovement;
  assert.equal(typeof isWalkableMovement, 'function', 'the worker must validate movement with shared station geometry');
  assert.equal(isWalkableMovement(WORLD.spawn, { x: rooms.about.x - 80, y: WORLD.spawn.y }), false);
  const prop = obstacles[0];
  assert.equal(isWalkableMovement(WORLD.spawn, { x: prop.x + prop.width / 2, y: prop.y + prop.height / 2 }), false);
  for (const route of corridorRoutes) {
    for (let index = 1; index < route.points.length; index += 1) {
      const from = route.points[index - 1];
      const to = route.points[index];
      assert.equal(isWalkableMovement({ x: from.x * MAP_SCALE, y: from.y * MAP_SCALE }, { x: to.x * MAP_SCALE, y: to.y * MAP_SCALE }), true, `${route.id} leg ${index} must remain traversable`);
    }
  }
});

test('guest palette is stable and always selects one of five variants', () => {
  assert.equal(paletteForGuest('guest-123'), paletteForGuest('guest-123'));
  assert.equal(SUIT_PALETTES.length, 5);
  assert.equal(new Set(SUIT_PALETTES.map((palette) => suitColors[palette].trim)).size, 5);
  assert.ok(SUIT_PALETTES.includes(paletteForGuest('guest-123')));
});

test('presence sync parser accepts unique, in-bounds visitor snapshots', () => {
  const visitor = { guestId: 'd14d3f84-a2fc-4c67-97c4-cac8e8d3bbac', palette: 'azure', x: 120, y: 240, facing: 'left', sequence: 8 };
  assert.deepEqual(parsePresenceSyncFrame(JSON.stringify({ type: 'sync', visitors: [visitor] })), [visitor]);
});

test('presence sync parser rejects malformed, duplicate, excessive, or out-of-bounds visitors', () => {
  const visitor = { guestId: 'd14d3f84-a2fc-4c67-97c4-cac8e8d3bbac', palette: 'azure', x: 120, y: 240, facing: 'left', sequence: 8 };
  assert.equal(parsePresenceSyncFrame('{'), null);
  assert.equal(parsePresenceSyncFrame(JSON.stringify({ type: 'other', visitors: [] })), null);
  assert.equal(parsePresenceSyncFrame(JSON.stringify({ type: 'sync', visitors: [visitor, visitor] })), null);
  assert.equal(parsePresenceSyncFrame(JSON.stringify({ type: 'sync', visitors: [{ ...visitor, x: -1 }] })), null);
  assert.equal(parsePresenceSyncFrame(JSON.stringify({ type: 'sync', visitors: Array(33).fill(visitor).map((item, i) => ({ ...item, guestId: `${i.toString().padStart(8, '0')}-0000-0000-0000-000000000000` })) })), null);
});

test('signed guest tickets verify, expire, and reject tampering', async () => {
  const now = Date.now();
  const claims = {
    guestId: 'd14d3f84-a2fc-4c67-97c4-cac8e8d3bbac',
    ticketId: 'fd890beb-5b02-4089-8af1-46c30713894a',
    lobbyId: 'lobby-0',
    palette: 'azure',
    expiresAt: now + TICKET_LIFETIME_MS,
  };
  const token = await signGuestTicket(claims, 'test-secret-at-least-32-characters-long');
  assert.deepEqual(await verifyGuestTicket(token, 'test-secret-at-least-32-characters-long', now), claims);
  assert.equal(await verifyGuestTicket(token, 'wrong-secret-long-enough-to-be-valid', now), null);
  assert.equal(await verifyGuestTicket(token, 'test-secret-at-least-32-characters-long', now + TICKET_LIFETIME_MS + 1), null);
  assert.equal(await verifyGuestTicket(`${token}x`, 'test-secret-at-least-32-characters-long', now), null);
  assert.equal(lobbyHintFromTicket(token), 'lobby-0');
  assert.equal(lobbyHintFromTicket('malformed'), null);
});

test('origin guard accepts only the configured origin', () => {
  assert.equal(isAllowedOrigin('https://portfolio.example', 'https://portfolio.example/'), true);
  assert.equal(isAllowedOrigin('https://evil.example', 'https://portfolio.example'), false);
  assert.equal(isAllowedOrigin('https://portfolio.example.attacker.test', 'https://portfolio.example'), false);
  assert.equal(isAllowedOrigin(null, 'https://portfolio.example'), false);
});
