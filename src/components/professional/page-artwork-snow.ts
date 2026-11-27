import { createSnowfall, windTravel } from "./artwork-snow";
import { createLedge, slideSnow, snowBankProfile, type SnowLedge } from "./snow-ledge";
import type { ArtworkPointer, PageScene } from "./page-artwork-scenes";

const surfaces = [
  ".ascii-art-frame", ".artwork-barrel", ".folio-theme-toggle", ".folio-section-dock", ".folio-section-link",
  ".folio-keycap-face", ".folio-project-board > .folio-project-print", ".folio-album-print",
  ".folio-album-arrow", ".folio-award-more", ".folio-raised-control", ".folio-career-tabs button",
  ".folio-career-details", ".folio-career-autoplay", ".folio-contribution-case", ".folio-contact-panel",
  ".folio-space-card", ".folio-space-id",
].join(",");
type Grain = {
  x: number; y: number; vx: number; vy: number; r: number; age: number; life: number; phase: number; fixed: boolean;
  slide?: { bank: SnowLedge; u: number; direction: number; speed: number; above: number };
};
export function makePageSnow(shell: HTMLElement): PageScene {
  const spill = document.createElement("canvas");
  spill.className = "folio-snow-spill";
  spill.setAttribute("aria-hidden", "true");
  shell.append(spill);
  const ink = spill.getContext("2d")!;
  const banks = new Map<HTMLElement, SnowLedge>();
  const inView = new Set<SnowLedge>();
  const debris: Grain[] = [];
  let seed = 0, clock = 0, scroll = window.scrollY;
  let previousPointer: (ArtworkPointer & { time: number }) | undefined;
  let pointer: ArtworkPointer | undefined;
  const clearPointer = () => { pointer = previousPointer = undefined; };
  document.documentElement.addEventListener("pointerleave", clearPointer);
  window.addEventListener("blur", clearPointer);
  let live: SnowLedge[] = [];

  const visibility = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const bank = banks.get(entry.target as HTMLElement);
      if (!bank) continue;
      if (entry.isIntersecting) inView.add(bank);
      else { inView.delete(bank); bank.sampled = false; }
    }
  });
  const sizing = new ResizeObserver(entries => {
    for (const entry of entries) banks.get(entry.target as HTMLElement)?.resize();
  });
  function register(host: HTMLElement) {
    if (banks.has(host) || host.closest("dialog")) return;
    const bank = createLedge(host, ++seed);
    banks.set(host, bank);
    visibility.observe(host);
    sizing.observe(host);
  }
  shell.querySelectorAll<HTMLElement>(surfaces).forEach(register);
  const additions = new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) {
      if (!(node instanceof HTMLElement) || node.classList.contains("folio-snow-ledge")) continue;
      if (node.matches(surfaces)) register(node);
      node.querySelectorAll<HTMLElement>(surfaces).forEach(register);
    }
    for (const [host, bank] of banks) {
      if (host.isConnected && bank.el.parentNode === host) continue;
      visibility.unobserve(host); sizing.unobserve(host); inView.delete(bank); banks.delete(host);
      if (shell.contains(host)) register(host);
    }
  });
  additions.observe(shell, { childList: true, subtree: true });

  function exposed(bank: SnowLedge, x: number, y: number) {
    return bank.host.contains(document.elementFromPoint(x, y + 2));
  }

  function dislodge(bank: SnowLedge, center: number, radius: number, strength: number, velocity: number) {
    const index = Math.round(center * (bank.depth.length - 1));
    const reach = Math.ceil(radius / bank.step);
    for (let i = Math.max(0, index - reach); i <= Math.min(bank.depth.length - 1, index + reach); i++) {
      const u = i / (bank.depth.length - 1);
      const amount = bank.depth[i] * strength * Math.max(0, 1 - Math.abs(u - center) * bank.width / radius);
      if (amount < .12) continue;
      const x = bank.x + bank.dx * u, y = bank.y + bank.dy * u + bank.foot[i] * bank.verticalScale;
      if (!exposed(bank, x, y)) continue;
      bank.depth[i] -= amount;
      bank.dirty = true;
      if (debris.length >= 175) continue;
      debris.push({ x, y: y - bank.depth[i] * bank.verticalScale + (bank.fixed ? 0 : scroll),
        vx: velocity + (Math.random() - .46) * 20, vy: -6 + Math.random() * 17,
        r: Math.min(1.75, .4 + Math.sqrt(amount) * .65), age: 0,
        life: 1.2 + Math.random() * .8, phase: Math.random() * Math.PI * 2, fixed: bank.fixed });
    }
  }

  function releasePowder(bank: SnowLedge, first: number, last: number, slope: number, show = true) {
    const direction = Math.sign(slope);
    const samples = bank.depth.length - 1;
    const stride = Math.max(1, Math.round(7 / bank.step));
    let powder = 0;
    for (let i = first; i <= last; i++) {
      const thickness = bank.depth[i];
      const loose = Math.max(0, thickness - bank.capacity[i] * .48);
      const released = slope ? loose * .80 * snowBankProfile(i - first, last - first + 1) : thickness;
      powder += released * bank.step;
      bank.depth[i] -= released;
      if ((i - first + 1) % stride && i < last) continue;
      const count = powder >= .55 ? Math.min(5, Math.ceil(powder / 3)) : 0;
      const radius = Math.min(.9, .32 + Math.sqrt(powder) * .13);
      powder = 0;
      if (!show) continue;
      for (let j = 0; j < count && debris.length < 260; j++) {
        const u = Math.max(first, i - Math.random() * stride) / samples;
        const x = bank.x + bank.dx * u;
        const y = bank.y + bank.dy * u + bank.foot[Math.round(u * samples)] * bank.verticalScale;
        const above = Math.random() * Math.min(3, thickness);
        debris.push({
          x, y: y - above + (bank.fixed ? 0 : scroll),
          vx: (Math.random() - .5) * 11,
          vy: 2 + Math.random() * 9,
          r: radius * (.72 + Math.random() * .68), age: 0, life: 1.45 + Math.random() * .85,
          phase: Math.random() * Math.PI * 2, fixed: bank.fixed,
          slide: slope ? { bank, u, direction, speed: 7 + Math.random() * 8, above } : undefined,
        });
      }
    }
  }

  function land(x: number, before: number, after: number, size: number) {
    for (const bank of live) {
      if (clock < bank.lastGrowth) continue;
      const u = (x - bank.x) / bank.dx;
      if (u <= 0 || u >= 1) continue;
      const i = Math.round(u * (bank.depth.length - 1));
      const foot = bank.y + bank.dy * u + bank.foot[i] * bank.verticalScale;
      const top = foot - bank.depth[i] * bank.verticalScale;
      if (before > top || after < top || !exposed(bank, x, foot)) continue;
      for (let j = Math.max(0, i - 2); j <= Math.min(i + 2, bank.depth.length - 1); j++) {
        bank.depth[j] += Math.min(Math.max(0, bank.capacity[j] - bank.depth[j]), size * .11 * (1 - Math.abs(i - j) / 3));
      }
      bank.dirty = true;
      return true;
    }
    return false;
  }
  const snowfall = createSnowfall("page", land);

  function sweep(to: ArtworkPointer, from: ArtworkPointer) {
    const sx = to.x - from.x, sy = to.y - from.y;
    // Sweep across the path between pointer events, including fast diagonal strokes.
    const steps = Math.min(32, Math.max(1, Math.ceil(Math.hypot(sx, sy) / 10)));
    for (let k = 1; k <= steps; k++) {
      const x = from.x + sx * k / steps, y = from.y + sy * k / steps;
      for (const bank of live) {
        const u = (x - bank.x) / bank.dx;
        if (u < 0 || u > 1) continue;
        const i = Math.round(u * (bank.depth.length - 1));
        const foot = bank.y + bank.dy * u + bank.foot[i] * bank.verticalScale;
        if (y >= foot - bank.depth[i] * bank.verticalScale - 3 && y <= foot + 3) {
          dislodge(bank, u, 14, .72, Math.max(-35, Math.min(35, sx * .4)));
        }
      }
    }
  }

  return {
    press(control) {
      const host = control.querySelector<HTMLElement>(".artwork-barrel") ?? control;
      const bank = banks.get(host);
      if (!bank?.sampled || !bank.width) return;
      releasePowder(bank, 0, bank.depth.length - 1, 0);
      bank.paint();
      bank.lastGrowth = clock + .5;
    },
    brush(point, time) {
      sweep(point, previousPointer && time - previousPointer.time < .16 ? previousPointer : point);
      previousPointer = { ...point, time };
      pointer = point;
    },
    draw(ctx, view, time, opacity) {
      const dt = Math.max(0, Math.min(.05, time - clock));
      clock = time;
      scroll = view.scroll;
      live = [];
      // Read both ends in screen space. The browser applies ancestor transforms,
      // including the marquee, card rotation, scaling and the opening animations.
      for (const bank of inView) {
        if (!bank.width) continue;
        const a = bank.left.getBoundingClientRect(), b = bank.right.getBoundingClientRect();
        const dx = b.x - a.x, dy = b.y - a.y;
        const mx = a.x - bank.x, my = a.y - bank.y + (bank.fixed ? 0 : scroll - bank.lastScroll);
        if (bank.sampled && bank.moving) {
          const distance = Math.hypot(mx, my) + Math.abs(dy - bank.dy) * .5;
          if (distance < 50) bank.travel += distance;
        }
        if (!bank.sampled && bank.lastGrowth <= time) bank.lastGrowth = time;
        Object.assign(bank, { x: a.x, y: a.y, dx, dy, verticalScale: dx > 1 ? (dx * dx + dy * dy) / (dx * bank.width) : 1, lastScroll: scroll, sampled: true });
        if (dx > 1) live.push(bank);
      }
      for (const bank of live) {
        const age = time - bank.lastGrowth;
        if (age > .14) {
          const gain = 1 - Math.exp(-Math.min(age, .2) / 42);
          for (let i = 0; i < bank.depth.length; i++) bank.depth[i] += Math.max(0, bank.capacity[i] - bank.depth[i]) * gain;
          bank.lastGrowth = time;
          bank.dirty = true;
        }
        const slope = bank.dy / bank.dx;
        const overhang = slideSnow(bank.depth, bank.capacity, bank.step, slope, dt);
        if (Math.abs(slope) >= .016) bank.dirty = true;
        if (overhang) {
          const end = slope > 0 ? 1 : 0;
          // Check the ledge just uphill of the lip, where the rounded card
          // is still under the snow. Overlapping cards can hide that lip.
          const probe = end - Math.sign(slope) * Math.min(.25, 9 / bank.dx);
          const first = end ? bank.depth.length - overhang : 0;
          const last = first + overhang - 1;
          const foot = bank.foot[Math.round(probe * (bank.depth.length - 1))] * bank.verticalScale;
          const visible = exposed(bank, bank.x + bank.dx * probe, bank.y + bank.dy * probe + foot + 2);
          releasePowder(bank, first, last, slope, visible);
          bank.paint();
          bank.lastPaint = time;
        }
        if (bank.travel > bank.nextShed) {
          bank.travel = 0; bank.nextShed = 85 + Math.random() * 155;
          if (Math.abs(slope) < .016) dislodge(bank, Math.random(), 7, .35, 0);
        }
        const alpha = String(opacity);
        if (bank.el.style.opacity !== alpha) bank.el.style.opacity = alpha;
      }
      // A moving surface can pass under a resting pointer.
      if (pointer && previousPointer && time - previousPointer.time > .12) sweep(pointer, pointer);
      snowfall(ctx, view.width, view.height, time, opacity, view.dark);
      for (const bank of live) if (bank.dirty && time - bank.lastPaint > .045) {
        bank.paint(); bank.lastPaint = time;
      }
      const ratio = Math.min(devicePixelRatio, 1.5);
      const w = Math.round(view.width * ratio), h = Math.round(view.height * ratio);
      if (spill.width !== w || spill.height !== h) { spill.width = w; spill.height = h; }
      ink.setTransform(ratio, 0, 0, ratio, 0, 0);
      ink.clearRect(0, 0, view.width, view.height);
      const breeze = (windTravel(time + .08) - windTravel(time)) / .08;
      const drag = 1 - Math.exp(-3.6 * dt);
      ink.fillStyle = view.dark ? "#eaf3fb" : "#66839a";
      for (let i = debris.length - 1; i >= 0; i--) {
        const grain = debris[i];
        const slide = grain.slide;
        if (slide) {
          const { bank, direction } = slide;
          if (!bank.sampled || bank.dx <= 1 || !bank.host.isConnected) { debris.splice(i, 1); continue; }
          const slope = bank.dy / bank.dx;
          slide.speed = Math.min(65, slide.speed + (28 + Math.max(0, slope * direction) * 330) * dt);
          const next = slide.u + direction * slide.speed * dt / bank.dx;
          slide.u = Math.min(1, Math.max(0, next));
          const sample = slide.u * (bank.foot.length - 1);
          const j = Math.min(bank.foot.length - 2, Math.floor(sample));
          const foot = bank.foot[j] + (bank.foot[j + 1] - bank.foot[j]) * (sample - j);
          grain.x = bank.x + bank.dx * slide.u;
          grain.y = bank.y + bank.dy * slide.u + foot * bank.verticalScale - slide.above + (bank.fixed ? 0 : scroll);
          if (next <= 0 || next >= 1) {
            grain.slide = undefined;
            grain.vx = direction * slide.speed * .42;
            grain.vy = Math.max(5, Math.min(29, direction * slope * slide.speed + 7));
          }
        } else grain.age += dt;
        if (grain.age >= grain.life) { debris.splice(i, 1); continue; }
        // Air resistance gives each grain a settling speed. The shared gust
        // carries lighter powder farther, with a small flutter as it turns.
        const flutter = Math.sin(grain.phase + grain.age * 6);
        const wind = breeze / (1 + grain.r * .48) + flutter * 7;
        const settling = 13 + grain.r * 21 + flutter * 3;
        if (!slide) {
          grain.vx += (wind - grain.vx) * drag;
          grain.vy += (settling - grain.vy) * drag;
          grain.x += grain.vx * dt;
          grain.y += grain.vy * dt;
        }
        const y = grain.y - (grain.fixed ? 0 : scroll);
        ink.globalAlpha = opacity * (.64 + grain.r * .13) * Math.min(1, (grain.life - grain.age) * 1.65);
        ink.beginPath();
        ink.ellipse(grain.x, y, grain.r, grain.r * (.72 + flutter * .12), grain.phase + grain.age * 2, 0, Math.PI * 2);
        ink.fill();
      }
    },
    dispose() {
      visibility.disconnect(); sizing.disconnect(); additions.disconnect();
      document.documentElement.removeEventListener("pointerleave", clearPointer);
      window.removeEventListener("blur", clearPointer);
      for (const bank of banks.values()) {
        bank.el.remove();
        if (!bank.host.querySelector(":scope > .folio-snow-ledge")) bank.host.classList.remove("folio-snow-anchor");
      }
      spill.remove();
    },
  };
}
