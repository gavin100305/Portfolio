import { canWalkSegment, rooms, type Point } from "./station-world";

/** Short floor-only routes inside Engineering; no collision bypass or teleport. */
export function robotRoute(from: Point, to: Point): Point[] {
  if (canWalkSegment(from, to)) return [to];
  const bounds = rooms.stack, step = 20;
  type Node = Point & { cost: number; score: number; parent: Node | null; gx: number; gy: number };
  const first: Node = { ...from, cost: 0, score: 0, parent: null, gx: 0, gy: 0 };
  const pending = [first], visited = new Set<string>();
  const costs = new Map<string, number>([["0,0", 0]]);
  let attempts = 0;
  while (pending.length && attempts++ < 1800) {
    pending.sort((a, b) => b.score - a.score);
    const current = pending.pop()!;
    const key = `${current.gx},${current.gy}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (Math.hypot(current.x - to.x, current.y - to.y) < step * 1.5 && canWalkSegment(current, to)) {
      const route: Point[] = [to];
      for (let node: Node | null = current; node?.parent; node = node.parent) route.unshift({ x: node.x, y: node.y });
      return route;
    }
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
      const gx = current.gx + dx, gy = current.gy + dy;
      const nextKey = `${gx},${gy}`;
      const next = { x: from.x + gx * step, y: from.y + gy * step };
      if (visited.has(nextKey) || next.x < bounds.x || next.y < bounds.y || next.x > bounds.x + bounds.width || next.y > bounds.y + bounds.height || !canWalkSegment(current, next)) continue;
      const cost = current.cost + Math.hypot(dx, dy) * step;
      if ((costs.get(nextKey) ?? Infinity) <= cost) continue;
      costs.set(nextKey, cost);
      pending.push({ ...next, gx, gy, cost, score: cost + Math.hypot(next.x - to.x, next.y - to.y), parent: current });
    }
  }
  return [];
}
