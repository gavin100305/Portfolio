type Point = { x: number; y: number };
type Opening = Point & { width: number; height: number };

// Union an orthogonal room floor with its entrance floors before drawing an
// inset wall shadow. Stroking separate rectangles leaves false edges across
// walkable doorways, which makes a corridor look like a raised platform.
export function deckOutline(floor: readonly Point[], openings: readonly Opening[]): number[][] {
  const xs = [...new Set([...floor.map(p => p.x), ...openings.flatMap(r => [r.x, r.x + r.width])])].sort((a, b) => a - b);
  const ys = [...new Set([...floor.map(p => p.y), ...openings.flatMap(r => [r.y, r.y + r.height])])].sort((a, b) => a - b);
  const inside = (x: number, y: number) => {
    if (openings.some(r => x > r.x && x < r.x + r.width && y > r.y && y < r.y + r.height)) return true;
    let hit = false;
    for (let i = 0, j = floor.length - 1; i < floor.length; j = i++) {
      const a = floor[i], b = floor[j];
      if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) hit = !hit;
    }
    return hit;
  };
  const cells = ys.slice(1).map((y, row) => xs.slice(1).map((x, col) => inside((xs[col] + x) / 2, (ys[row] + y) / 2)));
  const edges = new Map<string, number[]>();
  const edge = (x: number, y: number, endX: number, endY: number) => edges.set(`${x},${y}`, [endX, endY]);
  cells.forEach((row, r) => row.forEach((filled, c) => {
    if (!filled) return;
    const [x, endX, y, endY] = [xs[c], xs[c + 1], ys[r], ys[r + 1]];
    if (!cells[r - 1]?.[c]) edge(x, y, endX, y);
    if (!row[c + 1]) edge(endX, y, endX, endY);
    if (!cells[r + 1]?.[c]) edge(endX, endY, x, endY);
    if (!row[c - 1]) edge(x, endY, x, y);
  }));
  const start = edges.keys().next().value;
  if (!start) return [];
  const points: number[][] = [];
  let cursor = start;
  do {
    points.push(cursor.split(",").map(Number));
    const next = edges.get(cursor);
    if (!next) throw new Error("Station floor outline is disconnected");
    cursor = next.join(",");
  } while (cursor !== start && points.length <= edges.size);
  if (cursor !== start || points.length !== edges.size) throw new Error("Station entrances must join a single floor");
  // Remove intermediate points on straight wall segments before rounding.
  return points.filter((p, i) => {
    const a = points[(i + points.length - 1) % points.length], b = points[(i + 1) % points.length];
    return !((a[0] === p[0] && p[0] === b[0]) || (a[1] === p[1] && p[1] === b[1]));
  });
}
