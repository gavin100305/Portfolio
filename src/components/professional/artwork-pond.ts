import { createPondRipples } from "./artwork-ripples";

const tau = Math.PI * 2;
type Point = readonly [number, number];

function cubicSpline(a: number, b: number, c: number, d: number, t: number) {
  const back = 1 - t;
  return (back ** 3 * a + (4 - 6 * t * t + 3 * t ** 3) * b
    + (1 + 3 * t + 3 * t * t - 3 * t ** 3) * c + t ** 3 * d) / 6;
}

function makeTrack(waypoints: Point[]) {
  const count = waypoints.length;
  const points: Point[] = [];
  const distance = [0];
  const at = (i: number) => waypoints[(i + count) % count];
  for (let i = 0; i <= count; i++) {
    const [a, b, c, d] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const steps = i === count ? 1 : 40;
    for (let j = 0; j < steps; j++) {
      const t = j / 40;
      const point: Point = [cubicSpline(a[0], b[0], c[0], d[0], t), cubicSpline(a[1], b[1], c[1], d[1], t)];
      const last = points[points.length - 1];
      if (last) distance.push(distance[distance.length - 1] + Math.hypot(point[0] - last[0], point[1] - last[1]));
      points.push(point);
    }
  }
  const length = distance[distance.length - 1];
  // Resample by distance so tighter turns don't cause artificial speed changes.
  const samples: Point[] = [];
  const steps = Math.ceil(length);
  let cursor = 0;
  for (let i = 0; i < steps; i++) {
    const target = i * length / steps;
    while (distance[cursor + 1] < target) cursor++;
    const blend = (target - distance[cursor]) / (distance[cursor + 1] - distance[cursor]);
    const [a, b] = [points[cursor], points[cursor + 1]];
    samples.push([a[0] + (b[0] - a[0]) * blend, a[1] + (b[1] - a[1]) * blend]);
  }

  function pointAt(distance: number): Point {
    const unit = ((distance % length + length) % length) * steps / length;
    const index = Math.floor(unit);
    const blend = unit - index;
    const [a, b] = [samples[index], samples[(index + 1) % steps]];
    return [a[0] + (b[0] - a[0]) * blend, a[1] + (b[1] - a[1]) * blend];
  }

  function headingAt(distance: number) {
    const a = pointAt(distance - 4);
    const b = pointAt(distance + 4);
    return Math.atan2(b[1] - a[1], b[0] - a[0]);
  }

  return { length, pointAt, headingAt };
}

const outer = makeTrack([[208, 253], [329, 127], [590, 111], [805, 174], [810, 324], [655, 428], [399, 454], [220, 375]]);
const inner = makeTrack([[278, 250], [365, 374], [574, 392], [728, 305], [672, 187], [506, 159], [351, 170]]);

const koi = [
  { asset: 1, track: inner, start: .31, size: 105, speed: 23, frequency: .85, phase: .44, cycle: 5.9, opacity: .78 },
  { asset: 1, track: inner, start: .81, size: 120, speed: 22, frequency: .73, phase: .09, cycle: 6.4, opacity: .84 },
  { asset: 2, track: outer, start: .53, size: 165, speed: 32, frequency: .79, phase: .71, cycle: 6.1, opacity: .91 },
  { asset: 0, track: outer, start: .045, size: 187, speed: 32, frequency: .76, phase: .32, cycle: 6.9, opacity: .95 },
];
type Koi = (typeof koi)[number];

function poseAt(fish: Koi, time: number) {
  const cadence = time / fish.cycle * tau + fish.phase * tau;
  const phase = (time * fish.frequency + fish.phase) * tau;
  // Each half stroke adds a short surge within the longer burst-and-coast cycle.
  const surge = Math.sin(cadence - .45) * fish.cycle / tau * .40
    + .14 * Math.sin(2 * phase - 1.1) / (2 * tau * fish.frequency);
  const effort = Math.max(0, (Math.cos(cadence) + .28) / 1.28);
  const distance = fish.track.length * fish.start + fish.speed * (time + surge);
  return { distance, phase, effort };
}

// Advance the head along the route. Integrate backwards in fixed-length links:
// the skull steers first, the trunk follows its track, and the tail finishes the stroke.
const links = 32;
function bodyAt(fish: Koi, time: number) {
  const pose = poseAt(fish, time);
  const noseDistance = pose.distance + fish.size * .5;
  const headAngle = fish.track.headingAt(noseDistance);
  const joints: Point[] = [fish.track.pointAt(noseDistance)];
  const length = fish.size / links;
  for (let i = 0; i < links; i++) {
    const u = (i + .5) / links;
    const angle = fish.track.headingAt(noseDistance - u * fish.size);
    const turn = Math.atan2(Math.sin(angle - headAngle), Math.cos(angle - headAngle));
    const flex = Math.max(0, (u - .19) / .81);
    const stroke = Math.sin(pose.phase - flex * 5.1) * flex ** 1.8 * (.25 + .59 * pose.effort);
    const tangent = headAngle + 1.12 * Math.tanh(turn / 1.12) * Math.min(1, u * 2.4) + stroke;
    const [x, y] = joints[i];
    joints.push([x - length * Math.cos(tangent), y - length * Math.sin(tangent)]);
  }
  return { joints, phase: pose.phase, effort: pose.effort };
}

export function createPondSwim() {
  const ripples = createPondRipples();
  const previous = koi.map(fish => bodyAt(fish, 0).joints);
  function disturb(time: number, dt: number) {
    for (const [i, fish] of koi.entries()) {
      const { joints } = bodyAt(fish, time);
      // The shoulder parts water, the flank carries it, and the narrow tail
      // sweeps it sideways. Use actual joint velocities, including in turns.
      for (const [joint, radius] of [[4, .080], [15, .068], [27, .047], [32, .033]]) {
        const [x, y] = joints[joint];
        const [px, py] = previous[i][joint];
        ripples.push(x, y, (x - px) / dt, (y - py) / dt, fish.size * radius);
      }
      previous[i] = joints;
    }
  }

  function draw(ctx: CanvasRenderingContext2D, images: HTMLImageElement[], time: number) {
    ripples.advance(time, disturb);
    for (const fish of koi) {
      const { joints, phase, effort } = bodyAt(fish, time);
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
