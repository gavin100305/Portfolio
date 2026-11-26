const height = 562.5;
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
  const surge = Math.sin(cadence) * fish.cycle / tau * .24;
  const effort = Math.max(0, (Math.cos(cadence) + .28) / 1.28);
  const distance = fish.track.length * fish.start + fish.speed * (time + surge);
  return { distance, phase: (time * fish.frequency + fish.phase) * tau, effort };
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
    const stroke = Math.sin(pose.phase - flex * 5.1) * flex ** 1.8 * (.09 + .64 * pose.effort);
    const tangent = headAngle + 1.12 * Math.tanh(turn / 1.12) * Math.min(1, u * 2.4) + stroke;
    const [x, y] = joints[i];
    joints.push([x - length * Math.cos(tangent), y - length * Math.sin(tangent)]);
  }
  return { joints, headAngle, effort: pose.effort };
}

export function createPondSwim() {
  const noses = new Float32Array(16);
  const wakes = new Float32Array(32);
  const wakeAges = new Float32Array(8);

  const lastBeats = koi.map(() => NaN);

  function draw(ctx: CanvasRenderingContext2D, images: HTMLImageElement[], time: number) {
    for (const [i, fish] of koi.entries()) {
      const { joints, headAngle, effort } = bodyAt(fish, time);
      const [noseX, noseY] = joints[0];
      noses.set([noseX / height, noseY / height, headAngle, fish.opacity * (.40 + effort * .47)], i * 4);

      // The tail lags the trunk wave. Release each vortex near the end of
      // its lateral sweep, at the position occupied on that stroke.
      const releasePhase = .84;
      const lastBeat = Math.floor((time * fish.frequency + fish.phase - releasePhase) * 2);
      for (let j = 0; j < 2; j++) {
        const beat = lastBeat - j;
        const released = (beat * .5 + releasePhase - fish.phase) / fish.frequency;
        const index = i * 2 + j;
        wakeAges[index] = time - released;
        if (lastBeats[i] === lastBeat) continue;
        const stroke = bodyAt(fish, released);
        const [x, y] = stroke.joints[links];
        const [stemX, stemY] = stroke.joints[links - 3];
        const heading = Math.atan2(stemY - y, stemX - x);
        const direction = beat % 2 ? 1 : -1;
        wakes.set([x / height, y / height, heading, direction * stroke.effort * fish.opacity], index * 4);
      }
      lastBeats[i] = lastBeat;

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
        ctx.drawImage(sprite, j * sourceSlice, 0, sourceSlice, sprite.height,
          0, -.5 * thickness, slice + .6, thickness);
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
