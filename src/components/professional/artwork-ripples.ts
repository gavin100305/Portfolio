// Height and vertical velocity on a shallow-water grid in pond coordinates.
export function createPondRipples() {
  const width = 224, height = 126;
  const level = new Float32Array(width * height);
  const velocity = new Float32Array(level.length);
  const normals = new ImageData(width, height);
  const pixels = normals.data;
  const scale = width / 1000;
  let clock = 0;

  function push(x: number, y: number, vx: number, vy: number, radius: number) {
    const cx = x * scale, cy = y * scale, r = radius * scale;
    const reach = 2.7 * r;
    for (let j = Math.max(1, Math.floor(cy - reach)); j <= Math.min(height - 2, cy + reach); j++) {
      for (let i = Math.max(1, Math.floor(cx - reach)); i <= Math.min(width - 2, cx + reach); i++) {
        const dx = (i - cx) / r, dy = (j - cy) / r;
        // Water rises on the leading side of a moving patch and falls behind it.
        velocity[j * width + i] += (dx * vx + dy * vy) * .00036 * Math.exp(-dx * dx - dy * dy);
      }
    }
  }

  function advance(time: number, disturb: (t: number, dt: number) => void) {
    const dt = 1 / 60;
    while (clock + dt <= time) {
      clock += dt;
      disturb(clock, dt);
      for (let j = 1; j < height - 1; j++) {
        const end = (j + 1) * width - 1;
        for (let i = j * width + 1; i < end; i++) {
          const curvature = level[i-1] + level[i+1] + level[i-width] + level[i+width] - 4 * level[i];
          velocity[i] = .926 * velocity[i] + .105 * curvature - .0024 * level[i];
        }
      }
      for (let i = 0; i < level.length; i++) level[i] += velocity[i];
    }
    for (let i = 0; i < level.length; i++) {
      const inner = i >= width && i < level.length - width;
      pixels[i*4] = 128 + (inner ? (level[i+1] - level[i-1]) * 150 : 0);
      pixels[i*4+1] = 128 + (inner ? (level[i+width] - level[i-width]) * 150 : 0);
      pixels[i*4+3] = 255;
    }
  }
  return { push, advance, normals };
}
