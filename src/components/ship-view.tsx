"use client";

import { useEffect, useRef, useState, type RefObject, type KeyboardEvent } from "react";
import { BernabeuExteriorArtwork } from "./bernabeu-artwork";
import { sections, getSection } from "@/data/sections";
import { corridorPath, MAP_SCALE, rooms, WORLD } from "@/data/station-world";
import { moduleOutline } from "@/data/ship-observation";
import { type SpaceMood } from "@/components/use-space-mood";
import { ThemeSlider } from "@/components/theme-slider";
import type { createExteriorScene } from "@/components/exterior-scene";
import type { DeckSources } from "@/components/exterior-model";

function ShipIllustration() {
  return <svg className="ship-view-fallback-art" viewBox={`-24 32 ${WORLD.width / MAP_SCALE + 48} 820`} role="img" aria-label="Overview of the existing space station, with its seven connected decks">
    <path d={corridorPath} fill="none" stroke="#405775" strokeWidth="36" strokeLinejoin="round" />
    <path d={corridorPath} fill="none" stroke="#d9d4be" strokeWidth="16" strokeLinejoin="round" />
    {Object.entries(rooms).map(([id, r]) => <g key={id} transform={`translate(${r.x / MAP_SCALE} ${r.y / MAP_SCALE}) scale(${r.width / MAP_SCALE / 240})`}>
      {id === "football" ? <svg width="240" height="176" viewBox="0 0 240 176"><BernabeuExteriorArtwork /></svg> : <>
      <polygon points={moduleOutline.map(p => `${p.x},${p.y}`).join(" ")} fill="#405775" stroke="#8ba2ba" strokeWidth="3" />
      <rect x="28" y="30" width="184" height="112" rx="3" fill="#d9d4be" />
      <path d="M40 38h40v20H40zM100 38h40v20h-40zM160 38h40v20h-40z" fill="#718795" />
      <path d="M44 42h32m28 0h32m28 0h32" stroke="#65c8ff" strokeWidth="3" />
      <path d="M96 88h48v32H96z" fill="#253858" stroke="#8ba2ba" strokeWidth="3" />
      </>}
    </g>)}
    <path d="M0 392h48v168H0zM1584 408h48v168h-48z" fill="#182e4c" stroke="#8ba2ba" strokeWidth="3" />
  </svg>;
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
  const [peekNotice, setPeekNotice] = useState("Tap a room to peek inside");
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const sources: DeckSources = {};
    for (const { id } of sections) {
      const element = worldRef.current?.querySelector<SVGSVGElement>(`a[href="#${id}"] .room-artwork`);
      if (element) sources[id] = element;
    }
    // Import failure, unsupported WebGL2 and context loss all leave the real
    // portfolio available, with a small original SVG overview as fallback.
    void import("@/components/exterior-scene").then(({ createExteriorScene }) => {
      if (cancelled || !hostRef.current) return;
      sceneRef.current = createExteriorScene(hostRef.current, sources, () => { if (!cancelled) setStatus("fallback"); }, (id, open) => { if (!cancelled) setPeekNotice(id === "football" ? `Bernabéu · roof ${open ? "open · tap again to close" : "closed"}` : `${getSection(id)?.roomName} ${open ? "open · tap again to close" : "closed"}`); });
      setStatus("ready");
    }).catch(() => { if (!cancelled) setStatus("fallback"); });
    return () => { cancelled = true; sceneRef.current?.dispose(); sceneRef.current = null; };
  }, [worldRef]);

  const handleKeys = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
    if (!(event.target instanceof HTMLInputElement)) {
      const roomIndex = Number(event.key) - 1;
      if (/^[1-7]$/.test(event.key)) { event.preventDefault(); sceneRef.current?.toggleRoom(sections[roomIndex].id); return; }
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
      {status === "ready" && <p role="status" className="ship-view-notice pointer-events-none m-0 text-center font-pixel text-xs tracking-wide text-[#c8d5df]">{peekNotice}</p>}
      <p id="ship-view-help" className="visually-hidden">Drag to rotate, scroll or pinch to zoom. Keyboard: left and right arrows rotate, plus and minus zoom, Home resets. Number keys 1 to 7 toggle room roofs, in Projects, Achievements, Tech Stack, Experience, About, Contact, and Bernabéu order. The Bernabéu’s central roof slides open to reveal the pitch.</p>
    </div>
    <footer className="relative mx-auto w-full max-w-[540px] shrink-0 px-3 py-3"><ThemeSlider mood={mood} onChange={onMoodChange} /></footer>
  </section>;
}
