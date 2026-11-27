import fieldStems from "./artwork-field-stems.json";

const width = 1000;
const height = 562.5;
const circle = Math.PI * 2;

function noise(seed: number) {
  const n = Math.sin(seed * 127.1 + 78.23) * 43758.5453;
  return n - Math.floor(n);
}

const flies = Array.from({ length: 38 }, (_, i) => ({
  x: .055 + noise(i) * .88,
  y: .56 + noise(i + 180) * .34 + noise(i + 60) * .08,
  phase: noise(i + 120) * circle,
  depth: noise(i + 180),
  rate: .34 + noise(i + 240) * .48,
  timing: noise(i + 300),
  seed: i,
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
      const clock = time * (.16 + .16 * fly.rate) + fly.timing;
      const interval = Math.floor(clock);
      const age = clock - interval;
      const firstFlash = .19 + .31 * noise(fly.seed + interval * 83);
      const pulse = (delay: number) => {
        const t = (age - firstFlash - delay) / (delay ? .032 : .043);
        return Math.exp(-(t * t));
      };
      const blink = pulse(0) + (fly.timing > .7 ? .48 * pulse(.13) : 0);
      if (blink < .025) continue;
      const travel = .42 + .72 * fly.depth;
      const x = (fly.x + travel * (Math.sin(a * .77) * .044 + Math.sin(a * 1.81) * .012)) * width;
      const y = (fly.y + travel * (Math.cos(a * .69) * .033 + Math.sin(a * 1.37 + x * .002) * .017)) * height;
      const size = 2.4 + fly.depth ** 2 * 8;
      ctx.globalAlpha = blink * (.36 + .64 * fly.depth);
      ctx.drawImage(halo, x - size, y - size, size * 2, size * 2);
      ctx.fillStyle = "#ffface";
      ctx.beginPath();
      ctx.arc(x, y, .36 + fly.depth * .77, 0, circle);
      ctx.fill();
    }
    ctx.restore();
  };
}
// Rectangles pair each stem's atlas pixels with its position in the 1440 × 810 photograph.
const stems = [
  [0, 0, 215, 576, 124, 239],
  [124, 0, 1020, 556, 106, 259],
  [230, 0, 900, 608, 54, 132],
  [284, 0, 132, 571, 45, 104],
  [329, 0, 705, 651, 55, 106],
  [384, 0, 1225, 627, 90, 171],
  [474, 0, 440, 656, 95, 145],
  [569, 0, 30, 634, 54, 157],
];
const photoScale = width / 1440;

export function drawMeadow(ctx: CanvasRenderingContext2D, atlas: HTMLImageElement, field: HTMLImageElement, time: number, wave: Float32Array) {
  // These smaller blooms are cut from the field photograph in back-to-front order.
  // Shear about each root so a passing breeze bends the stalk without shifting its base.
  ctx.save();
  ctx.scale(photoScale, photoScale);
  const gustAge = time - wave[2];
  for (const [sx, sy, x, y, w, h] of fieldStems) {
    const phase = x * .008 + y * .012;
    const front = Math.abs(x / 1440 - wave[0]) - gustAge * .48;
    const gust = wave[3] && gustAge < 2.7
      ? Math.exp(-11 * Math.abs(front)) * Math.sin(Math.PI * gustAge / 2.7) : 0;
    const bend = .21 * Math.sin(time * 1.38 - phase)
      + .08 * Math.sin(time * 2.13 + x * .054) + .26 * gust;
    ctx.save();
    ctx.transform(1, 0, bend, 1, x, y + h);
    ctx.drawImage(field, sx, sy, w, h, 0, -h, w, h);
    ctx.restore();
  }
  ctx.restore();
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

// Reflections travel along the bends of the creek. The matte comes from the
// photographed water and keeps the light off rocks and banks.
export function makeCreekReflections(matte: HTMLImageElement) {
  const layer = document.createElement("canvas");
  layer.width = matte.width;
  layer.height = matte.height;
  const light = layer.getContext("2d");
  if (!light) return () => {};

  const glints = Array.from({ length: 44 }, (_, i) => ({
    phase: noise(i + 410),
    lane: noise(i + 540) - .5,
    speed: .13 + .11 * noise(i + 610),
    brightness: .25 + .48 * noise(i + 680),
  }));

  return (ctx: CanvasRenderingContext2D, time: number) => {
    light.clearRect(0, 0, layer.width, layer.height);
    light.globalCompositeOperation = "source-over";
    for (const glint of glints) {
      const distance = (glint.phase + time * glint.speed) % 1;
      const y = distance * layer.height;
      const center = 240 - 183 * distance + 46 * Math.sin(distance * 8.2);
      const x = center + glint.lane * (width * .085 + distance * 134);
      const fade = Math.sin(Math.PI * distance) ** .7;
      const spread = 8 + 20 * distance;
      light.save();
      light.translate(x, y);
      light.rotate(.11 * Math.sin(distance * 14));
      light.scale(spread, 1.1 + 2.2 * distance);
      const sheen = light.createRadialGradient(0, 0, 0, 0, 0, 1);
      sheen.addColorStop(0, `rgba(171,205,229,${glint.brightness * fade})`);
      sheen.addColorStop(1, "rgba(171,205,229,0)");
      light.fillStyle = sheen;
      light.fillRect(-1, -1, 2, 2);
      light.restore();
    }
    light.globalCompositeOperation = "destination-in";
    light.drawImage(matte, 0, 0);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.drawImage(layer, 457 * photoScale, 499 * photoScale,
      layer.width * photoScale, layer.height * photoScale);
    ctx.restore();
  };
}
