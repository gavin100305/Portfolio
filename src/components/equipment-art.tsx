import type { ReactNode } from "react";

// All equipment is lit from the upper left. These solid, shallow faces give
// the original pixel drawings physical weight without changing the camera.
export const equipment = {
  outline: "#111722", casing: "#718795", highlight: "#c0d0d7",
  side: "#405463", inset: "#283b46", glass: "var(--ship-screen, #142e38)",
  light: "var(--ship-light, #65c8ff)", warm: "var(--ship-warning, #ffc875)", keys: "#b4c5ce",
};

export function EquipmentHousing({ x = 0, y = 0, width, height, children }: {
  x?: number; y?: number; width: number; height: number; children: ReactNode;
}) {
  return <g transform={`translate(${x} ${y})`}>
    <rect x="1" y="2" width={width} height={height} rx="1" fill="#111722" opacity=".22" />
    <path d={`M2 0h${width - 4}l2 2v${height - 2}H0V2z`} fill={equipment.casing} stroke={equipment.outline} strokeWidth="1" />
    <path d={`M2 1h${width - 4}M1 3v${height - 6}`} fill="none" stroke={equipment.highlight} strokeWidth="1" />
    <path d={`M1 ${height - 3}h${width - 2}v3H1zM${width - 2} 3v${height - 6}`} fill={equipment.side} stroke={equipment.side} strokeWidth="1" />
    {children}
  </g>;
}
