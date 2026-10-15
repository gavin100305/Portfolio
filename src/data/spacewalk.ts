export type Body = { x: number; y: number; vx: number; vy: number };
export const SPACE = { width: 1800, height: 1200, dock: { x: 470, y: 650 }, planet: { x: 1310, y: 300, radius: 165 } };
export function advanceSpacewalker(body: Body, dt: number, thrust: { x: number; y: number }, brake: boolean): Body {
  const next = { ...body };
  const dx = SPACE.planet.x - body.x, dy = SPACE.planet.y - body.y;
  const distance = Math.hypot(dx, dy) || 1;
  const pull = distance < 650 ? 6_000_000 / (distance * distance + 40000) * (1 - distance / 650) : 0;
  const length = Math.hypot(thrust.x, thrust.y) || 1;
  next.vx += (thrust.x / length * 175 + dx / distance * pull) * dt;
  next.vy += (thrust.y / length * 175 + dy / distance * pull) * dt;
  const damping = Math.exp(-(brake ? 5 : .055) * dt);
  next.vx *= damping; next.vy *= damping;
  const speed = Math.hypot(next.vx, next.vy);
  if (speed > 245) { next.vx *= 245 / speed; next.vy *= 245 / speed; }
  next.x += next.vx * dt; next.y += next.vy * dt;
  // Solid planet surface: gravity never pulls a visitor through the planet.
  const px = next.x - SPACE.planet.x, py = next.y - SPACE.planet.y;
  const separation = Math.hypot(px, py) || 1, radius = SPACE.planet.radius + 28;
  if (separation < radius) {
    const nx = px / separation, ny = py / separation;
    next.x = SPACE.planet.x + nx * radius; next.y = SPACE.planet.y + ny * radius;
    const inward = next.vx * nx + next.vy * ny;
    if (inward < 0) { next.vx -= inward * nx; next.vy -= inward * ny; }
  }
  if (next.x < 25 || next.x > SPACE.width - 25) { next.x = Math.max(25, Math.min(SPACE.width - 25, next.x)); next.vx *= -.25; }
  if (next.y < 25 || next.y > SPACE.height - 25) { next.y = Math.max(25, Math.min(SPACE.height - 25, next.y)); next.vy *= -.25; }
  return next;
}
