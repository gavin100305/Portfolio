# Gavin Soares Portfolio

An explorable pixel-art space station portfolio. The original six-room illustration, with its stepped hulls, room props, corridors, and solar arrays, is enlarged uniformly, with a new east wing extending the world to 4968 × 2400. The ship is larger than the viewport: an astronaut and following camera reveal its rooms as you explore. The latest exploration direction overrides the PRD's earlier whole-map fit requirement.

## Run locally

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Explore

- Move with WASD or arrow keys on desktop, or drag to steer on touch screens. Short acceleration and braking make movement responsive; diagonal movement has the same speed as straight movement.
- Walls and solid equipment block movement. A round footprint follows the visible props; shadows and lighting do not block the lobby floor. Movement slides along walls, and the camera follows within world bounds.
- The map fills the viewport without a navbar. Entering a deck updates your location without opening a panel or interrupting movement. Click/tap a room or its sign, or press Enter in the map to open a panel explicitly.
- Escape and Map/Home close the panel and restore focus. Movement pauses while a panel is open.
- Reduced motion removes camera easing, background parallax, walking poses, and the panel transition.
- Tab reaches room controls and reveals the focused room. Enter/Space opens it. Direct section URLs remain available without walking.

## Visual depth

The ship uses one consistent floor grid across its off-white decks and corridors. Room hulls have actual cutouts at entrances. `deck-outline.ts` joins the room floor and doorway geometry into one perimeter, so wall shadows turn around an entrance and never cross the walkway. `deck-pattern.tsx` keeps tile size and alignment consistent even though the original room SVGs have different scales. The collision coordinates in `station-world.ts` remain the source of the openings.

Hull underlayers and foreground wall lips add restrained exterior depth. Equipment uses a shared light steel casing, upper-left edge highlights, recessed glass, physical keys and dials, and compact contact shadows. The Command Deck has a physical navigation table and chairs; the hangar craft has panel seams and engine details; Engineering has server blades and a circuit cabinet; the archive has glass-fronted displays; Communications has a radar with a slow sweep and rotary controls. Planters and the navigation table use updated solid footprints. Reduced motion stops the sweep and indicator animations. These are original SVG drawings inspired by the clear floor and wall hierarchy in spaceship exploration games; no game artwork or assets are bundled.

Three star layers, a shaded moon, a ringed planet, and distant debris move behind the station as the camera follows the astronaut. Astronaut walking poses follow distance travelled and stop while idle.

## Space moods

The illuminated left-hand console on the command deck selects Deep Space (default), Nebula Drift, Planetary Orbit, or Near-Sun Meteor Shower and remembers the choice locally. Walk near it and press E, click/tap the physical instrument, or use the nearby HUD action. Its chooser traps keyboard focus, closes with Escape or Return to ship, and returns focus to the instrument. The ship’s interior palette is fixed across all four moods. Only the space background, distant scenery, window views, and exterior travel effects change. All mood palettes, nebula/planet/meteor effects, and rocket/travel keyframes are in `src/app/globals.css`. `use-space-mood.ts` coordinates departure, arrival, and the return to the exploration camera; no animation packages are used.

A mood change briefly pulls back to show the ship and firing engines, travels to the new environment, and returns to the same astronaut position. Walking pauses during this sequence. Reduced motion changes moods instantly and disables meteors and rocket/travel effects. Room entry continues to leave panels closed. Small curves soften the original stepped hulls and equipment without changing room positions or collision geometry.

## Update content and world

`src/data/sections.ts` contains the six original portfolio destinations and Orbital Training Deck. URL fragments are `#projects`, `#achievements`, `#stack`, `#experience`, `#about`, `#contact`, and `#football`; direct loads and Back/Forward remain supported.

`src/data/station-world.ts` defines world dimensions, spawn, the original room placements, airlocks, walkable areas, furniture collisions, and camera clamping. Keep these shared coordinates aligned with the artwork when editing the ship. `src/components/ship-artwork.tsx` renders the original corridor network, solar arrays, foreground wall lips, and space backdrop. `room-artwork.tsx` draws the room hulls, connected floor outlines, and room-specific equipment. All text and controls remain HTML; no map labels or text are flattened into artwork.

`use-station-exploration.ts` handles input, movement, and camera updates with a single requestAnimationFrame loop. It clears input when the window loses focus or the page is hidden. The world uses the same movement geometry on desktop and phones. A small Three.js layer adds shallow visual depth while HTML/SVG retains all interactions and the graphics fallback.

## Live visitor astronauts

The map can show anonymous visitors in the same 32-person lobby. Each visitor receives one of five stable suit palettes; the larger astronaut sprites, direction, and walking pose are drawn in the scene as accessible SVG/HTML. Position updates are sent at most five times per second while the map is open. The app stores no visitor names or profiles; live positions and leases expire automatically after disconnect.

Live presence is optional and stays off until `NEXT_PUBLIC_PRESENCE_URL` points to a deployed Worker. Copy `.env.example` to `.env.local` to configure it. The Cloudflare Worker setup, local development instructions, origin setting, and deploy steps are in [`workers/presence/README.md`](workers/presence/README.md). Without that service, the local astronaut and portfolio work normally.

Panels still contain placeholders. Add only profile facts, projects, achievements, experience, technology groups, and links that have been verified and approved for publication.

## Typography

Manrope is the interface/body font; Pixelify Sans is used for selected headings. Both are bundled as local variable fonts in `src/app/fonts` with their OFL licenses.

## Orbital Training Deck

A seventh room extends east from Communications, with a connecting corridor, sliding entrance doors, and an Orbital Training Deck sign. The original six rooms retain their positions and scale. Walk to the ball and press E, click/tap the ball or room sign, or open `/#football` directly. Walking into the room leaves exploration active until you choose to play.

The shootout happens on the existing stadium floor: your astronaut takes the marked penalty position (not the centre circle), a goalkeeper moves across the actual goal, and the ball travels across the pitch. The room uses charcoal-blue station decking, deep green turf, and cyan/amber lights. A compact console below the pitch shows keyboard instructions, score, and shot feedback; there is no game dialog or second pitch. The camera frames the playing area on desktop and phones. Walking pauses during play and resumes at your entry position after Escape.

Take penalties for as long as you like: choose Left, Centre, or Right with A/D or arrow keys, then press Space. The shootout uses keyboard input only. The goalkeeper chooses a direction independently for each shot. A scoreboard above the goal and the console below the room track goals and saves throughout the visit. Leaving the deck ends the session and resets the tally. Direct links and Back/Forward enter or leave play without opening a card. Goals and saves reset each time the visitor exits the room. Results are not stored between visits or broadcast to other visitors. Reduced motion resolves shots immediately without flight, dive, or kick animation.

After changing world bounds or furniture footprints, redeploy the optional presence Worker so online visitors can sync positions in the east wing. Each visitor plays their own solo penalties; gameplay results are not broadcast to other visitors. During play, presence stays connected at the visitor’s entry position so starting a shootout does not send an invalid teleport. Remote visitors in this room appear in four sideline seats with suit accents and anonymous pilot tags; additional visitors are counted below the pitch. Their authoritative positions and the Worker protocol are unchanged.

## Full-screen portfolio pages

Opening Projects, Achievements, Tech Stack, Experience, About, or Contact presents a full-screen information page as a single off-white station panel with a blue perimeter frame, four corner screw bolts, original vector illustrations, and local Pixelify Sans / Manrope typography. Dark blue is used for frames, control highlights, and depth edges. Information pages use no gradients, branding header, section tabs, or footer directory. The underlying station stays mounted, so returning preserves the astronaut's position. The football game remains on its physical deck.

Each page has a persistent **Return to station** button. Existing URLs (`/#projects`, `/#achievements`, `/#stack`, `/#experience`, `/#about`, `/#contact`) and browser Back/Forward work. Escape or **Return to station** leaves the information view in one action, including when following the optional football detour from About. Focus starts on the page title and returns to the original station launcher; the underlying map is inert. Project search, a compact collection selector, links, and email-copy feedback support keyboard use. Mobile pages scroll independently; reduced motion removes entrance, orbital, and hover movement.

### Updating content

- `src/data/portfolio-content.ts`: biography, education, experience, skills, achievements, and the curated project list. Personal facts come from Gavin's supplied CV; additional projects come from public repositories and the user-provided Draft XI site. Keep project descriptions factual, distinguish team contributions, and check outbound links before adding them.
- `src/data/sections.ts`: section identifiers, labels, and room names. These also drive station links; keep IDs stable for shared URLs.
- `src/components/portfolio-page.tsx`: full-screen shell and section layouts. `portfolio-illustrations.tsx` supplies original decorative artwork, not app screenshots.
- `src/app/portfolio-pages.css`: scoped page palette, responsive layouts, frames, and animation. These styles do not recolor the exploration map.

Ten selected projects include Draft XI, Zenith, Money Council, InfluenceIQ, Neurolytics, TISD, EcoScan, Pashu Pehchan, NourishNet, and Vathavaran Variables. Source links are included where known. Draft XI has a verified live link but no supplied repository link. EcoScan and Vathavaran Variables currently link only to source because their listed deployments returned 404 during review. The contact page uses email, GitHub, and the user-confirmed LinkedIn URL. Phone numbers and the original CV PDF are intentionally not published.

No new packages or external artwork are required. Lint, typecheck, and production build use the existing npm scripts above.

## Three.js depth and Station view

The original interior remains the default. Three.js adds shallow equipment sides, raised wall edges and a static shadow map under the existing original artwork. It uses an orthographic camera whose ground projection matches the HTML floor exactly, so room positions, off-white tiles, corridors, astronaut movement and collision coordinates stay aligned. Room drawings supply the surface textures; no external models or artwork are used. The radar and console signals remain animated. Football retains its live SVG pitch and scoreboard so each shot updates immediately.

The small **Station view** button opens an optional perspective view of the same seven-room layout. There is no new enclosing hull. Each existing module gains shallow side faces, restrained service panels, recessed windows and room-specific details. Drag with a mouse or one finger to orbit; scroll or pinch to zoom. The visible rotate, zoom and reset buttons also work with keyboard and touch. Left/Right arrows rotate, +/− zoom, Home resets, and Escape returns to the deck. Peek inside exposes the original Command Deck and Project Hangar drawing. All portfolio destinations remain available as real links below the model. Returning preserves the astronaut's position, and multiplayer stays connected while observing.

Both scenes load from separate client chunks, cap pixel ratio at 1.5 on desktop and 1.25 on phones, and release GPU resources on cleanup. The interior renders through the existing exploration loop and skips unchanged frames; Ship view caps rendering at 30 fps (24 on coarse pointers). Hidden tabs and a hidden interior stop drawing. Reduced motion removes orbit easing and idle animation while keeping direct camera controls usable. Graphics initialization failure or context loss restores the existing SVG interior; Ship view supplies a small SVG overview and usable section links.

`interior-depth-model.ts` builds the shallow geometry and original surface textures; `interior-depth-scene.ts` aligns it to the exploration camera. `exterior-model.ts` builds the observation model, `exterior-scene.ts` owns its renderer and camera controls, and `ship-view.tsx` owns the accessible dialog. The backgrounds and ship colors still live in `globals.css`. Changing space mood never rebuilds or recolors either ship.

The implementation follows the Three.js guidance for [color management](https://threejs.org/manual/pages/color-management.html), [responsive rendering](https://threejs.org/manual/pages/responsive.html), [resource cleanup](https://threejs.org/manual/pages/cleanup.html) and [rendering on demand](https://threejs.org/manual/pages/rendering-on-demand.html).

## Design references

The [official Airship cockpit article](https://www.innersloth.com/airship-map-is-now-live-2/) and [Among Us gameplay references](https://www.innersloth.com/games/among-us/) informed the material hierarchy and readable equipment silhouettes. All room art, equipment, sprites, and UI are original SVG/HTML/CSS. The existing map layout is retained. No reference image assets are included in the application.
