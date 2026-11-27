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
    description: "Looking straight down through sunlit blue water, red, white, and golden koi swim between clusters of green lily pads.",
    image: "/artwork/koi-pond.webp",
    creator: "Hideyoshi isai",
    source: "https://www.pexels.com/video/vibrant-koi-fish-swimming-in-a-clear-pond-31421042/",
    additionalCredits: [
      { creator: "Jonathan Borba", source: "https://www.pexels.com/photo/green-leaves-of-water-plants-on-the-water-surface-14561610/" },
      { creator: "Megan Durkin", source: "https://www.pexels.com/photo/stones-under-shallow-water-24446616/" },
    ],
  },
  plateau: {
    title: "Poppy Meadow",
    description: "Foreground poppies sway beneath a tree-lined ridge across an open meadow.",
    image: "/artwork/poppy-hills-poster.webp",
    creator: "Gülsüm Şener",
    source: "https://www.pexels.com/photo/a-rural-field-with-poppies-17662755/",
    additionalCredits: [{ creator: "Liana Mikah", source: "https://www.pexels.com/photo/flowers-on-meadow-17206891/" }],
  },
  grove: {
    title: "Firefly Grove",
    description: "Fireflies drift above a narrow creek between mossy banks and conifer trunks.",
    image: "/artwork/moss-creek-poster.webp",
    creator: "Nguyen Ngoc Tien",
    source: "https://www.pexels.com/photo/serene-forest-stream-in-lush-greenery-33901108/",
  },
};
