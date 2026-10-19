import type { CSSProperties } from "react";
import { DeckPattern } from "@/components/deck-pattern";
import { RoomBulkheads } from "@/components/room-artwork";
import { airlocks, corridorPath, CORRIDOR_WIDTH, MAP_SCALE, rooms, ROOM_FLOOR_OUTLINE, WORLD } from "@/data/station-world";
import { suitColors, type Direction, type SuitPalette } from "@/data/astronauts";

export { SpaceBackdrop } from "@/components/space-backdrop";

// The corridors and solar arrays retain the original illustration's coordinates.
export function StationConnections() {
  return (
    <svg className="station-connections" width={WORLD.width} height={WORLD.height} viewBox={`0 0 ${WORLD.width / MAP_SCALE} ${WORLD.height / MAP_SCALE}`} aria-hidden="true" focusable="false" shapeRendering="crispEdges">
      <defs>
        <DeckPattern id="corridor-deck" />
        {/* Keep corridor rails outside the real room floor and doorway union.
            Room bounding boxes also contain empty space at stepped corners. */}
        <mask id="corridor-exterior-only" maskUnits="userSpaceOnUse" x="0" y="0" width={WORLD.width / MAP_SCALE} height={WORLD.height / MAP_SCALE}>
          <rect width={WORLD.width / MAP_SCALE} height={WORLD.height / MAP_SCALE} fill="white" />
          {Object.entries(rooms).map(([id, room]) => <polygon key={id} points={ROOM_FLOOR_OUTLINE.map(point => `${room.x / MAP_SCALE + point.x * room.width / (240 * MAP_SCALE)},${room.y / MAP_SCALE + point.y * room.width / (240 * MAP_SCALE)}`).join(" ")} fill="black" />)}
          {airlocks.map((opening, index) => <rect key={index} {...opening} fill="black" />)}
        </mask>
        <pattern id="solar-grid" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#182e4c" /><path d="M0 14V0h14" fill="none" stroke="#405b7a" strokeWidth="2" /></pattern>
      </defs>
      <g className="station-solar-arrays"><path d="M24 480h48M1560 496h48" stroke="#405775" strokeWidth="12" />
      <rect x="0" y="392" width="48" height="168" fill="url(#solar-grid)" stroke="#8ba2ba" strokeWidth="3" />
      <rect x="1584" y="408" width="48" height="168" fill="url(#solar-grid)" stroke="#8ba2ba" strokeWidth="3" />
      </g><g strokeLinecap="butt" strokeLinejoin="round">
        <g mask="url(#corridor-exterior-only)">
        {[{ color: "#8ba2ba", width: 36 }, { color: "#252b38", width: 32 }, { color: "#405775", width: 26 }].map(({ color, width }) => <path key={width} d={corridorPath} fill="none" stroke={color} strokeWidth={width} />)}
        <path d={corridorPath} fill="none" stroke="#65c8ff" strokeWidth={CORRIDOR_WIDTH + 6} opacity=".035" />
        </g>
        <path d={corridorPath} fill="none" stroke="url(#corridor-deck)" strokeWidth={CORRIDOR_WIDTH} />
        <path d={corridorPath} fill="none" stroke="#fff8e8" strokeWidth="1" strokeDasharray="3 7" opacity=".65" />
      </g>
    </svg>
  );
}

// A separate foreground plane gives the existing walls an overhanging rim.
// Airlock holes prevent the rim from covering traversable doorways.
export function StationForeground({ depth = false }: { depth?: boolean }) {
  return <svg className="station-foreground" width={WORLD.width} height={WORLD.height} viewBox={`0 0 ${WORLD.width} ${WORLD.height}`} aria-hidden="true" focusable="false" shapeRendering="crispEdges">
    <defs><mask id="bulkhead-openings" maskUnits="userSpaceOnUse" x="0" y="0" width={WORLD.width} height={WORLD.height}>
      <rect width={WORLD.width} height={WORLD.height} fill="white" />
      {airlocks.map((r, i) => <rect key={i} x={r.x * MAP_SCALE - 2} y={r.y * MAP_SCALE - 2} width={r.width * MAP_SCALE + 4} height={r.height * MAP_SCALE + 4} fill="black" />)}
    </mask></defs>
    <g mask="url(#bulkhead-openings)">{Object.entries(rooms).filter(([id]) => id !== "football").map(([id, room]) => <g key={id} transform={`translate(${room.x} ${room.y - (depth && id !== "football" ? 8.5 : 0)}) scale(${room.width / 240})`}><RoomBulkheads /></g>)}</g>
  </svg>;
}

export function Astronaut({ palette = "azure", facing = "down", walking = false, remote = false }: {
  palette?: SuitPalette;
  facing?: Direction;
  walking?: boolean;
  remote?: boolean;
}) {
  const colors = suitColors[palette];
  const style = {
    "--astronaut-suit": colors.suit,
    "--astronaut-shade": colors.shade,
    "--astronaut-trim": colors.trim,
    "--astronaut-visor": colors.visor,
  } as CSSProperties;
  return (
    <svg className="astronaut-svg" viewBox="0 0 48 60" width="48" height="60" aria-hidden="true" focusable="false" shapeRendering="crispEdges"
      style={style} data-facing={facing} data-walking={walking} data-remote={remote}>
      <path d="M20 3h8v4h-8z" fill="#ffc875" />
      <path d="M8 20h4v12H8zM36 20h4v12h-4zM6 24h4v4H6zM38 24h4v4h-4z" fill="#111722" />
      <path d="M10 19h5v15h-5zM33 19h5v15h-5z" fill="var(--astronaut-shade)" />
      <path d="M15 7h18v4h5v6h4v15h-4v5h-5v3H15v-3h-5v-5H6V17h4v-6h5z" fill="var(--astronaut-suit)" stroke="#111722" strokeWidth="3" />
      <path d="M16 10h16v3h5v4h3v12h-3v4h-5v3H16v-3h-5v-4H8V17h3v-4h5z" fill="var(--astronaut-shade)" />
      <path d="M16 11h16v3h5v4h3v9h-3v4h-5v2H16v-2h-5v-4H9v-9h2v-4h5z" fill="var(--astronaut-suit)" />
      <path className="astronaut-visor" d="M15 17h18v3h4v8h-4v3H15v-3h-4v-8h4z" fill="var(--astronaut-visor)" stroke="#111722" strokeWidth="2" />
      <path d="M16 19h8v3h-8zM16 24h4v2h-4z" fill="var(--astronaut-trim)" />
      <path d="M20 35h8v8h-8z" fill="#111722" />
      <path d="M17 35h14v9H17z" fill="var(--astronaut-suit)" stroke="#111722" strokeWidth="2" />
      <path d="M20 37h8v4h-8z" fill="var(--astronaut-trim)" />
      <path className="astronaut-arm astronaut-arm-left" d="M14 37h5v10h-5z" fill="var(--astronaut-suit)" stroke="#111722" strokeWidth="2" />
      <path className="astronaut-arm astronaut-arm-right" d="M29 37h5v10h-5z" fill="var(--astronaut-suit)" stroke="#111722" strokeWidth="2" />
      <path className="astronaut-leg astronaut-leg-left" d="M14 47h8v8h-8z" fill="var(--astronaut-suit)" stroke="#111722" strokeWidth="2" />
      <path className="astronaut-leg astronaut-leg-right" d="M26 47h8v8h-8z" fill="var(--astronaut-suit)" stroke="#111722" strokeWidth="2" />
      <path d="M12 53h10v4H12zM26 53h10v4H26z" fill="#111722" />
      <path d="M15 46h4v4h-4zM29 46h4v4h-4z" fill="var(--astronaut-trim)" />
      <path d="M13 13h5v2h-5zM30 13h3v2h-3z" fill="#fff" opacity=".8" />
    </svg>
  );
}

export function StationEngines() {
  return <svg className="station-engines" width={WORLD.width} height={WORLD.height} viewBox={`0 0 ${WORLD.width / MAP_SCALE} ${WORLD.height / MAP_SCALE}`} aria-hidden="true" focusable="false" shapeRendering="crispEdges">
    {[550, 698].map((x) => <g key={x} transform={`translate(${x} 780)`}>
      <path d="M-10-8h20v18H-10z" fill="#172c43" stroke="#8196ac" strokeWidth="2" />
      <path d="M-6 6H6v6H-6z" fill="#405775" />
      <g className="rocket-plume"><path d="M-6 12H6v12h4v16H6v16H2v14h-4V56h-4V40h-4V24h4z" fill="var(--rocket-outer)" opacity=".7" /><path d="M-4 12h8v26H2v14h-4V38h-2z" fill="var(--rocket-core)" /><path d="M-2 12h4v18h-4z" fill="#fff5df" /></g>
    </g>)}
  </svg>;
}
