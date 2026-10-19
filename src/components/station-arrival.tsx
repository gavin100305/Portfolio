"use client";

import { StationWelcome } from "./station-welcome";
import { useReturnJourney } from "./return-journey";
import { AirlockDoor } from "@/components/airlock-door";
import { useSpaceMood } from "@/components/use-space-mood";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function StationArrival({ children }: { children: ReactNode }) {
  const { mood } = useSpaceMood();
  const returnHome = useReturnJourney();
  const [welcomed, setWelcomed] = useState(false);
  const [phase, setPhase] = useState<"transit" | "docking" | "venting" | "opening" | "done">("transit");
  const scene = useRef<HTMLDivElement>(null);
  const skip = useRef<() => void>(() => {});
  const skipButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let disposed = false, opening = false, minimumElapsed = false;
    const previousFocus = document.activeElement;
    skipButton.current?.focus({ preventScroll: true });
    const finish = () => {
      if (disposed) return;
      setPhase("done");
      requestAnimationFrame(() => scene.current?.querySelector<HTMLElement>(".map-viewport")?.focus({ preventScroll: true }));
    };
    const open = () => {
      if (opening || disposed) return;
      opening = true;
      setPhase("opening");
      timers.push(setTimeout(finish, reduced ? 180 : 3300));
    };
    skip.current = open;
    const check = () => {
      if (minimumElapsed && scene.current?.querySelector('[data-depth-ready="true"]')) open();
    };
    const observer = new MutationObserver(check);
    if (scene.current) observer.observe(scene.current, { subtree: true, attributes: true, attributeFilter: ["data-depth-ready"] });
    timers.push(setTimeout(() => { setPhase(current => current === "transit" ? "docking" : current); }, reduced ? 0 : 4800));
    timers.push(setTimeout(() => { setPhase(current => current === "docking" ? "venting" : current); }, reduced ? 0 : 6200));
    timers.push(setTimeout(() => { minimumElapsed = true; check(); }, reduced ? 180 : 8000));
    // The station has a complete CSS map even when its optional depth layer is unavailable.
    timers.push(setTimeout(open, reduced ? 700 : 12500));
    const key = (event: KeyboardEvent) => { if (event.key === "Escape" && !opening) { event.preventDefault(); open(); } };
    window.addEventListener("keydown", key);
    return () => {
      disposed = true;
      timers.forEach(clearTimeout);
      observer.disconnect();
      window.removeEventListener("keydown", key);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);
  return <div className="station-arrival" data-arrival={phase} data-mood={mood}>
    <div ref={scene} className="station-arrival-scene" inert={phase !== "done" || !welcomed}>{children}</div>
    {phase === "done" && !welcomed && <StationWelcome onExplore={() => {
      setWelcomed(true);
      requestAnimationFrame(() => scene.current?.querySelector<HTMLElement>(".map-viewport")?.focus({ preventScroll: true }));
    }} onReturn={() => { setWelcomed(true); returnHome(); }} />}
    {phase === "done" && welcomed && <button className="station-return-control" type="button" onClick={returnHome}>← Main portfolio</button>}
    {phase !== "done" && <AirlockDoor onSkip={() => skip.current()} skipButton={skipButton} status={phase === "transit" ? "Leaving Earth for the station" : phase === "docking" ? "Docking" : phase === "venting" ? "Releasing pressure" : "Opening the airlock"} />}
  </div>;
}
