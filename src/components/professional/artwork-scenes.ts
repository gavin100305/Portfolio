export const artworkOrder = ["desk", "pond", "plateau", "grove"] as const;
export type ArtworkId = (typeof artworkOrder)[number];
export type ScenicId = Exclude<ArtworkId, "desk">;

export const scenicArtworks = {
  pond: {
    title: "Koi Pond",
    poster: "/artwork/koi-pond.webp",
    description: "A view straight into a jade-green pond, with sunlit stones and white water lilies.",
  },
  plateau: {
    title: "Alpine Plateau",
    poster: "/artwork/alpine-plateau.webp",
    description: "White, yellow, and purple wildflowers cover a high green plateau beneath the Dolomite peaks.",
  },
  grove: {
    title: "Firefly Grove",
    poster: "/artwork/firefly-grove.webp",
    description: "A still woodland pool surrounded by ferns and dark trees at dusk.",
  },
} satisfies Record<ScenicId, { title: string; poster: string; description: string }>;

const images = new Map<string, Promise<HTMLImageElement>>();

export function loadArtworkImage(src: string) {
  const cached = images.get(src);
  if (cached) return cached;

  const image = new Image();
  image.src = src;
  const loaded = image.decode().then(() => image, (error: unknown) => {
    images.delete(src);
    throw error;
  });
  images.set(src, loaded);
  return loaded;
}
