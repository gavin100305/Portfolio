"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { professionalAchievements as achievements, type ProfessionalAchievement } from "@/data/professional-achievements";

function AchievementRecord({ award, onClose }: { award: ProfessionalAchievement; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbar > 0) document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + scrollbar}px`;
    document.body.style.overflow = "hidden";
    element.showModal();
    element.getBoundingClientRect();
    const frame = requestAnimationFrame(() => { element.dataset.entered = "true"; });
    return () => {
      cancelAnimationFrame(frame);
      if (timer.current) clearTimeout(timer.current);
      element.close();
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
    };
  }, []);

  function dismiss() {
    if (closing.current) return;
    closing.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { onClose(); return; }
    if (dialog.current) dialog.current.dataset.entered = "false";
    timer.current = setTimeout(onClose, 300);
  }

  return <dialog ref={dialog} className="folio-award-dialog" aria-labelledby="achievement-record-title" onCancel={event => { event.preventDefault(); dismiss(); }} onClick={event => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dismiss();
  }}>
    <div className="folio-award-record">
      <header className="folio-award-record-header">
        <div><p className="font-mono text-[10px] text-folio-accent">{award.result} · {award.year}</p><h3 id="achievement-record-title" className="mt-1 text-lg font-medium tracking-tight">{award.event}</h3></div>
        <button type="button" autoFocus className="folio-award-more" onClick={dismiss} aria-label="Close achievement details">Close <span aria-hidden="true">×</span></button>
      </header>
      <div className="folio-award-record-layout">
        <div>
          <div className="folio-award-record-image"><Image src={award.image} alt={award.imageAlt} fill sizes="(max-width: 639px) 85vw, (max-width: 900px) 45vw, 380px" /></div>
          <a className="folio-text-link mt-4 font-mono text-[10px] text-folio-accent" href={award.image} target="_blank" rel="noreferrer">View full image <span aria-hidden="true">↗</span></a>
        </div>
        <div className="folio-award-record-copy">
          <h4 className="text-xl font-medium tracking-tight">{award.project ?? "Third rank · Second year"}</h4>
          <p className="mt-3 text-xs leading-6 text-folio-muted">{award.description}</p>
          {award.highlights.length > 0 && <ul className="mt-4 grid gap-3 text-[11px] leading-5 text-folio-muted">{award.highlights.map(highlight => <li key={highlight} className="flex gap-2"><span aria-hidden="true" className="text-folio-accent">—</span><span>{highlight}</span></li>)}</ul>}
          {award.stack.length > 0 && <div className="mt-5"><h5 className="text-[11px] font-medium">Built with</h5><ul className="folio-award-stack mt-2" aria-label={`${award.project} technology stack`}>{award.stack.map(tool => <li key={tool}>{tool}</li>)}</ul></div>}
          {award.team.length > 0 && <div className="mt-5"><h5 className="text-[11px] font-medium">The team</h5><ul className="folio-award-team mt-2">{award.team.map(name => <li key={name}>{name}</li>)}</ul></div>}
          <p className="mt-5 text-[10px] leading-5 text-folio-subtle">{award.venue} · {award.year}</p>
          {award.repository && <a className="folio-raised-control folio-raised-control-primary mt-4 font-mono text-[10px]" href={award.repository} target="_blank" rel="noreferrer">Project source <span aria-hidden="true">↗</span></a>}
        </div>
      </div>
    </div>
  </dialog>;
}

export function Achievements() {
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const root = useRef<HTMLElement>(null);
  const hovered = useRef(false);
  const focused = useRef(false);
  const readingUntil = useRef(0);
  const restart = useRef<() => void>(() => {});
  const opener = useRef<HTMLButtonElement | null>(null);
  const swipe = useRef<{ x: number; y: number; pointer: number } | null>(null);
  const suppressClick = useRef(false);
  const resetClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const award = achievements[active];
  useEffect(() => () => { if (resetClickTimer.current) clearTimeout(resetClickTimer.current); }, []);

  useEffect(() => {
    const section = root.current;
    if (!section) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    function schedule() {
      clearTimeout(timer);
      if (selected !== null || hovered.current || focused.current || document.hidden || motion.matches || !visible) return;
      timer = setTimeout(() => {
        setActive(index => (index + 1) % achievements.length);
        schedule();
      }, Math.max(4000, readingUntil.current - performance.now()));
    }
    restart.current = schedule;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      schedule();
    }, { threshold: 0.25 });
    observer.observe(section);
    document.addEventListener("visibilitychange", schedule);
    motion.addEventListener("change", schedule);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      document.removeEventListener("visibilitychange", schedule);
      motion.removeEventListener("change", schedule);
      restart.current = () => {};
    };
  }, [selected]);

  function reading(timestamp: number, delay = 12000) {
    readingUntil.current = Math.max(readingUntil.current, timestamp + delay);
    restart.current();
  }

  function move(step: number) { setActive(index => (index + step + achievements.length) % achievements.length); }
  function showRecord(button: HTMLButtonElement) { opener.current = button; setSelected(active); }
  function endSwipe(event: PointerEvent<HTMLDivElement>) {
    const start = swipe.current;
    swipe.current = null;
    if (!start || start.pointer !== event.pointerId) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    suppressClick.current = true;
    move(dx > 0 ? -1 : 1);
    resetClickTimer.current = setTimeout(() => { suppressClick.current = false; }, 0);
  }

  return <section id="achievements" ref={root} className="folio-awards mt-16 sm:mt-20" aria-labelledby="achievements-title"
    onPointerEnter={event => { if (event.pointerType !== "touch") { hovered.current = true; restart.current(); } }}
    onPointerLeave={event => { hovered.current = false; reading(event.timeStamp, 8000); }}
    onPointerDownCapture={event => reading(event.timeStamp, event.pointerType === "touch" ? 20000 : 12000)}
    onKeyDownCapture={event => reading(event.timeStamp)}
    onFocusCapture={() => { focused.current = true; restart.current(); }}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) { focused.current = false; reading(event.timeStamp, 8000); } }}>
    <div className="mb-3 flex items-center justify-between gap-4"><h2 id="achievements-title" className="text-xl font-medium tracking-tight">Achievements</h2><span className="font-mono text-[10px] text-folio-subtle">0{active + 1} / 0{achievements.length}</span></div>
    <div className="folio-album" role="region" aria-roledescription="carousel" aria-label="Achievement photographs" tabIndex={0} onKeyDown={event => { if (selected !== null) return; if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1); } }}>
      <div className="folio-album-stage" onPointerDown={event => { if (event.button === 0) swipe.current = { x: event.clientX, y: event.clientY, pointer: event.pointerId }; }} onPointerUp={endSwipe} onPointerCancel={() => { swipe.current = null; }}>
        {achievements.map((item, index) => {
          let offset = (index - active + achievements.length) % achievements.length;
          if (offset > 2) offset -= achievements.length;
          const distance = Math.abs(offset);
          const style = { "--album-offset": `${offset * (distance === 1 ? 26 : 21)}%`, "--album-offset-mobile": `${offset * (distance === 1 ? 12 : 7)}%`, "--album-rotation": `${offset === 0 ? -1.5 : offset * 6}deg`, "--album-scale": 1 - distance * .1, zIndex: 5 - distance } as CSSProperties;
          return <button key={item.id} type="button" className="folio-album-print" data-active={offset === 0} style={style} tabIndex={offset === 0 ? 0 : -1} aria-label={offset === 0 ? `View ${item.event} achievement details` : `Bring ${item.event} photo forward`} aria-haspopup={offset === 0 ? "dialog" : undefined} onClick={event => { if (suppressClick.current) return; if (index === active) showRecord(event.currentTarget); else setActive(index); }}>
            <span className="folio-album-image" data-certificate={item.id === "auraflix" || item.id === "academic-rank"}><Image src={item.image} alt={item.imageAlt} fill draggable={false} sizes="(max-width: 639px) 80vw, 520px" style={{ objectPosition: item.photoPosition ?? "center" }} /></span>
            <span className="folio-album-print-footer"><span>{item.result}</span><span>{item.year}</span></span>
          </button>;
        })}
      </div>
      <div className="folio-album-caption">
        <div key={award.id} className="folio-album-caption-copy" aria-live="off" aria-atomic="true"><p className="font-mono text-[10px] text-folio-accent">{award.project ?? "Academic recognition"}</p><h3 className="mt-2 text-xl font-medium tracking-tight">{award.event}</h3><p className="mt-1 text-[11px] leading-5 text-folio-muted">{award.venue}</p></div>
        <button type="button" className="folio-award-more" aria-haspopup="dialog" aria-label={`More info about ${award.event}`} onClick={event => showRecord(event.currentTarget)}>More info <span aria-hidden="true">↗</span></button>
      </div>
      <div className="folio-album-controls">
        <button type="button" className="folio-album-arrow" aria-label="Previous achievement" onClick={() => move(-1)}><svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="m11 5-5 5 5 5M6 10h10" /></svg></button>
        <div className="folio-album-index" aria-label="Choose an achievement">{achievements.map((item, index) => <button key={item.id} type="button" aria-label={`Show ${item.event}`} aria-current={active === index ? "true" : undefined} onClick={() => setActive(index)}><span /></button>)}</div>
        <button type="button" className="folio-album-arrow" aria-label="Next achievement" onClick={() => move(1)}><svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="m9 5 5 5-5 5M14 10H4" /></svg></button>
      </div>
    </div>
    {selected !== null && <AchievementRecord award={achievements[selected]} onClose={() => { setSelected(null); requestAnimationFrame(() => opener.current?.focus({ preventScroll: true })); }} />}
  </section>;
}
