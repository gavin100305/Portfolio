"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { Astronaut } from "@/components/ship-artwork";
import { advanceSpacewalker, SPACE, type Body } from "@/data/spacewalk";
import { corridorPath, MAP_SCALE, rooms, WORLD } from "@/data/station-world";
import { moduleOutline } from "@/data/ship-observation";

const directions: Record<string, { x: number; y: number }> = { w: { x: 0, y: -1 }, arrowup: { x: 0, y: -1 }, s: { x: 0, y: 1 }, arrowdown: { x: 0, y: 1 }, a: { x: -1, y: 0 }, arrowleft: { x: -1, y: 0 }, d: { x: 1, y: 0 }, arrowright: { x: 1, y: 0 } };

export function Spacewalk({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const astronautRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLButtonElement>(null);
  const beaconRef = useRef<HTMLButtonElement>(null);
  const readoutRef = useRef<HTMLOutputElement>(null);
  const input = useRef(new Set<string>());
  const character = useRef<Body>({ x: 670, y: 650, vx: 75, vy: -12 });
  const ball = useRef<Body>({ x: 850, y: 650, vx: 0, vy: 8 });
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [phase, setPhase] = useState<"sealed" | "launching" | "floating">("sealed");
  const [holding, setHolding] = useState(false);
  const [found, setFound] = useState(false);
  const foundRef = useRef(false);
  const [message, setMessage] = useState("Airlock ready");
  const startHold = useCallback(() => {
    if (holdTimer.current || phase !== "sealed") return;
    setHolding(true);
    holdTimer.current = setTimeout(() => { holdTimer.current = null; setHolding(false); setPhase("launching"); }, 1000);
  }, [phase]);
  const stopHold = useCallback(() => { if (holdTimer.current) clearTimeout(holdTimer.current); holdTimer.current = null; setHolding(false); }, []);
  const kick = useCallback(() => {
    const p = character.current, b = ball.current;
    const distance = Math.hypot(p.x - b.x, p.y - b.y);
    if (distance > 100) { setMessage("Find the floating football and get a little closer."); return; }
    const dx = b.x - p.x, dy = b.y - p.y, length = Math.hypot(dx, dy) || 1;
    b.vx = dx / length * 230 + p.vx * .35; b.vy = dy / length * 230 + p.vy * .35;
    foundRef.current = true; setFound(true); setMessage("Lost football found. Football works in zero gravity too.");
  }, []);
  useEffect(() => { ref.current?.focus({ preventScroll: true }); return () => { if (holdTimer.current) clearTimeout(holdTimer.current); }; }, []);
  useEffect(() => { if (phase === "floating") ref.current?.focus({ preventScroll: true }); }, [phase]);
  useEffect(() => {
    if (phase !== "launching") return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => { setPhase("floating"); setMessage("Spacewalk started · R returns to the station"); }, reduced ? 0 : 1000);
    return () => clearTimeout(timer);
  }, [phase]);
  useEffect(() => {
    const held = input.current;
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.target instanceof HTMLInputElement) return;
      const key = event.key.toLowerCase();
      if (key === "escape" || key === "r") { event.preventDefault(); onClose(); return; }
      if (phase === "sealed" && key === "e" && !event.repeat) { event.preventDefault(); startHold(); return; }
      if (phase !== "floating") return;
      if (key === "e" && !event.repeat) { event.preventDefault(); kick(); return; }
      if (directions[key] || key === " ") { event.preventDefault(); input.current.add(key); }
    };
    const up = (event: KeyboardEvent) => { input.current.delete(event.key.toLowerCase()); if (event.key.toLowerCase() === "e") stopHold(); };
    const clear = () => { input.current.clear(); stopHold(); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", clear); document.addEventListener("visibilitychange", clear);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", clear); document.removeEventListener("visibilitychange", clear); held.clear(); };
  }, [phase, startHold, stopHold, onClose, kick]);
  useEffect(() => {
    if (phase !== "floating") return;
    let frame = 0, previous = 0, reading = 0;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const tick = (time: number) => {
      const dt = previous && !document.hidden ? Math.min(.04, (time - previous) / 1000) : 0; previous = time;
      const thrust = { x: 0, y: 0 };
      input.current.forEach(key => { const direction = directions[key]; if (direction) { thrust.x += direction.x; thrust.y += direction.y; } });
      character.current = advanceSpacewalker(character.current, dt, thrust, input.current.has(" "));
      const p = character.current, b = ball.current;
      b.x += b.vx * dt; b.y += b.vy * dt; b.vx *= Math.exp(-.12 * dt); b.vy *= Math.exp(-.12 * dt);
      if (b.x < 30 || b.x > SPACE.width - 30) { b.x = Math.max(30, Math.min(SPACE.width - 30, b.x)); b.vx *= -.8; }
      if (b.y < 30 || b.y > SPACE.height - 30) { b.y = Math.max(30, Math.min(SPACE.height - 30, b.y)); b.vy *= -.8; }
      const planetDx = b.x - SPACE.planet.x, planetDy = b.y - SPACE.planet.y, planetDistance = Math.hypot(planetDx, planetDy) || 1;
      if (planetDistance < SPACE.planet.radius + 12) { b.x = SPACE.planet.x + planetDx / planetDistance * (SPACE.planet.radius + 12); b.y = SPACE.planet.y + planetDy / planetDistance * (SPACE.planet.radius + 12); b.vx += planetDx / planetDistance * 25; b.vy += planetDy / planetDistance * 25; }
      const dx = b.x - p.x, dy = b.y - p.y, distance = Math.hypot(dx, dy) || 1;
      if (distance < 38) {
        b.x = p.x + dx / distance * 39; b.y = p.y + dy / distance * 39;
        b.vx = p.vx + dx / distance * 45; b.vy = p.vy + dy / distance * 45;
        if (!foundRef.current) { foundRef.current = true; setFound(true); setMessage("Lost football found · E kicks it"); }
      }
      const viewport = ref.current, world = worldRef.current, astronaut = astronautRef.current;
      if (viewport && world && astronaut) {
        const scale = viewport.clientWidth < 700 ? .85 : 1;
        world.style.transform = `translate(${viewport.clientWidth / 2 - p.x * scale}px, ${viewport.clientHeight / 2 - p.y * scale}px) scale(${scale})`;
        astronaut.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${reduced.matches ? 0 : Math.max(-12, Math.min(12, p.vx * .05))}deg)`;
        astronaut.dataset.thrust = String(Boolean(thrust.x || thrust.y));
        astronaut.dataset.x = p.x.toFixed(1); astronaut.dataset.y = p.y.toFixed(1);
        astronaut.dataset.speed = Math.hypot(p.vx, p.vy).toFixed(1);
        ballRef.current?.style.setProperty("transform", `translate(${b.x}px, ${b.y}px) rotate(${reduced.matches ? 0 : time / 35}deg)`);
        const hx = SPACE.dock.x - p.x, hy = SPACE.dock.y - p.y;
        beaconRef.current?.style.setProperty("--beacon-angle", `${Math.atan2(hy, hx) * 180 / Math.PI}deg`);
        if (time - reading > 200 && readoutRef.current) { readoutRef.current.textContent = `${Math.round(Math.hypot(p.vx, p.vy))} m/s · station ${Math.round(Math.hypot(hx, hy))} m`; reading = time; }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);
  const steer = (key: string, event: PointerEvent<HTMLButtonElement>) => { event.currentTarget.setPointerCapture(event.pointerId); input.current.add(key); };
  const release = (key: string) => input.current.delete(key);
  return <section ref={ref} className="spacewalk" role="dialog" aria-modal="true" aria-label="Airlock spacewalk" tabIndex={-1} data-phase={phase} onKeyDown={event => {
    if (event.key !== "Tab") return;
    const elements = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not([disabled]):not([tabindex="-1"])') ?? []).filter(element => element.getClientRects().length > 0);
    const first = elements[0], last = elements[elements.length - 1];
    if (document.activeElement === ref.current) { event.preventDefault(); (event.shiftKey ? last : first)?.focus(); }
    else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }}>
    <div ref={worldRef} className="spacewalk-world" aria-hidden={phase !== "floating"}>
      <div className="spacewalk-station" style={{ left: SPACE.dock.x - 520, top: SPACE.dock.y - 180 }} aria-hidden="true"><svg viewBox={`0 0 ${WORLD.width / MAP_SCALE} ${WORLD.height / MAP_SCALE}`}><path d={corridorPath} fill="none" stroke="#718795" strokeWidth="30" />{Object.values(rooms).map((room, i) => <g key={i} transform={`translate(${room.x / MAP_SCALE} ${room.y / MAP_SCALE}) scale(${room.width / (240 * MAP_SCALE)})`}><polygon points={moduleOutline.map(p => `${p.x},${p.y}`).join(" ")} fill="#405775" stroke="#8ba2ba" strokeWidth="6" /><path d="M52 50h136v76H52z" fill="#253858" /><path d="M60 55h120" stroke="var(--ship-light)" strokeWidth="5" /></g>)}</svg><span>STATION AIRLOCK</span></div>
      <div className="spacewalk-planet" style={{ left: SPACE.planet.x - SPACE.planet.radius, top: SPACE.planet.y - SPACE.planet.radius, width: SPACE.planet.radius * 2 }} aria-hidden="true"><svg viewBox="0 0 180 180" shapeRendering="crispEdges"><defs><clipPath id="spacewalk-planet-clip"><circle cx="90" cy="90" r="86" /></clipPath></defs><circle cx="90" cy="90" r="86" fill="var(--ship-screen)" stroke="var(--ship-light)" strokeWidth="2" /><g clipPath="url(#spacewalk-planet-clip)" fill="var(--ship-blue)"><path d="M10 40h60v15h48v12h55v16H75V68H10zM0 105h60v-12h40v22h80v18H80v-12H0zM40 145h110v10H40z" /></g><path d="M100 5a86 86 0 0 1 0 170q95-85 0-170z" fill="#030911" opacity=".45" /></svg><span>GRAVITY WELL</span></div>
      <button ref={ballRef} type="button" className="spacewalk-football" onClick={kick} tabIndex={-1} aria-label="Kick the lost football when nearby"><svg viewBox="0 0 24 24" aria-hidden="true" shapeRendering="crispEdges"><path d="M7 1h10v3h4v4h2v9h-3v4h-4v2H7v-3H3v-4H1V8h3V4h3z" fill="#fffaf0" stroke="#172033" /><path d="M9 7h6l3 5-4 5H8l-2-6zM6 2h3v4H4zM18 4h4v4h-4zM3 16h4v5H3zM17 18h4v4h-4z" fill="#172033" /></svg></button>
      <div ref={astronautRef} className="spacewalker" role="img" aria-label="Your astronaut floating in space"><Astronaut /><span className="spacewalker-exhaust" /></div>
    </div>
    {phase !== "floating" && <div className="spacewalk-hatch" data-opening={phase === "launching"}><div className="hatch-door hatch-left" /><div className="hatch-door hatch-right" /><div className="airlock-prompt"><h2>Station airlock</h2><p>Take a spacewalk. Use thrusters to steer, coast through space, and brake near the planet.</p><button type="button" data-holding={holding} onPointerDown={startHold} onPointerUp={stopHold} onPointerCancel={stopHold} onPointerLeave={stopHold} onClick={event => { if (event.detail === 0) { stopHold(); setPhase("launching"); } }} disabled={phase === "launching"}>Hold E or hold here to eject<span className="ejection-progress" /></button><p className="airlock-hint">Return any time with R or the station beacon.</p></div></div>}
    <header className="spacewalk-header"><span className="font-pixel text-lg">{phase === "floating" ? "Outside the station" : "Airlock"}</span><button type="button" className="discovery-return" onClick={onClose}>Return to station <kbd>R</kbd></button></header>
    {phase === "floating" && <><button type="button" ref={beaconRef} className="spacewalk-beacon" onClick={onClose} aria-label="Follow station beacon and return"><span aria-hidden="true">➜</span>Station beacon</button><footer className="spacewalk-hud"><output ref={readoutRef}>0 m/s</output><p className="desktop-instructions">WASD / arrows · Space brakes · E kicks · R returns</p><p role="status">{message}</p>{found && <span className="font-pixel">Discovery: lost football</span>}</footer><div className="spacewalk-touch" aria-label="Spacewalk touch controls"><div>{[["w", "↑"], ["a", "←"], ["s", "↓"], ["d", "→"]].map(([key, label]) => <button key={key} type="button" aria-label={`Thrust ${key === "w" ? "up" : key === "s" ? "down" : key === "a" ? "left" : "right"}`} onPointerDown={event => steer(key, event)} onPointerUp={() => release(key)} onPointerCancel={() => release(key)}>{label}</button>)}</div><button type="button" onPointerDown={event => steer(" ", event)} onPointerUp={() => release(" ")} onPointerCancel={() => release(" ")}>Brake</button><button type="button" onClick={kick}>Kick</button></div></>}
  </section>;
}
