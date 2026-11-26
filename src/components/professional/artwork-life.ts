const width = 1000;
const height = 562.5;
const circle = Math.PI * 2;

const koi = [
  { asset: 2, x: 480, y: 302, rx: 220, ry: 142, phase: 4.52, speed: -.105, size: 146, depth: .92 },
  { asset: 1, x: 497, y: 294, rx: 262, ry: 151, phase: .40, speed: .115, size: 175, depth: .95 },
  { asset: 0, x: 430, y: 291, rx: 240, ry: 151, phase: 2.98, speed: .128, size: 198, depth: .98 },
  { asset: 1, x: 556, y: 284, rx: 207, ry: 125, phase: 2.09, speed: -.124, size: 124, depth: .77 },
];

function route(fish: (typeof koi)[number], time: number) {
  const a = fish.phase + time * fish.speed + Math.sin(time * .66 + fish.phase) * .066;
  return [
    fish.x + Math.cos(a) * fish.rx + Math.sin(a * 2) * 16,
    fish.y + Math.sin(a) * fish.ry + Math.cos(a * 3) * 10,
  ] as const;
}

export function drawKoi(ctx: CanvasRenderingContext2D, fishImages: HTMLImageElement[], time: number) {
  koi.forEach((fish, i) => {
    const [x, y] = route(fish, time);
    const [nextX, nextY] = route(fish, time + .12);
    const [lastX, lastY] = route(fish, time - .12);
    const heading = Math.atan2(nextY - lastY, nextX - lastX);
    const sprite = fishImages[fish.asset];
    const length = fish.size * (1 + Math.sin(time * .37 + i) * .028);
    const thickness = length * sprite.height / sprite.width;
    const bend = (u: number) =>
      (Math.sin(time * (3.3 + i * .25) + i * 1.94 + u * 6.9) * .121 - Math.sign(fish.speed) * .048)
      * (1 - u) ** 2.34 * length;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(heading);
    ctx.globalAlpha = fish.depth + Math.sin((x + y) * .024 + time * .45) * .025;
    const slices = 28;
    let previousBend = bend(0);
    // Each photographic slice is sheared between adjacent points on the spine.
    for (let j = 0; j < slices; j++) {
      const u = j / slices;
      const nextBend = bend((j + 1) / slices);
      const slice = length / slices;
      const slope = (nextBend - previousBend) / slice;
      const left = length * (u - .5);
      ctx.save();
      ctx.transform(1, slope, 0, 1, 0, previousBend - slope * left);
      ctx.drawImage(sprite, u * sprite.width, 0, sprite.width / slices, sprite.height,
        left, -thickness * .5, slice + .35, thickness);
      ctx.restore();
      previousBend = nextBend;
    }
    ctx.restore();
  });
}

function noise(seed: number) {
  const n = Math.sin(seed * 127.1 + 78.23) * 43758.5453;
  return n - Math.floor(n);
}

const flies = Array.from({ length: 33 }, (_, i) => ({
  x: .055 + noise(i) * .88,
  y: .37 + noise(i + 60) ** .7 * .56,
  phase: noise(i + 120) * circle,
  depth: noise(i + 180),
  rate: .34 + noise(i + 240) * .48,
}));

export function makeFireflies() {
  const halo = document.createElement("canvas");
  halo.width = halo.height = 48;
  const ctx = halo.getContext("2d");
  if (ctx) {
    const glow = ctx.createRadialGradient(24, 24, 0, 24, 24, 24);
    glow.addColorStop(0, "#fffbd5");
    glow.addColorStop(.13, "#f4f5a9ed");
    glow.addColorStop(.31, "#d4ed7873");
    glow.addColorStop(.64, "#b5d9511c");
    glow.addColorStop(1, "#a1c64700");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 48, 48);
  }

  return (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const fly of flies) {
      const a = time * fly.rate + fly.phase;
      const blink = Math.max(0, Math.sin(time * (1.05 + fly.rate) + fly.phase)) ** 3.7;
      if (blink < .02) continue;
      const x = (fly.x + Math.sin(a) * .024 + Math.sin(a * 1.33) * .019) * width;
      const y = (fly.y + Math.cos(a * .68) * .044 + Math.sin(a * 1.72) * .009) * height;
      const size = 4.4 + fly.depth ** 1.65 * 11;
      ctx.globalAlpha = blink * (.62 + .38 * fly.depth);
      ctx.drawImage(halo, x - size, y - size, size * 2, size * 2);
      ctx.fillStyle = "#ffface";
      ctx.beginPath();
      ctx.arc(x, y, .55 + fly.depth * 1.2, 0, circle);
      ctx.fill();
    }
    ctx.restore();
  };
}

// Rectangles pair each stem's atlas pixels with its position in the 1440 × 810 photograph.
const stems = [
  [0, 0, 44, 682, 77, 128], [180, 0, 204, 700, 45, 110], [360, 0, 312, 437, 37, 139],
  [540, 0, 385, 419, 43, 191], [720, 0, 423, 686, 54, 124], [0, 295, 662, 526, 46, 158],
  [180, 295, 928, 514, 55, 184], [360, 295, 1081, 731, 50, 79], [540, 295, 1132, 574, 50, 196],
  [720, 295, 1356, 599, 49, 143],
];
const photoScale = width / 1440;

export function drawMeadow(ctx: CanvasRenderingContext2D, atlas: HTMLImageElement, time: number, wave: Float32Array) {
  for (const [i, [sx, sy, x, y, w, h]] of stems.entries()) {
    const root = (y + h) * photoScale;
    const age = time - wave[2];
    const front = Math.abs(x / 1440 - wave[0]) - age * .48;
    const localGust = wave[3] && age > 0 && age < 2.7
      ? Math.exp(-Math.abs(front) * 11) * Math.sin(Math.PI * age / 2.7) * .95
      : 0;
    const wind = Math.sin(time * 1.38 - x * .009) * .42
      + Math.sin(time * .77 - x * .004) * .19
      + Math.sin(time * 2.69 + i * 1.6) * .12 + localGust;
    const amplitude = (4 + h * .085) * wind;
    const curvature = (u: number) => (1 - u) ** 2 * amplitude;
    const rowHeight = h / 18;
    const nod = 1 - Math.min(Math.abs(amplitude) * .0026, .065);
    for (let j = 0; j < 18; j++) {
      const u = j / 18;
      const offset = curvature(u);
      const slope = (curvature((j + 1) / 18) - offset) / (rowHeight * photoScale * nod);
      const top = root - (h - j * rowHeight) * photoScale * nod;
      ctx.save();
      ctx.transform(1, 0, slope, 1, offset - slope * top, 0);
      ctx.drawImage(atlas, sx, sy + j * rowHeight, w, rowHeight, x * photoScale, top,
        w * photoScale, rowHeight * photoScale * nod + .27);
      ctx.restore();
    }
  }
}

export function drawFallbackRipples(ctx: CanvasRenderingContext2D, time: number, waves: Float32Array) {
  ctx.save();
  ctx.strokeStyle = "#e5f6dc";
  ctx.lineWidth = .85;
  for (let i = 0; i < waves.length; i += 4) {
    const age = time - waves[i + 2];
    if (!waves[i + 3] || age <= 0 || age >= 2.6) continue;
    ctx.globalAlpha = Math.min(age * 4, 1) * (1 - age / 2.6) * .26;
    ctx.beginPath();
    ctx.arc(waves[i] * width, waves[i + 1] * height, 4 + age * 153, 0, circle);
    ctx.stroke();
  }
  ctx.restore();
}
