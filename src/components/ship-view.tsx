"use client";

import { useEffect, useRef, useState, type RefObject, type KeyboardEvent } from "react";
import { sections, type SectionId } from "@/data/sections";
import { corridorPath, MAP_SCALE, rooms, WORLD } from "@/data/station-world";
import { moduleOutline } from "@/data/ship-observation";
import { moods, type SpaceMood } from "@/components/use-space-mood";
import type { createExteriorScene } from "@/components/exterior-scene";
import type { DeckSources } from "@/components/exterior-model";

function ShipIllustration() {
  return <svg className="ship-view-fallback-art" viewBox={`-24 32 ${WORLD.width / MAP_SCALE + 48} 820`} role="img" aria-label="Overview of the existing spaceship, with its seven connected decks">
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

type ShipViewProps = {
  worldRef: RefObject<HTMLDivElement | null>;
  mood: SpaceMood;
  onMoodChange: (mood: SpaceMood) => void;
  onClose: () => void;
  onSection: (id: SectionId) => void;
};

/** Lightweight dialog; the Three.js chunk is requested only after opening. */
export function ShipView({ worldRef, mood, onMoodChange, onClose, onSection }: ShipViewProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const sceneRef = useRef<ReturnType<typeof createExteriorScene> | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const [peek, setPeek] = useState(false);

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
    if (!(event.target instanceof HTMLSelectElement)) {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); sceneRef.current?.rotate(event.key === "ArrowLeft" ? -1 : 1); return; }
      if (event.key === "+" || event.key === "=" || event.key === "-") { event.preventDefault(); sceneRef.current?.zoom(event.key === "-" ? -1 : 1); return; }
      if (event.key === "Home") { event.preventDefault(); sceneRef.current?.reset(); return; }
    }
    if (event.key !== "Tab") return;
    const controls = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], select');
    const first = controls?.item(0), last = controls?.item(controls.length - 1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  const changePeek = () => {
    sceneRef.current?.setPeek(!peek);
    setPeek(!peek);
  };

  return <section className="ship-view" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="ship-view-title" onKeyDown={handleKeys}>
    <header className="ship-view-heading">
      <div><span className="ship-view-eyebrow">EXTERIOR OBSERVATION</span><h2 id="ship-view-title">Ship view</h2></div>
      <button ref={closeRef} className="ship-view-return" type="button" onClick={onClose}>Return to deck <span aria-hidden="true">↵</span></button>
    </header>
    <div className="ship-view-observation">
      <div className="ship-view-canvas" ref={hostRef} role="img" tabIndex={status === "ready" ? 0 : -1} aria-describedby="ship-view-help" aria-label={`Interactive perspective view of the existing seven-deck spaceship${peek ? ", with the Command Deck and Project Hangar exposed" : ""}`} hidden={status === "fallback"} />
      {status !== "ready" && <div className="ship-view-fallback"><ShipIllustration /><p role="status">{status === "loading" ? "Preparing observation view…" : "3D view unavailable. You can explore every deck below."}</p></div>}
      <span className="ship-view-caption">{peek ? "COMMAND DECK + PROJECT HANGAR · DECK PEEK" : "SEVEN CONNECTED DECKS · ORIGINAL FLOOR PLAN"}</span>
    </div>
    <footer className="ship-view-footer">
      <div className="ship-view-camera" role="group" aria-label="Ship camera controls">
        <p id="ship-view-help">Drag to rotate · Scroll or pinch to zoom<span className="visually-hidden">. Keyboard: left and right arrows rotate, plus and minus zoom, Home resets.</span></p>
        <button type="button" aria-label="Rotate ship left" disabled={status !== "ready"} onClick={() => sceneRef.current?.rotate(-1)}>↶</button>
        <button type="button" aria-label="Rotate ship right" disabled={status !== "ready"} onClick={() => sceneRef.current?.rotate(1)}>↷</button>
        <button type="button" aria-label="Zoom in" disabled={status !== "ready"} onClick={() => sceneRef.current?.zoom(1)}>+</button>
        <button type="button" aria-label="Zoom out" disabled={status !== "ready"} onClick={() => sceneRef.current?.zoom(-1)}>−</button>
        <button type="button" disabled={status !== "ready"} onClick={() => sceneRef.current?.reset()}>Reset view</button>
      </div>
      <div className="ship-view-settings">
        <button type="button" className="ship-view-peek" disabled={status !== "ready"} aria-pressed={peek} onClick={changePeek}>{peek ? "Close deck peek" : "Peek inside"}</button>
        <label className="ship-view-mood">Space mood<select value={mood} onChange={event => onMoodChange(event.target.value as SpaceMood)}>{moods.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}</select></label>
        <p>Your astronaut is waiting where you left them.</p>
      </div>
      <nav className="ship-view-directory" aria-label="Go to a portfolio deck">{sections.map(section => <a href={`#${section.id}`} key={section.id} onClick={event => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault(); onSection(section.id);
      }}>{section.label}<span aria-hidden="true">↗</span></a>)}</nav>
    </footer>
  </section>;
}
