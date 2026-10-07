import type { RefObject } from "react";
import type { CSSProperties } from "react";
import { RoomBulkheads } from "@/components/room-artwork";
import { airlocks, corridorPath, CORRIDOR_WIDTH, MAP_SCALE, rooms, WORLD } from "@/data/station-world";
import { suitColors, type Direction, type SuitPalette } from "@/data/astronauts";

export function SpaceBackdrop({ backdropRef }: { backdropRef: RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={backdropRef} className="space-backdrop" aria-hidden="true">
      <div className="nebula-cloud nebula-purple" /><div className="nebula-cloud nebula-teal" />
      <div className="orbit-planet"><span className="orbit-clouds" /></div>
      <div className="meteor-field">{[0, 1, 2, 3, 4].map((i) => <span key={i} className={`meteor meteor-${i}`} />)}</div>
      <div className="travel-streaks" />
      <svg className="stars stars-far" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges">
        {Array.from({ length: 92 }, (_, i) => <rect key={i} x={(i * 137 + 29) % 1200} y={(i * 293 + 71) % 900} width={i % 8 === 0 ? 2 : 1} height={i % 8 === 0 ? 2 : 1} fill="var(--star-color, #DCE8FF)" opacity={.18 + (i % 5) * .08} />)}
      </svg>
      <svg className="stars stars-mid" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges">
        {Array.from({ length: 38 }, (_, i) => <rect key={i} x={(i * 197 + 281) % 1200} y={(i * 331 + 163) % 900} width="1" height="1" fill={i % 8 === 0 ? "var(--star-accent, #86BFFF)" : "var(--star-color, #DCE8FF)"} opacity={.25 + (i % 4) * .08} />)}
      </svg>
      <svg className="stars stars-near" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges">
        {Array.from({ length: 28 }, (_, i) => <path key={i} d={`M${(i * 239 + 131) % 1200} ${(i * 167 + 91) % 900}h2v2h-2z`} fill={i % 7 ? "var(--star-color, #DCE8FF)" : "var(--star-accent, #86BFFF)"} opacity={.35 + (i % 3) * .12} />)}
      </svg>
      <svg className="distant-body distant-moon" viewBox="0 0 64 64" shapeRendering="crispEdges">
        <path d="M20 4h24v4h10v10h6v26h-6v10H44v6H20v-6H10V44H4V20h6V10h10z" fill="#181d24" />
        <path d="M20 4h12v8H20v12H10v16H4V20h6V10h10z" fill="#46505d" />
        <path d="M44 8h10v10h6v26h-6v10H44v6H32v-8h10V40h8V20h-6z" fill="#0c111b" />
        <path d="M20 8h8v2h-8zM12 18h2v8h-2zM18 34h8v2h-8z" fill="#6a737c" />
        <path d="M18 18h10v10H18zM38 38h12v10H38zM16 42h6v6h-6z" fill="#0c1016" />
      </svg>
      <svg className="distant-body distant-planet" viewBox="0 0 144 104" shapeRendering="crispEdges">
        <path d="M10 48h16v-6h18v-6h64v6h18v6h10v8h-10v6h-18v6H44v-6H26v-6H10z" fill="#253342" />
        <path d="M12 48h14v-4h18v-4h64v4h18v4h8v4h-12v-4h-18v-4H46v4H28v4H12z" fill="#63717a" />
        <path d="M56 10h32v6h12v10h8v12h4v28h-4v12h-8v10H88v6H56v-6H44V78h-8V66h-4V38h4V26h8V16h12z" fill="var(--distant-planet, #17243A)" />
        <path d="M56 10h24v6H58v6H46v12H38v22h-6V38h4V26h8V16h12z" fill="var(--planet-rim, #496978)" />
        <path d="M46 28h46v4h12v6H38v-6h8zM36 48h66v6H36zM44 68h56v6H44zM56 82h32v4H56z" fill="#345363" />
        <path d="M80 16h20v10h8v12h4v28h-4v12h-8v10H88v6H70v-8h10V74h8V60h4V38h-4V24h-8z" fill="#0e1c2b" />
        <path d="M10 52h16v6h18v6h64v-6h18v-6h10v8h-10v6h-18v6H44v-6H26v-6H10z" fill="#526372" />
        <path d="M28 58h16v4h64v-4h16v2h-14v6H42v-6H28z" fill="#879095" opacity=".6" />
      </svg>
      <svg className="distant-body distant-debris" viewBox="0 0 96 48" shapeRendering="crispEdges">
        <path d="M8 22h6v4h4v8h-4v4H6v-4H2v-8h6zM52 6h6v4h4v8h-4v4h-8v-4h-4v-8h6zM80 32h6v4h4v6H78v-6h2z" fill="#25303b" />
        <path d="M6 26h6v2H6zM50 10h6v2h-6zM80 36h6v2h-6z" fill="#53606a" />
      </svg>
      <svg className="distant-body distant-asteroid" viewBox="0 0 48 48" shapeRendering="crispEdges">
        <path d="M16 4h16v8h10v12h-4v14H26v6H12V34H4V18h8v-6h4z" fill="#232328" />
        <path d="M16 10h10v6H16zM26 26h8v8h-8z" fill="#38363b" />
      </svg>
    </div>
  );
}

// The corridors and solar arrays retain the original illustration's coordinates.
export function StationConnections() {
  return (
    <svg className="station-connections" width={WORLD.width} height={WORLD.height} viewBox={`0 0 ${WORLD.width / MAP_SCALE} ${WORLD.height / MAP_SCALE}`} aria-hidden="true" focusable="false" shapeRendering="crispEdges">
      <defs>
        <pattern id="solar-grid" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#182e4c" /><path d="M0 14V0h14" fill="none" stroke="#405b7a" strokeWidth="2" /></pattern>
      </defs>
      <path d="M24 480h48M1560 496h48" stroke="#405775" strokeWidth="12" />
      <rect x="0" y="392" width="48" height="168" fill="url(#solar-grid)" stroke="#8ba2ba" strokeWidth="3" />
      <rect x="1584" y="408" width="48" height="168" fill="url(#solar-grid)" stroke="#8ba2ba" strokeWidth="3" />
      <g strokeLinecap="butt" strokeLinejoin="round">
        <path d={corridorPath} transform="translate(2 6)" fill="none" stroke="#050b13" strokeWidth="40" />
        <path d={corridorPath} transform="translate(0 2)" fill="none" stroke="#111722" strokeWidth="38" />
        {[{ color: "#8ba2ba", width: 36 }, { color: "#252b38", width: 32 }, { color: "#405775", width: 26 }].map(({ color, width }) => <path key={width} d={corridorPath} fill="none" stroke={color} strokeWidth={width} />)}
        <path d={corridorPath} fill="none" stroke="#65c8ff" strokeWidth={CORRIDOR_WIDTH + 6} opacity=".035" />
        <path d={corridorPath} fill="none" stroke="#d9d4be" strokeWidth={CORRIDOR_WIDTH} />
        <path d={corridorPath} transform="translate(-1 -1)" fill="none" stroke="#fff4d4" strokeWidth="1" opacity=".42" />
        <path d={corridorPath} fill="none" stroke="#fff8e8" strokeWidth="2" strokeDasharray="4 6" opacity=".88" />
      </g>
    </svg>
  );
}

// Small traversable openings in the existing hulls; the rooms stay in place.
export function StationAirlocks() {
  return <svg className="station-airlocks" width={WORLD.width} height={WORLD.height} viewBox={`0 0 ${WORLD.width / MAP_SCALE} ${WORLD.height / MAP_SCALE}`} aria-hidden="true" focusable="false" shapeRendering="crispEdges">
    {airlocks.map((r, i) => <g key={i}>
      <rect {...r} fill="#d9d4be" />
      {r.width > r.height ? <>
        <rect x={r.x + 2} y={r.y + 2} width="4" height={r.height - 4} fill="#798a91" opacity=".5" />
        <path d={`M${r.x + 3} ${r.y + 3}v${r.height - 6}`} stroke="#dce2d4" strokeWidth="1" />
        <path d={`M${r.x + r.width - 5} ${r.y + 4}v${r.height - 8}`} stroke="#748792" strokeWidth="2" strokeDasharray="2 2" />
      </> : <>
        <rect x={r.x + 2} y={r.y + 2} width={r.width - 4} height="4" fill="#798a91" opacity=".5" />
        <path d={`M${r.x + 3} ${r.y + 3}h${r.width - 6}`} stroke="#dce2d4" strokeWidth="1" />
        <path d={`M${r.x + 4} ${r.y + r.height - 5}h${r.width - 8}`} stroke="#748792" strokeWidth="2" strokeDasharray="2 2" />
      </>}
      {r.width > r.height ? <path d={`M${r.x} ${r.y}h${r.width}m-${r.width} ${r.height}h${r.width}`} stroke="#405775" strokeWidth="2" /> : <path d={`M${r.x} ${r.y}v${r.height}m${r.width} -${r.height}v${r.height}`} stroke="#405775" strokeWidth="2" />}
    </g>)}
  </svg>;
}

// A separate foreground plane gives the existing walls an overhanging rim.
// Airlock holes prevent the rim from covering traversable doorways.
export function StationForeground() {
  return <svg className="station-foreground" width={WORLD.width} height={WORLD.height} viewBox={`0 0 ${WORLD.width} ${WORLD.height}`} aria-hidden="true" focusable="false" shapeRendering="crispEdges">
    <defs><mask id="bulkhead-openings" maskUnits="userSpaceOnUse" x="0" y="0" width={WORLD.width} height={WORLD.height}>
      <rect width={WORLD.width} height={WORLD.height} fill="white" />
      {airlocks.map((r, i) => <rect key={i} x={r.x * MAP_SCALE - 2} y={r.y * MAP_SCALE - 2} width={r.width * MAP_SCALE + 4} height={r.height * MAP_SCALE + 4} fill="black" />)}
    </mask></defs>
    <g mask="url(#bulkhead-openings)">{Object.entries(rooms).map(([id, room]) => <g key={id} transform={`translate(${room.x} ${room.y}) scale(${room.width / 240})`}><RoomBulkheads /></g>)}</g>
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
