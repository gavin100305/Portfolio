# Spaceship Presentation and Exploration Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the existing top-down spaceship and portfolio panels, correct corridor/collision mismatches, and make Meteor Shower distinct while preserving navigation and multiplayer gameplay.

**Architecture:** Keep world geometry in `station-world.ts` as the authority for both rendered corridors and movement. Keep art in the existing SVG components, panel and mood styling in global CSS, and movement state in its existing hook. Add focused geometry tests before changing route or collision behavior, then visually verify the integrated site at desktop and mobile sizes.

**Tech Stack:** Next.js App Router 16, React 19, TypeScript, native SVG/CSS, Node.js 24 built-in test runner via the small `tsx` test runner.

**Spec:** `docs/superpowers/specs/2026-10-07-station-polish-design.md`

## Global Constraints

- Keep the world strictly top-down, connected 2D pixel art.
- Keep all six portfolio destinations, the Orbital Training Deck, shareable URLs, keyboard/touch navigation, and live visitor behavior working.
- Do not invent portfolio facts or change multiplayer transport or penalty rules.
- Do not add 3D, WebGL, a game framework, generated production art, or animation libraries.
- Respect `prefers-reduced-motion` and retain all four selectable moods.

## Review Focus

- Door approaches and corridor bends: tests must prove the avatar can enter/turn without snagging and cannot cross a blocked hull or door.
- Thin wall edges and diagonal movement: tests must prove the avatar footprint remains inside connected walkable geometry.
- Art/render geometry divergence: tests must prove corridor artwork and movement use the same route definitions.
- Reduced-motion preference: manual verification must confirm meteor streaks stop without disabling theme changes.
- Existing room/game interactions: manual smoke check must confirm URL selection, touch controls, football scoreboard, and presence rendering remain available.

---

### Task 1: Unify corridors and correct movement boundaries

**Files:**
- Modify: `src/data/station-world.ts`
- Modify: `src/components/ship-artwork.tsx`
- Modify: `src/components/use-station-exploration.ts` only if integration requires it
- Create: `src/data/station-world.test.ts`
- Modify: `package.json` and `package-lock.json` to add a `test:world` script and the `tsx` dev dependency

**Interfaces:**
- Consumes: existing `Point`, `Rect`, `airlocks`, `rooms`, `stationDoors`, and movement calls.
- Produces: exported immutable corridor route definitions; a route-derived SVG path for `StationConnections`; route-derived walkable bounds for `canWalk` and `moveCharacter`.

- [ ] **Step 1: Add focused failing geometry tests** for all route/airlock joins, blocked space and solid fixtures, large movement steps across walls, open door passage, and movement around a 90-degree corridor bend.
- [ ] **Step 2: Run `npm run test:world` and confirm the new route-consistency and collision assertions fail against the current duplicated geometry.**
- [ ] **Step 3: Make route definitions the single source** for SVG path generation and corridor walkable geometry; align every route endpoint to its airlock, including the project route currently starting at native x=330 while its artwork starts at x=358.
- [ ] **Step 4: Correct collision using the astronaut's existing circular footprint** against connected room/corridor walkable surfaces, furniture, hull boundaries, and closed doors. Preserve axis sliding so corners remain navigable.
- [ ] **Step 5: Run `npm run test:world`, `npm run lint`, and `npm run typecheck`; confirm geometry tests and static checks pass.**
- [ ] **Step 6: Commit this task** as `fix: align station paths and movement bounds`.

### Task 2: Polish the ship and portfolio section panels

**Files:**
- Modify: `src/components/room-artwork.tsx`
- Modify: `src/components/ship-artwork.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/components/station-shell.tsx` only if the existing panel markup needs semantic grouping for its visual hierarchy

**Interfaces:**
- Consumes: existing SVG room components, shared ship color variables, section metadata, and section dialog content.
- Produces: consistent hull/floor layering and stronger responsive section panel styles without changing section data or navigation behavior.

- [ ] **Step 1: Capture the current desktop and mobile appearance** for the Command Deck, one corridor junction, one portfolio section panel, and the Orbital Training Deck for visual comparison.
- [ ] **Step 2: Refine SVG floor and hull layers** toward the approved darker charcoal-blue station deck, consistent outlines, restrained cyan/amber detail, and clearer shallow 2D depth; keep room positions and the football pitch unchanged.
- [ ] **Step 3: Refine section panel hierarchy** with clear heading/category treatment, deliberate spacing, and a polished placeholder content frame while retaining all current accessible controls and placeholder wording.
- [ ] **Step 4: Inspect desktop and mobile captures** for hull/corridor continuity, legibility, clipping, room-frame overlap, and an unobstructed stadium pitch; adjust CSS/SVG as needed.
- [ ] **Step 5: Run `npm run lint`, `npm run typecheck`, and `npm run build`; confirm all pass.**
- [ ] **Step 6: Commit this task** as `style: polish ship rooms and portfolio panels`.

### Task 3: Distinguish Meteor Shower and verify preserved interactions

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/ship-artwork.tsx` only if more meteor elements are needed
- No changes: penalty rules, visitor transport, room URLs, or theme selection storage

**Interfaces:**
- Consumes: current mood attributes, palette variables, meteor field, and reduced-motion media query.
- Produces: sparse, visible meteor streaks and subtle mood-specific atmospheric contrast that remain disabled under reduced motion.

- [ ] **Step 1: Check all four mood captures** at the same viewport and note that Deep Space and Meteor Shower currently share the same background and star palette while the Meteor Shower effect is low contrast and brief.
- [ ] **Step 2: Tune meteor timing, trail length, and contrast** so the shower is recognizable but infrequent, using the existing CSS-only layer and shared ship palette.
- [ ] **Step 3: Verify reduced motion** stops meteor and decorative movement while allowing mood switching.
- [ ] **Step 4: Smoke-check six room navigation paths, direct section URLs, desktop keyboard movement, touch movement, return-to-map, live visitor rendering, and the Orbital Training Deck scoreboard and shot controls.**
- [ ] **Step 5: Run `npm run test:world`, `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check`; confirm all pass.**
- [ ] **Step 6: Commit this task** as `style: distinguish meteor shower mood`.

## Plan Self-Review

- **Spec coverage:** shared geometry, collision, foreground clarity, ship and panel design, Meteor Shower distinction, preserved game/presence/navigation, desktop/mobile visual checks, and production verification each have a task above.
- **Step clarity:** every implementation task starts with observable tests or captures; geometry tests use the specified Node test script; integrated smoke checks cover the preserved interactions.
- **Interface consistency:** route data is consumed by both `StationConnections` and the station-world movement helpers; existing `stationDoors` remains the door state input.
- **Review focus:** thin boundaries and turns are covered by movement tests; reduced motion and integration state are explicitly checked in Task 3.
- **Scope:** the plan does not rebuild the map, add portfolio content, alter football scoring, or change the multiplayer protocol.
