"use client";

import { signaturePaths } from "./signature-paths";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";



function CalligraphySignature() {
  const engravingId = useId();
  return <svg className="folio-opening-signature" viewBox="0 24 420 82" role="img" aria-label="Gavin Soares" strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <filter id={engravingId} filterUnits="userSpaceOnUse" x="-10" y="-10" width="440" height="150" colorInterpolationFilters="sRGB">
        <feOffset in="SourceAlpha" dy=".9" result="lowerEdge" />
        <feFlood floodColor="var(--signature-edge-light)" />
        <feComposite in2="lowerEdge" operator="in" result="highlight" />
        <feOffset in="SourceAlpha" dy="-.8" result="upperEdge" />
        <feFlood floodColor="var(--signature-edge-shadow)" />
        <feComposite in2="upperEdge" operator="in" result="shadow" />
        <feMerge><feMergeNode in="highlight" /><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    {signaturePaths.map((d, index) => <g key={index} filter={`url(#${engravingId})`} style={{ "--signature-delay": `${180 + index * 95}ms` } as CSSProperties}>
      <path className="folio-signature-outline" d={d} pathLength="1" />
      <path className="folio-signature-fill" d={d} />
    </g>)}
  </svg>;
}

export function OpeningIntro() {
  const [writing, setWriting] = useState(false);
  const [written, setWritten] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [visible, setVisible] = useState(true);
  const skip = useRef<() => void>(() => {});

  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.folioIntro !== "pending") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let disposed = false;
    let exiting = false;
    let readinessObserver: MutationObserver | undefined;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const siblings = Array.from(document.querySelector(".professional-shell")?.children ?? [])
      .filter((element): element is HTMLElement => element instanceof HTMLElement && !element.matches(".folio-opening, script, link"));
    const previousInert = siblings.map(element => element.inert);
    siblings.forEach(element => { element.inert = true; });
    const restore = () => {
      document.body.style.overflow = overflow;
      siblings.forEach((element, index) => { element.inert = previousInert[index]; });
    };
    function finish() {
      if (disposed || exiting) return;
      exiting = true;

      setLeaving(true);
      try { sessionStorage.setItem("gavin:opening-seen", "1"); } catch {}
      timers.push(setTimeout(() => {
        if (disposed) return;
        root.dataset.folioIntro = "done";
        restore();
        setVisible(false);
      }, reduced ? 0 : 1000));
    }
    skip.current = finish;
    const delay = (ms: number) => new Promise<void>(resolve => { timers.push(setTimeout(resolve, ms)); });
    async function run() {
      // Let the page fonts settle while the vector signature needs no font download.
      await Promise.race([document.fonts.ready.catch(() => {}), delay(900)]);
      if (disposed || exiting) return;
      if (reduced) { finish(); return; }
      setWriting(true);
      timers.push(setTimeout(() => { if (!disposed) setWritten(true); }, 4200));
      const hero = document.querySelector(".ascii-desk");
      const ready = new Promise<void>(resolve => {
        if (!hero || hero.getAttribute("data-ready") === "true") { resolve(); return; }
        const observer = new MutationObserver(() => {
          if (hero.getAttribute("data-ready") === "true") { observer.disconnect(); resolve(); }
        });
        readinessObserver = observer;
        observer.observe(hero, { attributes: true, attributeFilter: ["data-ready"] });
        timers.push(setTimeout(() => { observer.disconnect(); resolve(); }, 3000));
      });
      await Promise.all([delay(4850), ready]);
      finish();
    }
    void run();
    timers.push(setTimeout(finish, 6500));
    const escape = (event: KeyboardEvent) => {
      if (["Escape", "Enter", " "].includes(event.key)) { event.preventDefault(); finish(); }
    };
    window.addEventListener("keydown", escape);
    return () => {
      disposed = true;
      timers.forEach(clearTimeout);
      readinessObserver?.disconnect();
      restore();
      window.removeEventListener("keydown", escape);
    };
  }, []);

  if (!visible) return null;
  return <div className="folio-opening" data-leaving={leaving} data-writing={writing} data-written={written} aria-label="Opening Gavin Soares’s portfolio" role="region" onClick={() => skip.current()}>
    <div className="folio-opening-content">
      <div className="folio-opening-plate"><div className="folio-opening-inset"><CalligraphySignature /></div></div>
      <button type="button" className="folio-raised-control folio-raised-control-primary folio-opening-skip" onClick={() => skip.current()}>Skip intro <span aria-hidden="true">↗</span></button>
    </div>
  </div>;
}
