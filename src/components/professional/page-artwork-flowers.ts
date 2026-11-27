import type { loadContourPoints, PageScene } from "./page-artwork-scenes";

// Centers and radii of the individual flower heads in the four overhead plates.
const heads = [
  [[63, 82, 37, 37], [144, 174, 52, 51]],
  [[118, 27, 33, 26], [44, 104, 29, 29], [212, 130, 32, 30], [110, 215, 31, 31], [191, 185, 15, 15]],
  [[104, 100, 50, 49], [165, 203, 34, 36]],
  [[210, 65, 56, 52], [132, 86, 26, 21], [202, 149, 25, 23]],
];

const stages = 32;
const prepared = new WeakMap<HTMLImageElement, ReturnType<typeof prepareBouquet>>();
function prepareBouquet(photo: HTMLImageElement, variety: number) {
  const foliage = document.createElement("canvas");
  foliage.width = photo.width;
  foliage.height = photo.height;
  const base = foliage.getContext("2d")!;
  base.drawImage(photo, 0, 0);
  base.globalCompositeOperation = "destination-out";

  const blooms = heads[variety].map(([x, y, rx, ry], bloomIndex) => {
    const width = 2 * rx, height = 2 * ry;
    const frames = document.createElement("canvas");
    frames.width = width * stages;
    frames.height = height;
    const brush = frames.getContext("2d")!;
    brush.save();
    brush.beginPath();
    brush.ellipse(rx, ry, rx, ry, 0, 0, Math.PI * 2);
    brush.clip();
    brush.drawImage(photo, rx - x, ry - y);
    brush.restore();
    const original = brush.getImageData(0, 0, width, height);
    const frame = brush.createImageData(width, height);

    base.beginPath();
    base.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    base.fill();

    // The final pose uses the full-resolution petals. Earlier poses curl
    // each petal inward toward the center, with a small stagger around the head.
    brush.putImageData(original, width * (stages - 1), 0);
    const samples = Array.from({ length: width * height }, (_, index) => {
      const px = (index % width + .5 - rx) / rx;
      const py = (Math.floor(index / width) + .5 - ry) / ry;
      const radius = Math.hypot(px, py);
      const angle = Math.atan2(py, px);
      return { radius, angle, lag: .12 * (1 + Math.sin(angle * 4 + bloomIndex)) };
    });
    for (let stage = 0; stage < stages - 1; stage++) {
      const opening = stage / (stages - 1);
      for (const [index, { radius, angle, lag }] of samples.entries()) {
        const amount = Math.max(0, (opening - lag) / (1 - lag));
        const spread = .21 + .79 * Math.sin(amount * Math.PI / 2);
        const fromRadius = radius / spread;
        const dest = index * 4;
        if (fromRadius >= 1) {
          frame.data[dest + 3] = 0;
          continue;
        }
        const twist = (1 - amount) * fromRadius * .28;
        const srcX = Math.floor(rx + rx * fromRadius * Math.cos(angle + twist));
        const srcY = Math.floor(ry + ry * fromRadius * Math.sin(angle + twist));
        const src = (srcY * width + srcX) * 4;
        const shade = 1 - .22 * (1 - amount) * fromRadius;
        frame.data[dest] = original.data[src] * shade;
        frame.data[dest + 1] = original.data[src + 1] * shade;
        frame.data[dest + 2] = original.data[src + 2] * shade;
        frame.data[dest + 3] = original.data[src + 3];
      }
      brush.putImageData(frame, stage * width, 0);
    }
    return { x, y, rx, ry, frames, width, height };
  });
  return { foliage, blooms };
}

const petals = ["#f1e6c7", "#fff5dc", "#b6b9d2", "#f6da8b"];
const tileWidth = 180, tileHeight = 258, centerX = 90, centerY = 72;

export function makePageFlowers(
  layer: HTMLElement, contours: Awaited<ReturnType<typeof loadContourPoints>>, bouquets: HTMLImageElement[],
): PageScene {
  const plates = bouquets.map((photo, variety) => {
    const cached = prepared.get(photo);
    if (cached) return cached;
    const plate = prepareBouquet(photo, variety);
    prepared.set(photo, plate);
    return plate;
  });
  const field = document.createElement("div");
  field.className = "folio-flower-field";
  layer.append(field);

  function place(view: Parameters<PageScene["draw"]>[1]) {
    field.replaceChildren();
    const gutter = (view.width - 800) / 2;
    const diameter = Math.min(100, gutter * .68);
    const nearEdge = view.width >= 1280 ? 80 : 18;
    const minX = Math.min(gutter * .5, nearEdge + diameter * .43);
    const maxX = Math.max(minX, gutter - diameter * .43 - 12);
    const desiredX = (minX + maxX) / 2;
    return contours.flatMap((points, side) => {
      const available = points.map(p => ({ x: p.x * view.contourWidth, y: p.y * view.pageHeight }))
        .filter(p => p.x >= minX && p.x <= maxX);
      const count = Math.ceil(view.pageHeight / 370);
      return Array.from({ length: count }, (_, i) => {
        const targetY = 216 + side * 140 + i * 370;
        const score = (p: { x: number; y: number }) => Math.abs(p.y - targetY) + 2.8 * Math.abs(p.x - desiredX);
        const point = available.filter(p => Math.abs(p.y - targetY) < 125)
          .reduce<(typeof available)[number] | undefined>((best, p) => !best || score(p) < score(best) ? p : best, undefined);
        if (!point) return [];

        const variety = (i + side * 2) % plates.length;
        const plate = plates[variety];
        const x = side ? view.width - point.x : point.x;
        const y = point.y;
        const canvas = document.createElement("canvas");
        const density = Math.min(devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(tileWidth * density);
        canvas.height = Math.round(tileHeight * density);
        canvas.style.cssText = `width:${tileWidth}px;height:${tileHeight}px;left:${x - centerX}px;top:${y - centerY}px`;
        field.append(canvas);
        const ctx = canvas.getContext("2d")!;
        ctx.scale(density, density);
        return [{
          x, y, canvas, ctx, plate, variety, angle: i * 2.399 + side, size: diameter * (.88 + i % 4 * .04),
          delay: .12 + (i % 4) * .13, brushed: -Infinity, inside: false, settled: false,
          pushX: 0, pushY: 0, petalX: 0, petalY: 0, petalSpin: 1, dark: false,
        }];
      }).flat();
    });
  }

  let flowers: ReturnType<typeof place> = [];
  let width = 0, height = 0;
  return {
    dispose() { field.remove(); },
    brush(pointer, time) {
      const y = pointer.y + window.scrollY;
      for (const flower of flowers) {
        const dx = flower.x - pointer.x;
        const dy = flower.y - y;
        const distance = Math.hypot(dx, dy);
        const inside = distance < flower.size * .46;
        if (inside && !flower.inside && time - flower.brushed > 1.7) {
          flower.brushed = time;
          const angle = Math.atan2(dy, dx);
          flower.pushX = Math.cos(angle - flower.angle);
          flower.pushY = Math.sin(angle - flower.angle);
          const bloom = flower.plate.blooms[0];
          const { foliage } = flower.plate;
          const scale = flower.size / Math.max(foliage.width, foliage.height);
          const offsetX = (bloom.x - foliage.width / 2) * scale;
          const offsetY = (bloom.y - foliage.height / 2) * scale;
          flower.petalX = offsetX * Math.cos(flower.angle) - offsetY * Math.sin(flower.angle);
          flower.petalY = offsetX * Math.sin(flower.angle) + offsetY * Math.cos(flower.angle);
          flower.petalSpin = dx < 0 ? -1 : 1;
          flower.settled = false;
        }
        flower.inside = inside;
      }
    },
    draw(_ctx, view, time, opacity) {
      if (width !== view.width || height !== view.pageHeight) {
        width = view.width;
        height = view.pageHeight;
        flowers = place(view);
      }
      field.style.opacity = String(opacity);
      for (const flower of flowers) {
        if (flower.y < view.scroll - tileHeight || flower.y > view.scroll + view.height + centerY) continue;
        if (flower.settled && flower.dark === view.dark) continue;
        const { ctx, foliage, blooms } = { ctx: flower.ctx, ...flower.plate };
        const scale = flower.size / Math.max(foliage.width, foliage.height);
        ctx.clearRect(0, 0, tileWidth, tileHeight);
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(flower.angle);
        ctx.scale(scale, scale);
        ctx.translate(-foliage.width / 2, -foliage.height / 2);
        ctx.globalAlpha = view.dark ? .89 : .95;
        ctx.drawImage(foliage, 0, 0);

        for (const [i, bloom] of blooms.entries()) {
          const open = Math.max(0, Math.min(1, (time - flower.delay - i * .19) / 1.65));
          const stage = Math.round(open * (stages - 1));
          const age = time - flower.brushed - i * .035;
          const spring = age > 0 && age < 1.4 ? Math.sin(age * 7.3) * Math.exp(-age * 4.1) : 0;
          const sway = spring * (4 + .19 * bloom.rx);
          ctx.save();
          ctx.translate(bloom.x + sway * flower.pushX, bloom.y + sway * flower.pushY);
          ctx.rotate(spring * flower.pushX * .1);
          ctx.drawImage(bloom.frames, stage * bloom.width, 0, bloom.width, bloom.height,
            -bloom.rx, -bloom.ry, bloom.width, bloom.height);
          ctx.restore();
        }
        ctx.restore();

        const age = time - flower.brushed - .13;
        if (age >= 0 && age < 1.75) {
          const drift = Math.sin(age * 5.4) * (4 + age * 8) + flower.petalSpin * age * 15;
          ctx.save();
          ctx.translate(centerX + flower.petalX + drift, centerY + flower.petalY + 16 * age + 24 * age * age);
          ctx.rotate(flower.angle + flower.petalSpin * age * 2.5);
          ctx.scale(.46 + .54 * Math.abs(Math.cos(age * 5.8)), 1);
          ctx.globalAlpha = Math.min(1, (1.75 - age) * 3);
          ctx.fillStyle = petals[flower.variety];
          ctx.beginPath();
          ctx.moveTo(0, 3.9);
          ctx.bezierCurveTo(-4.1, .7, -2.7, -5, -.25, -5.1);
          ctx.bezierCurveTo(2.6, -5.5, 3.3, -.9, 0, 3.9);
          ctx.fill();
          ctx.restore();
        }
        flower.settled = time > flower.delay + blooms.length * .19 + 1.65 && age >= 1.75;
        flower.dark = view.dark;
      }
    },
  };
}
