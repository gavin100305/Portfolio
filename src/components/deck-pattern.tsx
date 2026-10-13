// A world-aligned floor grid shared by rooms and corridors. Room SVGs have
// different scales, so their pattern transforms cancel that scaling.
export function DeckPattern({ id, scale = 1, originX = 0, originY = 0, dark = false }: {
  id: string;
  scale?: number;
  originX?: number;
  originY?: number;
  dark?: boolean;
}) {
  return <pattern id={id} width="24" height="24" patternUnits="userSpaceOnUse"
    patternTransform={`translate(${-originX / scale} ${-originY / scale}) scale(${1 / scale})`}>
    <rect width="24" height="24" fill={dark ? "#263242" : "#d9d4be"} />
    <path d="M0 24V0h24" fill="none" stroke={dark ? "#202b3b" : "#c5c3b1"} strokeWidth=".7" />
    <path d="M1 1h22" stroke={dark ? "#597082" : "#efebdb"} strokeWidth=".6" opacity=".55" />
    <rect x="3" y="3" width=".65" height=".65" fill={dark ? "#597082" : "#aeb09f"} opacity=".65" />
  </pattern>;
}
