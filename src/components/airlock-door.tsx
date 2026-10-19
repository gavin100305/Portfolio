"use client";

import { useId, type RefObject } from "react";
import "@/app/station-arrival.css";

/** Shared geometry keeps the closing and arriving door seamless across routes. */
export function AirlockDoor({ onSkip, skipButton, status, skipLabel = "Skip journey" }: {
  onSkip: () => void;
  skipButton: RefObject<HTMLButtonElement | null>;
  status: string;
  skipLabel?: string;
}) {
  const fogId = useId();
  return <div className="station-airlock" role="dialog" aria-modal="true" aria-label="Travelling to the station" onKeyDown={event => {
    if (event.key === "Tab") { event.preventDefault(); skipButton.current?.focus(); }
    if (event.key === "Escape") { event.preventDefault(); onSkip(); }
  }}>
      <div className="station-airlock-frame" aria-hidden="true"><span /><span /></div>
      <div className="station-airlock-door station-airlock-left" aria-hidden="true"><div className="station-airlock-inset" /><span className="station-airlock-label">GS / STATION ACCESS</span><span className="station-airlock-ribs" /><span className="station-airlock-handle" /></div>
      <div className="station-airlock-door station-airlock-right" aria-hidden="true"><div className="station-airlock-inset" /><span className="station-airlock-number">01</span><span className="station-airlock-ribs" /><span className="station-airlock-handle" /></div>
      <div className="station-airlock-window" aria-hidden="true"><div className="station-airlock-window-rim"><div className="station-airlock-glass"><div className="station-airlock-earth-sky"><div className="station-airlock-day-clouds" /><div className="station-airlock-earth-horizon"><svg viewBox="0 0 300 240" preserveAspectRatio="none"><path d="M34 39 62 20 89 33 110 28 129 48 112 71 92 78 84 107 62 98 55 76 31 63ZM164 52 186 40 219 48 242 70 234 92 215 96 207 122 185 117 177 91 158 82ZM116 134 133 124 153 137 156 160 142 190 132 180 126 157Z" fill="#77ab8d" /><path d="M-10 55Q60 23 116 51T310 65M-10 107Q58 81 125 104T310 113M40 159Q110 134 191 154T290 163" fill="none" stroke="#e8f6f4" strokeWidth="8" opacity=".65" /><path d="M0 58Q90 20 154 51M176 102Q233 91 293 110" fill="none" stroke="white" strokeWidth="3" opacity=".85" /></svg></div></div><div className="station-airlock-sky"><div className="station-airlock-nebula" /><div className="station-airlock-stars station-airlock-stars-far" /><div className="station-airlock-stars" /><div className="station-airlock-planet" /></div></div></div>{Array.from({length: 8}, (_, i) => <span key={i} className="station-airlock-bolt" style={{ transform: `rotate(${i * 45}deg) translateY(calc(var(--airlock-window-size) * -.455)) rotate(${-i * 45}deg)` }} />)}</div>
      <div className="station-airlock-vent station-airlock-vent-left" aria-hidden="true" /><div className="station-airlock-vent station-airlock-vent-right" aria-hidden="true" />
      <div className="station-airlock-fog" aria-hidden="true">
        <svg className="station-airlock-fog-texture" width="0" height="0"><defs><filter id={fogId} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".007 .013" numOctaves="3" seed="8" result="noise" /><feColorMatrix in="noise" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  3 0 0 0 -1" result="wisps" /><feComposite in="SourceGraphic" in2="wisps" operator="in" result="cloud" /><feDisplacementMap in="cloud" in2="noise" scale="90" xChannelSelector="R" yChannelSelector="G" /><feGaussianBlur stdDeviation="3" /></filter></defs></svg>
        <div className="station-airlock-cloud station-airlock-cloud-left" style={{ filter: `url(#${fogId})` }} /><div className="station-airlock-cloud station-airlock-cloud-right" style={{ filter: `url(#${fogId})` }} /><div className="station-airlock-cloud station-airlock-cloud-floor" style={{ filter: `url(#${fogId})` }} />
      </div>
      <p className="visually-hidden" role="status">{status}</p>
      <button ref={skipButton} className="station-airlock-skip" type="button" onClick={onSkip}>{skipLabel} <span aria-hidden="true">↗</span></button>
    </div>;
}
