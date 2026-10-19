"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AirlockDoor } from "./airlock-door";
import { useSpaceMood } from "./use-space-mood";

const ReturnJourneyContext = createContext<() => void>(() => {});
export const useReturnJourney = () => useContext(ReturnJourneyContext);

/** Lives in the root layout so the return door stays mounted across navigation. */
export function ReturnJourneyProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { mood } = useSpaceMood();
  const [phase, setPhase] = useState<"idle" | "closing" | "transit" | "venting" | "transferring" | "opening">("idle");
  const skipButton = useRef<HTMLButtonElement>(null);
  const [fast, setFast] = useState(false);
  const busy = useRef(false);
  const goHome = () => {
    try { sessionStorage.setItem("gavin:opening-seen", "1"); } catch {}
    document.documentElement.dataset.folioIntro = "done";
    setPhase("transferring");
    router.push("/", { scroll: true });
  };
  useEffect(() => {
    if (phase === "idle") return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (phase === "closing") timer = setTimeout(() => setPhase("transit"), reduced ? 100 : 1850);
    if (phase === "transit") timer = setTimeout(() => setPhase("venting"), reduced ? 100 : 5000);
    if (phase === "venting") timer = setTimeout(() => {
      try { sessionStorage.setItem("gavin:opening-seen", "1"); } catch {}
      document.documentElement.dataset.folioIntro = "done";
      setPhase("transferring");
      router.push("/", { scroll: true });
    }, reduced ? 100 : 1800);
    if (phase === "transferring" && pathname === "/") {
      timer = setTimeout(() => setPhase("opening"), 100);
    }
    if (phase === "opening") timer = setTimeout(() => {
      setPhase("idle");
      busy.current = false;
      requestAnimationFrame(() => document.querySelector<HTMLElement>(".folio-home-mark")?.focus({ preventScroll: true }));
    }, reduced || fast ? 180 : 3300);
    return () => clearTimeout(timer);
  }, [phase, pathname, router, fast]);
  useEffect(() => {
    if (phase === "idle") return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    skipButton.current?.focus({ preventScroll: true });
    return () => { document.body.style.overflow = overflow; };
  }, [phase]);
  return <ReturnJourneyContext.Provider value={() => {
    if (busy.current || pathname !== "/space") return;
    busy.current = true;
    setFast(false);
    router.prefetch("/");
    setPhase("closing");
  }}>
    <div inert={phase !== "idle"}>{children}</div>
    {phase !== "idle" && <div className="station-arrival station-return-journey" data-station-overlay="true" data-arrival={phase === "transferring" ? "venting" : phase} data-direction="return" data-mood={mood} data-fast={fast}>
      <AirlockDoor onSkip={() => { setFast(true); goHome(); }} skipButton={skipButton} status="Returning to Earth and the main portfolio" label="Returning to the main portfolio" />
    </div>}
  </ReturnJourneyContext.Provider>;
}
