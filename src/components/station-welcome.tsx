"use client";

import { useEffect, useRef } from "react";
import { Astronaut } from "./ship-artwork";

export function StationWelcome({ onExplore, onReturn }: { onExplore: () => void; onReturn: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const explore = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    element.showModal();
    explore.current?.focus({ preventScroll: true });
    return () => element.close();
  }, []);
  return <dialog ref={dialog} className="station-welcome" data-station-overlay="true" aria-labelledby="station-welcome-title" onCancel={event => { event.preventDefault(); onExplore(); }}>
    <button className="station-welcome-close" type="button" onClick={onExplore} aria-label="Close welcome and explore station">×</button>
    <div className="station-welcome-heading"><div className="station-welcome-portrait"><Astronaut /></div><div><p className="station-welcome-tag">GS / EXPLORER 01</p><h2 id="station-welcome-title">Welcome to my station.</h2><p className="station-welcome-name">Gavin Soares · Developer</p></div></div>
    <p className="station-welcome-introduction">I’m Gavin, a Computer Engineering student in Mumbai building full-stack applications and AI tools. This is my corner of space—take a walk around and get to know my work.</p>
    <h3 className="station-welcome-section-title">Your first mission: explore.</h3>
    <div className="station-welcome-destinations">
      <div><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 9h10V5h6v4h10v19H3zM8 14h16v9H8z" /></svg><strong>Project Hangar</strong><span>Things I’ve built.</span></div>
      <div><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 3h18v26H7zM11 9h10M11 15h10M11 21h6" /></svg><strong>Mission Log</strong><span>Where I’ve worked.</span></div>
      <div><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 5h20v15H6zM10 26h12M16 20v6M10 10l6 5 6-5" /></svg><strong>Communications</strong><span>Let’s get in touch.</span></div>
    </div>
    <div className="station-welcome-guide"><p className="station-welcome-desktop"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><span>or arrow keys to move.</span></p><p className="station-welcome-desktop">Walk up to a room and press <kbd>Enter</kbd> to open it.</p><p className="station-welcome-touch">Drag to move your astronaut. Tap a room to open it.</p></div>
    <button ref={explore} className="station-welcome-explore" type="button" onClick={onExplore}>Explore the station <span aria-hidden="true">→</span></button>
    <button className="station-welcome-return" type="button" onClick={onReturn}>Prefer the main portfolio? Return to Earth <span aria-hidden="true">↗</span></button>
  </dialog>;
}
