import { createPondRipples } from "./artwork-ripples";

const tau = Math.PI * 2;
type Point = readonly [number, number];

const links = 32;
const shoulder = 9;

// Positions are at the shoulder; dorsal photographs run from tail to nose.
const koi = [
  { asset: 1, x: 435, y: 180, heading: 2.85, size: 105, frequency: 1.15, seed: .44, opacity: .78 },
  { asset: 1, x: 573, y: 349, heading: -.32, size: 120, frequency: 1.02, seed: .09, opacity: .84 },
  { asset: 2, x: 756, y: 312, heading: 2.3, size: 165, frequency: .93, seed: .71, opacity: .91 },
  { asset: 0, x: 257, y: 170, heading: -.68, size: 187, frequency: .98, seed: .32, opacity: .95 },
];
type Koi = (typeof koi)[number];

function bodyAt(fish: Koi, x: number, y: number, heading: number, bend: number, phase: number, effort: number) {
  const joints: Point[] = [[0, 0]];
  const length = fish.size / links;
  for (let i = 0; i < links; i++) {
    const u = (i + .5) / links;
    const stroke = Math.sin(phase - u * 4.9) * (.055 + .98 * u ** 1.55) * effort;
    const tangent = heading - bend * (u - .22) + stroke;
    const [px, py] = joints[i];
    joints.push([px - length * Math.cos(tangent), py - length * Math.sin(tangent)]);
  }
  const dx = x - joints[shoulder][0], dy = y - joints[shoulder][1];
  return joints.map(([px, py]): Point => [px + dx, py + dy]);
}

export function createPondSwim() {
  const ripples = createPondRipples();
  const swimmers = koi.map(fish => {
    const phase = fish.seed * tau;
    return { ...fish, phase, effort: .8, speed: fish.size * .19, turn: 0,
      joints: bodyAt(fish, fish.x, fish.y, fish.heading, 0, phase, .8) };
  });

  function disturb(time: number, dt: number) {
    // Read all positions before advancing any fish, including when two meet.
    const positions = swimmers.map(({ x, y }) => [x, y]);
    for (const [i, fish] of swimmers.entries()) {
      const previous = fish.joints;
      const heading = fish.heading;
      const forwardX = Math.cos(heading), forwardY = Math.sin(heading);
      const lookX = fish.x + forwardX * fish.size * .88;
      const lookY = fish.y + forwardY * fish.size * .88;
      let steerX = Math.max(0, (238 - lookX) / 68) - Math.max(0, (lookX - 762) / 68);
      let steerY = Math.max(0, (177 - lookY) / 52) - Math.max(0, (lookY - 385) / 52);
      for (const [j, [x, y]] of positions.entries()) {
        if (j === i) continue;
        const dx = lookX - x, dy = lookY - y;
        const range = Math.max(1, Math.hypot(dx, dy));
        const avoid = Math.max(0, 1 - range / (fish.size * .83));
        steerX += avoid * dx / range;
        steerY += avoid * dy / range;
      }
      // Near a bank, keep steering toward open water until the shoulder clears
      // the margin. Looking ahead alone can release a turn too early.
      steerX += (Math.max(0, 210 - fish.x) - Math.max(0, fish.x - 790)) / 40;
      steerY += (Math.max(0, 145 - fish.y) - Math.max(0, fish.y - 417)) / 32;
      const wander = Math.sin(.39 * time + fish.seed * 15) * .22
        + Math.sin(.14 * time + fish.seed * 29) * .19;
      const side = forwardX * steerY - forwardY * steerX;
      const ahead = forwardX * steerX + forwardY * steerY;
      // Hold the turning side in a head-on encounter while the obstacle is
      // directly ahead. Tiny changes in bearing can otherwise reverse the turn.
      const bearing = Math.atan2(side + .04 * Math.sin(fish.seed * 15), .58 + ahead);
      const desiredTurn = wander + (ahead < -.68 && Math.abs(side) < .35 && Math.abs(fish.turn) > .09
        ? Math.sign(fish.turn) * Math.abs(bearing) : bearing);
      const turnLimit = .28 + 1.75 * fish.speed / fish.size;
      fish.turn += (Math.max(-turnLimit, Math.min(turnLimit, desiredTurn)) - fish.turn) * dt * 2.2;

      const burst = Math.sin(time * (1.24 + fish.seed * .24) + fish.seed * 14)
        + .43 * Math.sin(time * .57 + fish.seed * 29);
      const effort = Math.min(1, Math.max(.09, .51 + burst * .52 + Math.abs(fish.turn) * .28));
      fish.effort += (effort - fish.effort) * dt * 3.6;
      fish.phase += tau * fish.frequency * (.69 + .46 * fish.effort) * dt;
      fish.heading += fish.turn * dt;
      const bend = Math.tanh(fish.turn * 2.2) * 1.17;
      const joints = bodyAt(fish, fish.x, fish.y, fish.heading, bend, fish.phase, fish.effort);

      // Tail velocity relative to the shoulder supplies thrust. During recovery
      // drag bleeds off momentum, so a quiet tail cannot tow the body forward.
      const tail = joints[links], oldTail = previous[links];
      const rotationalSweep = fish.turn * ((oldTail[0] - fish.x) * forwardX + (oldTail[1] - fish.y) * forwardY);
      const lateral = ((oldTail[0] - tail[0]) * forwardY + (tail[1] - oldTail[1]) * forwardX) / dt - rotationalSweep;
      const thrust = Math.min(fish.size * 1.5, Math.abs(lateral)) * .52;
      const braking = Math.max(0, -ahead);
      fish.speed += (thrust / (1 + braking) - fish.speed * (.66 + braking + fish.speed / fish.size)) * dt;
      const travel = fish.speed * dt;
      const dx = Math.cos(fish.heading) * travel, dy = Math.sin(fish.heading) * travel;
      fish.x += dx;
      fish.y += dy;
      fish.joints = joints.map(([x, y]): Point => [x + dx, y + dy]);
      // The shoulder parts water, the flank carries it, and the narrow tail
      // sweeps it sideways. Use actual joint velocities, including in turns.
      for (const [joint, radius] of [[4, .080], [15, .068], [27, .047], [32, .033]]) {
        const [x, y] = fish.joints[joint];
        const [px, py] = previous[joint];
        ripples.push(x, y, (x - px) / dt, (y - py) / dt, fish.size * radius);
      }
    }
  }

  function draw(ctx: CanvasRenderingContext2D, images: HTMLImageElement[], time: number) {
    ripples.advance(time, disturb);
    for (const fish of swimmers) {
      const { joints, phase, effort } = fish;
      const sprite = images[fish.asset];
      const thickness = fish.size * sprite.height / sprite.width;
      const slices = links;
      const sourceSlice = sprite.width / slices;
      const slice = fish.size / slices;
      let start = joints[links];
      ctx.save();
      ctx.globalAlpha = fish.opacity;
      for (let j = 0; j < slices; j++) {
        const end = joints[links - j - 1];
        const x = (end[0] - start[0]) / slice;
        const y = (end[1] - start[1]) / slice;
        ctx.save();
        ctx.transform(x, y, -y, x, start[0], start[1]);
        const u = (j + .5) / slices;
        const fin = Math.exp(-(((u - .72) / .087) ** 2));
        if (fin > .02) {
          // The pectoral tips fan outward from a fixed root beside the gills.
          // Move only the outer rows so the trunk keeps its width.
          ctx.drawImage(sprite, j * sourceSlice, sprite.height * .21, sourceSlice, sprite.height * .58,
            0, -thickness * .29, slice + .6, thickness * .58);
          for (const side of [-1, 1]) {
            const beat = Math.sin(phase + side * .56);
            ctx.save();
            ctx.translate(0, side * thickness * .29);
            ctx.transform(1, 0, side * fin * (.28 + .48 * beat), 1 + fin * (.18 + .23 * beat) * (.7 + .3 * effort), 0, 0);
            ctx.drawImage(sprite, j * sourceSlice, side < 0 ? 0 : sprite.height * .79, sourceSlice, sprite.height * .21,
              0, side < 0 ? -thickness * .21 : 0, slice + .6, thickness * .21);
            ctx.restore();
          }
        } else {
          ctx.drawImage(sprite, j * sourceSlice, 0, sourceSlice, sprite.height,
            0, -.5 * thickness, slice + .6, thickness);
        }
        ctx.restore();
        start = end;
      }
      ctx.restore();
    }
  }

  return { draw, normals: ripples.normals };
}
