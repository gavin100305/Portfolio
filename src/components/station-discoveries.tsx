"use client";

import { useEffect, useRef, useState } from "react";
import { discoveries, discoveryNear, type DiscoveryId } from "@/data/station-discoveries";
import { moveCharacter, type Point } from "@/data/station-world";
import { robotRoute } from "@/data/robot-route";
import { PortfolioIcon } from "@/components/portfolio-icon";

export function StationDiscoveries({ robotAwake, enabled, onDiscover, getMovement, onRobotMovement, onFocus, onBlur }: {
  robotAwake: boolean; enabled: boolean; onDiscover: (id: DiscoveryId) => void;
  getMovement: () => Point; onRobotMovement: (point: Point) => void; onFocus: (point: Point) => void; onBlur: () => void;
}) {
  const robotRef = useRef<HTMLButtonElement>(null);
  const [nearby, setNearby] = useState<DiscoveryId | null>(null);
  const robotState = useRef({ position: { x: discoveries.robot.x, y: discoveries.robot.y } });
  const robotPhase = robotAwake ? "following" : "sleeping";
  useEffect(() => {
    let frame = 0, previous = 0;
    const saved = robotState.current;
    if (!robotAwake) saved.position = { x: discoveries.robot.x, y: discoveries.robot.y };
    let robot = { ...saved.position };
    let routeAge = 1;
    let route: Point[] = [], destination = { ...robot };
    const tick = (time: number) => {
      const dt = previous ? Math.min(.04, (time - previous) / 1000) : 0; previous = time;
      if (enabled) {
        const player = getMovement();
        const near = discoveryNear(player); setNearby(current => current === near ? current : near);
        if (robotAwake) {
          routeAge += dt;
          const target = player;
          const distance = Math.hypot(target.x - robot.x, target.y - robot.y);
          const shouldMove = distance > 64;
          if (shouldMove) {
            if (routeAge > .6 && (!route.length || Math.hypot(destination.x - target.x, destination.y - target.y) > 24)) {
              destination = { ...target }; route = robotRoute(robot, target); routeAge = 0;
            }
            const waypoint = route[0];
            if (waypoint) {
              const length = Math.hypot(waypoint.x - robot.x, waypoint.y - robot.y);
              if (length < 6) route.shift();
              else { const step = Math.min(length, dt * 165); robot = moveCharacter(robot, (waypoint.x - robot.x) / length * step, (waypoint.y - robot.y) / length * step); }
            }
          }
        }
      }
      saved.position = robot;
      if (robotAwake) onRobotMovement(robot);
      const element = robotRef.current;
      if (element) { element.style.left = `${robot.x - 24}px`; element.style.top = `${robot.y - 22}px`; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [robotAwake, enabled, getMovement, onRobotMovement]);
  return <>
    {(["airlock", "signal"] as const).map(id => <button key={id} type="button" disabled={!enabled} className={`station-discovery discovery-${id}`} style={{ left: discoveries[id].x - 35, top: discoveries[id].y - 17 }} aria-label={discoveries[id].label} onClick={() => onDiscover(id)} onFocus={() => onFocus(discoveries[id])} onBlur={onBlur}>
      {id === "airlock" ? <><span className="discovery-airlock-icon" aria-hidden="true" /><span>AIRLOCK</span></> : <><span className="discovery-signal-bars" aria-hidden="true">▂▅▃▆</span><span>???</span></>}
    </button>)}
    <button ref={robotRef} type="button" className="maintenance-robot" disabled={!enabled || robotAwake} data-phase={robotAwake ? robotPhase : "sleeping"} aria-label={robotAwake ? `Maintenance robot ${robotPhase}` : "Wake sleeping maintenance robot"} onClick={() => onDiscover("robot")} onFocus={() => onFocus(discoveries.robot)} onBlur={onBlur} style={{ left: discoveries.robot.x - 24, top: discoveries.robot.y - 22 }}>
      <svg viewBox="0 0 40 40" aria-hidden="true" shapeRendering="crispEdges"><path d="M10 10h20v4h4v20H6V14h4z" fill="#718795" stroke="#172033" strokeWidth="2" /><path d="M10 16h20v10H10z" fill="#14334a" /><path className="robot-eyes" d="M13 20h5v3h-5zM23 20h5v3h-5z" fill="var(--ship-light)" /><path d="M11 34h6v4h-6zM24 34h6v4h-6zM19 4h3v7h-3z" fill="#253858" /><path d="M18 3h5v3h-5z" fill="var(--ship-warning)" /><path className="robot-repair-spark" d="M34 8h4v4h-4zM36 2h2v3h-2zM30 5h3v2h-3z" fill="#ffd47a" /></svg>
      <span className="robot-caption">{robotAwake ? "FOLLOWING" : "z z"}</span>
    </button>
    {nearby && enabled && <span className="discovery-near-label" style={{ left: discoveries[nearby].x - 60, top: discoveries[nearby].y + 28 }}>{nearby === "robot" && robotAwake ? "ROBOT AWAKE" : "E · " + (nearby === "airlock" ? "SPACEWALK" : nearby === "signal" ? "TUNE SIGNAL" : "WAKE ROBOT")}</span>}
  </>;
}

export function AlienTransmission({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [frequency, setFrequency] = useState(42);
  const [decoded, setDecoded] = useState(false);
  const distance = Math.abs(frequency - 73);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  useEffect(() => {
    if (distance > 2 || decoded) return;
    const timer = window.setTimeout(() => setDecoded(true), 900);
    return () => window.clearTimeout(timer);
  }, [distance, decoded]);
  return <dialog ref={ref} className="cockpit-mood-dialog" onCancel={event => { event.preventDefault(); onClose(); }} aria-labelledby="alien-title">
    <div className="flex items-center justify-between"><h2 id="alien-title" className="font-pixel text-2xl text-station-accent">Unknown transmission</h2><button className="discovery-close" onClick={onClose} aria-label="Close transmission">×</button></div>
    <p className="my-4 text-sm leading-relaxed text-[#45566a]">A faint signal is hiding in the static. Adjust the frequency until it becomes clear.</p>
    <div className="alien-wave" data-clear={distance < 3} aria-hidden="true">{Array.from({ length: 22 }, (_, i) => <i key={i} style={{ height: `${8 + ((i * 17 + frequency) % 34)}px`, opacity: .3 + Math.max(0, 1 - distance / 35) * .7 }} />)}</div>
    <label className="mt-5 block font-pixel text-station-accent" htmlFor="alien-frequency">Frequency · {frequency}.0 MHz</label>
    <input id="alien-frequency" type="range" min="0" max="100" value={frequency} onChange={event => setFrequency(Number(event.target.value))} className="mt-3 w-full accent-station-accent" />
    <p role="status" className="mt-4 min-h-20 font-pixel text-station-accent">{decoded ? "TRANSMISSION DECODED: We came for intelligent life. We stayed for the football. See you on the pitch, Earthling." : distance < 3 ? "Signal locked · decoding…" : distance < 14 ? "Signal getting stronger…" : "Only static. Keep searching."}</p>
    {decoded && <PortfolioIcon name="star" />}
  </dialog>;
}
