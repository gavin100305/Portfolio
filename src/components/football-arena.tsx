"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Astronaut } from "@/components/ship-artwork";
import type { RemoteVisitor } from "@/data/ship-presence";
import { SUIT_PALETTES, suitColors, type SuitPalette } from "@/data/astronauts";
import { contains, rooms } from "@/data/station-world";

const spots = ["Left", "Centre", "Right"] as const;
function displayTally(value: number) {
  if (value < 1_000) return String(value);
  if (value < 1_000_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
}
type Shot = { aim: number; keeper: number; goal: boolean };

export function nextGoalStreak(current: number, scored: boolean) {
  return scored ? current + 1 : 0;
}

export function penaltyKeyAction(key: string): "left" | "right" | "shoot" | "exit" | null {
  if (key === "ArrowLeft" || key.toLowerCase() === "a") return "left";
  if (key === "ArrowRight" || key.toLowerCase() === "d") return "right";
  if (key === " " || key === "Spacebar") return "shoot";
  if (key === "Escape") return "exit";
  return null;
}

export function useFootballGame(active: boolean) {
  const [aim, setAim] = useState(1);
  const [wasActive, setWasActive] = useState(active);
  const [goals, setGoals] = useState(0);
  const [saves, setSaves] = useState(0);
  const [goalStreak, setGoalStreak] = useState(0);
  const attempts = goals + saves;
  const [flight, setFlight] = useState<Shot | null>(null);
  const [lastShot, setLastShot] = useState<Shot | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locked = useRef(false);
  if (active !== wasActive) {
    setWasActive(active);
    if (!active) {
      setGoals(0); setSaves(0); setGoalStreak(0); setLastShot(null); setFlight(null); setAim(1);
    }
  }
  useEffect(() => {
    if (active) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (!active) locked.current = false;
  }, [active]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const shoot = useCallback(() => {
    if (!active || locked.current) return;
    locked.current = true;
    const keeper = Math.floor(Math.random() * spots.length);
    const shot = { aim, keeper, goal: keeper !== aim };
    setLastShot(null);
    setFlight(shot);
    timer.current = setTimeout(() => {
      if (shot.goal) {
        setGoals((previous) => previous + 1);
        setGoalStreak((previous) => nextGoalStreak(previous, true));
      } else {
        setSaves((previous) => previous + 1);
        setGoalStreak((previous) => nextGoalStreak(previous, false));
      }
      setFlight(null);
      setLastShot(shot);
      locked.current = false;
      timer.current = null;
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 850);
  }, [active, aim]);

  const select = useCallback((next: number) => {
    if (!locked.current) setAim(next);
  }, []);
  const reset = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    locked.current = false;
    setGoals(0); setSaves(0); setGoalStreak(0); setLastShot(null); setFlight(null); setAim(1);
  }, []);

  const status = flight ? "Shot in flight…" : lastShot
    ? `${lastShot.goal ? "Goal!" : "Saved!"} Running total: ${goals} goal${goals === 1 ? "" : "s"}, ${saves} save${saves === 1 ? "" : "s"}. Take another penalty when ready.`
    : `Choose a direction for penalty ${attempts + 1}. Your tally continues until you leave the deck.`;
  return { aim, goals, saves, goalStreak, displayGoals: displayTally(goals), displaySaves: displayTally(saves), attempts, displayAttempts: displayTally(attempts), flight, lastShot, status, shoot, select, reset };
}
type Game = ReturnType<typeof useFootballGame>;

/** Only actors and aiming markers: the room itself supplies the pitch and goal. */
export function FootballArenaScene({ active, game }: { active: boolean; game: Game }) {
  const room = rooms.football;
  const shot = active ? game.flight ?? game.lastShot : null;
  const target = 98 + game.aim * 20;
  const style = {
    left: room.x, top: room.y, width: room.width, height: room.height,
    "--shot-x": `${(shot?.aim ?? game.aim) * 20 - 20}px`,
    "--shot-y": `${shot?.goal ? -35 : -27}px`,
    "--keeper-x": `${(shot?.keeper ?? 1) * 20 - 20}px`,
    "--keeper-tilt": `${((shot?.keeper ?? 1) - 1) * 55}deg`,
  } as CSSProperties;
  return <svg className="football-world-scene" style={style} viewBox="0 0 240 176" aria-hidden="true" focusable="false" shapeRendering="crispEdges" data-shooting={active && Boolean(game.flight)} data-result={shot && !game.flight ? shot.goal ? "goal" : "saved" : ""}>
    <g className="penalty-net">
      <path d="M96 35v14m8-14v14m8-14v14m8-14v14m8-14v14m8-14v14m8-14v14M89 40h62M89 45h62" stroke="#a4c4cf" strokeWidth=".6" fill="none" />
      <rect className="penalty-net-flash" x="89" y="35" width="62" height="14" fill="#65c8ff" opacity="0" />
    </g>
    {active && <>
      {!shot && <path d={`M118 80L${target} 46`} stroke="#e4f0df" strokeWidth=".8" strokeDasharray="2 3" opacity=".6" />}
      {spots.map((spot, i) => <rect key={spot} x={94 + i * 20} y="38" width="8" height="8" fill="none" stroke={game.aim === i ? "#ffd38b" : "#cde5db"} strokeWidth={game.aim === i ? 1 : .5} opacity={game.aim === i ? 1 : .4} />)}
    </>}
    <g className="penalty-keeper"><ellipse cx="118" cy="51" rx="6" ry="2" fill="#111722" opacity=".4" /><g className="keeper-body"><g transform="translate(112 35) scale(.25)"><Astronaut palette="coral" /></g></g></g>
    <g className="penalty-ball"><path d="M116 77h4v1h1v4h-1v1h-4v-1h-1v-4h1z" fill="#f2f5fa" stroke="#111722" strokeWidth=".5" /><rect x="117" y="79" width="2" height="2" fill="#111722" /></g>
    {active && game.lastShot?.goal && <g className="penalty-celebration" fill="#ffd38b"><path d="M78 65h2v6h-2zM76 67h6v2h-6zM158 75h2v6h-2zM156 77h6v2h-6zM88 122h2v6h-2zM86 124h6v2h-6zM148 116h2v6h-2zM146 118h6v2h-6z" /></g>}
  </svg>;
}

export function FootballArenaControls({ game, onExit }: { game: Game; onExit: () => void }) {
  const { aim, select, shoot } = game;
  useEffect(() => {
    function handleKeys(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const action = penaltyKeyAction(event.key);
      if (action === "exit") { event.preventDefault(); onExit(); }
      else if (action === "left" || action === "right") {
        event.preventDefault();
        select((aim + (action === "left" ? 2 : 1)) % 3);
      } else if (action === "shoot" && !event.repeat) {
        event.preventDefault(); shoot();
      }
    }
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [aim, select, shoot, onExit]);

  return <section className="football-controls" aria-label="Orbital Training Deck penalty controls">
    <div className="football-console-title">ORBITAL TRAINING DECK <span>Penalty practice</span></div>
    <div className="football-controls-top"><strong>GOALS {game.displayGoals} · SAVES {game.displaySaves}</strong><span className="football-attempts">{game.displayAttempts} {game.attempts === 1 ? "penalty" : "penalties"}</span>{game.goalStreak >= 3 && <span className="football-streak" role="status">GOAL STREAK ×{game.goalStreak}</span>}</div>
    <span className={`football-result${game.lastShot ? game.lastShot.goal ? " is-goal" : " is-save" : ""}`}>{game.flight ? "IN FLIGHT" : game.lastShot ? game.lastShot.goal ? "GOAL" : "SAVE" : "READY"}</span>
    <p className="penalty-status" role="status" aria-live="polite" aria-atomic="true">{game.status}</p>
    <p className="penalty-help"><kbd>←</kbd> <kbd>→</kbd> or <kbd>A</kbd>/<kbd>D</kbd> aim <span>·</span> <kbd>Space</kbd> shoot <span>·</span> <kbd>Esc</kbd> return to exploring</p>
  </section>;
}

/** Sideline display only; authoritative visitor coordinates and tickets stay untouched. */
export function FootballArenaSpectators({ visitors }: { visitors: RemoteVisitor[] }) {
  const nearby = visitors.filter((visitor) => contains(rooms.football, visitor)).sort((a, b) => a.guestId.localeCompare(b.guestId));
  const scale = rooms.football.width / 240;
  const usedAccents = new Set<SuitPalette>();
  return <>{nearby.slice(0, 4).map((visitor, i) => {
    const accent = usedAccents.has(visitor.palette) ? SUIT_PALETTES.find((palette) => !usedAccents.has(palette)) ?? visitor.palette : visitor.palette;
    usedAccents.add(accent);
    const name = `Pilot ${visitor.guestId.slice(4, 8).toUpperCase()}`;
    return <div key={visitor.guestId} className="astronaut football-spectator" data-remote="true" role="img" aria-label={`${name} watching from the sideline`} style={{ left: rooms.football.x + (i % 2 ? 202 : 38) * scale, top: rooms.football.y + (76 + Math.floor(i / 2) * 48) * scale, "--spectator-accent": suitColors[accent].trim } as CSSProperties}>
      <Astronaut palette={accent} facing={i % 2 ? "left" : "right"} remote />
      <span className="spectator-name" aria-hidden="true">{`P-${visitor.guestId.slice(4, 8).toUpperCase()}`}</span>
    </div>;
  })}{nearby.length > 4 && <span className="spectator-overflow" style={{ left: rooms.football.x + 120 * scale, top: rooms.football.y + 148 * scale }}>+{nearby.length - 4} pilots watching</span>}</>;
}
