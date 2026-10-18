"use client";

import { useEffect, useRef, useState } from "react";

export function ThemeToggle() {
  const busy = useRef(false);
  const manuallyChanged = useRef(false);
  const transitionRef = useRef<ViewTransition | null>(null);
  const [changing, setChanging] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const followSystem = () => {
      if (manuallyChanged.current) return;
      try {
        const saved = localStorage.getItem("gavin:professional-theme");
        if (saved === "light" || saved === "dark") return;
      } catch {}
      document.documentElement.dataset.professionalTheme = media.matches ? "dark" : "light";
    };
    const syncSavedTheme = (event: StorageEvent) => {
      if (event.key !== "gavin:professional-theme" && event.key !== null) return;
      const saved = event.newValue;
      manuallyChanged.current = saved === "light" || saved === "dark";
      document.documentElement.dataset.professionalTheme = manuallyChanged.current ? saved! : media.matches ? "dark" : "light";
    };
    media.addEventListener("change", followSystem);
    window.addEventListener("storage", syncSavedTheme);
    return () => {
      media.removeEventListener("change", followSystem);
      window.removeEventListener("storage", syncSavedTheme);
      transitionRef.current?.skipTransition();
      delete document.documentElement.dataset.professionalTransition;
      document.documentElement.style.removeProperty("--folio-transition-radius");
    };
  }, []);
  const toggle = async () => {
    if (busy.current) return;
    const root = document.documentElement;
    const next = root.dataset.professionalTheme === "dark" ? "light" : "dark";
    const apply = () => {
      root.dataset.professionalTheme = next;
      manuallyChanged.current = true;
      try { localStorage.setItem("gavin:professional-theme", next); } catch {}
    };
    if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { apply(); return; }
    busy.current = true; setChanging(true);
    // Cover the farthest corner at every viewport size, including portrait phones.
    root.style.setProperty("--folio-transition-radius", `${Math.hypot(window.innerWidth, window.innerHeight) + 2}px`);
    root.dataset.professionalTransition = next;
    try {
      // Synchronous palette update avoids waiting for a suspended animation frame.
      const transition = document.startViewTransition(apply);
      transitionRef.current = transition;
      await transition.finished;
    } catch { apply(); transitionRef.current?.skipTransition(); }
    finally {
      delete root.dataset.professionalTransition;
      root.style.removeProperty("--folio-transition-radius");
      transitionRef.current = null; busy.current = false; setChanging(false);
    }
  };
  return <button type="button" disabled={changing} aria-busy={changing} className="folio-theme-toggle" aria-label="Toggle light and dark theme" onClick={toggle}>
    <svg className="folio-sun size-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><circle cx="12" cy="12" r="3.5" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></svg>
    <svg className="folio-moon size-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z" /></svg>
  </button>;
}
