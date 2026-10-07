export const SUIT_PALETTES = ["azure", "teal", "amber", "violet", "coral"] as const;
export type SuitPalette = (typeof SUIT_PALETTES)[number];
export type Direction = "up" | "down" | "left" | "right";

export const suitColors: Record<SuitPalette, { suit: string; shade: string; trim: string; visor: string }> = {
  azure: { suit: "#F2F5FA", shade: "#A7B0C0", trim: "#65C8FF", visor: "#16334B" },
  teal: { suit: "#D8FFF7", shade: "#78BEB5", trim: "#52CFC6", visor: "#103C43" },
  amber: { suit: "#FFF0CC", shade: "#C5A36A", trim: "#FFC875", visor: "#3C2D1B" },
  violet: { suit: "#F1E8FF", shade: "#AA93CC", trim: "#B68AFF", visor: "#302448" },
  coral: { suit: "#FFE5DE", shade: "#C79485", trim: "#FF987B", visor: "#432A2B" },
};

export function paletteForGuest(guestId: string): SuitPalette {
  let hash = 2166136261;
  for (let index = 0; index < guestId.length; index += 1) {
    hash ^= guestId.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return SUIT_PALETTES[(hash >>> 0) % SUIT_PALETTES.length];
}
