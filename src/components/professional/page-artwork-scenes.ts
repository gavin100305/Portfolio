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

function noise(seed: number) {
  const value = Math.sin(seed * 127.1 + 78.23) * 43758.5453;
  return value - Math.floor(value);
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

export function makePageFireflies(): PageScene {
  const flies = Array.from({ length: 102 }, (_, i) => ({
    x: noise(i), y: noise(i + 71), depth: noise(i + 140), timing: noise(i + 215),
  }));
  const lantern = document.createElement("canvas");
  lantern.width = lantern.height = 48;
  const brush = lantern.getContext("2d")!;
  const glow = brush.createRadialGradient(24, 24, 0, 24, 24, 24);
  glow.addColorStop(0, "#fff9bc");
  glow.addColorStop(.19, "#e6d964bd");
  glow.addColorStop(.49, "#cfb73136");
  glow.addColorStop(1, "#cfb73100");
  brush.fillStyle = glow;
  brush.fillRect(0, 0, 48, 48);

  return { draw(ctx, view, time, opacity) {
    for (const fly of flies) {
      const clock = time / (2.7 + fly.timing * 2.6) + fly.timing * 7;
      const age = clock % 1 - (.12 + .43 * noise(Math.floor(clock) + fly.timing * 106));
      if (age < 0 || age > .4) continue;
      const flash = (1 - Math.exp(-age * 95)) * Math.exp(-age * 6.4) * (1 - (age / .4) ** 2);
      const phase = time * (.23 + fly.depth * .26) + fly.timing * 24;
      const drift = 21 + fly.depth * 60;
      const x = fly.x * view.width + drift * (Math.sin(phase) + .24 * Math.sin(phase * 2.3));
      const y = fly.y * view.height + drift * (.7 * Math.cos(phase * .72) + .25 * Math.sin(phase * 1.6));
      const size = 5 + 12 * fly.depth ** 2;
      ctx.globalAlpha = Math.min(1, opacity * flash * (1 + .65 * fly.depth));
      ctx.drawImage(lantern, x - size, y - size, size * 2, size * 2);
      ctx.fillStyle = view.dark ? "#fff5b1" : "#806300";
      ctx.beginPath();
      ctx.arc(x, y, 1 + 1.25 * fly.depth, 0, Math.PI * 2);
      ctx.fill();
    }
  } };
}
