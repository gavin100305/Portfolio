import assert from "node:assert/strict";
import test from "node:test";
import { deckOutline } from "./deck-outline";

test("a corridor and room have one outer perimeter with no edge across their entrance", () => {
  const floor = [{ x: 10, y: 10 }, { x: 100, y: 10 }, { x: 100, y: 100 }, { x: 10, y: 100 }];
  const outline = deckOutline(floor, [{ x: 0, y: 40, width: 30, height: 20 }]);
  let twiceArea = 0;
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i], b = outline[(i + 1) % outline.length];
    twiceArea += a[0] * b[1] - b[0] * a[1];
    assert.ok(a[0] === b[0] || a[1] === b[1], "deck edges stay on the drawing grid");
    assert.equal(a[0] === 10 && b[0] === 10 && Math.min(a[1], b[1]) < 50 && Math.max(a[1], b[1]) > 50, false, "no wall shadow can cross the entrance");
  }
  assert.equal(Math.abs(twiceArea) / 2, 8300, "the corridor overlaps the room without adding an internal seam");
});

test("doorways on opposite walls are included in a single closed outline", () => {
  const floor = [{ x: 10, y: 10 }, { x: 100, y: 10 }, { x: 100, y: 100 }, { x: 10, y: 100 }];
  const outline = deckOutline(floor, [{ x: -24, y: 40, width: 44, height: 16 }, { x: 90, y: 40, width: 34, height: 16 }]);
  assert.equal(Math.min(...outline.map(p => p[0])), -24);
  assert.equal(Math.max(...outline.map(p => p[0])), 124);
  assert.equal(outline.filter(p => p[0] === -24).length, 2);
  assert.equal(outline.filter(p => p[0] === 124).length, 2);
});
