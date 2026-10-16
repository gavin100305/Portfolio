export type AsciiCell = {
  x: number; y: number; strength: number; accent: boolean;
  seed: number; delay: number; kind?: "cursor" | "star";
};

export const DESK_WIDTH = 1000;
export const DESK_HEIGHT = 560;
const random = (value: number) => { const n = Math.sin(value * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };

/** Original scene geometry is sampled into stippled dots, never displayed as an image. */
export function createDeskCells(columns: number): AsciiCell[] {
  const source = document.createElement("canvas");
  source.width = DESK_WIDTH; source.height = DESK_HEIGHT;
  const ctx = source.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, DESK_WIDTH, DESK_HEIGHT);
  const gray = (value: number) => `rgb(${value} ${value} ${value})`;
  const polygon = (points: number[][], fill: number, stroke = 150, width = 5) => {
    ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
    ctx.fillStyle = gray(fill); ctx.fill(); ctx.strokeStyle = gray(stroke); ctx.lineWidth = width; ctx.stroke();
  };
  const line = (points: number[][], value = 140, width = 5) => {
    ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.strokeStyle = gray(value); ctx.lineWidth = width; ctx.lineJoin = "round"; ctx.stroke();
  };
  const box = (x: number, y: number, w: number, h: number, fill: number, stroke: number, radius = 0) => {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fillStyle = gray(fill); ctx.fill();
    ctx.strokeStyle = gray(stroke); ctx.lineWidth = 5; ctx.stroke();
  };

  // Recessed observation window, with a distant ringed planet.
  box(605, 52, 275, 286, 14, 180, 16);
  box(619, 66, 247, 258, 0, 95, 7);
  ctx.save(); ctx.beginPath(); ctx.rect(625, 72, 235, 246); ctx.clip();
  for (let i = 0; i < 42; i++) {
    const x = 630 + random(i + 9) * 220, y = 78 + random(i + 84) * 232;
    ctx.fillStyle = gray(60 + random(i + 20) * 90); ctx.fillRect(x, y, i % 8 === 0 ? 5 : 3, 4);
  }
  ctx.save(); ctx.translate(754, 170); ctx.rotate(-.34);
  ctx.beginPath(); ctx.ellipse(0, 0, 93, 26, 0, Math.PI, Math.PI * 2);
  ctx.strokeStyle = gray(155); ctx.lineWidth = 7; ctx.stroke();
  ctx.restore();
  const sphere = ctx.createRadialGradient(730, 143, 5, 767, 179, 74);
  sphere.addColorStop(0, gray(150)); sphere.addColorStop(.55, gray(70)); sphere.addColorStop(1, gray(12));
  ctx.beginPath(); ctx.arc(754, 170, 56, 0, Math.PI * 2); ctx.fillStyle = sphere; ctx.fill(); ctx.strokeStyle = gray(120); ctx.lineWidth = 4; ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.arc(754, 170, 53, 0, Math.PI * 2); ctx.clip();
  line([[699, 151], [728, 148], [790, 162], [811, 160]], 40, 10);
  line([[701, 180], [732, 174], [776, 184], [808, 187]], 38, 8);
  ctx.restore();
  ctx.save(); ctx.translate(754, 170); ctx.rotate(-.34);
  ctx.beginPath(); ctx.ellipse(0, 0, 93, 26, 0, 0, Math.PI); ctx.strokeStyle = gray(180); ctx.lineWidth = 7; ctx.stroke();
  ctx.restore(); ctx.restore();
  polygon([[605, 324], [880, 324], [895, 341], [591, 341]], 70, 150, 4);
  polygon([[591, 341], [895, 341], [895, 350], [591, 350]], 36, 90, 3);
  line([[615, 64], [615, 320]], 200, 4);

  // Desk, drawn in a consistent shallow perspective.
  // Rear-left support is visible beneath the receding edge of the tabletop.
  polygon([[149, 402], [169, 411], [169, 493], [149, 484]], 27, 85, 3);
  line([[169, 489], [250, 528]], 48, 3);
  polygon([[128, 391], [780, 391], [912, 451], [232, 451]], 24, 135, 5);
  polygon([[232, 451], [912, 451], [912, 465], [232, 465]], 55, 130, 5);
  polygon([[250, 466], [270, 466], [270, 533], [250, 533]], 32, 100, 4);
  polygon([[838, 466], [857, 466], [857, 533], [838, 533]], 32, 100, 4);
  line([[270, 516], [838, 516]], 50, 3);

  // Small plant and two books on the far side of the desk.
  box(133, 350, 45, 39, 44, 105, 3);
  line([[155, 350], [155, 295]], 105, 5);
  polygon([[154, 329], [129, 311], [120, 280], [145, 297]], 70, 115, 4);
  polygon([[156, 318], [166, 288], [187, 273], [181, 305]], 85, 135, 4);
  polygon([[155, 341], [176, 325], [195, 326], [180, 340]], 55, 100, 3);
  polygon([[184, 372], [239, 372], [259, 386], [202, 386]], 58, 105, 3);
  line([[202, 387], [259, 387]], 160, 3);

  // CRT case: front, side, top, inset glass, vents, floppy slot, and stand.
  polygon([[238, 188], [291, 157], [509, 157], [456, 188]], 100, 200, 6);
  polygon([[456, 188], [509, 157], [509, 335], [456, 368]], 67, 155, 5);
  box(238, 188, 218, 180, 55, 195, 10);
  box(252, 202, 190, 133, 100, 165, 11);
  box(263, 212, 167, 111, 3, 150, 13);
  line([[275, 224], [412, 224]], 48, 3);
  line([[269, 230], [269, 307]], 35, 3);
  for (let i = 0; i < 7; i++) line([[476, 216 + i * 13], [497, 204 + i * 13]], 145, 4);
  box(256, 346, 91, 8, 3, 115, 1);
  line([[362, 348], [396, 348]], 125, 4);
  polygon([[314, 371], [386, 371], [402, 395], [300, 395]], 75, 155, 4);
  line([[296, 396], [408, 396]], 160, 4);

  // Keyboard with individual keys, mouse and its loose cable.
  polygon([[248, 403], [437, 403], [488, 437], [273, 437]], 42, 155, 4);
  for (let row = 0; row < 3; row++) for (let key = 0; key < 11; key++) {
    const x = 259 + row * 9 + key * 16, y = 406 + row * 8;
    polygon([[x,y],[x+12,y],[x+16,y+5],[x+4,y+5]], 105, 170, 1.5);
  }
  polygon([[321,430],[399,430],[405,435],[327,435]], 125, 200, 2);
  line([[274,440],[489,440]], 85, 3);
  ctx.beginPath(); ctx.moveTo(553, 397); ctx.bezierCurveTo(600, 360, 565, 345, 505, 359);
  ctx.strokeStyle = gray(110); ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(557, 415, 23, 17, .35, 0, Math.PI * 2); ctx.fillStyle = gray(75); ctx.fill(); ctx.strokeStyle = gray(190); ctx.lineWidth = 4; ctx.stroke();
  line([[550,400],[555,414],[578,418]], 170, 2.5);
  line([[552,403],[556,408]], 220, 3);

  // Mug and a little steam. No extra ornamental UI around the scene.
  ctx.beginPath(); ctx.ellipse(711, 382, 29, 9, 0, 0, Math.PI * 2); ctx.strokeStyle = gray(45); ctx.lineWidth = 5; ctx.stroke();
  box(688, 345, 42, 36, 44, 150, 5);
  ctx.beginPath(); ctx.ellipse(709, 346, 21, 6, 0, 0, Math.PI * 2); ctx.fillStyle = gray(0); ctx.fill(); ctx.strokeStyle = gray(150); ctx.lineWidth = 4; ctx.stroke();
  line([[732, 352], [744, 353], [744, 370], [732, 372]], 135, 4);
  line([[698, 331], [694, 321], [701, 312], [698, 303]], 62, 3);
  line([[715, 333], [720, 323], [715, 315]], 45, 3);

  // Rasterize small cobalt details into the same dot grid as the case.
  const accentCanvas = document.createElement("canvas");
  accentCanvas.width = DESK_WIDTH; accentCanvas.height = DESK_HEIGHT;
  const ink = accentCanvas.getContext("2d");
  if (!ink) return [];
  ink.fillStyle = "white"; ink.font = "bold 16px monospace";
  ink.fillText("> build", 279, 252); ink.fillText("ready_", 279, 280);
  ink.beginPath(); ink.arc(420, 351, 4, 0, Math.PI * 2); ink.fill();
  for (const [x,y] of [[657,110],[831,248],[672,268]]) {
    ink.fillRect(x-4,y-1.5,8,3); ink.fillRect(x-1.5,y-4,3,8);
  }
  const pixels = ctx.getImageData(0, 0, DESK_WIDTH, DESK_HEIGHT).data;
  const accents = ink.getImageData(0, 0, DESK_WIDTH, DESK_HEIGHT).data;
  const rows = Math.round(columns * DESK_HEIGHT / DESK_WIDTH);
  const cellWidth = DESK_WIDTH / columns, cellHeight = DESK_HEIGHT / rows;
  const cells: AsciiCell[] = [];
  for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
    const x = (col + .5) * cellWidth, y = (row + .5) * cellHeight;
    let brightness = 0, blue = 0;
    for (const [dx, dy] of [[0,0],[-1,-1],[1,1],[-1,1],[1,-1]]) {
      const index = (Math.max(0, Math.min(559, Math.floor(y+dy))) * 1000 + Math.max(0, Math.min(999, Math.floor(x+dx)))) * 4;
      brightness += pixels[index]; blue += accents[index+3];
    }
    brightness /= 1275; blue /= 1275;
    if (brightness < .025 && blue < .08) continue;
    const seed = random(row * columns + col);
    cells.push({ x: col, y: row, strength: blue > .08 ? Math.max(.4,blue) : brightness, accent: blue > .08, kind: blue > .08 && x > 600 ? "star" : undefined, seed, delay: blue > .08 ? 1700 : y > 385 ? 0 : x < 560 ? 420 : 850 });
  }
  return cells;
}
