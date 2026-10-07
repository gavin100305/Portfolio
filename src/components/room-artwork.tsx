import type { SectionId } from "@/data/sections";
import { ROOM_FLOOR_OUTLINE } from "@/data/station-world";

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
const floorShape = roundedOutline(ROOM_FLOOR_OUTLINE.map(({ x, y }) => [x, y]), 1.5);

// Original top-down SVG props. All shapes follow a two-unit drawing grid.
const palette = {
  frame: "#405775", edge: "#8ba2ba", floor: "#d9d4be", tile: "#c9c6b2",
  shadow: "#111722", steel: "#252b38", screen: "var(--ship-screen, #14334a)", teal: "var(--ship-light, #35c5c3)",
  cream: "#f2f5fa", amber: "var(--ship-warning, #f4bc66)", blue: "var(--ship-blue, #4b75b8)",
};

function Console({ x, y, width = 36 }: { x: number; y: number; width?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="2" y="4" width={width} height="24" fill={palette.shadow} />
      <rect width={width} height="24" fill={palette.steel} />
      <path d={`M0 0h${width}v2H2v18H0z`} fill="var(--ship-secondary, #264C70)" />
      <path d={`M2 22h${width - 2}v2H2z`} fill="#142338" />
      <rect x="4" y="4" width={width - 8} height="10" fill={palette.screen} />
      <rect x="4" y="14" width={width - 8} height="2" fill={palette.teal} opacity=".14" />
      <path d={`M8 8h${width - 18}M8 12h10`} stroke={palette.teal} strokeWidth="2" />
      <rect x="6" y="18" width="12" height="2" fill={palette.edge} />
      <rect className="console-status-light" style={{ animationDelay: `${(x + y) % 900}ms` }} x={width - 10} y="18" width="4" height="2" fill={palette.amber} />
    </g>
  );
}

function Plant({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="2" y="12" width="14" height="10" fill={palette.shadow} />
      <rect x="4" y="10" width="10" height="10" fill={palette.steel} />
      <path d="M6 4h6v14H6zM0 8h6v6H0zM12 0h6v10h-6z" fill="#538b75" />
      <rect x="4" y="18" width="10" height="2" fill="#162c3b" />
      <rect x="8" y="2" width="4" height="8" fill="#82b48e" />
    </g>
  );
}

function Hangar() {
  return (
    <g>
      <path d="M46 56v80h66V56M140 56v80h58V56" fill="none" stroke="#a6a18e" strokeWidth="2" />
      <path d="M42 140h164" stroke={palette.amber} strokeWidth="4" strokeDasharray="10 6" />
      <g transform="translate(50 60)">
        <rect x="8" y="14" width="40" height="64" fill={palette.shadow} />
        <path d="M24 0h10v12h8v34h12v26H38v10H20V72H4V46h12V12h8z" fill={palette.cream} />
        <path d="M24 14h10v22H24zM6 50h10v20H6zM42 50h10v20H42z" fill={palette.blue} />
        <rect x="22" y="62" width="14" height="8" fill={palette.steel} />
        <path d="M22 82v8h6v-8m4 0v8h6v-8" fill={palette.teal} />
      </g>
      <Console x={146} y={68} width={42} />
      <Console x={146} y={104} width={42} />
      <rect x="26" y="58" width="10" height="66" fill={palette.steel} />
      <path d="M28 64h6m-6 10h6m-6 10h6m-6 10h6" stroke={palette.amber} strokeWidth="2" />
    </g>
  );
}

function Archive() {
  return (
    <g>
      {[40, 96, 152].map((x, index) => (
        <g key={x} transform={`translate(${x} 68)`}>
          <rect x="2" y="4" width="44" height="52" fill={palette.shadow} />
          <rect width="44" height="50" fill={palette.steel} />
          <rect x="4" y="4" width="36" height="40" fill="#364a61" />
          <path d="M14 12h16v16h-4v8H18v-8h-4zM8 14h6v12H8zM30 14h6v12h-6zM14 38h16v4H14z" fill={index === 1 ? palette.amber : palette.edge} />
          <rect x="16" y="16" width="4" height="12" fill={palette.cream} opacity=".65" />
        </g>
      ))}
      <path d="M46 132h146v10H46z" fill={palette.steel} />
      <path d="M52 134h22m6 0h22m6 0h22m6 0h22m6 0h22" stroke={palette.edge} strokeWidth="4" />
      <Plant x={24} y={118} /><Plant x={202} y={118} />
    </g>
  );
}

function Engineering() {
  return (
    <g>
      <Console x={38} y={62} width={68} /><Console x={134} y={62} width={68} />
      <path d="M46 98h52v44H46zM142 98h52v44h-52z" fill={palette.shadow} />
      <path d="M42 94h52v44H42zM138 94h52v44h-52z" fill={palette.steel} />
      <path d="M48 100h40v24H48zM144 100h40v24h-40z" fill={palette.frame} />
      <path d="M58 100v24m10-24v24m10-24v24M150 108h28m-28 8h28" stroke={palette.teal} strokeWidth="2" />
      <path d="M52 130h12m8 0h12m68 0h12m8 0h10" stroke={palette.amber} strokeWidth="2" />
      <rect x="114" y="106" width="12" height="24" fill={palette.edge} />
      <rect x="116" y="110" width="8" height="12" fill={palette.blue} />
    </g>
  );
}

function CommandDeck() {
  return (
    <g>
      <Console x={36} y={60} width={44} /><Console x={98} y={52} width={44} /><Console x={160} y={60} width={44} />
      <path d="M98 98h44v8h12v30h-12v8H98v-8H86v-30h12z" fill={palette.shadow} />
      <path d="M96 94h44v8h12v28h-12v8H96v-8H84v-28h12z" fill={palette.steel} />
      <path d="M104 92h26v6h10v10h6v16h-6v10h-10v6h-26v-6H94v-10h-6v-16h6V98h10z" fill={palette.teal} />
      <path d="M104 92h26v6h10v10h-4V102h-10v-6h-22z" fill="#97eee0" opacity=".7" />
      <path d="M94 124v10h10v6h26v-6h10v-10h-4v6h-10v6h-22v-6H98v-6z" fill="#178896" />
      <path d="M104 102h14v8h-6v6h-10v-8h2zM122 114h12v6h-6v12h-6z" fill="#a9eee1" />
      <path d="M94 116h46M116 98v36" stroke={palette.cream} strokeWidth="2" opacity=".5" />
      <path d="M56 104h16v20H56zM168 104h16v20h-16z" fill={palette.blue} />
      <Plant x={26} y={124} /><Plant x={194} y={124} />
    </g>
  );
}

function MissionLog() {
  return (
    <g>
      <rect x="42" y="66" width="160" height="70" fill={palette.shadow} />
      <rect x="38" y="62" width="160" height="68" fill={palette.steel} />
      <path d="M38 62h160v2H40v64h-2z" fill="var(--ship-secondary, #264C70)" />
      <path d="M38 128h160v2H38z" fill="#142338" />
      <rect x="46" y="70" width="144" height="48" fill={palette.screen} />
      <path d="M58 94h116" stroke={palette.blue} strokeWidth="2" />
      {[62, 98, 134, 170].map((x) => (
        <g key={x}>
          <rect x={x - 4} y="90" width="8" height="8" fill={palette.teal} />
          <path d={`M${x - 8} 80h16M${x - 8} 106h16`} stroke={palette.edge} strokeWidth="2" />
        </g>
      ))}
      <path d="M46 122h26m8 0h20m66 0h22" stroke={palette.edge} strokeWidth="2" />
      <path d="M86 140h64v8H86z" fill={palette.blue} />
    </g>
  );
}

function Communications() {
  return (
    <g>
      <g transform="translate(42 60)">
        <path d="M18 0h24v6h10v10h6v24h-6v10H42v6H18v-6H8V40H2V16h6V6h10z" fill={palette.steel} />
        <path d="M20 6h20v6h10v10h6v12h-6v10H40v6H20v-6H10V34H4V22h6V12h10z" fill={palette.edge} />
        <path d="M18 18h24v24H18z" fill={palette.frame} />
        <path d="M28 0v54M2 28h54" stroke={palette.cream} strokeWidth="2" />
        <rect x="26" y="24" width="8" height="8" fill={palette.teal} />
        <path d="M24 56h12v10h12v8H12v-8h12z" fill={palette.steel} />
      </g>
      <Console x={130} y={72} width={70} />
      <path d="M136 110h56v24h-56z" fill={palette.steel} />
      <path d="M142 114h44v12h-44z" fill={palette.frame} />
      <path d="M146 118h14m6 0h14" stroke={palette.teal} strokeWidth="2" />
      <Plant x={204} y={126} />
    </g>
  );
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

export function RoomArtwork({ id, goals = 0, saves = 0 }: { id: SectionId; goals?: number | string; saves?: number | string }) {
  const Props = roomProps[id];
  const training = id === "football";
  return (
    <svg className="room-artwork" data-room={id} viewBox="0 0 240 176" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
      <defs>
        <pattern id={`floor-${id}`} width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill={training ? "#263242" : palette.floor} />
          <rect x="1" y="1" width="18" height="1" fill={training ? "#597082" : "#eee8d2"} opacity={training ? .15 : .55} />
          <rect x="18" y="2" width="1" height="17" fill={training ? "#3b5063" : "#929888"} opacity=".15" />
          <rect x="3" y="3" width="1" height="1" fill={training ? "#3b5063" : "#acae9e"} />
          <rect x="16" y="16" width="1" height="1" fill={training ? "#3b5063" : "#eee8d2"} />
          <path d="M0 20V0h20" fill="none" stroke={training ? "#202b3b" : palette.tile} strokeWidth="1" />
        </pattern>
        <clipPath id={`deck-clip-${id}`}><path shapeRendering="geometricPrecision" d={floorShape} /></clipPath>
      </defs>
      <path className="hull-underlayer" shapeRendering="geometricPrecision" d={hullShape} transform="translate(2 6)" fill="#0c1728" stroke="#050b13" strokeWidth="4" />
      <path shapeRendering="geometricPrecision" d={hullShape} transform="translate(0 2)" fill="#182a42" stroke="#61738b" strokeWidth="2" />
      <path className="room-hull" shapeRendering="geometricPrecision" d={hullShape} fill="#252b38" stroke={palette.edge} strokeWidth="2" />
      <path d="M32 10h176v8h12v14h10v108h-10v14h-12v12H32v-12H20v-14H10V32h10V18h12z" fill={palette.frame} />
      <path shapeRendering="geometricPrecision" d={floorShape} fill={`url(#floor-${id})`} />
      <g clipPath={`url(#deck-clip-${id})`}>
        <path shapeRendering="geometricPrecision" d={floorShape} fill="none" stroke="#112538" strokeWidth="16" opacity=".1" />
        <path shapeRendering="geometricPrecision" d={floorShape} fill="none" stroke="#112538" strokeWidth="8" opacity=".16" />
        <path d="M38 20h164v6H44v10H30v104h-6V30h14z" fill="#172b3d" opacity=".3" />
        <path d="M46 28h148v4H46zM32 40h4v94h-4z" fill="#1b3448" opacity=".1" />
        <path d="M50 40h140v96H50z" fill="#fff4d4" opacity=".045" />
        <path d="M42 146h156v4H42z" fill="#6e7e7e" opacity=".25" />
        <path d="M42 150h156v2H42z" fill={training ? "#42536a" : "#f7f2e7"} opacity=".5" />
      </g>
      <path d="M38 152h164v4H38zM212 30h4v110h-4z" fill={training ? "#42536a" : "#fff4d4"} opacity=".5" />
      <path d="M28 0h184v2H30v8H18v12H10v12H2V32h6V20h8V8h12z" fill="#d3deeb" opacity=".4" />
      <path d="M16 156h12v10h184v-10h12v-12h8V32h8v112h-8v12h-8v12h-12v8H28v-8H16z" fill="#101e32" opacity=".4" />
      <path d="M40 28h160M32 48v84m176-84v84M42 150h156" fill="none" stroke="#aaa58f" strokeWidth="1" opacity=".55" />
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
        {id === "about" && <><path d="M100 84h34v6h16v16h8v26h-8v16h-16v6h-34v-6H84v-16h-8v-26h8V90h16z" fill={palette.teal} opacity=".08" /><path d="M36 84h44v8H36zM98 76h44v8H98zM160 84h44v8h-44z" fill={palette.teal} opacity=".1" /></>}
      </g>
      <g className="room-props">{id === "football" ? <FootballArenaArtwork goals={goals} saves={saves} /> : <Props />}</g>
      <rect x="108" y="156" width="24" height="20" fill={palette.frame} />
      <path d="M110 158h20m-20 6h20m-20 6h20" stroke={palette.edge} strokeWidth="2" />
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
