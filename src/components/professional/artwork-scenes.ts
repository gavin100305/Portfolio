export const artworkOrder = ["desk", "pond", "plateau", "grove"] as const;
export type ArtworkId = (typeof artworkOrder)[number];
export type ScenicId = Exclude<ArtworkId, "desk">;

export const scenicArtworks = {
  pond: {
    title: "Koi Pond",
    poster: "/artwork/koi-pond.webp",
    description: "Ivory and red koi swim through a jade-green pond among sunlit stones and white water lilies.",
  },
  plateau: {
    title: "Alpine Plateau",
    poster: "/artwork/alpine-plateau.webp",
    description: "White, yellow, and purple wildflowers sway across a high green plateau beneath the Dolomite peaks.",
  },
  grove: {
    title: "Firefly Grove",
    poster: "/artwork/firefly-grove.webp",
    description: "Fireflies drift over a still woodland pool surrounded by ferns and dark trees at dusk.",
  },
} satisfies Record<ScenicId, { title: string; poster: string; description: string }>;

const images = new Map<string, Promise<HTMLImageElement>>();

function loadArtworkImage(src: string) {
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

export function loadScenicArtwork(id: ScenicId) {
  const poster = loadArtworkImage(scenicArtworks[id].poster);
  const koi = id === "pond"
    ? Promise.all(["/artwork/kohaku.webp", "/artwork/sanke.webp"].map(loadArtworkImage))
    : Promise.resolve([]);
  return Promise.all([poster, koi]).then(([poster, koi]) => ({ poster, koi }));
}

export type ScenicAssets = Awaited<ReturnType<typeof loadScenicArtwork>>;
