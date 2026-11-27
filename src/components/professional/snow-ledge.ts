const baseline = 16;
const height = 24;

function noise(seed: number) {
  const n = Math.sin(seed * 41.37 + 17) * 43758.5453;
  return n - Math.floor(n);
}

export function snowBankProfile(index: number, count: number) {
  if (count < 3) return 1;
  const u = index / (count - 1);
  return 4 * u * (1 - u);
}

// Carry loose snow downhill until the lip exceeds the depth it can support.
// The caller then releases the loose snow from those samples as powder.
export function slideSnow(depth: Float32Array, capacity: Float32Array, step: number, slope: number, dt: number) {
  const grade = Math.abs(slope);
  if (grade < .016 || dt <= 0 || depth.length < 2) return 0;
  const direction = Math.sign(slope);
  const lip = direction > 0 ? depth.length - 1 : 0;
  const speed = Math.min(49, 4 + 130 * grade);
  const fraction = 1 - Math.exp(-speed * dt / step);
  const retained = Math.max(.28, .73 - grade * 1.55);
  const lipWidth = Math.min(26, (depth.length - 1) * step * .28);
  const lipCells = Math.min(depth.length - 1, Math.max(2, Math.round(lipWidth / step)));
  const shoulder = lip - direction * (lipCells - 1);
  // Work uphill so transported snow moves at most one sample per step.
  for (let i = shoulder - direction; i >= 0 && i < depth.length; i -= direction) {
    const loose = Math.max(0, depth[i] - capacity[i] * retained);
    const transfer = loose * fraction;
    depth[i] -= transfer;
    if (i + direction === shoulder) {
      // Spread the flow over the corner, tapering into both the ledge and tip.
      let total = 0;
      for (let j = 0; j < lipCells; j++) total += snowBankProfile(j, lipCells);
      for (let j = 0; j < lipCells; j++) {
        depth[shoulder + direction * j] += transfer * snowBankProfile(j, lipCells) / total;
      }
    } else depth[i + direction] += transfer;
  }
  const holdingDepth = Math.max(2.9, 4.6 - 8 * grade);
  for (let j = 0; j < lipCells; j++) {
    const i = shoulder + direction * j;
    if (snowBankProfile(j, lipCells) > .5 && depth[i] >= holdingDepth) return lipCells;
  }
  return 0;
}

export function createLedge(host: HTMLElement, seed: number) {
  const round = host.matches(".folio-theme-toggle, .folio-album-arrow");
  if (getComputedStyle(host).position === "static") host.classList.add("folio-snow-anchor");
  const el = document.createElement("span");
  el.className = "folio-snow-ledge";
  el.setAttribute("aria-hidden", "true");
  const inset = round ? "14%" : "1px";
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
    const scale = Math.min(7.6, 2.3 + Math.sqrt(width) * .28);
    const phase = noise(seed + 3) * 30;
    const style = getComputedStyle(host);
    const radius = Math.min(host.offsetWidth, host.offsetHeight) / 2;
    const sideInset = Math.max(0, (host.clientWidth - width) / 2);
    const leftRadius = round ? radius : Math.min(radius, parseFloat(style.borderTopLeftRadius) || 0);
    const rightRadius = round ? radius : Math.min(radius, parseFloat(style.borderTopRightRadius) || 0);
    const corner = (distance: number, r: number) => {
      const inset = Math.min(r, distance);
      return r - Math.sqrt(r * r - (r - inset) ** 2);
    };
    for (let i = 0; i < count; i++) {
      const u = i / (count - 1), x = u * width;
      const taper = Math.min(1, x / 6, (width - x) / 6);
      const mound = .55 + .20 * Math.sin(x / 29 + phase) + .19 * Math.sin(x / 11 + seed) + .10 * Math.cos(x / 5 + phase);
      capacity[i] = Math.max(0, scale * taper * mound);
      depth[i] = old.length ? old[Math.round(u * (old.length - 1))] : capacity[i] * .08;
      depth[i] = Math.min(depth[i], capacity[i]);
      foot[i] = .45 + Math.max(corner(x + sideInset, leftRadius), corner(width - x + sideInset, rightRadius));
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
    bank.dirty = false;
    if (!depth.some(value => value > 0)) return;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, baseline + foot[0]);
    for (let i = 0; i < depth.length - 1; i++) {
      const y = baseline + foot[i] - depth[i], next = baseline + foot[i+1] - depth[i+1];
      ctx.quadraticCurveTo(i * step, y, (i + .5) * step, (y + next) / 2);
    }
    ctx.lineTo(width, baseline + foot[depth.length - 1] - depth[depth.length - 1]);
    const drape = (j: number) => depth[j] * (.31 + .31 * noise(seed + j));
    for (let i = depth.length - 1; i > 0; i--) {
      const y = baseline + foot[i] + drape(i);
      const prev = baseline + foot[i - 1] + drape(i - 1);
      ctx.quadraticCurveTo(i * step, y, (i - .5) * step, (y + prev) / 2);
    }
    ctx.lineTo(0, baseline + foot[0]);
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
  }
  return Object.assign(bank, { resize, paint });
}

export type SnowLedge = ReturnType<typeof createLedge>;
