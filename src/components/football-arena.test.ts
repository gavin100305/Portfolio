import test from "node:test";
import assert from "node:assert/strict";
import { nextGoalStreak, penaltyKeyAction } from "@/components/football-arena";

test("goal streak increments after a goal", () => {
  assert.equal(nextGoalStreak(2, true), 3);
});

test("a saved shot resets the goal streak", () => {
  assert.equal(nextGoalStreak(4, false), 0);
});

test("arrow keys and A/D aim without on-screen controls", () => {
  assert.equal(penaltyKeyAction("ArrowLeft"), "left");
  assert.equal(penaltyKeyAction("a"), "left");
  assert.equal(penaltyKeyAction("ArrowRight"), "right");
  assert.equal(penaltyKeyAction("d"), "right");
});

test("Space shoots and Escape exits the arena", () => {
  assert.equal(penaltyKeyAction(" "), "shoot");
  assert.equal(penaltyKeyAction("Escape"), "exit");
});

test("unmapped keys do not affect penalty play", () => {
  assert.equal(penaltyKeyAction("w"), null);
  assert.equal(penaltyKeyAction("Tab"), null);
});
