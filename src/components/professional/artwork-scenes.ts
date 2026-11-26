export const artworkOrder = ["pond", "plateau", "grove", "desk"] as const;
export type ArtworkId = (typeof artworkOrder)[number];
export type ScenicId = Exclude<ArtworkId, "desk">;

type Scene = {
  title: string;
  description: string;
  image: string;
  creator: string;
  source: string;
  additionalCredit?: { creator: string; source: string; license: { label: string; url: string } };
};

export const scenicArtworks: Record<ScenicId, Scene> = {
  pond: {
    title: "Koi Pond",
    description: "Seen from underwater, orange and golden koi swim past moss and gravel in deep green water.",
    image: "/artwork/koi-pond.webp",
    creator: "Pablo Buendia",
    source: "https://www.pexels.com/video/fishes-in-aquarium-12409002/",
    additionalCredit: {
      creator: "Georg Pirrung",
      source: "https://commons.wikimedia.org/wiki/File:Forests_Underwater_(122868199).jpeg",
      license: { label: "CC BY 3.0", url: "https://creativecommons.org/licenses/by/3.0/" },
    },
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
