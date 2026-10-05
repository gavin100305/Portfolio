# Live Ship Presence and Astronaut Avatar Design

**Status:** Draft for review  
**Date:** 2026-10-06

## Goal

Make the astronaut easier to see and let anonymous visitors encounter other people exploring the same ship. The first capacity target is approximately 1,000 concurrent visitors across the site. Each browser sees a small nearby group, rather than receiving a global stream of every visitor. Guests do not need accounts.

Keep the existing ship illustration, room positions, movement and collision behavior, navigation, themes, and cockpit mood selector. Do not add names, chat, profiles, or new map art.

## Avatar

- Replace the current 32×40 drawing with a more legible top-down pixel astronaut, about 48×60 CSS pixels at the normal camera scale. Keep crisp SVG rendering, facing direction, and walking frames.
- Use one reusable astronaut component for local and remote visitors.
- Define five suit palettes with helmet/body accents as well as different colors. Choose a stable palette from a temporary guest identity.
- Remote sprites use a generic accessible label, “Visitor astronaut.” Hide decorative SVG details from assistive technology. Do not display visitor names or persistent identifiers.
- Render at most 32 remote sprites in one lobby. Prefer nearby visitors when the camera cannot show all members.

## Realtime architecture

Use a small Cloudflare Worker WebSocket service backed by Durable Objects for ephemeral lobby state. The existing Next.js app remains the website and requests a short-lived signed guest ticket from the Worker when the map opens. This is a separate service because the repository has no realtime backend or hosting binding today.

Use one coordinator Durable Object to assign guests to the least occupied lobby, with an atomic admission check and a hard cap of 32 active guests per lobby. A lobby Durable Object owns only its connected sockets and their latest position, facing, and palette. No persistent database is used. A guest receives a cryptographically random, short-lived server-issued identity; the identity is not linked to a name, account, IP address, or analytics profile. Do not store raw IP addresses or log tickets/positions.

Each client sends a compact movement snapshot at no more than 5 updates per second, only when its position or facing changes. The lobby validates payload shape, finite coordinates, map bounds, direction and palette enums, and per-client rate. The server broadcasts a compact current-position snapshot to lobby members at the same capped rate, batching all members into one message per recipient. Clients interpolate remote positions locally; under reduced motion they snap to the latest snapshot. Other avatars do not collide with or affect local movement.

Durable Object WebSocket hibernation and per-socket attachments should preserve only the minimal current state needed to restore a lobby after idle hibernation. Disconnected guests expire promptly. Guests reconnect to their lobby while their ticket is valid; membership and state are discarded when the lobby empties. The app must work fully in local-only mode if the Worker is missing or unavailable.

This creates parallel copies of the same map. A visitor sees at most 32 people in their assigned copy and is not promised visibility of every visitor on the site. The first release targets 1,000 concurrent guests spread across lobbies; this target must be measured against a configured Cloudflare account before it is claimed as verified. Cloudflare publishes WebSocket and Durable Object service limits and pricing; actual plan quotas, socket duration, bandwidth, and expected monthly cost need production load measurements. Sources: [Durable Object WebSockets](https://developers.cloudflare.com/durable-objects/best-practices/websockets/) and [Durable Object pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/).

## Data flow

1. The map requests a temporary guest ticket from the Worker. The Worker issues a random identity and assigns the guest through the coordinator to a lobby with capacity.
2. The browser opens a WebSocket to that lobby using the ticket. The ticket is scoped to one lobby, expires, and is not an API secret.
3. The existing local movement loop remains authoritative for the local guest. At the capped rate it sends position/facing updates.
4. The lobby validates updates and broadcasts a packed current-state snapshot. Remote sprites update and interpolate in the existing map renderer.
5. On disconnect, the lobby removes the visitor; when no visitors remain, guest state expires. Nothing is persisted.

## Privacy, accessibility, and resilience

- Presence is ephemeral and starts only when the visitor opens the map. Explain in the README/privacy copy that the current position, facing, and suit palette are shared with visitors in the same lobby while connected.
- Do not collect names, email, IP, chat, precise device identifiers, or persistent analytics for this feature. Do not log tickets, cookies, or coordinates.
- Keep the local astronaut, movement, room access, direct section URLs, themes, and cockpit controls usable when presence is disabled or offline.
- Show focus clearly. Do not rely on suit color alone to distinguish astronauts. Respect reduced motion by removing remote easing.
- Release sockets and listeners on map close/unmount; use bounded reconnect backoff and reject expired tickets. Invalid or abusive clients are rate-limited or disconnected.

## Failure behavior

Any missing Worker configuration, ticket failure, WebSocket close, malformed movement message, or provider outage degrades to the single-player map. Do not block local movement on a network response. Never expose signing keys or secrets in the browser. Return generic errors and do not log credential or position payloads.

## Verification

- Verify the enlarged sprite remains crisp and legible in every direction and all five palettes are distinct.
- With two independent sessions, verify enter, movement, facing, disconnect, reconnect, and no duplicated remote avatar.
- Verify invalid/out-of-bounds/rate-limited messages do not change lobby state.
- Verify capped 32-person lobby assignment and that a full lobby causes an atomic allocation into another lobby.
- Verify reduced motion, movement collisions, touch and keyboard movement, direct section URLs, all rooms/themes, and local-only fallback.
- Load test 1,000 simulated concurrent guests against a configured service. Measure join bursts, inbound messages, fan-out bytes, CPU/duration, cost, and reconnect behavior. Do not report the 1,000 target as achieved until this passes.

## Alternatives considered

- **One global realtime channel:** simplest to explain, but every movement update fans out to every visitor and makes delivery cost grow with the square of attendance. Rejected.
- **Managed pub/sub with lobby shards:** less backend code, but per-account message throughput remains a sizing concern. For example, 1,000 guests sending 5 updates per second already produce 5,000 incoming updates per second before recipient delivery. Ably currently publishes account-wide limits of 2,500 messages/second on Standard and 10,000 on Pro, plus separate channel limits. This approach would need a deliberate slower update rate, more batching, or a higher negotiated plan. Sources: [Ably limits](https://ably.com/docs/platform/pricing/limits) and [Ably presence](https://ably.com/docs/presence-occupancy/presence).
- **Cloudflare Worker + Durable Object lobby shards (recommended):** gives the project explicit lobby admission, server-side validation, and batching before fan-out, without introducing a general game framework or persistent database. It adds a separately deployed Worker and Cloudflare configuration, so local single-player mode must remain available and deployment setup is a prerequisite.

## Out of scope

One shared simulation where all 1,000+ users see each other, sign-in, visitor names, chat, database-backed presence history, cross-lobby transfer, and a general multiplayer/game framework.
