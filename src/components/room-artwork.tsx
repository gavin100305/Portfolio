import type { SectionId } from "@/data/sections";
import { EquipmentHousing, equipment } from "@/components/equipment-art";
import { DeckPattern } from "@/components/deck-pattern";
import { deckOutline } from "@/components/deck-outline";
import { airlocks, MAP_SCALE, rooms, ROOM_FLOOR_OUTLINE } from "@/data/station-world";

// Tiny curves soften the existing stepped silhouette without changing its layout.
function roundedOutline(points: number[][], radius: number) {
  const corners = points.map((point, i) => {
    const previous = points[(i + points.length - 1) % points.length];
    const next = points[(i + 1) % points.length];
    const incoming = Math.hypot(point[0] - previous[0], point[1] - previous[1]);
    const outgoing = Math.hypot(next[0] - point[0], next[1] - point[1]);
    const r = Math.min(radius, incoming / 2, outgoing / 2);
    return { point, before: [point[0] + (previous[0] - point[0]) * r / incoming, point[1] + (previous[1] - point[1]) * r / incoming], after: [point[0] + (next[0] - point[0]) * r / outgoing, point[1] + (next[1] - point[1]) * r / outgoing] };
  });
  return `M${corners[0].before.join(" ")} ` + corners.map((corner, i) => `${i ? `L${corner.before.join(" ")} ` : ""}Q${corner.point.join(" ")} ${corner.after.join(" ")}`).join(" ") + "Z";
}
const hullShape = roundedOutline([[28,0],[212,0],[212,8],[224,8],[224,20],[232,20],[232,32],[240,32],[240,144],[232,144],[232,156],[224,156],[224,168],[212,168],[212,176],[28,176],[28,168],[16,168],[16,156],[8,156],[8,144],[0,144],[0,32],[8,32],[8,20],[16,20],[16,8],[28,8]], 2);

// Real SVG focus/hover feedback stays above the decorative Three.js surface.
export function RoomFocusOutline({ id }: { id: SectionId }) {
  return <svg className="room-focus-outline" viewBox="0 0 240 176" aria-hidden="true" focusable="false"><path d={hullShape} fill="none" stroke="currentColor" strokeWidth="3" mask={`url(#hull-openings-${id})`} /></svg>;
}

// Cut genuine openings in every room's walls using the same geometry that
// movement and multiplayer use. No entrance floor is painted over a wall.
function roomOpenings(id: SectionId) {
  const room = rooms[id];
  const scale = room.width / 240;
  return airlocks.filter((door) =>
    door.x * MAP_SCALE < room.x + room.width && (door.x + door.width) * MAP_SCALE > room.x &&
    door.y * MAP_SCALE < room.y + room.height && (door.y + door.height) * MAP_SCALE > room.y,
  ).map((door) => ({
    x: (door.x * MAP_SCALE - room.x) / scale,
    y: (door.y * MAP_SCALE - room.y) / scale,
    width: door.width * MAP_SCALE / scale,
    height: door.height * MAP_SCALE / scale,
  }));
}

// Original top-down SVG props. All shapes follow a two-unit drawing grid.
const palette = {
  frame: "#405775", edge: "#8ba2ba", floor: "#d9d4be", tile: "#c9c6b2",
  shadow: "#111722", steel: "#252b38", screen: "var(--ship-screen, #14334a)", teal: "var(--ship-light, #35c5c3)",
  cream: "#f2f5fa", amber: "var(--ship-warning, #f4bc66)", blue: "var(--ship-blue, #4b75b8)",
};

function Console({ x, y, width = 36, display = "telemetry" }: { x: number; y: number; width?: number; display?: "telemetry" | "navigation" | "signal" }) {
  return (
    <EquipmentHousing x={x} y={y} width={width} height={24}>
      <rect x="3" y="3" width={width - 6} height="13" fill={equipment.outline} />
      <rect x="4" y="4" width={width - 8} height="11" fill={equipment.glass} />
      <path d={`M5 5h${width - 10}`} stroke="#42616d" strokeWidth=".6" />
      <svg x="5" y="5" width={width - 10} height="9" viewBox="0 0 100 30" preserveAspectRatio="none">
        {display === "telemetry" && <>
          <path d="M2 24h96M2 14h96M24 2v24m24-24v24m24-24v24" stroke={palette.edge} strokeWidth=".6" opacity=".22" />
          <path d="M2 22h13l8-13 9 12h12l9-17 8 13h15l7-8 15 3" fill="none" stroke={palette.teal} strokeWidth="2" />
        </>}
        {display === "navigation" && <>
          <path d="M18 7h26v16h38M44 15h28V5" stroke={palette.teal} strokeWidth="1.8" fill="none" />
          <path d="M12 3h12v8H12zM38 11h12v8H38zM66 1h12v8H66zM76 19h12v8H76z" fill={palette.edge} />
          <path d="M41 13h6v4h-6z" fill={palette.teal} />
        </>}
        {display === "signal" && <>
          {[5, 20, 35, 50, 65, 80].map((bar, i) => <rect key={bar} x={bar} y={25 - (i % 4 + 1) * 5} width="8" height={(i % 4 + 1) * 5} fill={palette.teal} opacity={.5 + i * .08} />)}
          <path d="M2 28h96" stroke={palette.edge} strokeWidth="1" />
        </>}
      </svg>
      <path d="M5 18h15v3H5z" fill={equipment.inset} />
      {[6, 10, 14, 18].map(key => <path key={key} d={`M${key} 19h2`} stroke={equipment.keys} strokeWidth=".8" />)}
      <path d={`M${width - 12} 18v3`} stroke={equipment.outline} strokeWidth="1" />
      <rect className="console-status-light" style={{ animationDelay: `${(x + y) % 9 / 3}s` }} x={width - 7} y="18" width="3" height="2" fill={equipment.warm} />
      <path d={`M2 3v1m${width - 4} -1v1`} stroke={equipment.outline} strokeWidth=".6" />
    </EquipmentHousing>
  );
}

function Plant({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}>
    <path d="M3 15h13v7H3z" fill="#111722" opacity=".22" />
    <path d="M2 14h14v6H4v-2H2z" fill="#718795" stroke="#111722" strokeWidth=".7" />
    <path d="M3 13h12v3H3z" fill="#bfccd0" />
    <path d="M5 13h8v2H5z" fill="#263c32" />
    <path d="M8 3h3v12H8zM3 7h5v3H3zM11 5h5v3h-5zM5 1h4v5H5zM1 5h4v3H1zM12 0h4v4h-4z" fill="#477e68" />
    <path d="M6 1h2v4H6zM1 5h3v1H1zM12 0h3v1h-3zM12 5h3v1h-3zM8 8h2v5H8z" fill="#8eb88e" />
    <path d="M4 17h10" stroke="#a5b9c2" strokeWidth="1" />
  </g>;
}

function Hangar() {
  return <g>
    <rect x="48" y="58" width="62" height="76" fill="#7d9298" opacity=".12" />
    <path d="M46 56v80h66V56M140 56v80h58V56" fill="none" stroke="#a6a18e" strokeWidth="1" />
    <path d="M50 58h10m40 0h10M50 134h10m40 0h10" stroke={palette.edge} strokeWidth="2" />
    <path d="M42 144h164" stroke={palette.amber} strokeWidth="2" strokeDasharray="6 4" />
    <g transform="translate(50 60)">
      <path d="M24 0h10v12h8v34h12v26H38v10H20V72H4V46h12V12h8z" transform="translate(1 2)" fill="#111722" opacity=".18" />
      <path d="M24 0h10v12h8v34h12v26H38v10H20V72H4V46h12V12h8z" fill={palette.shadow} />
      <path d="M28 2h2v4h2v8h8v34h12v22H36v10H22V70H6V48h12V14h8V6h2z" fill="#dce3e8" />
      <path d="M26 4h6v12h-6zM20 18h18v22H20z" fill={palette.edge} />
      <path d="M24 18h10v18H24z" fill={palette.screen} />
      <path d="M26 20h6v2h-6zM25 24h2v10h-2z" fill="#a8dae3" />
      <path d="M35 18h3v22h-3zM38 48h4v20h-4z" fill="#8298a5" />
      <path d="M20 44h18M20 58h2m14 0h2M26 66h6" stroke="#718795" strokeWidth="1" />
      <path d="M18 42h22v4H18zM24 46h10v16H24z" fill="#b5c2ce" />
      <path d="M8 50h8v18H8zM42 50h8v18h-8z" fill={palette.blue} />
      <path d="M10 56h4m-4 4h4m30-4h4m-4 4h4" stroke="#a9c0cf" strokeWidth="1" />
      <path d="M10 52h4m30 0h4M20 48v18m18-18v18" stroke={palette.edge} strokeWidth="1" />
      <path d="M24 48h10v4H24z" fill={palette.steel} />
      <path d="M24 49h6" stroke={palette.teal} strokeWidth="1" />
      <path d="M22 72h6v10h-6zM32 72h6v10h-6z" fill={palette.steel} />
      <path d="M23 78h4m6 0h4" stroke={palette.amber} strokeWidth="2" />
      <path d="M20 38h18M8 64h8m26 0h8" stroke="#f2f5fa" strokeWidth="1" />
    </g>
    <Console x={146} y={68} width={42} display="navigation" /><Console x={146} y={104} width={42} display="signal" />
    <rect x="26" y="58" width="10" height="66" fill={palette.steel} />
    {[62, 74, 86, 98, 110].map((y) => <g key={y}><path d={`M28 ${y}h6v8h-6z`} fill={palette.frame} /><path d={`M29 ${y + 2}h4`} stroke={palette.amber} strokeWidth="1" /></g>)}
  </g>;
}

function Archive() {
  return <g>
    {[40, 96, 152].map((x, index) => <EquipmentHousing key={x} x={x} y={68} width={44} height={50}>
      <rect x="4" y="4" width="36" height="37" fill="#283e49" stroke="#111722" strokeWidth=".8" />
      <path d="M5 5h34v2H5z" fill="#527382" />
      <path d="M14 12h16v12h-3v4h-3v7h6v3H14v-3h6v-7h-3v-4h-3z" fill={index === 1 ? "#dfad62" : "#a3b6c0"} stroke="#172b38" strokeWidth=".6" />
      <path d="M11 14H8v8h6m16-8h6v8h-6" fill="none" stroke={index === 1 ? "#ffc875" : "#c0d0d7"} strokeWidth="2" />
      <path d="M16 13h12v2H16zM17 16h3v7h-3zM16 36h11" fill={index === 1 ? "#ffe1a1" : "#dfebec"} stroke={index === 1 ? "#ffe1a1" : "#dfebec"} strokeWidth=".7" />
      <path d="M7 8h3v29H7zM12 8h1v29h-1z" fill="#e8f4f5" opacity=".08" />
      <path d="M7 44h30" stroke="#405463" strokeWidth="2" />
      <path d="M14 44h16" stroke="#c0d0d7" strokeWidth=".8" />
    </EquipmentHousing>)}
    <EquipmentHousing x={46} y={132} width={146} height={10}>
      {[54, 80, 106, 132, 158, 184].map(x => <path key={x} d={`M${x - 46} 4h10`} stroke="#283b46" strokeWidth="2" />)}
    </EquipmentHousing>
    <Plant x={24} y={118} /><Plant x={202} y={118} />
  </g>;
}

function Engineering() {
  return <g>
    <Console x={38} y={62} width={68} /><Console x={134} y={62} width={68} display="signal" />
    <EquipmentHousing x={42} y={94} width={52} height={44}>
      {[7, 17, 27].map((y, i) => <g key={y}>
        <rect x="5" y={y} width="42" height="8" fill="#172733" stroke="#405463" strokeWidth=".6" />
        <path d={`M7 ${y + 2}v4`} stroke="#b4c5ce" strokeWidth="1" />
        <path d={`M12 ${y + 2}h17m-17 2h17m-17 2h17`} stroke="#627f8b" strokeWidth=".7" />
        <rect className="console-status-light" x="35" y={y + 3} width="2" height="2" fill="#65c8ff" style={{ animationDelay: `${i}s` }} />
        <rect x="41" y={y + 3} width="2" height="2" fill={i === 1 ? "#ffc875" : "#7d9a9a"} />
      </g>)}
      <path d="M9 39h32" stroke="#405463" strokeWidth="1" />
    </EquipmentHousing>
    <EquipmentHousing x={138} y={94} width={52} height={44}>
      <rect x="5" y="5" width="42" height="32" fill="#244c4b" stroke="#172733" strokeWidth="1" />
      <path d="M9 11h10v5m14-5h9v9h-7M9 31h9v-6m15 6h9v-6" stroke="#8db8af" strokeWidth="1" fill="none" />
      <path d="M9 17h6m22 7h6m-18 6v3" stroke="#65c8ff" strokeWidth=".7" />
      <path d="M21 10v4m5-4v4m5-4v4m-10 12v4m5-4v4m5-4v4M16 17h4m-4 5h4m12-5h4m-4 5h4" stroke="#ffc875" strokeWidth="1" />
      <rect x="20" y="14" width="12" height="12" fill="#a3b8c1" stroke="#111722" strokeWidth=".7" />
      <rect x="22" y="16" width="8" height="8" fill="#334952" />
      <path d="M23 17h6" stroke="#829ba5" strokeWidth=".6" />
      {[8, 42].flatMap(x => [8, 34].map(y => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#bdcfcf" />))}
    </EquipmentHousing>
    <EquipmentHousing x={114} y={106} width={12} height={24}>
      <rect x="3" y="4" width="6" height="14" fill="#142e38" />
      <path d="M4 7h4m-4 4h4m-4 4h4" stroke="#65c8ff" strokeWidth="1.4" />
      <path d="M4 20h4" stroke="#ffc875" strokeWidth="1" />
    </EquipmentHousing>
  </g>;
}

function CommandDeck() {
  return <g>
    <Console x={36} y={60} width={44} /><Console x={98} y={52} width={44} display="navigation" /><Console x={160} y={60} width={44} display="signal" />
    <g className="navigation-table">
      <path d="M100 98h36v4h8v8h4v16h-4v8h-8v4h-36v-4h-8v-8h-4v-16h4v-8h8z" fill="#111722" opacity=".25" />
      <path d="M100 96h36v4h8v8h4v16h-4v8h-8v4h-36v-4h-8v-8h-4v-16h4v-8h8z" fill="#718795" stroke="#111722" strokeWidth="1" />
      <path d="M101 98h34v4h8v7h3" fill="none" stroke="#c0d0d7" strokeWidth="1.3" />
      <path d="M90 122h4v8h8v4h32v-4h8v-8h4" fill="none" stroke="#405463" strokeWidth="2" />
      <path d="M102 102h32v4h6v20h-6v4h-32v-4h-6v-20h6z" fill="#111824" />
      <path d="M104 104h28v4h6v16h-6v4h-28v-4h-6v-16h6z" fill="#183c48" />
      <path d="M102 110h32m-32 6h32m-32 6h32M108 106v20m10-20v20m10-20v20" stroke="#a6c6ce" strokeWidth=".5" opacity=".18" />
      <ellipse cx="118" cy="116" rx="17" ry="9" fill="none" stroke="#8eafb9" strokeWidth=".6" opacity=".65" />
      <circle cx="118" cy="116" r="7" fill="#3f6b73" stroke="#a5ccd1" strokeWidth=".6" />
      <path d="M115 110h4v3h-2v3h-4v-3h2zM120 117h3v3h-2v2h-2v-3h1z" fill="#8fbcb0" />
      <path d="M104 122l27-13" fill="none" stroke="#65c8ff" strokeWidth=".6" />
      <rect x="129" y="108" width="2" height="2" fill="#ffc875" />
      <path d="M105 120h2v2h-2zM108 108h1v1h-1zM132 122h1v1h-1z" fill="#d3eaeb" />
      <path d="M104 132h28" stroke="#405463" strokeWidth="1.5" />
      <path className="console-status-light" d="M115 132h6" stroke="#65c8ff" strokeWidth="1" />
    </g>
    {[56, 168].map(x => <g key={x}>
      <path d={`M${x + 3} 106h12v19H${x + 3}z`} fill="#111722" opacity=".22" />
      <path d={`M${x + 2} 104h12v2h2v16h-2v2h-12v-2h-2v-16h2z`} fill="#718795" stroke="#111722" strokeWidth=".8" />
      <rect x={x + 3} y="106" width="10" height="4" fill="#a8bdc7" />
      <rect x={x + 3} y="112" width="10" height="8" fill="#4c7487" />
      <path d={`M${x + 4} 113h8M${x + 1} 112v7m14-7v7`} stroke="#b4c5ce" strokeWidth=".7" />
    </g>)}
    <Plant x={26} y={124} /><Plant x={194} y={124} />
  </g>;
}

function MissionLog() {
  return <g>
    <EquipmentHousing x={38} y={62} width={160} height={68}>
      <rect x="5" y="5" width="150" height="49" fill="#111824" />
      <rect x="7" y="7" width="146" height="45" fill="#18343e" />
      <path d="M12 12h136M12 46h136" stroke="#42616d" strokeWidth=".7" />
      <path d="M24 30h112" stroke="#65c8ff" strokeWidth="1.3" />
      {[22, 58, 94, 130].map((x, i) => <g key={x}>
        <path d={`M${x - 7} 20h5v-2h5v2h5v20h-15z`} fill={i === 3 ? "#b4c5ce" : "#718f9c"} stroke="#111824" strokeWidth=".8" />
        <path d={`M${x - 5} 24h10m-10 4h10m-10 4h6`} stroke="#d1e1e4" strokeWidth=".7" />
        <rect x={x - 1} y="36" width="3" height="2" fill="#65c8ff" />
      </g>)}
      <path d="M12 60h30m8 0h30m8 0h30" stroke="#405463" strokeWidth="2" />
      <path d="M14 59h2m4 0h2m4 0h2m4 0h2m20 0h2m4 0h2m4 0h2" stroke="#c0d0d7" strokeWidth="1" />
      <rect className="console-status-light" x="140" y="59" width="4" height="2" fill="#ffc875" />
    </EquipmentHousing>
    <EquipmentHousing x={86} y={140} width={64} height={8}>
      <path d="M5 3h54" stroke="#405463" strokeWidth="2" />
      <path d="M22 2h20" stroke="#b4c5ce" strokeWidth="1" />
    </EquipmentHousing>
  </g>;
}

function Communications() {
  return <g>
    <g transform="translate(42 60)">
      <path d="M18 2h24v4h10v8h6v34h-6v8H42v6H18v-6H8v-8H2V14h6V6h10z" fill="#111722" opacity=".25" />
      <path d="M18 0h24v4h10v8h6v36h-6v8H42v4H18v-4H8v-8H2V12h6V4h10z" fill="#718795" stroke="#111722" strokeWidth="1" />
      <path d="M18 2h23M4 14v32M10 6h7" stroke="#c0d0d7" strokeWidth="1.3" />
      <path d="M10 54h8v4h24v-4h8" fill="none" stroke="#405463" strokeWidth="2" />
      <circle cx="30" cy="30" r="24" fill="#253d48" stroke="#b4c5ce" strokeWidth=".7" />
      <circle cx="30" cy="30" r="21" fill="#123736" stroke="#111824" strokeWidth="1" />
      <g fill="none" stroke="#77b1aa" strokeWidth=".6">
        <circle cx="30" cy="30" r="17" opacity=".65" /><circle cx="30" cy="30" r="11" opacity=".55" /><circle cx="30" cy="30" r="5" opacity=".45" />
        <path d="M10 30h40M30 10v40" opacity=".4" />
      </g>
      <g className="radar-sweep">
        <circle cx="30" cy="30" r="20" fill="none" opacity="0" />
        <path d="M30 30V10l14 6z" fill="#65c8ff" opacity=".16" />
        <path d="M30 30l14-14" stroke="#b2e4da" strokeWidth=".8" />
      </g>
      {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => <path key={angle} d="M30 7v2" transform={`rotate(${angle} 30 30)`} stroke="#d0dfe1" strokeWidth=".7" />)}
      <path className="console-status-light" d="M18 23h2v2h-2zM38 18h2v2h-2zM34 39h2v2h-2z" fill="#b1e8d5" />
      <rect x="29" y="29" width="2" height="2" fill="#ffc875" />
      <EquipmentHousing x={14} y={62} width={32} height={12}>
        <rect x="4" y="3" width="24" height="5" fill="#142e38" />
        <path d="M6 5h5m3 0h4m4 0h4" stroke="#65c8ff" strokeWidth="1" />
      </EquipmentHousing>
    </g>
    <Console x={130} y={72} width={70} display="signal" />
    <EquipmentHousing x={136} y={110} width={56} height={24}>
      <path d="M5 4h46m-46 2h46" stroke="#405463" strokeWidth=".7" />
      {[12, 28, 44].map((x, i) => <g key={x}>
        <circle cx={x} cy="15" r="5" fill="#293d48" stroke="#c0d0d7" strokeWidth=".7" />
        <path d={`M${x} 15v-4`} transform={`rotate(${i * 45 - 45} ${x} 15)`} stroke="#ffc875" strokeWidth="1" />
      </g>)}
    </EquipmentHousing>
    <Plant x={204} y={126} />
  </g>;
}

function FootballArenaArtwork({ goals = 0, saves = 0 }: { goals?: number | string; saves?: number | string }) {
  return <g>
    <rect x="48" y="48" width="144" height="94" fill="#111722" />
    <rect x="50" y="50" width="140" height="90" fill="#12372b" />
    {[0, 1, 2, 3].map((i) => <rect key={i} x={52 + i * 34} y="52" width="17" height="86" fill="#184333" />)}
    <rect x="54" y="52" width="132" height="84" fill="none" stroke="#edf5ea" strokeWidth="1.2" />
    <path d="M80 52v34h76V52M100 52v12h36V52M95 86a25 25 0 0 0 46 0" fill="none" stroke="#edf5ea" strokeWidth="1.2" />
    <circle cx="118" cy="80" r="1" fill="#edf5ea" />
    <rect x="88" y="34" width="64" height="16" fill="#122430" stroke="#edf5fa" strokeWidth="1.5" />
    <path d="M86 51h68" stroke="#f2f5fa" strokeWidth="1.5" />
    <g className="orbital-scoreboard" role="img" aria-label={`Stadium scoreboard: ${goals} goals, ${saves} saves`}>
      <rect x="78" y="20" width="84" height="11" fill="#111824" stroke="#708aa2" strokeWidth="1" />
      <path d="M81 22h78v7H81z" fill="#172536" />
      <text x="85" y="27.5" fill="#65c8ff" fontSize="4.5" fontFamily="var(--font-pixel), monospace">{String(goals) === "1" ? "GOAL" : "GOALS"}</text>
      <text x="106" y="28" fill="#f2f5fa" fontSize="6" fontFamily="var(--font-pixel), monospace">{goals}</text>
      <text x="124" y="27.5" fill="#ffc875" fontSize="4.5" fontFamily="var(--font-pixel), monospace">{String(saves) === "1" ? "SAVE" : "SAVES"}</text>
      <text x="147" y="28" fill="#f2f5fa" fontSize="6" fontFamily="var(--font-pixel), monospace">{saves}</text>
      <path d="M82 30h76" stroke="#405775" strokeWidth=".5" />
    </g>
    <path d="M42 30h30m96 0h30" stroke="#65c8ff" strokeWidth="2" />
    <path d="M40 144h22m112 0h22" stroke="#ffc875" strokeWidth="2" />
    {[34, 202].map((x) => <g key={x}><path d={`M${x} 58h4v76h-4z`} fill="#111824" /><path d={`M${x + 1} 62h2m-2 18h2m-2 18h2m-2 18h2`} stroke="#4b657b" strokeWidth="1" /></g>)}
    <path d="M62 151h112" stroke="#42536a" strokeWidth="1" />
  </g>;
}

const roomProps = {
  projects: Hangar, achievements: Archive, stack: Engineering,
  about: CommandDeck, experience: MissionLog, contact: Communications, football: FootballArenaArtwork,
};

// Panels reuse the room's original equipment drawing as their illustration.
// These props have no SVG IDs, so previews cannot collide with map floor masks.
export function RoomEquipmentIcon({ id }: { id: Exclude<SectionId, "football"> }) {
  const Props = roomProps[id];
  return <svg viewBox="20 44 200 112" aria-hidden="true" focusable="false" shapeRendering="crispEdges"><Props /></svg>;
}

export function RoomArtwork({ id, goals = 0, saves = 0 }: { id: SectionId; goals?: number | string; saves?: number | string }) {
  const Props = roomProps[id];
  const training = id === "football";
  const openings = roomOpenings(id);
  const room = rooms[id];
  const nativeScale = room.width / MAP_SCALE / 240;
  const openingMask = `url(#hull-openings-${id})`;
  // Extend entrances beyond the SVG bounds before unioning them, then clip the
  // floor at the bounds. The shadow's end cap stays outside the visible join.
  const extended = openings.map(o => ({
    ...o,
    x: o.x < 1 ? -24 : o.x,
    y: o.y < 1 ? -24 : o.y,
    width: o.width + (o.x < 1 || o.x + o.width > 239 ? 24 : 0),
    height: o.height + (o.y < 1 || o.y > 140 ? 24 : 0),
  }));
  const deckShape = roundedOutline(deckOutline(ROOM_FLOOR_OUTLINE, extended), 1);
  return (
    <svg className="room-artwork" data-room={id} viewBox="0 0 240 176" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
      <defs>
        <DeckPattern id={`floor-${id}`} scale={nativeScale} originX={room.x / MAP_SCALE} originY={room.y / MAP_SCALE} dark={training} />
        <clipPath id={`deck-clip-${id}`}><path shapeRendering="geometricPrecision" d={deckShape} /></clipPath>
        <clipPath id={`room-bounds-${id}`}><rect width="240" height="176" /></clipPath>
        <mask id={`hull-openings-${id}`} maskUnits="userSpaceOnUse" x="-24" y="-24" width="288" height="224">
          <rect x="-24" y="-24" width="288" height="224" fill="white" />
          {openings.map((opening, index) => <rect key={index}
            x={opening.x - (opening.x < 1 ? 16 : 0)}
            y={opening.y - (opening.y < 1 ? 16 : 0)}
            width={opening.width + (opening.x < 1 || opening.x + opening.width > 239 ? 16 : 0)}
            height={opening.height + (opening.y < 1 ? 16 : opening.y > 140 ? 24 : 0)} fill="black" />)}
        </mask>
      </defs>
      <g mask={openingMask}>
        <path className="hull-underlayer" shapeRendering="geometricPrecision" d={hullShape} transform="translate(2 6)" fill="#0c1728" stroke="#050b13" strokeWidth="4" />
        <path shapeRendering="geometricPrecision" d={hullShape} transform="translate(0 2)" fill="#182a42" stroke="#61738b" strokeWidth="2" />
        <path className="room-hull" shapeRendering="geometricPrecision" d={hullShape} fill="#252b38" stroke={palette.edge} strokeWidth="2" />
        <path d="M32 10h176v8h12v14h10v108h-10v14h-12v12H32v-12H20v-14H10V32h10V18h12z" fill={palette.frame} />
        <g className="exterior-plating">
          <path d="M30 4h180v4H30zM26 10h188v2H26zM8 34h6v108H8zM226 34h6v108h-6zM30 164h180v4H30z" fill="#30445f" />
          <path d="M34 4h172M16 34v106m208-106v106M34 170h172" fill="none" stroke="#9ab2c8" strokeWidth="1" opacity=".7" />
          {[44, 100, 156].map((x) => <g key={x}><path d={`M${x} 12h32v4h-32zM${x} 160h32v2h-32z`} fill="#617d9c" /><path d={`M${x + 4} 13h24`} stroke="#b6c9d7" strokeWidth="1" opacity=".55" /></g>)}
          {[48, 90, 132].map((y) => <g key={y}><path d={`M14 ${y}h5v18h-5zM221 ${y}h5v18h-5z`} fill="#334b68" /><path d={`M15 ${y + 2}v10m210-10v10`} stroke="#7597b5" strokeWidth="1" /></g>)}
        </g>
      </g>
      <g clipPath={`url(#room-bounds-${id})`}>
        <path shapeRendering="geometricPrecision" d={deckShape} fill={`url(#floor-${id})`} />
        <g clipPath={`url(#deck-clip-${id})`}>
          <path shapeRendering="geometricPrecision" d={deckShape} fill="none" stroke="#112538" strokeWidth="6" opacity=".1" />
          <path shapeRendering="geometricPrecision" d={deckShape} fill="none" stroke="#112538" strokeWidth="2" opacity=".15" />
        </g>
      </g>
      <g mask={openingMask}>
        <path d="M28 0h184v2H30v8H18v12H10v12H2V32h6V20h8V8h12z" fill="#d3deeb" opacity=".4" />
        <path d="M16 156h12v10h184v-10h12v-12h8V32h8v112h-8v12h-8v12h-12v8H28v-8H16z" fill="#101e32" opacity=".4" />
        <path d="M40 10h32m32 0h32m32 0h32M40 166h32m32 0h32m32 0h32" stroke={palette.edge} strokeWidth="4" />
        <path d="M4 64v16m0 16v16m232-48v16m0 16v16" stroke={palette.teal} strokeWidth="4" />
        <g className="hull-panels">
          {[44, 86, 128].map((y) => <g key={y}>
            <rect x="12" y={y} width="10" height="18" fill="#182b43" />
            <path d={`M12 ${y}h10v2H14v12h-2z`} fill="#768aa1" />
            <path d={`M16 ${y + 6}h4m-4 4h4`} stroke="#415d74" strokeWidth="2" />
            <rect x="218" y={y} width="10" height="18" fill="#182b43" />
            <path d={`M218 ${y}h10v2h-8v12h-2z`} fill="#768aa1" />
            <path d={`M222 ${y + 6}h4m-4 4h4`} stroke="#415d74" strokeWidth="2" />
          </g>)}
          {[48, 88, 152, 192].map((x) => <g key={x}><rect x={x} y="14" width="2" height="2" fill="#b8c9d4" /><rect x={x} y="160" width="2" height="2" fill="#111f33" /></g>)}
        </g>
        <g className="room-light-spill">
          <path d="M24 64h10v16H24zM24 96h10v16H24zM206 64h10v16h-10zM206 96h10v16h-10z" fill={palette.teal} opacity=".12" />
          <path d="M34 64h6v16h-6zM34 96h6v16h-6zM200 64h6v16h-6zM200 96h6v16h-6z" fill={palette.teal} opacity=".05" />
          {id === "about" && <><path d="M36 84h44v8H36zM98 76h44v8H98zM160 84h44v8h-44z" fill={palette.teal} opacity=".1" /></>}
        </g>
      </g>
      <g className="room-props">{id === "football" ? <FootballArenaArtwork goals={goals} saves={saves} /> : <Props />}</g>
    </svg>
  );
}

// Foreground wall lips occlude the astronaut naturally at the deck perimeter.
export function RoomBulkheads() {
  return <g className="foreground-bulkheads">
    <path d="M38 156h164v10H38z" fill="#182b43" />
    <path d="M38 156h164v2H38z" fill="#8096ae" />
    <path d="M40 162h32m32 0h32m32 0h32" stroke="#425c78" strokeWidth="2" />
  </g>;
}
