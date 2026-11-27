import { createPondSwim } from "./artwork-pond";

export type ArtworkViewport = {
  width: number; height: number; scroll: number; pageHeight: number;
  contourWidth: number; dark: boolean;
};
export type ArtworkPointer = { x: number; y: number };
export type PageScene = {
  draw: (ctx: CanvasRenderingContext2D, view: ArtworkViewport, time: number, opacity: number) => void;
  dispose?: () => void;
  brush?: (pointer: ArtworkPointer, time: number) => void;
};

export async function loadArtworkImage(src: string) {
  const image = new Image();
  image.src = src;
  await image.decode();
  return image;
}

export function makePagePond(images: HTMLImageElement[], view: ArtworkViewport): PageScene {
  const scale = .72;
  const margin = (view.width - 800) / 2;
  // The schools live in viewport space while the content scrolls over them.
  // The wakes can still reach under the outer edges of the cards.
  const laneWidth = Math.min(390, margin + 34);
  const reach = view.height;
  const lanes = [0, 1].map(lane => {
    const swim = createPondSwim(laneWidth / scale, reach / scale, {
      lane, spacing: 270 / scale, rippleColumns: Math.ceil(laneWidth / 4.5),
    });
    const wake = document.createElement("canvas");
    wake.width = swim.normals.width;
    wake.height = swim.normals.height;
    const brush = wake.getContext("2d")!;
    return { swim, wake, brush, water: brush.createImageData(wake.width, wake.height) };
  });

  return { draw(ctx, bounds, time, opacity) {
    for (const [lane, { swim, wake, brush, water }] of lanes.entries()) {
      const left = lane ? bounds.width - laneWidth : 0;
      ctx.save();
      ctx.translate(left, 0);
      ctx.scale(scale, scale);
      swim.draw(ctx, images, time * .82, opacity * .72, true);
      ctx.restore();

      const normals = swim.normals.data;
      const pixels = water.data;
      for (let i = 0; i < pixels.length; i += 4) {
        const slope = (normals[i] - 128) * .48 + (normals[i + 1] - 128) * .88;
        const crest = slope > 0;
        pixels[i] = crest ? 155 : 44;
        pixels[i + 1] = crest ? 226 : 127;
        pixels[i + 2] = crest ? 241 : 166;
        pixels[i + 3] = Math.min(100, Math.abs(slope) * (crest && !bounds.dark ? 1.4 : 2.7));
      }
      brush.putImageData(water, 0, 0);
      ctx.globalAlpha = opacity;
      ctx.drawImage(wake, left, 0, laneWidth, bounds.height);
      ctx.globalAlpha = 1;
    }
  } };
}
