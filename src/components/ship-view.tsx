"use client";

import { useEffect, useRef, useState, type RefObject, type KeyboardEvent, type CSSProperties } from "react";
import { corridorPath, MAP_SCALE, rooms, WORLD } from "@/data/station-world";
import { moduleOutline } from "@/data/ship-observation";
import { moods, type SpaceMood } from "@/components/use-space-mood";
import type { createExteriorScene } from "@/components/exterior-scene";
import type { DeckSources } from "@/components/exterior-model";

function ShipIllustration() {
  return <svg className="ship-view-fallback-art" viewBox={`-24 32 ${WORLD.width / MAP_SCALE + 48} 820`} role="img" aria-label="Overview of the existing space station, with its seven connected decks">
    <path d={corridorPath} fill="none" stroke="#405775" strokeWidth="36" strokeLinejoin="round" />
    <path d={corridorPath} fill="none" stroke="#d9d4be" strokeWidth="16" strokeLinejoin="round" />
    {Object.entries(rooms).map(([id, r]) => <g key={id} transform={`translate(${r.x / MAP_SCALE} ${r.y / MAP_SCALE}) scale(${r.width / MAP_SCALE / 240})`}>
      <polygon points={moduleOutline.map(p => `${p.x},${p.y}`).join(" ")} fill="#405775" stroke="#8ba2ba" strokeWidth="3" />
      <rect x="28" y="30" width="184" height="112" rx="3" fill={id === "football" ? "#214c3e" : "#d9d4be"} />
      <path d="M40 38h40v20H40zM100 38h40v20h-40zM160 38h40v20h-40z" fill="#718795" />
      <path d="M44 42h32m28 0h32m28 0h32" stroke="#65c8ff" strokeWidth="3" />
      <path d="M96 88h48v32H96z" fill="#253858" stroke="#8ba2ba" strokeWidth="3" />
    </g>)}
    <path d="M0 392h48v168H0zM1584 408h48v168h-48z" fill="#182e4c" stroke="#8ba2ba" strokeWidth="3" />
  </svg>;
}

function ThemeSlider({ mood, onChange }: { mood: SpaceMood; onChange: (mood: SpaceMood) => void }) {
  const [position, setPosition] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const selected = moods.findIndex(item => item.id === mood);
  const value = position ?? selected;
  const settle = () => { setDragging(false); setPosition(null); };
  return <footer className="relative mx-auto w-full max-w-[540px] shrink-0 px-3 py-3 text-[#e2e9ef]">
    <div className="mb-2 flex items-baseline justify-between gap-3 font-pixel text-sm tracking-wide">
      <label htmlFor="observation-theme">Space mood</label>
      <span aria-hidden="true">{moods[selected].label}</span>
    </div>
    <div className="relative">
      <input id="observation-theme" className="station-theme-slider block w-full cursor-pointer" type="range" min="0" max={moods.length - 1} step="0.01" value={value} aria-valuetext={moods[selected].label}
        onPointerDown={() => setDragging(true)} onPointerUp={settle} onPointerCancel={settle} onBlur={settle}
        onChange={event => { const next = Number(event.target.value); setPosition(next); onChange(moods[Math.round(next)].id); }}
        onKeyDown={event => {
          const direction = event.key === "ArrowRight" || event.key === "ArrowUp" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 0;
          if (!direction && event.key !== "Home" && event.key !== "End") return;
          event.preventDefault();
          const next = event.key === "Home" ? 0 : event.key === "End" ? moods.length - 1 : Math.max(0, Math.min(moods.length - 1, selected + direction));
          setPosition(null); onChange(moods[next].id);
        }} />
      <span aria-hidden="true" data-dragging={dragging} className="station-slider-thumb" style={{ left: `calc(${value / (moods.length - 1) * 100}% + ${13 - value / (moods.length - 1) * 26}px)` } as CSSProperties} />
    </div>
    <div aria-hidden="true" className="mt-1 flex justify-between gap-2 font-pixel text-[10px] text-[#b7c4d3]"><span>Deep space</span><span>Nebula</span><span>Orbit</span><span>Meteors</span></div>
  </footer>;
}

type ShipViewProps = {
  worldRef: RefObject<HTMLDivElement | null>;
  mood: SpaceMood;
  onMoodChange: (mood: SpaceMood) => void;
  onClose: () => void;
};

/** Lightweight dialog; the Three.js chunk is requested only after opening. */
export function ShipView({ worldRef, mood, onMoodChange, onClose }: ShipViewProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const sceneRef = useRef<ReturnType<typeof createExteriorScene> | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const sources: DeckSources = {};
    for (const id of ["about", "projects"] as const) {
      const element = worldRef.current?.querySelector<SVGSVGElement>(`a[href="#${id}"] .room-artwork`);
      if (element) sources[id] = element;
    }
    // Import failure, unsupported WebGL2 and context loss all leave the real
    // portfolio available, with a small original SVG overview as fallback.
    void import("@/components/exterior-scene").then(({ createExteriorScene }) => {
      if (cancelled || !hostRef.current) return;
      sceneRef.current = createExteriorScene(hostRef.current, sources, () => { if (!cancelled) setStatus("fallback"); });
      setStatus("ready");
    }).catch(() => { if (!cancelled) setStatus("fallback"); });
    return () => { cancelled = true; sceneRef.current?.dispose(); sceneRef.current = null; };
  }, [worldRef]);

  const handleKeys = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
    if (!(event.target instanceof HTMLInputElement)) {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); sceneRef.current?.rotate(event.key === "ArrowLeft" ? -1 : 1); return; }
      if (event.key === "+" || event.key === "=" || event.key === "-") { event.preventDefault(); sceneRef.current?.zoom(event.key === "-" ? -1 : 1); return; }
      if (event.key === "Home") { event.preventDefault(); sceneRef.current?.reset(); return; }
    }
    if (event.key !== "Tab") return;
    const controls = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex="0"]');
    const first = controls?.item(0), last = controls?.item(controls.length - 1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  return <section className="ship-view" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="ship-view-title" onKeyDown={handleKeys}>
    <header className="ship-view-heading">
      <div><span className="ship-view-eyebrow">EXTERIOR OBSERVATION</span><h2 id="ship-view-title">Station view</h2></div>
      <button ref={closeRef} className="ship-view-return" type="button" onClick={onClose}>Return to deck <span aria-hidden="true">↵</span></button>
    </header>
    <div className="ship-view-observation">
      <div className="ship-view-canvas" ref={hostRef} role="img" tabIndex={status === "ready" ? 0 : -1} aria-describedby="ship-view-help" aria-label="Interactive perspective view of the space station" hidden={status === "fallback"} />
      {status !== "ready" && <div className="ship-view-fallback"><ShipIllustration /><p role="status">{status === "loading" ? "Preparing observation view…" : "3D view unavailable. Return to the deck to explore the station."}</p></div>}
      <p id="ship-view-help" className="visually-hidden">Drag to rotate, scroll or pinch to zoom. Keyboard: left and right arrows rotate, plus and minus zoom, Home resets.</p>
    </div>
    <ThemeSlider mood={mood} onChange={onMoodChange} />
  </section>;
}
