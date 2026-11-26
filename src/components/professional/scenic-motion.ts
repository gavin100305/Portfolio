import type { ScenicId } from "./artwork-scenes";

export const scenicWidth = 1000;
export const scenicHeight = 560;
type Painter = (ctx: CanvasRenderingContext2D, time: number) => void;
const tau = 2 * Math.PI;

const swimmers = [
  { x: 322, y: 305, rx: 188, ry: 111, period: 74, phase: 1.3, length: 99, depth: .72 },
  { x: 494, y: 322, rx: 254, ry: 142, period: 85, phase: 4.2, length: 123, depth: .84 },
  { x: 608, y: 305, rx: 226, ry: 136, period: -81, phase: 2.5, length: 110, depth: .77 },
  { x: 486, y: 300, rx: 288, ry: 170, period: -99, phase: .82, length: 155, depth: .96 },
  { x: 457, y: 286, rx: 286, ry: 134, period: 88, phase: 3.8, length: 140, depth: .9 },
];

function swimPath(fish: (typeof swimmers)[number], time: number) {
  const angle = fish.phase + time * tau / fish.period + .09 * Math.sin(time * .44 + fish.phase);
  return {
    x: fish.x + fish.rx * Math.cos(angle) + 22 * Math.sin(angle * 2),
    y: fish.y + fish.ry * Math.sin(angle) + 15 * Math.cos(angle * 3),
  };
}

function pondPainter(koi: HTMLImageElement[]): Painter {
  const fishCanvas = document.createElement("canvas");
  fishCanvas.width = 400;
  fishCanvas.height = 220;
  const fishContext = fishCanvas.getContext("2d");
  if (!fishContext) return () => {};

  return (ctx, time) => {
    swimmers.forEach((fish, index) => {
      const sprite = koi[index % koi.length];
      const { x, y } = swimPath(fish, time);
      const ahead = swimPath(fish, time + .12);
      const behind = swimPath(fish, time - .12);
      const heading = Math.atan2(ahead.y - behind.y, ahead.x - behind.x);
      const pulse = Math.sin(time * (2.7 + index * .21) + 6 * fish.phase);
      const length = fish.length * (1 + .035 * Math.sin(time * .26 + fish.phase));
      const spriteHeight = fishCanvas.width * sprite.naturalHeight / sprite.naturalWidth;
      const sections = 32;
      const yCenter = (fishCanvas.height - spriteHeight) / 2;
      fishContext.clearRect(0, 0, fishCanvas.width, fishCanvas.height);

      // The stroke travels from the fixed head through the body to the tail.
      for (let section = 0; section < sections; section++) {
        const start = section / sections;
        const span = 1 / sections;
        const tailWeight = (1 - start) ** 2.3;
        const wave = Math.sin(time * (3.1 + index * .17) + 6 * fish.phase + start * 6.5);
        const bend = (wave * 32 - Math.sign(fish.period) * 7) * tailWeight;
        fishContext.drawImage(
          sprite, start * sprite.naturalWidth, 0, span * sprite.naturalWidth, sprite.naturalHeight,
          start * fishCanvas.width, yCenter + bend, span * fishCanvas.width + .36, spriteHeight,
        );
      }

      const height = length * fishCanvas.height / fishCanvas.width;
      const brightness = .96 + .04 * Math.sin(x / 74 + y / 57 + time * .31);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(heading + pulse * .033);
      ctx.globalAlpha = .11 * fish.depth;
      ctx.drawImage(fishCanvas, -length * .50 + 5, -height / 2 + 7, length, height);
      ctx.globalAlpha = fish.depth * brightness;
      ctx.drawImage(fishCanvas, -length * .50, -height / 2, length, height);
      ctx.restore();

      if (fish.depth < .85) return;
      const rippleAge = (time + index * 2.3) % 6.9;
      if (rippleAge > 2.1) return;
      const source = swimPath(fish, time - rippleAge);
      const next = swimPath(fish, time + .1 - rippleAge);
      const wakeAngle = Math.atan2(next.y - source.y, next.x - source.x);
      const surfaceX = source.x + length * .43 * Math.cos(wakeAngle);
      const surfaceY = source.y + length * .43 * Math.sin(wakeAngle);
      ctx.strokeStyle = "#f0ffe0";
      ctx.lineWidth = .9;
      for (let ring = 0; ring < 2; ring++) {
        const age = rippleAge - ring * .37;
        if (age < 0) continue;
        ctx.globalAlpha = .32 * Math.min(age * 4, 1) * (1 - age / 2.1) ** 2;
        ctx.beginPath();
        ctx.ellipse(surfaceX, surfaceY, 5 + age * 23, 4 + age * 17, wakeAngle, -.8, 4.5);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    });
  };
}

function meadowPainter(poster: HTMLImageElement): Painter {
  const rows = 42;
  const columns = 10;
  const meadowTop = .51;
  const patchHeight = (1 - meadowTop) / rows;
  const { naturalWidth, naturalHeight } = poster;

  function wind(x: number, y: number, time: number) {
    const gust = Math.max(0, .48 + .52 * Math.sin(x * 7.4 - time * 1.15 + y * 1.7));
    const sway = Math.sin(time * 2.1 - x * 8.2 + y * 3.5);
    const flutter = Math.sin(time * 4.7 - x * 10 + y * 12) * .18;
    const edge = Math.min(1, x * 12, (1 - x) * 12);
    return (sway * gust + flutter) * y ** 1.45 * edge * 11;
  }

  return (ctx, time) => {
    // Keep the peaks still. A traveling wind field displaces the foreground
    // texture more strongly where the flowers are closer to the viewer.
    for (let row = 0; row < rows; row++) {
      const y = meadowTop + row * patchHeight;
      let left = 0;
      for (let column = 0; column < columns; column++) {
        const u = column / columns;
        const next = (column + 1) / columns;
        const right = next * scenicWidth + wind(next, row / rows, time);
        ctx.drawImage(
          poster, u * naturalWidth, y * naturalHeight, naturalWidth / columns, patchHeight * naturalHeight,
          left, y * scenicHeight, right - left + .4, patchHeight * scenicHeight + .4,
        );
        left = right;
      }
    }
  };
}

function grovePainter(): Painter {
  const random = (seed: number) => {
    const sample = Math.sin(seed * 127.1 + 43.7) * 43758.5453;
    return sample - Math.floor(sample);
  };
  const fireflies = Array.from({ length: 23 }, (_, index) => ({
    x: 52 + random(index + 2) * 890,
    y: 174 + random(index + 31) ** .7 * 340,
    phase: random(index + 79) * tau,
    speed: .22 + random(index + 120) * .54,
    size: .65 + random(index + 151) * 1.5,
  }));
  const glow = document.createElement("canvas");
  glow.width = glow.height = 40;
  const glowContext = glow.getContext("2d");
  if (!glowContext) return () => {};
  const gradient = glowContext.createRadialGradient(20, 20, 0, 20, 20, 20);
  gradient.addColorStop(0, "#ffffd9");
  gradient.addColorStop(.12, "#e8ed91d0");
  gradient.addColorStop(.32, "#d3e67443");
  gradient.addColorStop(1, "#cedb7000");
  glowContext.fillStyle = gradient;
  glowContext.fillRect(0, 0, 40, 40);

  return (ctx, time) => {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    fireflies.forEach(({ x, y, phase, speed, size }) => {
      const pulse = Math.max(0, Math.sin(time * (1 + speed) + phase)) ** 3;
      const drift = time * speed + phase;
      const dx = x + 25 * Math.sin(drift) + 13 * Math.sin(drift * .73);
      const dy = y + 13 * Math.cos(drift * .94) + 10 * Math.sin(drift * 1.41);
      if (pulse < .015) return;
      ctx.globalAlpha = pulse * .85;
      ctx.drawImage(glow, dx - size * 6, dy - size * 6, size * 12, size * 12);
    });
    ctx.restore();
  };
}

export function createScenicPainter(id: ScenicId, poster: HTMLImageElement, koi: HTMLImageElement[]) {
  switch (id) {
    case "pond": return pondPainter(koi);
    case "plateau": return meadowPainter(poster);
    case "grove": return grovePainter();
  }
}
