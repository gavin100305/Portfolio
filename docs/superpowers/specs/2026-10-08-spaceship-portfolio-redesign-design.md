# Spaceship Portfolio World Redesign

## Goal

Polish the existing top-down pixel-art spaceship into a coherent, navigable portfolio world while preserving the current rooms, portfolio wording, football game, multiplayer presence, and theme switcher.

## Constraints and preserved behavior

- Keep the current Next.js project structure and existing game and presence flows.
- Keep strict top-down 2D pixel art; do not introduce 3D, WebGL, or a game framework.
- Keep the black space backdrop and off-white room and corridor floors. Deep Space remains quiet and still; Meteor Shower gets visible, occasional animated streaks.
- Keep the six portfolio destinations and the additional Orbital Training Deck. Do not invent portfolio facts or replace existing copy.
- Keep mouse, keyboard, touch, direct URLs, accessible dialogs, reduced-motion support, and existing theme switching.
- Keep effects lightweight and avoid covering walkable areas, room entrances, the football pitch, or its controls.

## Current implementation findings

- `station-world.ts` holds room rectangles, a separate corridor SVG path, a separate set of route rectangles for collision, doors, furniture obstacles, and spawn coordinates. These sources can diverge.
- `ship-artwork.tsx` paints corridors from the SVG path; `use-station-exploration.ts` uses `canWalk` and door state for the local astronaut.
- The presence worker validates world bounds and movement speed but not station walkability. Remote astronauts render server coordinates directly.
- Room interiors are SVG illustrations. Standard portfolio destinations open an accessible dialog that currently contains placeholder copy; the PRD content must remain unchanged.
- Deep Space and Meteor Shower already have theme variables and meteor CSS. The redesign should strengthen their distinction without altering other theme palettes or the ship.

## Design

### World plan and geometry

Keep the Command Deck as the central hub. Arrange Projects, Achievements, Tech Stack, Experience, About, Contact, and the Orbital Training Deck around it in the existing world footprint. Align room bounds, corridor centerlines, corridor widths, thresholds, and wall details to a common grid. Use short orthogonal corridor runs with consistent width and cleanly joined doorway thresholds; retain the off-white walking surface and a restrained blue-gray hull frame.

Create one typed station geometry source for room bounds, corridor floor shapes, doorway openings, and solid furniture footprints. Render the corridor layers and derive walkability from that same geometry so every visible path is traversable and every wall edge blocks movement. The ship should read as one organized station silhouette, with nested hull, inner wall, floor, door, lighting, and room-art layers.

### Movement and multiplayer

Retain the current responsive local movement, camera follow, touch and keyboard input, door animation, and room activation. Use the shared geometry for the local collision footprint and for server validation of multiplayer movement snapshots. Reject or constrain snapshots that cross solid walls, furniture, closed thresholds, or world edges; remote avatars must use the same walkable region as the local astronaut. Preserve visitor identity palettes and avoid forced crowding in rooms.

### Room interiors and content displays

Refine the existing SVG room equipment into a consistent terminal design language: a clear frame, screen, concise heading/icon treatment, deliberate margins, and restrained cyan/amber status lights. Use small room-specific variations where useful. Keep consoles and decorations outside the clear movement lanes. Preserve all room names and existing portfolio wording. Empty portfolio sections remain clearly marked placeholders until Gavin supplies verified content; no sample achievements, project details, metrics, or contact links will be invented.

### Ambient motion and discoveries

Add limited CSS-only ambience such as slow console status blinking and occasional distant window activity. Deep Space has sparse stationary stars with no meteor animation. Meteor Shower keeps the same black base and ship geometry, with a few separated, low-frequency streaks and brighter star activity. All decorative motion respects `prefers-reduced-motion` and does not affect controls or character movement.

Add two optional, content-neutral discoveries: a hidden ship-console response and a football-session streak celebration. They must be discoverable through normal interaction, must not block navigation, and must not imply personal biography or achievements.

### Accessibility and responsive behavior

Keep room names available to assistive technology, visible focus, direct section URLs, browser history, dialog keyboard behavior, and touch movement. Ensure map framing, room access, consoles, the training pitch, scoreboard, and controls remain usable at desktop and mobile sizes. Reduced motion removes or shortens decorative and camera easing while preserving navigation and game feedback.

## Validation

- Exercise walkability at room interiors, furniture edges, every door, corridor bends, hull edges, and corridor junctions.
- Verify generated corridor art and collision floor geometry share the same coordinates and widths.
- Validate remote movement snapshots against the same geometry and confirm simultaneous visitors remain visible with distinct suit colors.
- Review the ship and room terminals at desktop and mobile sizes; check that floors remain off-white and destinations remain readable.
- Switch repeatedly between Deep Space and Meteor Shower and verify the former has no streaks while the latter has visible but restrained motion.
- Check keyboard, touch, direct URLs, dialogs, football play, scoreboard, and reduced-motion behavior.
- Run the existing lint, type-check, tests, and production build commands after implementation; do not add packages unless a concrete existing-dependency limitation requires one.

## Out of scope

- Adding new portfolio facts, links, projects, awards, metrics, or biography.
- Replacing the football game or multiplayer architecture.
- Copying the reference website's art, layout, assets, or village setting.
- Rebuilding the site from scratch or changing unrelated portfolio sections.
