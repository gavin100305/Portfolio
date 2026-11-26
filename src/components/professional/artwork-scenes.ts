export const artworkOrder = ["desk", "pond", "plateau", "grove"] as const;
export type ArtworkId = (typeof artworkOrder)[number];
export type ScenicId = Exclude<ArtworkId, "desk">;

export const scenicArtworks = {
  pond: {
    title: "Koi Pond",
    description: "Ivory and red koi swim through a jade-green pond among ink-blue water and lily pads.",
  },
  plateau: {
    title: "Alpine Plateau",
    description: "White, yellow, and purple wildflowers sway across a high green plateau beneath layered mountain ridges.",
  },
  grove: {
    title: "Firefly Grove",
    description: "Fireflies drift over a still woodland pool surrounded by ferns and dark trees at dusk.",
  },
} satisfies Record<ScenicId, { title: string; description: string }>;
