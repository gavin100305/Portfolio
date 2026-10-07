# Spaceship Portfolio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the existing top-down pixel-art spaceship into a coherent, accessible portfolio world with aligned geometry, reliable collisions, polished room terminals, and visibly distinct space moods.

**Architecture:** Make typed station geometry the source of truth for corridor artwork and walkability. Reuse the same pure geometry functions in the client movement hook and Cloudflare presence worker. Keep room artwork in the current SVG components, responsive treatments and ambience in CSS, and preserve the existing section, football, and presence interfaces.

**Tech Stack:** Next.js App Router 16, React 19, TypeScript, SVG, CSS, Cloudflare Durable Objects, Node built-in test runner through the existing `tsx` dependency.

**Spec:** `docs/superpowers/specs/2026-10-08-spaceship-portfolio-redesign-design.md`

## Global Constraints

- Keep the scene strict top-down 2D pixel art; add no 3D, WebGL, or game framework.
- Preserve off-white room and corridor floors, black space, all four themes, six portfolio sections, and the Orbital Training Deck.
- Preserve current portfolio wording and placeholders; do not add unverified user facts or links.
- Preserve keyboard, touch, mouse, direct URL, accessible panel, football game, and multiplayer flows.
- Keep ambient animation CSS-only and honor `prefers-reduced-motion`.
- Do not alter unrelated portfolio files or discard existing workspace changes.

## Review Focus

- Door and corridor joins: test walkability from each room through each doorway and around every turn.
- Collision footprint: test diagonals, narrow corners, furniture, room edges, and high-speed movement across obstacles.
- Multiplayer position validation: test invalid wall-crossing segments, speed limits, and valid doorway/corridor travel.
- Responsive composition: manually inspect room labels, controls, doors, room frames, and game UI on desktop and mobile.
- Theme and reduced motion: verify Deep Space stays still and Meteor Shower animates visibly, and that reduced motion disables decorative motion without disabling navigation.

---

### Task 1: Define a shared station floor plan

**Files:**
- Modify: `src/data/station-world.ts`
- Modify: `src/data/station-world.test.ts`
- Read: relevant Next.js App Router/client component guidance under `node_modules/next/dist/docs/` before any component edits.

**Interfaces:**
- Consumes: existing room IDs, map scale, spawn, astronaut radius, door positions, room furniture, and current art coordinates.
- Produces: typed immutable corridor centerlines/rectangles and doorway openings consumed by both SVG rendering and collision helpers; `canWalkSegment(from: Point, to: Point, closedDoors?: Rect[]): boolean` for validating movement paths.

- [ ] **Step 1: Add failing geometry assertions** for grid alignment, corridor width consistency, room-to-corridor joins, and walkable continuity through every intended doorway.
- [ ] **Step 2: Run `npx tsx --test src/data/station-world.test.ts`; confirm the new geometry assertions fail against the separate artwork/collision routes.**
- [ ] **Step 3: Define one grid-aligned floor-plan schema** for the existing room footprint: central Command Deck, six portfolio destinations, and east-wing Orbital Training Deck. Keep off-white walking surfaces and consistent corridor widths.
- [ ] **Step 4: Derive the SVG path data and walkway shapes from the schema**; remove the duplicate private route list and align every doorway to its corridor endpoint.
- [ ] **Step 5: Implement `canWalkSegment(from, to, doorState?)`** with the same astronaut footprint, furniture bounds, world edge, and threshold rules used by local movement.
- [ ] **Step 6: Run `npx tsx --test src/data/station-world.test.ts` and confirm route, alignment, and continuity assertions pass.**
- [ ] **Step 7: Commit only this task’s changed files** as `refactor: unify station floor plan geometry`.

### Task 2: Render a unified ship and repair local movement

**Files:**
- Modify: `src/components/ship-artwork.tsx`
- Modify: `src/components/room-artwork.tsx`
- Modify: `src/components/use-station-exploration.ts`
- Modify: `src/data/station-world.test.ts`

**Interfaces:**
- Consumes: the shared floor-plan and `canWalk` / `moveCharacter` functions from Task 1.
- Produces: corridor layers rendered from shared geometry and local movement constrained to the exact same walkable surface.

- [ ] **Step 1: Add failing collision cases** for outer walls, every corridor bend, diagonal motion at corners, closed door panels, room furniture, and large steps crossing a wall.
- [ ] **Step 2: Run the focused world test and verify the new collision cases expose current gaps.**
- [ ] **Step 3: Render corridor hull, wall, threshold, and off-white floor layers from the shared geometry** with consistent width, aligned ends, and clean room joins.
- [ ] **Step 4: Update local collision and door movement** to use the shared footprint and threshold geometry while retaining responsive axis sliding and doorway animation.
- [ ] **Step 5: Run world tests and `npm run typecheck`; confirm the astronaut remains within connected floor and can reach every room.**
- [ ] **Step 6: Commit only this task’s changed files** as `fix: align ship corridors and local collision`.

### Task 3: Enforce walkable multiplayer positions

**Files:**
- Modify: `workers/presence/src/lobby.ts`
- Modify: `workers/presence/src/protocol.ts` only if frame-level validation needs a shared helper.
- Modify: `workers/presence/test/protocol.test.mjs` and add a focused worker movement test if needed.
- Modify: `src/data/ship-presence.ts` only if invalid snapshots need safe filtering.

**Interfaces:**
- Consumes: `canWalkSegment` and shared station geometry from Task 1, visitor movement snapshots, and current speed/sequence validation.
- Produces: presence snapshots accepted only when the movement segment stays within the shared walkable world; valid visitors preserve their current identity palette and rendering.

- [ ] **Step 1: Add failing worker tests** for movement through a wall, across furniture, outside the hull, through a valid corridor bend, and through each valid doorway.
- [ ] **Step 2: Run `npm --prefix workers/presence test` and confirm wall-crossing snapshots are currently accepted.**
- [ ] **Step 3: Validate the segment from the stored avatar position to each incoming snapshot** with the shared movement rules; retain existing ticket, sequence, rate, bounds, and speed checks.
- [ ] **Step 4: Reject invalid movement updates without broadcasting an out-of-floor avatar position; preserve valid shared snapshots and connection behavior.**
- [ ] **Step 5: Run `npm --prefix workers/presence test` and `npm --prefix workers/presence run typecheck`; confirm movement tests and worker types pass.**
- [ ] **Step 6: Commit only this task’s changed files** as `fix: validate multiplayer station movement`.

### Task 4: Polish room terminals and ship ambience

**Files:**
- Modify: `src/components/room-artwork.tsx`
- Modify: `src/components/station-map.tsx` only if a semantic accessible label or interaction is needed for an existing terminal.
- Modify: `src/app/globals.css`
- Modify: `src/data/sections.ts` only if room presentation needs existing labels; do not alter section descriptions.

**Interfaces:**
- Consumes: current SVG room components, section labels, theme variables, motion preference, and existing football art/game state.
- Produces: a consistent terminal-display visual system with room-specific accents, uncluttered walkways, two optional content-neutral discoveries, and quiet CSS-only ambient effects.

- [ ] **Step 1: Capture desktop and mobile baselines** for Command Deck, a corridor junction, one portfolio room, and the Orbital Training Deck.
- [ ] **Step 2: Refine the SVG terminals** with consistent frames, readable screen hierarchy, small pixel icons, restrained cyan/amber indicators, and clear path spacing; preserve all current text and game content.
- [ ] **Step 3: Add one hidden, accessible ship-console response and one football-session streak celebration** without adding personal claims or blocking navigation.
- [ ] **Step 4: Add subtle status/window animation** and ensure reduced-motion styles remove decorative movement while preserving interaction.
- [ ] **Step 5: Inspect the captured desktop/mobile views** for legibility, clipping, walkway clearance, and alignment; correct any issues before proceeding.
- [ ] **Step 6: Commit only this task’s changed files** as `style: polish station terminals and ambience`.

### Task 5: Clarify Deep Space and Meteor Shower, then run integrated review

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/ship-artwork.tsx` only if the existing meteor layer needs small markup adjustments.
- No changes: room content, football scoring, presence transport, URL behavior, or non-theme ship geometry.

**Interfaces:**
- Consumes: existing mood attribute and color variables, CSS meteor layer, and `prefers-reduced-motion` rules.
- Produces: a quiet, stationary Deep Space sky and a clearly recognizable but restrained Meteor Shower while keeping the ship and content identical.

- [ ] **Step 1: Capture both themes at the same desktop and mobile sizes** and record the visible difference in star density, streak activity, and lighting.
- [ ] **Step 2: Tune only existing CSS/SVG effects** so Deep Space has sparse stationary stars and no trails while Meteor Shower has occasional visible streaks and brighter star activity.
- [ ] **Step 3: Verify reduced-motion mode** disables streaks and ambient animation while preserving theme selection, movement, and football feedback.
- [ ] **Step 4: Smoke-test desktop and mobile navigation, all seven destinations, direct section URLs, dialog close/history, room movement, touch movement, football shots/scoreboard, and two-client presence.**
- [ ] **Step 5: Run `npx tsx --test src/data/station-world.test.ts`, `npm --prefix workers/presence test`, `npm --prefix workers/presence run typecheck`, `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check`; confirm all pass.**
- [ ] **Step 6: Commit only this task’s changed files** as `style: distinguish deep space and meteor shower`.

## Plan Self-Review

- **Spec coverage:** floor-plan alignment and unified rendering/collision are covered by Tasks 1–2; remote collision by Task 3; room terminals, optional discoveries, and ambience by Task 4; theme differences and full responsive/interactions review by Task 5.
- **Step clarity:** each subsystem starts with a failing behavior test or a visual baseline, makes the smallest relevant change, and names a verification command or view.
- **Interface consistency:** Task 1 exports `canWalkSegment(from, to, doorState?)` and shared geometry; Tasks 2 and 3 consume those same exports. Existing components, worker, and theme interfaces remain in place.
- **Review focus:** doorway continuity, walls/furniture, movement segments, mobile layout, live presence, and reduced motion all map to explicit checks above.
- **Scope:** no portfolio content creation, new runtime package, football-rule change, or unrelated site redesign is included.
