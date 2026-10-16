import { canWalkSegment, WORLD, type Point } from "./station-world";

/** Find a floor-only route anywhere in the station; walls and furniture stay solid. */
export function robotRoute(from: Point, to: Point): Point[] {
  if (canWalkSegment(from, to)) return [to];
  const step = 24;
  type Node = Point & { cost: number; score: number; parent: Node | null; gx: number; gy: number };
  const first: Node = { ...from, cost: 0, score: 0, parent: null, gx: 0, gy: 0 };
  const pending: Node[] = [];
  const push = (node: Node) => {
    pending.push(node);
    let index = pending.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (pending[parent].score <= node.score) break;
      pending[index] = pending[parent]; index = parent;
    }
    pending[index] = node;
  };
  const pop = () => {
    const first = pending[0], last = pending.pop()!;
    if (pending.length) {
      let index = 0;
      while (true) {
        const left = index * 2 + 1, right = left + 1;
        if (left >= pending.length) break;
        const child = right < pending.length && pending[right].score < pending[left].score ? right : left;
        if (pending[child].score >= last.score) break;
        pending[index] = pending[child]; index = child;
      }
      pending[index] = last;
    }
    return first;
  };
  const visited = new Set<string>();
  const costs = new Map<string, number>([["0,0", 0]]);
  let attempts = 0;
  push(first);
  while (pending.length && attempts++ < 12000) {
    const current = pop();
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
      if (visited.has(nextKey) || next.x < WORLD.radius || next.y < WORLD.radius || next.x > WORLD.width - WORLD.radius || next.y > WORLD.height - WORLD.radius || !canWalkSegment(current, next)) continue;
      const cost = current.cost + Math.hypot(dx, dy) * step;
      if ((costs.get(nextKey) ?? Infinity) <= cost) continue;
      costs.set(nextKey, cost);
      push({ ...next, gx, gy, cost, score: cost + Math.hypot(next.x - to.x, next.y - to.y), parent: current });
    }
  }
  return [];
}
