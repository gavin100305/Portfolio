# Spaceship Presentation and Exploration Polish

## Goal

Make the existing spaceship portfolio feel composed and intentional while fixing the corridor alignment, wall collision, room panel, and theme distinction problems visible in the current build.

## Product direction

- Keep the world a strictly top-down, connected 2D pixel-art spaceship. Use the referenced site as inspiration for clear spatial organization and legible destination presentation; do not copy its village setting, layout, or exact art.
- Keep the ship silhouette, six portfolio destinations, Orbital Training Deck, astronaut identity, room navigation, shareable URLs, touch support, and live visitor logic working.
- Keep the six portfolio sections as honest placeholders until Gavin supplies biographical, project, achievement, experience, and contact content.
- Preserve the four selectable space moods. Deep Space stays the restrained default. Meteor Shower must read as a distinct mood while keeping its effects subtle and respecting reduced motion.
- Keep the visual work native to the existing HTML, SVG, and CSS implementation. Do not add 3D, WebGL, a game framework, production art assets, or animation dependencies.

## Design

### Station shell and room panels

Refine the existing ship and room art as one visual system: consistent hull outlines and corner treatment, clearer layered depth, restrained cyan and amber indicators, and a darker station deck that reduces the current beige tiled appearance. Maintain the established top-down shapes and room locations. Give the existing portfolio section panel a stronger card-like hierarchy, with readable room/category framing, deliberate spacing, and a useful placeholder content area; do not invent portfolio facts. Keep keyboard, touch, URL, focus, and close behavior intact.

### Corridors and movement

Represent each corridor route once and derive both its visible path and its walkable geometry from the same route definition. Align route ends to actual room airlocks, use consistent corridor width and rounded turns, and remove detached or protruding segments. Define collision against the station interior, corridor lanes, airlock thresholds, and solid room fixtures so the astronaut cannot enter outer space or hull walls. Keep the existing movement input, camera follow, room activation, and open-door behavior. Preserve intentional foreground occlusion only where it makes the astronaut read as inside the ship.

### Space moods

Retain the current palette tokens and scenery layers. Increase Meteor Shower's distinction through legible, infrequent streaks and a sparse silhouette/accent treatment, without changing the Deep Space palette or adding competing scenery. Keep Nebula Drift and Planetary Orbit recognizable and preserve reduced-motion behavior.

## Interfaces and data flow

- `src/data/station-world.ts` remains the source for station scale, room positions, entrances, routes, walkable regions, and solid fixtures.
- `src/components/ship-artwork.tsx` renders corridor and hull SVG from the shared station geometry.
- `src/components/use-station-exploration.ts` continues to own character input, movement, camera, and airlock state; it consumes collision helpers from station-world data.
- `src/components/room-artwork.tsx` and `src/app/globals.css` own the visual treatment of ship rooms and shared room art.
- `src/components/station-shell.tsx` and its existing styles own the portfolio section panel; section data stays in `src/data/sections.ts`.
- `src/components/use-space-mood.ts` and the mood styles in `src/app/globals.css` retain mood selection and reduced-motion support.

No portfolio-content or multiplayer protocol changes are part of this work.

## Acceptance criteria

1. The same route definitions determine the rendered corridor centerlines and walkable corridor bounds; paths connect cleanly at all room entrances without visible loose ends.
2. The astronaut remains on walkable ship surfaces, cannot pass through the hull or solid fixtures, can pass through traversable airlocks, and can move along corridor turns without snagging.
3. The astronaut remains visually legible at corridor and room thresholds, with hull foreground overlap matching its position relative to walls.
4. The ship and section panel look more organized and deliberately layered at desktop and mobile sizes, while preserving all existing destination links and accessibility behavior.
5. Meteor Shower has a visible meteor effect in normal motion settings and becomes still under reduced motion; the other three moods remain independently recognizable.
6. The Orbital Training Deck shootout, its tally, live visitors, touch controls, and keyboard controls remain operational and visually unobstructed.
7. Lint, typecheck, and production build pass. Geometry behavior is covered by focused tests, and desktop/mobile and four-mood views are visually checked.

## Out of scope

- Rebuilding the map or changing the ship's established top-down concept.
- Adding new rooms, portfolio facts, or external links.
- Changing presence transport, visitor limits, penalty rules, URLs, or section navigation behavior.
- Adding new art-generation or game-engine dependencies.
