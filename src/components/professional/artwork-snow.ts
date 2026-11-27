// Travel is the integral of a breeze with two slow gust cycles. Nearby flakes
// pick up the same gust with a small delay as it crosses the valley.
function windTravel(time: number) {
  return 9 * time + 15 * Math.sin(time * .46) + 8 * Math.sin(time * .21 + 1.2);
}

function sample(seed: number) {
  const n = Math.sin((seed + 1) * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function wrap(value: number, span: number) {
  return value - Math.floor(value / span) * span;
}

function snowSprite(color: string, focus: number) {
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = 24;
  const ctx = sprite.getContext("2d")!;
  const edge = ctx.createRadialGradient(12, 12, 0, 12, 12, 12);
  edge.addColorStop(0, `rgba(${color},1)`);
  edge.addColorStop(focus, `rgba(${color},.8)`);
  edge.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, 24, 24);
  return sprite;
}

export function createSnowfall(target: "frame" | "page") {
  const framed = target === "frame";
  const flakes = Array.from({ length: framed ? 112 : 125 }, (_, index) => {
    const seed = index * 8 + (framed ? 0 : 1800);
    const depth = sample(seed) ** 1.9;
    return {
      depth, x: sample(seed + 1), y: sample(seed + 2),
      phase: sample(seed + 3) * Math.PI * 2,
      speed: (13 + 53 * depth) * (.83 + .33 * sample(seed + 4)),
      radius: (.86 + 2.6 * depth ** 2) * (.78 + .44 * sample(seed + 5)),
      flutter: .55 + sample(seed + 6) * .48,
    };
  });
  const daylight = snowSprite("240,247,255", .44);
  const near = snowSprite("251,251,247", .19);
  const shade = framed ? daylight : snowSprite("107,137,160", .35);

  return function draw(ctx: CanvasRenderingContext2D, width: number, height: number,
    time: number, opacity = 1, dark = true) {
    ctx.save();
    const padding = 6;
    const span = width + padding * 2;
    for (const flake of flakes) {
      const { depth, phase } = flake;
      // The far snow disappears into the valley. The nearest flakes can
      // pass the lens and fall through the bottom edge of the frame.
      const fall = framed ? height * (.72 + .36 * depth) : height;
      const cycle = fall + padding * 2;
      const y = wrap(flake.y * cycle + time * flake.speed, cycle) - padding;
      const breeze = windTravel(time - flake.x * 2 - depth);
      const tumble = time * flake.flutter + phase;
      const x = wrap(flake.x * span + (.48 + 1.4 * depth) * breeze +
        Math.sin(tumble) * (1 + 2.3 * depth), span) - padding;
      const fade = framed ? Math.min(1, Math.max(0, (fall - y) / 30)) : 1;
      ctx.globalAlpha = opacity * fade * (.41 + .48 * depth) * (framed ? 1 : .73);
      const r = framed ? flake.radius * .84 : flake.radius;
      const halfWidth = r * (.83 + .12 * Math.sin(tumble));
      const sprite = !dark ? shade : depth > .67 ? near : daylight;
      ctx.drawImage(sprite, x - halfWidth, y - r, halfWidth * 2, r * 2);
    }
    ctx.restore();
  };
}
