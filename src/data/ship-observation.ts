import type { Point } from "./station-world";

// The current room-artwork's stepped outline, in native 240 × 176 units.
// Used only by the optional exterior preview and its SVG fallback.
export const moduleOutline: readonly Point[] = [
  [28, 0], [212, 0], [212, 8], [224, 8], [224, 20], [232, 20], [232, 32], [240, 32],
  [240, 144], [232, 144], [232, 156], [224, 156], [224, 168], [212, 168], [212, 176],
  [28, 176], [28, 168], [16, 168], [16, 156], [8, 156], [8, 144], [0, 144],
  [0, 32], [8, 32], [8, 20], [16, 20], [16, 8], [28, 8],
].map(([x, y]) => ({ x, y }));
