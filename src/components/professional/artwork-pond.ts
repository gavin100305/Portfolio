const height = 562.5;
const tau = Math.PI * 2;
type Point = readonly [number, number];

function catmull(a: number, b: number, c: number, d: number, t: number) {
  return b + .5 * t * (c - a + t * (2 * a - 5 * b + 4 * c - d + t * (3 * b - a - 3 * c + d)));
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
      const point: Point = [catmull(a[0], b[0], c[0], d[0], t), catmull(a[1], b[1], c[1], d[1], t)];
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
const inner = makeTrack([[358, 261], [420, 332], [579, 342], [660, 284], [620, 218], [480, 202], [393, 220]]);

const koi = [
  { asset: 1, track: inner, start: .48, size: 105, speed: 23, frequency: .85, phase: .44, cycle: 5.9, opacity: .78 },
  { asset: 1, track: inner, start: .97, size: 120, speed: 22, frequency: .73, phase: .09, cycle: 6.4, opacity: .84 },
  { asset: 2, track: outer, start: .53, size: 165, speed: 32, frequency: .79, phase: .71, cycle: 6.1, opacity: .91 },
  { asset: 0, track: outer, start: .045, size: 187, speed: 32, frequency: .76, phase: .32, cycle: 6.9, opacity: .95 },
];
type Koi = (typeof koi)[number];

function poseAt(fish: Koi, time: number) {
  const cadence = time / fish.cycle * tau + fish.phase * tau;
  const surge = Math.sin(cadence) * fish.cycle / tau * .24;
  const effort = Math.max(0, (Math.cos(cadence) + .28) / 1.28);
  const distance = fish.track.length * fish.start + fish.speed * (time + surge);
  const heading = fish.track.headingAt(distance);
  return {
    distance,
    center: fish.track.pointAt(distance),
    forward: [Math.cos(heading), Math.sin(heading)] as Point,
    amplitude: fish.size * (.008 + .049 * effort),
    phase: (time * fish.frequency + fish.phase) * tau,
    effort,
  };
}

function spine(fish: Koi, pose: ReturnType<typeof poseAt>, u: number): Point {
  const offset = (u - .50) * fish.size;
  const [x, y] = fish.track.pointAt(pose.distance + offset);
  const [dx, dy] = pose.forward;
  const [cx, cy] = pose.center;
  const sway = Math.cos(pose.phase + u * 5.6) * pose.amplitude * (1 - u) ** 2.8;
  const follow = .62;
  return [
    x * follow + (cx + dx * offset) * (1 - follow) - dy * sway,
    y * follow + (cy + dy * offset) * (1 - follow) + dx * sway,
  ];
}

export function createPondSwim() {
  const noses = new Float32Array(16);
  const wakes = new Float32Array(32);
  const wakeAges = new Float32Array(8);

  function draw(ctx: CanvasRenderingContext2D, images: HTMLImageElement[], time: number) {
    for (const [i, fish] of koi.entries()) {
      const pose = poseAt(fish, time);
      const [noseX, noseY] = spine(fish, pose, 1);
      const [napeX, napeY] = spine(fish, pose, .92);
      const noseAngle = Math.atan2(noseY - napeY, noseX - napeX);
      noses.set([noseX / height, noseY / height, noseAngle, fish.opacity * (.40 + pose.effort * .47)], i * 4);

      // A slowed-down, visible representation of the alternating tail vortices.
      // Sample their origin at the half-stroke, so they stay behind as the koi moves away.
      const lastBeat = Math.floor((time * fish.frequency + fish.phase) * 2);
      for (let j = 0; j < 2; j++) {
        const beat = lastBeat - j;
        const released = (beat * .5 - fish.phase) / fish.frequency;
        const stroke = poseAt(fish, released);
        const [x, y] = spine(fish, stroke, 0);
        const [stemX, stemY] = spine(fish, stroke, .09);
        const heading = Math.atan2(stemY - y, stemX - x);
        const direction = beat % 2 ? -1 : 1;
        const index = i * 2 + j;
        wakes.set([x / height, y / height, heading, direction * stroke.effort * fish.opacity], index * 4);
        wakeAges[index] = time - released;
      }

      const sprite = images[fish.asset];
      const thickness = fish.size * sprite.height / sprite.width;
      const slices = 22;
      const sourceSlice = sprite.width / slices;
      const slice = fish.size / slices;
      const [dx, dy] = pose.forward;
      let start = spine(fish, pose, 0);
      ctx.save();
      ctx.globalAlpha = fish.opacity;
      for (let j = 0; j < slices; j++) {
        const end = spine(fish, pose, (j + 1) / slices);
        const x = (end[0] - start[0]) / slice;
        const y = (end[1] - start[1]) / slice;
        ctx.save();
        ctx.transform(x, y, -dy, dx, start[0], start[1]);
        ctx.drawImage(sprite, j * sourceSlice, 0, sourceSlice, sprite.height,
          0, -.5 * thickness, slice + .3, thickness);
        ctx.restore();
        start = end;
      }
      ctx.restore();
    }
  }

  function drawFallbackWake(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.strokeStyle = "#82b9b0";
    ctx.lineWidth = .9;
    for (let i = 0; i < wakeAges.length; i++) {
      const age = wakeAges[i];
      const index = i * 4;
      const strength = wakes[index + 3];
      const alpha = Math.min(age * 7, 1) * Math.max(0, 1 - age) * Math.abs(strength) * .24;
      if (alpha < .01) continue;
      const side = Math.sign(strength);
      const heading = wakes[index + 2];
      const spread = 8 + age * 20;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.ellipse(
        wakes[index] * height - Math.sin(heading) * spread * side,
        wakes[index + 1] * height + Math.cos(heading) * spread * side,
        spread, spread * .56, heading, Math.PI * .59, Math.PI * 1.49,
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  return { draw, drawFallbackWake, noses, wakes, wakeAges };
}
