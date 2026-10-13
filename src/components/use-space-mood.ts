"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

export const moods = [
  { id: "deep-space", label: "Deep Space" },
  { id: "nebula-drift", label: "Nebula Drift" },
  { id: "planetary-orbit", label: "Planetary Orbit" },
  { id: "meteor-shower", label: "Near-Sun Meteor Shower" },
] as const;
export type SpaceMood = typeof moods[number]["id"];
const key = "portfolio:space-mood";
let fallback: SpaceMood = "deep-space";
function snapshot(): SpaceMood {
  try { const saved = localStorage.getItem(key); return moods.find((mood) => mood.id === saved)?.id ?? fallback; }
  catch { return fallback; }
}
function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(key, listener);
  return () => { window.removeEventListener("storage", listener); window.removeEventListener(key, listener); };
}
function save(mood: SpaceMood) {
  fallback = mood;
  try { localStorage.setItem(key, mood); } catch { /* Preference still works without storage. */ }
  window.dispatchEvent(new Event(key));
}
export function useSpaceMood() {
  const controlRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const mood = useSyncExternalStore(subscribe, snapshot, () => "deep-space" as SpaceMood);
  const [flight, setFlight] = useState<"departing" | "arriving" | "settling" | null>(null);
  const [destination, setDestination] = useState<SpaceMood | null>(null);
  const advance = useCallback(() => {
    if (flight === "departing" && destination) { save(destination); setFlight("arriving"); }
    else if (flight === "arriving") setFlight("settling");
    else if (flight === "settling") { setFlight(null); setDestination(null); }
  }, [flight, destination]);
  useEffect(() => {
    if (!flight) return;
    // Fallback if an animation is interrupted or the browser suppresses its event.
    const timer = window.setTimeout(advance, flight === "settling" ? 500 : 1500);
    return () => window.clearTimeout(timer);
  }, [flight, advance]);
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stop = () => {
      if (motion.matches && destination) { save(destination); setFlight(null); setDestination(null); }
    };
    motion.addEventListener("change", stop);
    return () => motion.removeEventListener("change", stop);
  }, [destination]);
  useEffect(() => {
    if (flight) restoreFocus.current = true;
    else if (restoreFocus.current) {
      restoreFocus.current = false;
      if (document.activeElement === document.body) controlRef.current?.focus({ preventScroll: true });
    }
  }, [flight]);
  const choose = (next: SpaceMood) => {
    if (flight || next === mood) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { save(next); return; }
    setDestination(next); setFlight("departing");
  };
  return { controlRef, mood, flight, destination, choose, advance };
}
