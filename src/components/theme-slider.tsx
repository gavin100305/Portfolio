"use client";

import { useState, type CSSProperties } from "react";
import { moods, type SpaceMood } from "@/components/use-space-mood";

export function ThemeSlider({ mood, onChange, tone = "dark", id = "observation-theme" }: { mood: SpaceMood; onChange: (mood: SpaceMood) => void; tone?: "dark" | "light"; id?: string }) {
  const [position, setPosition] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const selected = moods.findIndex(item => item.id === mood);
  const value = position ?? selected;
  const settle = () => { setDragging(false); setPosition(null); };
  return <div className={`relative w-full ${tone === "light" ? "text-station-accent" : "text-[#e2e9ef]"}`}>
    <div className="mb-2 flex items-baseline justify-between gap-3 font-pixel text-sm tracking-wide">
      <label htmlFor={id}>Space mood</label>
      <span aria-hidden="true">{moods[selected].label}</span>
    </div>
    <div className="relative">
      <input id={id} data-tone={tone} className="station-theme-slider block w-full cursor-pointer" type="range" min="0" max={moods.length - 1} step="0.01" value={value} aria-valuetext={moods[selected].label}
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
    <div aria-hidden="true" className={`mt-1 flex justify-between gap-2 font-pixel text-[10px] ${tone === "light" ? "text-station-accent" : "text-[#b7c4d3]"}`}><span>Deep space</span><span>Nebula</span><span>Orbit</span><span>Meteors</span></div>
  </div>;
}

