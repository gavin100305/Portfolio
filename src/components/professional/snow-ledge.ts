const baseline = 16;
const height = 24;

function noise(seed: number) {
  const n = Math.sin(seed * 41.37 + 17) * 43758.5453;
  return n - Math.floor(n);
}

// Transport loose powder one sample downhill. Work from the low end back so
// snow received this frame cannot traverse the entire ledge in a single step.
export function slideSnow(depth: Float32Array, capacity: Float32Array, step: number, slope: number, dt: number) {
  const grade = Math.abs(slope);
  if (grade < .009 || dt <= 0 || depth.length < 2) return 0;
  const direction = Math.sign(slope);
  const lip = direction > 0 ? depth.length - 1 : 0;
  const speed = Math.min(100, 8 + 280 * grade);
  const fraction = 1 - Math.exp(-speed * dt / step);
  const retained = Math.max(.2, .66 - grade * 1.8);
  const lipCells = Math.min(depth.length - 1, Math.max(1, Math.round(12 / step)));
  const shoulder = lip - direction * (lipCells - 1);
  for (let i = shoulder - direction; i >= 0 && i < depth.length; i -= direction) {
    const loose = Math.max(0, depth[i] - capacity[i] * retained);
    const transfer = loose * fraction;
    depth[i] -= transfer;
    if (i + direction === shoulder) {
      for (let j = 0; j < lipCells; j++) depth[shoulder + direction * j] += transfer / lipCells;
    } else depth[i + direction] += transfer;
  }
  // The overhang holds until its accumulated cross section breaks the crust.
  let load = 0;
  for (let j = 0; j < lipCells; j++) {
    const i = shoulder + direction * j;
    load += Math.max(0, depth[i] - retained * capacity[i]);
  }
  if (load < 3.2 * lipCells) return 0;
  for (let j = 0; j < lipCells; j++) {
    const i = shoulder + direction * j;
    depth[i] -= .9 * Math.max(0, depth[i] - retained * capacity[i]);
  }
  return .9 * load * step;
}

export function createLedge(host: HTMLElement, seed: number) {
  const round = host.matches(".folio-theme-toggle, .folio-album-arrow");
  if (getComputedStyle(host).position === "static") host.classList.add("folio-snow-anchor");
  const el = document.createElement("span");
  el.className = "folio-snow-ledge";
  el.setAttribute("aria-hidden", "true");
  const inset = round ? "23%" : Math.min(9, parseFloat(getComputedStyle(host).borderTopLeftRadius) || 3) + "px";
  el.style.insetInline = inset;
  const left = document.createElement("i"), right = document.createElement("i");
  const canvas = document.createElement("canvas");
  el.append(left, canvas, right);
  host.append(el);
  const ctx = canvas.getContext("2d")!;
  const bank = {
    host, el, left, right, depth: new Float32Array(), capacity: new Float32Array(),
    foot: new Float32Array(), width: 0, ratio: 0, lastPaint: -1, dirty: true,
    moving: host.matches(".folio-keycap-face,.folio-album-print,.folio-project-print,.folio-space-id"),
    fixed: !!host.closest(".folio-section-dock"),
    x: 0, y: 0, dx: 0, dy: 0, verticalScale: 1, lastScroll: 0, sampled: false, travel: 0,
    step: 1, nextShed: 64 + noise(seed) * 110, lastGrowth: 0,
  };

  function resize() {
    const width = el.clientWidth;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    if (!width || (width === bank.width && ratio === bank.ratio)) return;
    const old = bank.depth;
    const count = Math.max(5, Math.ceil(width / 3) + 1);
    const depth = new Float32Array(count), capacity = new Float32Array(count), foot = new Float32Array(count);
    const scale = Math.min(12, 2.6 + Math.sqrt(width) * .38);
    const phase = noise(seed + 3) * 30;
    for (let i = 0; i < count; i++) {
      const u = i / (count - 1), x = u * width;
      const taper = Math.min(1, x / 10, (width - x) / 12);
      const mound = .58 + .18 * Math.sin(x / 32 + phase) + .14 * Math.sin(x / 14 + seed) + .07 * Math.cos(x / 7 + phase);
      capacity[i] = Math.max(0, scale * taper * mound);
      depth[i] = old.length ? old[Math.round(u * (old.length - 1))] : capacity[i] * .35;
      depth[i] = Math.min(depth[i], capacity[i]);
      const radius = host.offsetWidth / 2;
      foot[i] = round ? radius - Math.sqrt(Math.max(0, radius ** 2 - ((u - .5) * width) ** 2)) : .45;
    }
    Object.assign(bank, { width, ratio, step: width / (count - 1), depth, capacity, foot, dirty: true });
    canvas.width = Math.round(width * ratio);
    canvas.height = height * ratio;
    ctx.setTransform(canvas.width / width, 0, 0, ratio, 0, 0);
  }

  function paint() {
    const { width, depth, step, foot } = bank;
    if (!width) return;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, baseline + foot[0]);
    for (let i = 0; i < depth.length - 1; i++) {
      const y = baseline + foot[i] - depth[i], next = baseline + foot[i+1] - depth[i+1];
      ctx.quadraticCurveTo(i * step, y, (i + .5) * step, (y + next) / 2);
    }
    ctx.lineTo(width, baseline + foot[depth.length - 1] - depth[depth.length - 1]);
    for (let i = depth.length - 1; i >= 0; i--) {
      ctx.lineTo(i * step, baseline + foot[i] + Math.min(depth[i] * .19, 1.2));
    }
    ctx.closePath();
    const shade = ctx.createLinearGradient(0, baseline - 6, 0, baseline + 1.1);
    shade.addColorStop(0, "#fcfdff"); shade.addColorStop(.55, "#e8f1f6"); shade.addColorStop(1, "#96afc3");
    ctx.fillStyle = shade;
    ctx.fill();
    ctx.clip();
    // Fixed grains and small blue pockets reveal thickness along the contact edge.
    for (let i = 0; i < depth.length; i++) {
      const x = i * step, top = baseline + foot[i] - depth[i];
      ctx.fillStyle = "rgba(255,255,255,.82)";
      ctx.fillRect(x, top + .3, 1.2, .65);
      ctx.fillStyle = "rgba(92,129,152,.23)";
      ctx.fillRect(x + 1, top + depth[i] * noise(i + seed), 1, .65);
    }
    ctx.restore();
    bank.dirty = false;
  }
  return Object.assign(bank, { resize, paint });
}

export type SnowLedge = ReturnType<typeof createLedge>;
