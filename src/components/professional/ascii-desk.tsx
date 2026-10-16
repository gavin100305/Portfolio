"use client";

import { useEffect, useRef, useState } from "react";
import { createDeskCells, DESK_HEIGHT, DESK_WIDTH, type AsciiCell } from "./ascii-scene";

const fallback = `                         .          +
     _________________     .-----------------.
    /________________/|    |    .     ___     |
   |  ______________ | |   |       / . . \\   |
   | |              || |   |   ---(_ . . _)-- |
   | | $ npm run    || |   |        '---'   + |
   | |   build _    || |   |_________________|
   | |______________|| /
   |_________________|/              ( (
         |_____|                    .---.
  ______/_______\\__________________|___|___
 /       [::::::::::]      ()              /|
/_______________________________________ / |
    | |                              | |
    |_|                              |_|`;

export function AsciiDesk() {
  const figureRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const replayRef = useRef<(() => void) | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current, figure = figureRef.current;
    if (!canvas || !figure) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const still = document.createElement("canvas");
    const base = still.getContext("2d");
    if (!base) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0, previousFrame = 0, start = 0, width = 0, height = 0, columns = 160;
    let cells: AsciiCell[] = [], animatedCells: AsciiCell[] = [], visible = true, mounted = true, initialized = false, finished = false;
    let foreground = "#171717", accent = "#2457e6";
    const rowCount = () => Math.round(columns * DESK_HEIGHT / DESK_WIDTH);

    const paintCell = (ctx: CanvasRenderingContext2D, cell: AsciiCell, x = cell.x, y = cell.y, alpha = 1) => {
      ctx.fillStyle = cell.accent ? accent : foreground;
      ctx.globalAlpha = alpha * (cell.accent ? .95 : .48 + cell.strength * .5);
      const radius = width / columns * (.17 + Math.sqrt(cell.strength) * .32);
      ctx.beginPath(); ctx.arc((x+.5)*width/columns, (y+.5)*height/rowCount(), radius, 0, Math.PI*2); ctx.fill();
    };
    const paintActivity = (time: number) => {
      animatedCells.forEach(cell => {
        const entrance = Math.max(0, Math.min(1, (time - start - 4900) / 900));
        const pulse = Math.max(0, Math.sin(time / (850 + cell.seed * 1400) + cell.seed * 70)) ** 4;
        const alpha = motion.matches ? .18 : entrance * (.025 + pulse * .65);
        paintCell(context, cell, cell.x, cell.y, alpha);
      });
    };
    const paintStill = () => {
      base.clearRect(0, 0, width, height);
      cells.forEach(cell => { if (!cell.kind) paintCell(base, cell); }); base.globalAlpha = 1;
    };
    const palette = () => {
      const style = getComputedStyle(figure);
      foreground = style.getPropertyValue("--folio-foreground").trim(); accent = style.getPropertyValue("--folio-accent").trim();
      if (initialized) {
        paintStill();
        if (finished || motion.matches) {
          context.clearRect(0,0,width,height); context.globalAlpha = 1;
          context.drawImage(still,0,0,width,height);
          paintActivity(performance.now());
        }
      }
    };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      width = rect.width; height = rect.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = still.width = Math.round(width * ratio); canvas.height = still.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0); base.setTransform(ratio, 0, 0, ratio, 0, 0);
      columns = width < 500 ? 170 : 240;
      cells = createDeskCells(columns); animatedCells = cells.filter(cell => cell.kind); palette(); paintStill();
    };
    const tick = (time: number) => {
      frame = requestAnimationFrame(tick);
      if (document.hidden || !visible || time - previousFrame < (finished ? 40 : 30)) return;
      previousFrame = time;
      const elapsed = motion.matches ? 10000 : time - start;
      context.clearRect(0, 0, width, height);
      if (elapsed >= 4900) {
        finished = true;
        context.globalAlpha = 1; context.drawImage(still, 0, 0, width, height);
        paintActivity(time);
      } else {
        cells.forEach(cell => {
          if (cell.kind === "background") return;
          const progress = Math.max(0, Math.min(1, (elapsed - cell.delay - cell.seed * 480) / (cell.accent ? 1900 : 3500)));
          if (!progress) return;
          const eased = progress * progress * (3 - 2 * progress);
          const spread = (1 - eased);
          const x = cell.x + (cell.seed - .5) * columns * 1.1 * spread;
          const y = cell.y + (Math.sin(cell.seed * 93) - .2) * rowCount() * .8 * spread;
          paintCell(context, cell, x, y, Math.min(1, progress * 2));
        });
      }
      context.globalAlpha = 1;
    };
    const observer = new ResizeObserver(() => { if (initialized) resize(); }); observer.observe(canvas);
    const theme = new MutationObserver(palette); theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-professional-theme"] });
    const viewport = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { rootMargin: "100px" }); viewport.observe(canvas);
    document.fonts.ready.then(() => {
      if (!mounted) return;
      initialized = true; resize(); start = performance.now();
      setReady(true); frame = requestAnimationFrame(tick);
    });
    replayRef.current = () => { start = performance.now(); finished = false; };
    return () => { mounted = false; cancelAnimationFrame(frame); observer.disconnect(); theme.disconnect(); viewport.disconnect(); replayRef.current = null; };
  }, []);

  return <figure ref={figureRef} className="ascii-desk" data-ready={ready}>
    <div className="ascii-art-frame"><div className="ascii-stage">
      <pre className="ascii-fallback" aria-hidden="true">{fallback}</pre>
      <canvas ref={canvasRef} role="img" aria-label="Dot art with Gavin Soares written in dots in the upper-left corner beside a retro computer on a desk, with a keyboard, coffee, and a window overlooking a ringed planet. Cobalt blue lights up the terminal and a few stars." />
    </div></div>
    <figcaption className="ascii-caption"><span>A LITTLE SPACE TO MAKE THINGS.</span><button type="button" onClick={() => replayRef.current?.()} className="ascii-replay" aria-label="Replay dot scene reveal"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><path d="M3 5a5 5 0 1 1 0 6M3 1v4h4" /></svg>Replay</button></figcaption>
  </figure>;
}
