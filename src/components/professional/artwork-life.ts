import fieldStems from "./artwork-field-stems.json";

const width = 1000;
const height = 562.5;
const circle = Math.PI * 2;

function noise(seed: number) {
  const n = Math.sin(seed * 127.1 + 78.23) * 43758.5453;
  return n - Math.floor(n);
}

// Small groups follow the creek and the two mossy banks visible in the plate.
const creekBanks = [
  { x: .29, y: .51, spreadX: .20, spreadY: .19, depth: .22, count: 22 },
  { x: .61, y: .56, spreadX: .23, spreadY: .20, depth: .33, count: 23 },
  { x: .77, y: .68, spreadX: .29, spreadY: .24, depth: .46, count: 20 },
  { x: .39, y: .79, spreadX: .32, spreadY: .24, depth: .66, count: 20 },
  { x: .19, y: .83, spreadX: .18, spreadY: .18, depth: .77, count: 11 },
];

const flies = creekBanks.flatMap((bank, group) => Array.from({ length: bank.count }, (_, i) => {
  const seed = group * 2048 + i * 19;
  const depth = bank.depth + .18 * noise(seed + 3);
  return {
    seed,
    depth,
    x: (bank.x + (noise(seed + 1) - .5) * bank.spreadX) * width,
    y: (bank.y + (noise(seed + 2) - .5) * bank.spreadY) * height,
    phase: noise(seed + 4) * circle,
    rate: .38 + .48 * noise(seed + 5),
    flashPeriod: 2.5 + 1.9 * noise(seed + 6),
    flashOffset: 5 * noise(seed + 7),
    doubleFlash: noise(seed + 8) > .68,
  };
}));

export function makeFireflies() {
  const halo = document.createElement("canvas");
  halo.width = halo.height = 48;
  const brush = halo.getContext("2d");
  if (!brush) return () => {};

  const glow = brush.createRadialGradient(24, 24, 0, 24, 24, 24);
  glow.addColorStop(0, "#fff7bb");
  glow.addColorStop(.16, "#f6e984d9");
  glow.addColorStop(.33, "#dce76863");
  glow.addColorStop(.65, "#bbce451a");
  glow.addColorStop(1, "#bbce4500");
  brush.fillStyle = glow;
  brush.fillRect(0, 0, halo.width, halo.height);

  return (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "#fff8cd";
    for (const fly of flies) {
      const clock = time + fly.flashOffset;
      const interval = Math.floor(clock / fly.flashPeriod);
      const flashStart = .18 + .9 * noise(fly.seed + interval * 149 + 9);
      const age = clock % fly.flashPeriod - flashStart;
      const pulse = (seconds: number) => {
        if (seconds < 0 || seconds > 1) return 0;
        return (1 - Math.exp(-seconds * 30)) * Math.exp(-seconds * 3.7) * (1 - seconds ** 4);
      };
      const blink = Math.max(pulse(age), fly.doubleFlash ? .8 * pulse(age - .65) : 0);
      if (blink < .025) continue;

      const phase = time * fly.rate + fly.phase;
      const travel = 12 + 28 * fly.depth;
      const x = fly.x + travel * (Math.sin(phase) + .38 * Math.sin(phase * 1.81));
      const y = fly.y + travel * (.53 * Math.cos(phase * .78) + .18 * Math.sin(phase * 2.23));
      const size = 4 + 8 * fly.depth ** 2;
      const intensity = Math.min(1, blink * (1.18 + .45 * fly.depth));
      ctx.globalAlpha = intensity * (.65 + .35 * fly.depth);
      ctx.drawImage(halo, x - size, y - size, size * 2, size * 2);
      ctx.globalAlpha = intensity;
      ctx.beginPath();
      ctx.arc(x, y, .67 + .86 * fly.depth, 0, circle);
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

// Refract the photographed water inside its alpha matte. The original plate
// shows through around the rocks, where the matte falls to zero.
export function makeCreekCurrent(plate: HTMLImageElement, matte: HTMLImageElement) {
  const left = 457, top = 499;
  const layer = document.createElement("canvas");
  const columns = layer.width = Math.ceil(matte.width / 2);
  const rows = layer.height = Math.ceil(matte.height / 2);
  const brush = layer.getContext("2d");
  if (!brush) return () => {};

  brush.drawImage(matte, 0, 0, columns, rows);
  const mask = brush.getImageData(0, 0, columns, rows).data;
  brush.clearRect(0, 0, columns, rows);
  brush.drawImage(plate, left, top, matte.width, matte.height, 0, 0, columns, rows);
  const photo = brush.getImageData(0, 0, columns, rows).data;
  const frame = brush.createImageData(columns, rows);
  const water: { pixel: number; interior: number; ripple: number; eddy: number }[] = [];
  for (let y = 2; y < rows - 2; y++) {
    for (let x = 1; x < columns - 1; x++) {
      const pixel = (y * columns + x) * 4;
      const coverage = mask[pixel + 3] / 255;
      if (coverage < .02) continue;
      const interior = Math.min(coverage, mask[pixel - columns * 4 + 3] / 255,
        mask[pixel + columns * 4 + 3] / 255);
      water.push({ pixel, interior,
        ripple: y * .82 + x * .19 + 1.8 * Math.sin(x * .21),
        eddy: y * .32 - x * .25,
      });
      frame.data[pixel + 3] = Math.round(coverage * 255);
    }
  }

  return (ctx: CanvasRenderingContext2D, time: number) => {
    for (const { pixel, interior, ripple, eddy } of water) {
      const fine = Math.sin(ripple - time * 8.1);
      const broad = Math.sin(eddy - time * 3.2);
      const offset = interior * (.78 * fine + .55 * broad);
      const firstRow = Math.floor(offset);
      const fraction = offset - firstRow;
      const source = pixel + firstRow * columns * 4;
      // Sample from inside the channel to keep the waterline and banks steady.
      const brightness = 1 + .13 * interior * (fine + .5 * broad);
      for (let channel = 0; channel < 3; channel++) {
        const nearby = photo[source + channel] * (1 - fraction)
          + photo[source + columns * 4 + channel] * fraction;
        const refracted = photo[pixel + channel] + interior * (nearby - photo[pixel + channel]);
        frame.data[pixel + channel] = brightness * refracted;
      }
    }
    brush.putImageData(frame, 0, 0);
    ctx.drawImage(layer, left * photoScale, top * photoScale,
      matte.width * photoScale, matte.height * photoScale);
  };
}
