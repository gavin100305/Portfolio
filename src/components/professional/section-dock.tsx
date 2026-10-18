"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";

const sections = [
  { id: "home", label: "Home", path: "m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" },
  { id: "projects", label: "Projects", path: "M3 7a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" },
  { id: "experience", label: "Experience", path: "M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 11l7 3h4l7-3M12 12v4M5 7h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" },
  { id: "achievements", label: "Achievements", path: "M8 3h8v6a4 4 0 0 1-8 0ZM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 1v5m-4 3h8m-6-3h4v3h-4Z" },
  { id: "contact", label: "Contact", path: "m3 7 9 6 9-6M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" },
];

export function SectionDock() {
  const [active, setActive] = useState("home");
  const [hidden, setHidden] = useState(false);
  const navigating = useRef<string | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const targets = sections.map(section => document.getElementById(section.id));
    let frame = 0;
    let lastY = window.scrollY;
    let direction = 0;
    let travel = 0;
    function update() {
      frame = 0;
      const readingLine = Math.min(window.innerHeight * .32, 230);
      let current = "home";
      targets.forEach((target, index) => {
        if (target && target.getBoundingClientRect().top <= readingLine) current = sections[index].id;
      });
      if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) current = "contact";
      if (!navigating.current) setActive(current);
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    function settled() {
      if (settleTimer.current) clearTimeout(settleTimer.current);
      navigating.current = null;
      schedule();
    }
    function scroll() {
      const y = Math.max(0, window.scrollY);
      const delta = y - lastY;
      lastY = y;
      if (navigating.current) {
        if (settleTimer.current) clearTimeout(settleTimer.current);
        settleTimer.current = setTimeout(settled, 150);
        travel = 0;
      } else if (window.matchMedia("(max-width: 1279px)").matches && Math.abs(delta) > 1) {
        const nextDirection = Math.sign(delta);
        travel = direction === nextDirection ? travel + Math.abs(delta) : Math.abs(delta);
        direction = nextDirection;
        if (y < 48) setHidden(false);
        else if (travel >= 22) { setHidden(direction < 0); travel = 0; }
      }
      schedule();
    }
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("scrollend", settled);
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    targets.forEach(target => { if (target) observer.observe(target); });
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      if (settleTimer.current) clearTimeout(settleTimer.current);
      observer.disconnect();
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("scrollend", settled);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  function navigate(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    navigating.current = id;
    setActive(id);
    setHidden(false);
    if (settleTimer.current) clearTimeout(settleTimer.current);
    // Native anchor scrolling continues normally. Keep its destination selected
    // until scrolling settles instead of selecting every section along the way.
    settleTimer.current = setTimeout(() => { navigating.current = null; }, 1200);
  }

  return <nav className="folio-section-dock" data-hidden={hidden} aria-label="Portfolio sections" onFocusCapture={() => setHidden(false)}>
    <div className="folio-section-track" style={{ "--dock-index": sections.findIndex(section => section.id === active) } as CSSProperties}>
      <span className="folio-section-indicator" aria-hidden="true" />
      {sections.map(section => <a key={section.id} href={`#${section.id}`} className="folio-section-link" onClick={event => navigate(event, section.id)} aria-label={section.label} aria-current={active === section.id ? "location" : undefined}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={section.path} /></svg>
        <span className="folio-section-tooltip" aria-hidden="true">{section.label}</span>
      </a>)}
    </div>
  </nav>;
}
