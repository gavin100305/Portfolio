import type { ScenicId } from "./artwork-scenes";

export const scenicWidth = 1000;
export const scenicHeight = 560;
const tau = Math.PI * 2;
type Brush = CanvasRenderingContext2D;
type Point = [number, number];
type Scene = {
  draw: (ctx: Brush, time: number) => void;
  touch?: (x: number, y: number, time: number) => void;
};

function seeded(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function ellipse(ctx: Brush, x: number, y: number, rx: number, ry: number, color: string, angle = 0) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, angle, 0, tau);
  ctx.fill();
}

function stroke(ctx: Brush, points: Point[], color: string, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.stroke();
}

function wash(ctx: Brush, top: string, bottom: string) {
  const gradient = ctx.createLinearGradient(0, 0, 0, scenicHeight);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, scenicWidth, scenicHeight);
}

function layer(paint: (ctx: Brush) => void, width = scenicWidth, height = scenicHeight) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * 1.4);
  canvas.height = Math.round(height * 1.4);
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.scale(canvas.width / width, canvas.height / height);
    paint(ctx);
  }
  return canvas;
}

const paper = () => layer(ctx => {
  const random = seeded(427);
  for (let i = 0; i < 26000; i++) {
    ctx.fillStyle = random() > .48 ? "#f8e3b824" : "#201d2320";
    ctx.fillRect(random() * 1000, random() * 560, .5 + random() * 2, .25 + random() * .8);
  }
});

function paintLayer(ctx: Brush, canvas: HTMLCanvasElement) {
  ctx.drawImage(canvas, 0, 0, scenicWidth, scenicHeight);
}

function ripple(ctx: Brush, x: number, y: number, age: number, width: number, color: string) {
  if (age < 0 || age > 2.8) return;
  const radius = width + age * 30;
  ctx.save();
  ctx.globalAlpha = Math.min(1, age * 5) * (1 - age / 2.8) * .74;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(x, y, radius, radius * .65, -.2, .1, 2.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, y, radius, radius * .65, -.2, 3.25, 5.7);
  ctx.stroke();
  ctx.restore();
}

function lily(ctx: Brush, x: number, y: number, size: number, angle: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ellipse(ctx, 3, 6, size * 1.02, size * .74, "#101e2980");
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.ellipse(0, 0, size, size * .72, 0, .26, tau - .42);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#bfd1977f";
  ctx.lineWidth = 1;
  ctx.stroke();
  for (let i = 1; i <= 9; i++) {
    const a = i * .57;
    stroke(ctx, [[0, 0], [Math.cos(a + .12) * size * .49, Math.sin(a) * size * .35], [Math.cos(a) * size * .9, Math.sin(a) * size * .63]], "#d1d2a03b");
  }
  ctx.restore();
}

function koi(ctx: Brush, x: number, y: number, heading: number, length: number, phase: number, pale: string, ink: string, pattern: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(heading);
  ctx.scale(length / 140, length / 140);
  const bend = (x: number) => Math.sin(phase + x * .035) * Math.max(0, (28 - x) / 113) ** 2 * 20;
  const tailY = bend(-69);
  ctx.fillStyle = pale + "bd";
  ctx.beginPath();
  ctx.moveTo(-59, bend(-59));
  ctx.quadraticCurveTo(-75, tailY - 9, -96, tailY - 22);
  ctx.quadraticCurveTo(-92, tailY - 3, -83, tailY + 1);
  ctx.quadraticCurveTo(-99, tailY + 9, -95, tailY + 20);
  ctx.quadraticCurveTo(-75, tailY + 7, -59, bend(-59) + 3);
  ctx.fill();
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(1, side);
    ctx.rotate(Math.sin(phase + side) * .14);
    ctx.fillStyle = pale + "a0";
    ctx.beginPath();
    ctx.moveTo(25, 10);
    ctx.quadraticCurveTo(10, 28, -8, 28);
    ctx.quadraticCurveTo(-10, 20, 9, 10);
    ctx.fill();
    for (let i = 0; i < 4; i++) stroke(ctx, [[21 - i * 2, 11], [-6 + i * 3, 26 - i * 2]], "#583c282d", .7);
    ctx.restore();
  }
  const silhouette = new Path2D();
  silhouette.moveTo(50, 0);
  silhouette.bezierCurveTo(46, -15, 20, -20, 2, -14);
  silhouette.quadraticCurveTo(-27, -11 + bend(-27), -71, bend(-71) - 3);
  silhouette.lineTo(-71, bend(-71) + 3);
  silhouette.quadraticCurveTo(-27, 11 + bend(-27), 2, 14);
  silhouette.bezierCurveTo(20, 20, 46, 15, 50, 0);
  ctx.fillStyle = pale;
  ctx.fill(silhouette);
  ctx.save();
  ctx.clip(silhouette);
  const random = seeded(pattern);
  for (const mark of [-42, -14, 18, 38]) {
    const a = random() * 8 - 4;
    const b = 6 + random() * 11;
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.moveTo(mark - b, bend(mark) + a);
    ctx.bezierCurveTo(mark - 16, -22, mark + b, -19, mark + b, a - 5);
    ctx.bezierCurveTo(mark + b + 2, 15, mark - 9, 21, mark - b, bend(mark) + a);
    ctx.fill();
  }
  for (let i = 0; i < 40; i++) {
    const sx = -56 + random() * 93;
    const sy = bend(sx) + random() * 27 - 13;
    ellipse(ctx, sx, sy, .6 + random(), .5, random() > .6 ? "#512f294d" : "#f9d79a69");
  }
  stroke(ctx, [[-64, bend(-64)], [-42, bend(-42)], [-20, bend(-20)], [5, 0], [24, -.4]], "#fff3cb62", 1.1);
  ctx.restore();
  ctx.strokeStyle = "#202c3369";
  ctx.lineWidth = 1.5;
  ctx.stroke(silhouette);
  ellipse(ctx, 38, -9, 2.1, 1.8, "#222728");
  ellipse(ctx, 38, 9, 2.1, 1.8, "#222728");
  ctx.restore();
}

function pond(): Scene {
  const random = seeded(537);
  const water = layer(ctx => {
    wash(ctx, "#18353d", "#34594e");
    for (let i = 0; i < 16; i++) {
      const x = random() * 1000, y = random() * 560, radius = 80 + random() * 220;
      const ink = ctx.createRadialGradient(x, y, 6, x, y, radius);
      ink.addColorStop(0, i % 2 ? "#a0a3622b" : "#0b233a7a");
      ink.addColorStop(1, "#17434a00");
      ctx.fillStyle = ink;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    for (let i = 0; i < 430; i++) {
      const x = random() * 1000, y = random() * 560, span = 3 + random() ** 3 * 43;
      stroke(ctx, [[x, y], [x + span * .62, y - .9], [x + span, y]], i % 4 ? "#acc8aa20" : "#d4ca9054", .5 + random() * .8);
    }
    for (let i = 0; i < 75; i++) {
      const x = 1000 - random() ** 2 * 230, y = 560 - random() * 270;
      const size = 2 + random() ** 2 * 13;
      ellipse(ctx, x, y, size * 1.7, size, i % 2 ? "#b2b09525" : "#b8bc7052", -.3);
    }
  });
  const plants = layer(ctx => {
    const pads: [number, number, number, number, string][] = [
      [50, 14, 83, .1, "#567d62"], [134, 6, 47, .9, "#466d61"], [29, 117, 45, -.2, "#547e69"],
      [103, 74, 45, 1.1, "#739064"], [179, 38, 28, .7, "#879766"], [23, 191, 24, -.7, "#697950"],
      [969, 421, 52, 1.6, "#648265"], [914, 494, 55, 2.4, "#749166"], [992, 529, 79, -2, "#506e5a"],
      [850, 542, 39, -.8, "#7f9363"], [957, 325, 27, 2, "#86a074"],
    ];
    pads.forEach(([x, y, size, angle, color]) => lily(ctx, x, y, size, angle, color));
    for (const [x, y, size] of [[139, 42, 18], [937, 469, 23]]) {
      for (let i = 0; i < 11; i++) {
        const a = i * tau / 11;
        ellipse(ctx, x + Math.cos(a) * size * .52, y + Math.sin(a) * size * .4, size * .64, size * .24, i % 3 ? "#e6cfbb" : "#ebdfbf", a);
      }
      ellipse(ctx, x, y, size * .27, size * .21, "#d8a861");
    }
  });
  const texture = paper();
  const reeds = Array.from({ length: 24 }, (_, i) => {
    const end = i < 12;
    return {
      x: end ? 879 + random() * 121 : random() * 38,
      y: end ? 536 + random() * 34 : 64 + random() * 150,
      length: 18 + random() ** 1.5 * 72,
      lean: (random() - .6) * 26 + (end ? -7 : 12),
      ink: i % 3 ? "#829d7780" : "#b2ac7280",
      phase: random() * tau,
    };
  });
  const fish = [
    { x: 465, y: 290, rx: 260, ry: 145, a: 1.1, v: .13, size: 141, pale: "#eadabc", ink: "#b34c39", pattern: 52 },
    { x: 545, y: 276, rx: 231, ry: 172, a: 3.7, v: -.12, size: 123, pale: "#d9c8a4", ink: "#a04f3d", pattern: 17 },
    { x: 490, y: 302, rx: 300, ry: 130, a: 5.7, v: .105, size: 113, pale: "#c49860", ink: "#855a49", pattern: 81 },
    { x: 507, y: 268, rx: 140, ry: 104, a: 2.75, v: -.17, size: 106, pale: "#ded4b7", ink: "#ad603e", pattern: 91 },
  ];
  let touches: { x: number; y: number; at: number }[] = [];
  return {
    touch(x, y, at) { touches = [...touches.slice(-7), { x, y, at }]; },
    draw(ctx, time) {
      paintLayer(ctx, water);
      fish.forEach((f, i) => {
        const a = f.a + f.v * time + .035 * Math.sin(time + i);
        const x = f.x + Math.cos(a) * f.rx, y = f.y + Math.sin(a) * f.ry;
        const heading = Math.atan2(Math.cos(a) * f.ry * f.v, -Math.sin(a) * f.rx * f.v);
        ellipse(ctx, x + 4, y + 8, f.size * .37, f.size * .095, "#12283548", heading);
        koi(ctx, x, y, heading, f.size, time * (3 + i * .2) + i, f.pale, f.ink, f.pattern);
        ripple(ctx, x, y, (time + i * 2.1) % 9, 15, "#cbd4a78c");
      });
      paintLayer(ctx, plants);
      for (const { x, y, length, lean, ink, phase } of reeds) {
        const bend = lean + Math.sin(time * 1.35 + phase) * length * .07;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + bend * .24, y - length * .63, x + bend, y - length);
        ctx.strokeStyle = ink;
        ctx.lineWidth = .7 + length * .012;
        ctx.stroke();
        if (length > 53) ellipse(ctx, x + bend, y - length, 1.9, 5.8, "#8d8154b0", bend * .018);
      }
      for (const { x, y, at } of touches) {
        for (let i = 0; i < 3; i++) ripple(ctx, x, y, time - at - i * .21, 3, "#d5e1b9");
      }
      paintLayer(ctx, texture);
    },
  };
}

function ridge(ctx: Brush, crest: Point[], color: string, round = false) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(...crest[0]);
  for (let i = 1; i < crest.length; i++) {
    const [x, y] = crest[i];
    const next = crest[i + 1];
    if (round && next) ctx.quadraticCurveTo(x, y, (x + next[0]) / 2, (y + next[1]) / 2);
    else ctx.lineTo(x, y);
  }
  ctx.lineTo(1000, 560);
  ctx.lineTo(0, 560);
  ctx.closePath();
  ctx.fill();
}

function plateau(): Scene {
  const random = seeded(19561);
  const landscape = layer(ctx => {
    wash(ctx, "#a3b6af", "#e6c592");
    ellipse(ctx, 772, 109, 46, 46, "#f5deb3");
    for (let i = 0; i < 46; i++) {
      const x = random() * 980, y = 41 + random() * 207;
      const length = 8 + random() ** 2 * 91;
      stroke(ctx, [[x, y], [x + length, y - 1]], "#f7e9c75d", .5 + random() * 1.7);
    }
    const crest: Point[] = [[0, 296], [54, 256], [107, 243], [154, 188], [181, 207], [239, 139], [273, 176], [301, 186], [351, 236], [400, 210], [443, 239], [505, 187], [542, 202], [616, 119], [639, 151], [672, 169], [717, 216], [759, 203], [805, 237], [862, 177], [886, 163], [921, 209], [1000, 225]];
    ridge(ctx, crest, "#829594");
    for (const face of [
      [[239,139],[273,176],[301,186],[351,236],[278,213],[249,172]],
      [[616,119],[639,151],[672,169],[717,216],[667,202],[621,165]],
      [[886,163],[921,209],[962,217],[977,246],[919,232]],
      [[154,188],[181,207],[193,223],[174,220]],
    ] as Point[][]) {
      ctx.fillStyle = "#c6c1a8";
      ctx.beginPath();
      face.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.fill();
    }
    ridge(ctx, [[0,311],[76,300],[153,317],[228,307],[313,263],[362,251],[446,275],[510,279],[622,306],[707,274],[779,268],[895,311],[1000,282]], "#647a73", true);
    ridge(ctx, [[0,408],[89,378],[172,378],[242,358],[318,323],[440,310],[487,293],[544,291],[628,314],[699,328],[805,310],[925,351],[1000,352]], "#505f50");
    ridge(ctx, [[0,410],[91,384],[172,385],[246,370],[325,334],[446,324],[540,307],[634,325],[700,345],[837,335],[923,360],[1000,360]], "#86905c");
    ridge(ctx, [[0,444],[121,428],[228,424],[313,406],[399,410],[485,433],[602,420],[737,393],[904,403],[1000,383]], "#66784d", true);
    ridge(ctx, [[0,483],[110,465],[290,455],[395,473],[575,472],[673,454],[800,462],[1000,432]], "#4c6547", true);
    for (let i = 0; i < 620; i++) {
      const x = random() * 1000, y = 346 + random() * 210;
      const verge = 431 - 45 * Math.sin(x / 520) + 14 * Math.sin(x * .018);
      if (y < verge || Math.sin(x * .021 + y * .026) + Math.sin(y * .053 - x * .008) < .12) continue;
      const grain = .6 + (y - verge) * .021;
      ellipse(ctx, x, y, grain + random() * .8, grain * .53, ["#e7c88160", "#c0a7bc61", "#f2e2b684"][i % 3], -.15);
    }
    for (let i = 0; i < 1200; i++) {
      const x = random() * 1000, y = 365 + random() * 195;
      if (y < 409 - Math.sin(x * .0027) * 58) continue;
      const length = 2 + random() * (y - 330) * .11;
      stroke(ctx, [[x, y], [x + length, y - length * .17]], i % 3 ? "#c0c28247" : "#25443561", .4 + random() * 1.2);
    }
  });
  const plants = Array.from({ length: 395 }, (_, i) => {
    const x = random() * 1015 - 7;
    const y = 410 + random() ** .75 * 174;
    const scale = (y - 375) / 196;
    const height = (11 + random() ** 2 * 93) * scale;
    const color = ["#e8d3aa", "#bcaac8", "#d7ae65", "#eee2c3", "#a699bf"][i % 5];
    return { x, y, height, scale, color, petals: i % 7 === 0 ? 0 : [5, 8, 6][i % 3], lean: (random() - .5) * 26 };
  }).sort((a, b) => a.y - b.y);
  const texture = paper();
  let gust = { x: 0, at: -20 };
  return {
    touch(x, _y, at) { gust = { x, at }; },
    draw(ctx, time) {
      paintLayer(ctx, landscape);
      for (const { x, y, height, scale, color, petals, lean } of plants) {
        const age = time - gust.at;
        const wave = age < 3 ? Math.exp(-Math.abs(Math.abs(x - gust.x) - age * 220) / 112) * (1 - age / 3) * 13 : 0;
        const bend = lean * scale + (Math.sin(time * 2.3 - x * .011 + y * .015) * (4 + 4 * Math.sin(time * .76 - x * .005)) + wave) * scale;
        const tip = x + bend;
        ctx.strokeStyle = petals ? "#abba795f" : "#a5b06498";
        ctx.lineWidth = .65 + 1.4 * scale;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + bend * .12, y - height * .65, tip, y - height);
        ctx.stroke();
        if (!petals) continue;
        const r = (1.6 + height * .065) * scale;
        if (height > 25) {
          ellipse(ctx, x - r, y - height * .43, r * 1.8, r * .42, "#a1a7689e", -.5);
          ellipse(ctx, x + r * 1.1, y - height * .61, r * 1.7, r * .48, "#c0bd765f", .56);
        }
        for (let i = 0; i < petals; i++) {
          const a = i * tau / petals + .32;
          ellipse(ctx, tip + Math.cos(a) * r * .9, y - height + Math.sin(a) * r * .57, r, r * (petals === 8 ? .28 : .4), color, a);
        }
        ellipse(ctx, tip, y - height, r * .46, r * .36, "#936d45");
      }
      paintLayer(ctx, texture);
    },
  };
}

function grove(): Scene {
  const random = seeded(2013);
  const wood = layer(ctx => {
    wash(ctx, "#242c43", "#182d39");
    const clearing = ctx.createRadialGradient(584, 226, 7, 584, 226, 428);
    clearing.addColorStop(0, "#9b8b77");
    clearing.addColorStop(.36, "#506368");
    clearing.addColorStop(1, "#24314300");
    ctx.fillStyle = clearing;
    ctx.fillRect(0, 0, 1000, 480);
    ellipse(ctx, 618, 119, 23, 23, "#e1cf9c");
    for (let i = 0; i < 96; i++) {
      const x = random() * 1000, y = 253 + random() * 88;
      const width = 2 + random() ** 2 * 14 + Math.abs(x - 535) * .012;
      const lean = (random() - .5) * 58;
      ctx.fillStyle = ["#283e48", "#334850", "#40565b", "#1e3541"][i % 4];
      ctx.beginPath();
      ctx.moveTo(x - width, y);
      ctx.quadraticCurveTo(x - width / 2, y * .5, x + lean, -26);
      ctx.lineTo(x + lean + width * .55, -26);
      ctx.quadraticCurveTo(x + width / 3, y * .5, x + width, y);
      ctx.fill();
      if (i % 4 === 0) stroke(ctx, [[x, y - 91], [x + lean * .3, y - 169], [x + lean - 60, y - 224]], "#263944", 3);
    }
    ridge(ctx, [[0,222],[148,256],[297,286],[412,300],[520,307],[632,282],[761,280],[861,248],[1000,213]], "#263d47", true);
    for (let i = 0; i < 490; i++) {
      const x = random() * 1000;
      const bank = 288 - Math.abs(x - 510) * .105;
      const y = bank + random() * 28;
      const width = 2 + random() ** 2 * 21;
      ellipse(ctx, x, y, width, width * .24, i % 3 ? "#53695c49" : "#71816965", -.3);
    }
    ridge(ctx, [[0,255],[148,267],[297,309],[412,306],[520,321],[632,295],[761,291],[861,259],[1000,228]], "#1c3541", true);
    for (let i = 0; i < 520; i++) {
      const y = 308 + random() * 225, x = random() * 1000;
      const length = (2 + random() ** 2 * 40) * (y - 280) / 160;
      stroke(ctx, [[x, y], [x + length, y]], Math.abs(x - 610) < 75 ? "#c6b89455" : "#799a9349", .6 + random() * 1.2);
    }
    for (const [x, start, width, tilt] of [[65, 546, 68, -104], [944, 517, 49, 89], [131, 314, 27, 12]]) {
      ctx.fillStyle = "#182631";
      ctx.beginPath();
      ctx.moveTo(x - width, start);
      ctx.quadraticCurveTo(x, start * .55, x + tilt, -10);
      ctx.lineTo(x + tilt + width * .8, -10);
      ctx.quadraticCurveTo(x + width * .2, start * .65, x + width, start);
      ctx.fill();
      for (let i = 0; i < 13; i++) {
        const offset = (random() - .5) * width * .6;
        stroke(ctx, [[x + offset, start - 6], [x + offset + tilt * .06, start * .66], [x + offset + tilt * .62, start * .24]], "#66716639", 1 + random() * 2);
      }
    }
    ridge(ctx, [[0,472],[94,456],[153,508],[247,531],[377,543],[508,550],[680,533],[844,510],[953,447],[1000,460]], "#182b35");
    for (let i = 0; i < 160; i++) {
      const x = random() * 1000, y = 548 + random() * 65 - Math.abs(x - 490) * .13;
      const h = 14 + random() ** 2 * 77;
      const side = x < 490 ? 1 : -1;
      ctx.strokeStyle = i % 3 ? "#687c5a70" : "#a99e6f75";
      ctx.lineWidth = .8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x - side * h * .08, y - h * .7, x + side * h * .27, y - h);
      ctx.stroke();
      if (h > 43) {
        for (let j = 1; j < 6; j++) {
          const fraction = j / 6;
          ellipse(ctx, x + side * (fraction - .45) * h * .34, y - h * fraction, h * .125 * (1 - fraction), 1.5, "#7486609b", side * .35);
        }
      }
    }
  });
  const texture = paper();
  const flies = Array.from({ length: 36 }, () => ({
    x: 89 + random() * 822, y: 197 + random() ** .7 * 350,
    phase: random() * tau, speed: .22 + random() * .62, size: 1 + random() * 2.2,
  }));
  const glow = layer(ctx => {
    const light = ctx.createRadialGradient(24, 24, .5, 24, 24, 24);
    light.addColorStop(0, "#fff5bc");
    light.addColorStop(.17, "#eed486df");
    light.addColorStop(.38, "#d2b76c61");
    light.addColorStop(1, "#dfc48200");
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, 48, 48);
  }, 48, 48);
  return {
    draw(ctx, time) {
      paintLayer(ctx, wood);
      for (const {x, y, phase, speed, size} of flies) {
        const a = time * speed + phase;
        const pulse = Math.max(0, Math.sin(time * (1 + speed) + phase)) ** 2.3;
        if (pulse < .013) continue;
        const px = x + 28 * Math.sin(a) + 11 * Math.sin(a * 1.41), py = y + 14 * Math.cos(a * 1.12) + 8 * Math.sin(a * .58);
        const radius = size * 5;
        ctx.globalAlpha = pulse;
        ctx.drawImage(glow, px - radius, py - radius, radius * 2, radius * 2);
        if (py > 331 && px > 240 && px < 850) {
          ellipse(ctx, px + 3 * Math.sin(time), Math.min(532, 426 + (py - 330) * .56), size * 1.8, .85, "#ecd39052");
        }
      }
      ctx.globalAlpha = 1;
      paintLayer(ctx, texture);
    },
  };
}

export function createScenicPainter(id: ScenicId): Scene {
  switch (id) {
    case "pond": return pond();
    case "plateau": return plateau();
    case "grove": return grove();
  }
}
