import { createPondRipples } from "./artwork-ripples";

const tau = Math.PI * 2;
type Point = readonly [number, number];

const links = 32;
const shoulder = 9;

// Positions are at the shoulder; dorsal photographs run from tail to nose.
const koi = [
  { asset: 2, x: 645, y: 70, heading: .82, size: 83, frequency: 1.24, seed: .83, opacity: .55 },
  { asset: 0, x: 342, y: 352, heading: 2.48, size: 91, frequency: 1.36, seed: .56, opacity: .60 },
  { asset: 1, x: 898, y: 192, heading: -.95, size: 97, frequency: 1.18, seed: .96, opacity: .67 },
  { asset: 2, x: 120, y: 478, heading: -.25, size: 104, frequency: 1.09, seed: .19, opacity: .72 },
  { asset: 1, x: 435, y: 180, heading: 2.85, size: 105, frequency: 1.15, seed: .44, opacity: .78 },
  { asset: 1, x: 573, y: 349, heading: -.32, size: 120, frequency: 1.02, seed: .09, opacity: .84 },
  { asset: 2, x: 756, y: 312, heading: 2.3, size: 165, frequency: .93, seed: .71, opacity: .91 },
  { asset: 0, x: 257, y: 170, heading: -.68, size: 187, frequency: .98, seed: .32, opacity: .95 },
];
type Koi = (typeof koi)[number];

// Spine landmarks from tail to nose, expressed as fractions of each photograph.
// The source fish are already curved. Align their spines before bending them.
const spines = [
  [.32, .40, .44, .46, .47, .44, .42, .39, .39, .40, .40],
  [.35, .37, .43, .47, .46, .44, .45, .45, .46, .43, .39],
  [.22, .46, .53, .59, .62, .60, .52, .43, .40, .38, .41],
];

function bodyAt(fish: Koi, x: number, y: number, heading: number, bend: number, phase: number, effort: number) {
  const joints: Point[] = [[0, 0]];
  const length = fish.size / links;
  for (let i = 0; i < links; i++) {
    const u = (i + .5) / links;
    const stroke = Math.sin(phase - u * 4.6) * (.018 + .79 * u ** 2) * effort;
    const tangent = heading - bend * (u ** 1.5 - .14) + stroke;
    const [px, py] = joints[i];
    joints.push([px - length * Math.cos(tangent), py - length * Math.sin(tangent)]);
  }
  const dx = x - joints[shoulder][0], dy = y - joints[shoulder][1];
  return joints.map(([px, py]): Point => [px + dx, py + dy]);
}

export function createPondSwim(
  worldWidth = 1000, worldHeight = 562.5,
  options?: { lane: number; spacing: number; rippleColumns: number },
) {
  const ripples = createPondRipples(worldWidth, worldHeight, options?.rippleColumns);
  const population = options ? Math.max(4, Math.ceil(worldHeight / options.spacing)) : koi.length;
  const swimmers = Array.from({ length: population }, (_, i) => {
    const original = koi[(i + (options?.lane ?? 0) * 3) % koi.length];
    const fish = options ? {
      ...original,
      x: worldWidth * (.42 + .13 * Math.sin(i * 2.399)),
      y: worldHeight * (i + (options.lane ? .68 : .37)) / population,
      heading: (options.lane ? -1 : 1) * Math.PI * .5 + .36 * Math.sin(i * 3.1 + options.lane),
      size: Math.min(original.size, worldWidth * .60),
      seed: (original.seed + i * .618 + options.lane * .33) % 1,
    } : { ...original, x: original.x * worldWidth / 1000, y: original.y * worldHeight / 562.5 };
    const phase = fish.seed * tau;
    return { ...fish, phase, effort: .8, speed: fish.size * .19, turn: 0,
      joints: bodyAt(fish, fish.x, fish.y, fish.heading, 0, phase, .8) };
  });

  const footprint = document.createElement("canvas");
  const resolution = 1.5;
  footprint.width = footprint.height = Math.ceil(Math.max(...swimmers.map(fish => fish.size)) * 2 * resolution);
  const brush = footprint.getContext("2d")!;
  const center = footprint.width * .5;

  function disturb(time: number, dt: number) {
    // Read all positions before advancing any fish, including when two meet.
    const positions = swimmers.map(({ x, y }) => [x, y]);
    for (const [i, fish] of swimmers.entries()) {
      const previous = fish.joints;
      const heading = fish.heading;
      const forwardX = Math.cos(heading), forwardY = Math.sin(heading);
      const lookX = fish.x + forwardX * fish.size * .88;
      const lookY = fish.y + forwardY * fish.size * .88;
      const margin = fish.size * .72 + 12;
      let steerX = (Math.max(0, margin - lookX) - Math.max(0, lookX - (worldWidth - margin))) / 38;
      let steerY = (Math.max(0, margin - lookY) - Math.max(0, lookY - (worldHeight - margin))) / 38;
      for (const [j, [x, y]] of positions.entries()) {
        if (j === i) continue;
        const dx = lookX - x, dy = lookY - y;
        const range = Math.max(1, Math.hypot(dx, dy));
        const proximity = Math.max(0, 1 - range / (fish.size * .83));
        const sameDepth = Math.exp(-8 * Math.abs(fish.opacity - swimmers[j].opacity));
        const avoid = proximity * sameDepth;
        steerX += avoid * dx / range;
        steerY += avoid * dy / range;
      }
      // Near a bank, keep steering toward open water until the shoulder clears
      // the margin. Looking ahead alone can release a turn too early.
      steerX += (Math.max(0, margin - fish.x) - Math.max(0, fish.x - (worldWidth - margin))) / 40;
      steerY += (Math.max(0, margin - fish.y) - Math.max(0, fish.y - (worldHeight - margin))) / 32;
      const wander = Math.sin(.39 * time + fish.seed * 15) * .22
        + Math.sin(.14 * time + fish.seed * 29) * .19;
      const side = forwardX * steerY - forwardY * steerX;
      const ahead = forwardX * steerX + forwardY * steerY;
      // Hold the turning side in a head-on encounter while the obstacle is
      // directly ahead. Tiny changes in bearing can otherwise reverse the turn.
      const bearing = Math.atan2(side + .04 * Math.sin(fish.seed * 15), .58 + ahead);
      const desiredTurn = wander + (ahead < -.68 && Math.abs(side) < .35 && Math.abs(fish.turn) > .09
        ? Math.sign(fish.turn) * Math.abs(bearing) : bearing);
      const turnLimit = .46 + 1.45 * fish.speed / fish.size;
      fish.turn += (Math.max(-turnLimit, Math.min(turnLimit, desiredTurn)) - fish.turn) * dt * 2.2;

      const burst = Math.sin(time * (1.24 + fish.seed * .24) + fish.seed * 14)
        + .43 * Math.sin(time * .57 + fish.seed * 29);
      const effort = Math.min(1, Math.max(.09, .51 + burst * .52 + Math.abs(fish.turn) * .28));
      fish.effort += (effort - fish.effort) * dt * 3.6;
      fish.phase += tau * fish.frequency * (.69 + .46 * fish.effort) * dt;
      fish.heading += fish.turn * dt;
      const bend = Math.tanh(fish.turn / (.23 + fish.speed / fish.size)) * .96;
      const joints = bodyAt(fish, fish.x, fish.y, fish.heading, bend, fish.phase, fish.effort);

      // Tail velocity relative to the shoulder supplies thrust. During recovery
      // drag bleeds off momentum, so a quiet tail cannot tow the body forward.
      const tail = joints[links], oldTail = previous[links];
      const rotationalSweep = fish.turn * ((oldTail[0] - fish.x) * forwardX + (oldTail[1] - fish.y) * forwardY);
      const lateral = ((oldTail[0] - tail[0]) * forwardY + (tail[1] - oldTail[1]) * forwardX) / dt - rotationalSweep;
      const thrust = Math.min(fish.size * 1.5, Math.abs(lateral)) * .63;
      const braking = Math.max(0, -ahead);
      fish.speed += (thrust / (1 + braking) - fish.speed * (.66 + braking + fish.speed / fish.size)) * dt;
      const travel = fish.speed * dt;
      const dx = Math.cos(fish.heading) * travel, dy = Math.sin(fish.heading) * travel;
      fish.x += dx;
      fish.y += dy;
      fish.joints = joints.map(([x, y]): Point => [x + dx, y + dy]);
      // Forward travel displaces water outward on either side of the head.
      // The tail sheds a reversing lateral pulse as it flexes across the spine.
      const wake = fish.opacity ** 4;
      const normalX = -Math.sin(fish.heading), normalY = Math.cos(fish.heading);
      const [bowX, bowY] = fish.joints[5];
      for (const side of [-1, 1]) {
        const offset = side * fish.size * .065;
        ripples.push(bowX + normalX * offset, bowY + normalY * offset,
          wake * fish.speed * (.35 * forwardX + side * normalX),
          wake * fish.speed * (.35 * forwardY + side * normalY), fish.size * .092);
      }
      const [tailX, tailY] = fish.joints[links];
      ripples.push(tailX, tailY, wake * lateral * normalX, wake * lateral * normalY,
        Math.max(6, fish.size * .058));
    }
  }

  function draw(ctx: CanvasRenderingContext2D, images: HTMLImageElement[], time: number, opacity = 1, emerging = false) {
    ripples.advance(time, disturb);
    ctx.save();
    for (const fish of swimmers) {
      const { joints } = fish;
      const sprite = images[fish.asset];
      const thickness = fish.size * sprite.height / sprite.width * (fish.asset === 2 ? .88 : 1);
      const sourceSlice = sprite.width / links;
      const slice = fish.size / links;
      const spine = spines[fish.asset];

      // Assemble opaque slices on their own layer so overlapping strips
      // cannot darken into ribs when the whole fish is composited underwater.
      brush.setTransform(1, 0, 0, 1, 0, 0);
      brush.clearRect(0, 0, footprint.width, footprint.height);
      brush.setTransform(resolution, 0, 0, resolution, center - fish.x * resolution, center - fish.y * resolution);
      for (let j = 0; j < links; j++) {
        const start = joints[links - j], end = joints[links - j - 1];
        const dx = (end[0] - start[0]) / slice;
        const dy = (end[1] - start[1]) / slice;
        const coordinate = (j + .5) * (spine.length - 1) / links;
        const index = Math.floor(coordinate);
        const axis = spine[index] + (spine[index + 1] - spine[index]) * (coordinate - index);
        brush.save();
        brush.transform(dx, dy, -dy, dx, start[0], start[1]);
        brush.drawImage(sprite, j * sourceSlice, 0, sourceSlice, sprite.height,
          0, -axis * thickness, slice + .7, thickness);
        brush.restore();
      }
      const rise = emerging ? Math.min(1, Math.max(0, (time - fish.seed * .65) / .95)) : 1;
      ctx.globalAlpha = fish.opacity * opacity * rise * (2 - rise);
      const size = footprint.width / resolution;
      ctx.drawImage(footprint, fish.x - size / 2, fish.y - size / 2, size, size);
    }
    ctx.restore();
  }

  return { draw, normals: ripples.normals };
}
