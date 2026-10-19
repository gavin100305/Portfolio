/** Shared superellipse contours: a broad, flowing bowl rather than a box. */
export function stadiumPoint(angle: number, rx: number, ry: number, exponent = 2.7, cx = 120, cy = 88) {
  const c = Math.cos(angle), s = Math.sin(angle);
  return { x: cx + rx * Math.sign(c) * Math.abs(c) ** (2 / exponent), y: cy + ry * Math.sign(s) * Math.abs(s) ** (2 / exponent) };
}
export function stadiumContour(rx: number, ry: number, exponent = 2.7, cx = 120, cy = 88, count = 120) {
  return Array.from({ length: count }, (_, i) => stadiumPoint(i / count * Math.PI * 2, rx, ry, exponent, cx, cy));
}
export function contourPath(points: readonly { x: number; y: number }[], close = true) {
  return points.map((p,i) => `${i ? "L" : "M"}${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join("") + (close ? "Z" : "");
}

/** Uneven rounded quadrilateral of the metal envelope; the seating stays regular. */
export function bernabeuEnvelopePoint(angle: number, rx: number, ry: number, cx = 120, cy = 88) {
  const p = stadiumPoint(angle, 1, 1, 3.25, 0, 0);
  const x = p.x * (1 + .055 * p.y) - .065 * p.y;
  const y = p.y * (1 - .045 * p.x) + .04 * p.x;
  return { x: cx + rx * x, y: cy + ry * y };
}
