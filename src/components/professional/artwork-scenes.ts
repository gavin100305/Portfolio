export const artworkOrder = ["pond", "plateau", "grove", "desk"] as const;
export type ArtworkId = (typeof artworkOrder)[number];
export type ScenicId = Exclude<ArtworkId, "desk">;

type Scene = {
  title: string;
  description: string;
  image: string;
  creator: string;
  source: string;
  additionalCredits?: { creator: string; source: string }[];
};

export const scenicArtworks: Record<ScenicId, Scene> = {
  pond: {
    title: "Koi Pond",
    description: "Looking straight down through dark water, red, white, and golden koi swim between clusters of green lily pads.",
    image: "/artwork/koi-pond.webp",
    creator: "Hideyoshi isai",
    source: "https://www.pexels.com/video/vibrant-koi-fish-swimming-in-a-clear-pond-31421042/",
    additionalCredits: [
      { creator: "Jonathan Borba", source: "https://www.pexels.com/photo/green-leaves-of-water-plants-on-the-water-surface-14561610/" },
      { creator: "Megan Durkin", source: "https://www.pexels.com/photo/stones-under-shallow-water-24446616/" },
    ],
  },
  plateau: {
    title: "Alpine Meadow",
    description: "Yellow wildflowers sway in an alpine meadow beneath layers of blue mountain ridges.",
    image: "/artwork/alpine-meadow.webp",
    creator: "landsmann",
    source: "https://www.pexels.com/photo/flowers-on-meadow-in-mountains-19425581/",
  },
  grove: {
    title: "Firefly Grove",
    description: "Fireflies blink and drift through a backlit woodland of tall trees and ferns.",
    image: "/artwork/firefly-grove.webp",
    creator: "Jacob Colvin",
    source: "https://www.pexels.com/photo/scenic-photo-of-forest-with-sunlight-1757363/",
  },
};
