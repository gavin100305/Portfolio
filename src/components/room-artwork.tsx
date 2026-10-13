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
  return <g>
    <path d="M46 56v80h66V56M140 56v80h58V56" fill="none" stroke="#a6a18e" strokeWidth="1" />
    <path d="M50 58h10m40 0h10M50 134h10m40 0h10" stroke={palette.edge} strokeWidth="2" />
    <path d="M42 144h164" stroke={palette.amber} strokeWidth="2" strokeDasharray="6 4" />
    <g transform="translate(50 60)">
      <path d="M24 0h10v12h8v34h12v26H38v10H20V72H4V46h12V12h8z" fill={palette.shadow} />
      <path d="M28 2h2v4h2v8h8v34h12v22H36v10H22V70H6V48h12V14h8V6h2z" fill="#dce3e8" />
      <path d="M26 4h6v12h-6zM20 18h18v22H20z" fill={palette.edge} />
      <path d="M24 18h10v18H24z" fill={palette.screen} />
      <path d="M26 20h6v2h-6z" fill={palette.teal} />
      <path d="M18 42h22v4H18zM24 46h10v16H24z" fill="#b5c2ce" />
      <path d="M8 50h8v18H8zM42 50h8v18h-8z" fill={palette.blue} />
      <path d="M10 52h4m30 0h4M20 48v18m18-18v18" stroke={palette.edge} strokeWidth="1" />
      <path d="M24 48h10v4H24z" fill={palette.steel} />
      <path d="M24 49h6" stroke={palette.teal} strokeWidth="1" />
      <path d="M22 72h6v10h-6zM32 72h6v10h-6z" fill={palette.steel} />
      <path d="M23 78h4m6 0h4" stroke={palette.amber} strokeWidth="2" />
      <path d="M20 38h18M8 64h8m26 0h8" stroke="#f2f5fa" strokeWidth="1" />
    </g>
    <Console x={146} y={68} width={42} /><Console x={146} y={104} width={42} />
    <rect x="26" y="58" width="10" height="66" fill={palette.steel} />
    {[62, 74, 86, 98, 110].map((y) => <g key={y}><path d={`M28 ${y}h6v8h-6z`} fill={palette.frame} /><path d={`M29 ${y + 2}h4`} stroke={palette.amber} strokeWidth="1" /></g>)}
  </g>;
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
  return <g>
    <Console x={38} y={62} width={68} /><Console x={134} y={62} width={68} />
    <g transform="translate(42 94)">
      <rect width="52" height="44" fill={palette.steel} />
      <path d="M2 2h48v2H4v36H2z" fill={palette.edge} />
      {[8, 18, 28].map((y) => <g key={y}>
        <rect x="6" y={y} width="40" height="8" fill={palette.shadow} />
        <path d={`M10 ${y + 3}h18m-18 3h18`} stroke={palette.frame} strokeWidth="1" />
        <path d={`M34 ${y + 3}h2m4 0h2`} stroke={palette.teal} strokeWidth="2" />
      </g>)}
      <path d="M8 40h12m12 0h12" stroke={palette.amber} strokeWidth="1" />
    </g>
    <g transform="translate(138 94)">
      <rect width="52" height="44" fill={palette.steel} />
      <path d="M2 2h48v2H4v36H2z" fill={palette.edge} />
      <rect x="6" y="6" width="40" height="30" fill={palette.screen} />
      <path d="M12 12h8v6m12-6h8v8h-6M12 30h8v-6m12 6h8v-4" stroke={palette.teal} strokeWidth="1" fill="none" />
      <path d="M22 14h10v12H22z" fill={palette.edge} />
      <path d="M24 16h6v8h-6z" fill={palette.steel} />
      <path d="M24 12v2m4-2v2m-4 12v2m4-2v2M20 18h2m-2 4h2m10-4h2m-2 4h2" stroke={palette.amber} strokeWidth="1" />
      <path d="M8 40h12m12 0h12" stroke={palette.edge} strokeWidth="1" />
    </g>
    <rect x="114" y="106" width="12" height="24" fill={palette.steel} />
    <path d="M116 108h8v18h-8z" fill={palette.edge} />
    <path d="M118 110h4v10h-4z" fill={palette.screen} />
    <path d="M118 112h4m-4 4h4" stroke={palette.teal} strokeWidth="1" />
    <path d="M118 124h4" stroke={palette.amber} strokeWidth="1" />
  </g>;
}

function CommandDeck() {
  return <g>
    <Console x={36} y={60} width={44} /><Console x={98} y={52} width={44} /><Console x={160} y={60} width={44} />
    <path d="M96 94h44v8h12v28h-12v8H96v-8H84v-28h12z" fill={palette.shadow} />
    <path d="M98 96h40v8h12v24h-12v8H98v-8H86v-24h12z" fill={palette.edge} />
    <path d="M100 98h36v8h12v20h-12v8h-36v-8H88v-20h12z" fill={palette.steel} />
    <path d="M102 100h32v8h12v16h-12v8h-32v-8H90v-16h12z" fill={palette.screen} />
    <path d="M102 108h32M96 116h44M102 124h32M110 102v28m8-28v28m8-28v28" stroke={palette.edge} strokeWidth=".5" opacity=".22" />
    <path d="M104 104h28v24h-28z" stroke={palette.teal} strokeWidth="1" fill="none" opacity=".5" />
    <path d="M108 108h20v16h-20zM108 116h20M118 108v16" fill="none" stroke={palette.edge} strokeWidth="1" />
    <path d="M114 112h8v8h-8zM106 106h4v4h-4zM126 106h4v4h-4zM106 122h4v4h-4zM126 122h4v4h-4z" fill={palette.cream} />
    <path d="M116 114h4v4h-4z" fill={palette.teal} />
    <path d="M96 112h4m36 8h4" stroke={palette.amber} strokeWidth="2" />
    <path d="M104 94h28M104 138h28" stroke={palette.teal} strokeWidth="1" />
    {[56, 168].map((x) => <g key={x}><rect x={x} y="104" width="16" height="20" fill={palette.steel} /><path d={`M${x + 2} 106h12v12h-12z`} fill={palette.blue} /><path d={`M${x + 3} 108h10M${x + 4} 122h8`} stroke={palette.edge} strokeWidth="1" /></g>)}
    <Plant x={26} y={124} /><Plant x={194} y={124} />
  </g>;
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
  return <g>
    <g transform="translate(42 60)">
      <path d="M14 0h32v6h10v10h4v28h-4v10H46v6H14v-6H4V44H0V16h4V6h10z" fill={palette.steel} />
      <path d="M16 4h28v6h10v10h2v20h-2v10H44v6H16v-6H6V40H4V20h2V10h10z" fill={palette.edge} />
      <path d="M18 6h24v6h10v10h2v16h-2v10H42v6H18v-6H8V38H6V22h2V12h10z" fill={palette.screen} />
      <g shapeRendering="geometricPrecision" fill="none" stroke={palette.teal} strokeWidth=".7">
        <circle cx="30" cy="30" r="20" opacity=".5" /><circle cx="30" cy="30" r="13" opacity=".4" /><circle cx="30" cy="30" r="6" opacity=".4" />
        <path d="M10 30h40M30 10v40" opacity=".3" />
      </g>
      <path d="M30 30V10l14 6z" fill={palette.teal} opacity=".12" />
      <path d="M30 30l14-14" stroke={palette.teal} strokeWidth="1" />
      <path d="M18 24h2v2h-2zM38 18h2v2h-2zM34 40h2v2h-2z" fill={palette.cream} />
      <path d="M30 28h2v2h-2z" fill={palette.amber} />
      <path d="M14 62h32v12H14z" fill={palette.steel} />
      <path d="M18 64h24v6H18z" fill={palette.shadow} />
      <path d="M20 66h8m8 0h4" stroke={palette.teal} strokeWidth="1" />
    </g>
    <Console x={130} y={72} width={70} />
    <path d="M140 82h8l3-4 4 7 4-5h6l3-2 4 5 4-3h14" fill="none" stroke={palette.edge} strokeWidth="1" />
    <rect x="136" y="110" width="56" height="24" fill={palette.steel} />
    <path d="M138 112h52" stroke={palette.edge} strokeWidth="1" />
    {[142, 158, 174].map((x) => <g key={x}><rect x={x} y="116" width="12" height="12" fill={palette.shadow} /><path d={`M${x + 2} 118h8v4h-8z`} fill={palette.frame} /><path d={`M${x + 3} 125h6`} stroke={palette.amber} strokeWidth="1" /></g>)}
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
      <g className="exterior-plating">
        <path d="M30 4h180v4H30zM26 10h188v2H26zM8 34h6v108H8zM226 34h6v108h-6zM30 164h180v4H30z" fill="#30445f" />
        <path d="M34 4h172M16 34v106m208-106v106M34 170h172" fill="none" stroke="#9ab2c8" strokeWidth="1" opacity=".7" />
        {[44, 100, 156].map((x) => <g key={x}><path d={`M${x} 12h32v4h-32zM${x} 160h32v2h-32z`} fill="#617d9c" /><path d={`M${x + 4} 13h24`} stroke="#b6c9d7" strokeWidth="1" opacity=".55" /></g>)}
        {[48, 90, 132].map((y) => <g key={y}><path d={`M14 ${y}h5v18h-5zM221 ${y}h5v18h-5z`} fill="#334b68" /><path d={`M15 ${y + 2}v10m210-10v10`} stroke="#7597b5" strokeWidth="1" /></g>)}
      </g>
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
        {id === "about" && <><path d="M36 84h44v8H36zM98 76h44v8H98zM160 84h44v8h-44z" fill={palette.teal} opacity=".1" /></>}
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
