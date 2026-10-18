"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { professionalExperience as experience } from "@/data/professional-experience";

export function Experience() {
  const [active, setActive] = useState(0);
  const root = useRef<HTMLElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const hovered = useRef(false);
  const focused = useRef(false);
  const readingUntil = useRef(0);
  const restart = useRef<() => void>(() => {});
  const height = useRef(0);
  const animation = useRef<Animation | null>(null);

  useEffect(() => {
    const section = root.current;
    if (!section) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    function schedule() {
      clearTimeout(timeout);
      if (hovered.current || focused.current || document.hidden || motion.matches || !inView) return;
      timeout = setTimeout(() => {
        setActive(index => (index + 1) % experience.length);
        schedule();
      }, Math.max(4000, readingUntil.current - performance.now()));
    }
    restart.current = schedule;
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting && entry.intersectionRatio >= 0.25;
      schedule();
    }, { threshold: 0.25 });
    observer.observe(section);
    document.addEventListener("visibilitychange", schedule);
    motion.addEventListener("change", schedule);
    return () => {
      clearTimeout(timeout);
      observer.disconnect();
      document.removeEventListener("visibilitychange", schedule);
      motion.removeEventListener("change", schedule);
      restart.current = () => {};
    };
  }, []);

  useLayoutEffect(() => {
    const element = card.current;
    if (!element) return;
    const previous = animation.current?.playState === "running" ? element.getBoundingClientRect().height : height.current;
    animation.current?.cancel();
    const next = element.getBoundingClientRect().height;
    height.current = next;
    if (previous && Math.abs(previous - next) > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      animation.current = element.animate([{ height: `${previous}px` }, { height: `${next}px` }], {
        duration: 460, easing: "cubic-bezier(.22,.65,.3,1)",
      });
    }
  }, [active]);

  useEffect(() => () => { animation.current?.cancel(); }, []);

  function handleSelect(index: number, timestamp: number) {
    readingUntil.current = Math.max(readingUntil.current, timestamp + 12000);
    setActive(index);
    restart.current();
  }

  function resumeAfterReading(timestamp: number) {
    readingUntil.current = Math.max(readingUntil.current, timestamp + 8000);
    restart.current();
  }

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % experience.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index + experience.length - 1) % experience.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = experience.length - 1;
    else return;
    event.preventDefault();
    tabs.current[next]?.focus();
    handleSelect(next, event.timeStamp);
  }

  return <section id="experience" ref={root} aria-labelledby="experience-title" className="folio-experience mt-16 sm:mt-20"
    onPointerEnter={event => { if (event.pointerType === "mouse" || event.pointerType === "pen") { hovered.current = true; restart.current(); } }}
    onPointerLeave={event => { hovered.current = false; resumeAfterReading(event.timeStamp); }}
    onPointerDown={event => { if (event.pointerType === "touch") { readingUntil.current = event.timeStamp + 20000; restart.current(); } }}
    onFocusCapture={() => { focused.current = true; restart.current(); }}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) { focused.current = false; resumeAfterReading(event.timeStamp); } }}>
    <div className="mb-6 flex items-center justify-between gap-4">
      <h2 id="experience-title" className="text-xl font-medium tracking-tight">Experience</h2>

    </div>
    <div className="folio-career-tabs" role="tablist" aria-label="Work experience">
      {experience.map((item, index) => <button key={item.label} ref={node => { tabs.current[index] = node; }} type="button" role="tab" data-tone={index === 1 ? "neutral" : "cobalt"} id={`work-tab-${index}`} aria-controls={`work-panel-${index}`} aria-selected={active === index} tabIndex={active === index ? 0 : -1} onKeyDown={event => navigate(event, index)} onClick={event => handleSelect(index, event.timeStamp)}><span className="folio-career-mark" aria-hidden="true">{item.initials}</span><span className="folio-career-tab-copy"><span>{item.label}</span><span className="folio-career-tab-kind">{item.kind}</span></span></button>)}
      <button type="button" role="tab" aria-selected="false" tabIndex={0} data-tone="neutral" className="folio-career-coming-soon"><span className="folio-career-mark" aria-hidden="true">···</span><span className="folio-career-tab-copy"><span>Coming soon</span><span className="folio-career-tab-kind">Next chapter</span></span></button>
    </div>
    <div ref={card} className="folio-career-details">
      {experience.map((item, index) => <article key={item.label} id={`work-panel-${index}`} role="tabpanel" aria-labelledby={`work-tab-${index}`} aria-hidden={active !== index} inert={active !== index} tabIndex={active === index ? 0 : -1} data-active={active === index} className="folio-career-page">
        {item.logo && <div className="folio-career-brand">
          <span className={`folio-career-logo folio-career-logo-wordmark ${index === 2 ? "folio-career-logo-rayeva" : ""}`}><Image src={item.logo} alt={`${item.label} logo`} width={index === 2 ? 150 : 124} height={index === 2 ? 150 : 34} /></span>
        </div>}
        <header className="folio-career-card-header flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
          <h3 className="text-base font-medium leading-6 tracking-tight">{item.role}</h3>
          <p className="folio-career-date shrink-0 self-start font-mono text-[10px] leading-5">{item.period}</p>
        </header>
        <div className="folio-career-body mt-4">
          <p className="text-[13px] leading-6 text-folio-muted">{item.description}</p>
          <ul className="mt-4 grid gap-3 text-xs leading-6 text-folio-muted">
            {item.highlights.map(highlight => <li key={highlight} className="flex gap-3"><span aria-hidden="true" className="text-folio-accent">—</span><span>{highlight}</span></li>)}
          </ul>
        </div>
        <div className="folio-career-stack mt-5" aria-label="Technologies used">{item.stack.map(tool => <span key={tool}>{tool}</span>)}</div>
        <footer className="folio-career-card-footer"><span>{index === 0 ? "Pillow Tax Innovation Pvt Ltd" : item.organization}</span><span className="folio-career-category">{item.kind}</span></footer>
      </article>)}
    </div>
  </section>;
}
