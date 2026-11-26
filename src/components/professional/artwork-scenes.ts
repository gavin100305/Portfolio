export const artworkOrder = ["pond", "plateau", "grove", "desk"] as const;
export type ArtworkId = (typeof artworkOrder)[number];
export type ScenicId = Exclude<ArtworkId, "desk">;

type Film = {
  title: string;
  description: string;
  file: string;
  creator: string;
  source: string;
  license?: string;
};

export const scenicArtworks: Record<ScenicId, Film> = {
  pond: {
    title: "Koi Pond",
    description: "Red, white, and golden koi swim through a clear pond viewed from above.",
    file: "koi-pond",
    creator: "Hideyoshi isai",
    source: "https://www.pexels.com/video/vibrant-koi-fish-swimming-in-a-clear-pond-31421042/",
  },
  plateau: {
    title: "Alpine Meadow",
    description: "Purple wildflowers sway in the breeze beneath a ridge in the Uinta Mountains.",
    file: "alpine-meadow",
    creator: "Alex Moliski",
    source: "https://www.pexels.com/video/wildflowers-in-the-alpine-meadows-27382859/",
  },
  grove: {
    title: "Fireflies at Dusk",
    description: "Fireflies flash briefly over a dark grassy field at dusk.",
    file: "fireflies-at-dusk",
    creator: "Mark of Minmark",
    source: "https://commons.wikimedia.org/wiki/File:FireFlies_short_video.webm",
    license: "https://creativecommons.org/licenses/by/3.0/",
  },
};
