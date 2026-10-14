"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { ContributionCalendar, ContributionDay } from "@/lib/github-calendar";
import { PortfolioIcon } from "@/components/portfolio-icon";
import { StationSelect } from "@/components/station-select";

const dateLabel = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const dayLabel = (day: ContributionDay) => `${day.count.toLocaleString()} ${day.count === 1 ? "contribution" : "contributions"} on ${dateLabel(day.date)}`;

export function GitHubCalendar() {
  const [year, setYear] = useState("rolling");
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ status: "loading" | "error" | "ready"; data?: ContributionCalendar }>({ status: "loading" });
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ index: number; left: number; top: number; below: boolean; arrow: number } | null>(null);
  const tooltipId = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getUTCFullYear();

  const showTooltip = (element: HTMLButtonElement, index: number) => {
    const rect = element.getBoundingClientRect();
    const below = rect.top < 80;
    const anchor = rect.left + rect.width / 2;
    const left = Math.max(107, Math.min(window.innerWidth - 107, anchor));
    setTooltip({ index, left, top: below ? rect.bottom + 10 : rect.top - 10, below, arrow: Math.max(12, Math.min(178, anchor - left + 95)) });
  };

  useEffect(() => {
    const dismiss = () => setTooltip(null);
    document.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => { document.removeEventListener("scroll", dismiss, true); window.removeEventListener("resize", dismiss); };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/github-contributions?year=${year}`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Activity unavailable");
        const data: ContributionCalendar = await response.json();
        if (!Array.isArray(data.days) || !data.days.length || !Number.isSafeInteger(data.total)) throw new Error("Invalid calendar");
        if (!controller.signal.aborted) {
          setSelected(data.days.length - 1);
          setHovered(null);
          setState({ status: "ready", data });
        }
      })
      .catch(() => { if (!controller.signal.aborted) setState({ status: "error" }); });
    return () => controller.abort();
  }, [year, attempt]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (state.status === "ready" && scroller) {
      // Start narrow screens at the most recent activity. This is an instant
      // internal scroll, without moving the page or stealing keyboard focus.
      scroller.scrollLeft = scroller.scrollWidth - scroller.clientWidth;
    }
  }, [state]);

  const days = state.data?.days ?? [];
  const offset = days.length ? new Date(`${days[0].date}T12:00:00Z`).getUTCDay() : 0;
  const activeDay = days[hovered ?? selected];
  const months = days.flatMap((day, index) => day.date.endsWith("-01") || index === 0 ? [{ label: new Date(`${day.date}T12:00:00Z`).toLocaleDateString("en", { month: "short", timeZone: "UTC" }), column: Math.floor((index + offset) / 7) + 1 }] : []);
  const handleKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "Escape" && tooltip) { event.preventDefault(); event.stopPropagation(); setTooltip(null); return; }
    const movement: Record<string, number> = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 };
    const next = event.key === "Home" ? 0 : event.key === "End" ? days.length - 1 : event.key in movement ? Math.max(0, Math.min(days.length - 1, index + movement[event.key])) : null;
    if (next === null) return;
    event.preventDefault();
    setSelected(next); setHovered(null);
    buttons.current[next]?.focus({ preventScroll: true });
    buttons.current[next]?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
  };

  return <section className="activity-panel" aria-labelledby="activity-title" aria-busy={state.status === "loading"}>
    <div className="activity-heading"><div><span className="info-overline">BUILDING IN THE OPEN</span><h2 id="activity-title"><PortfolioIcon name="github" /> GitHub activity</h2><p>Small steps, committed over time.</p></div><div className="activity-period"><StationSelect label="Contribution period" value={year} onChange={value => { if (value === year) return; setTooltip(null); setState({ status: "loading" }); setYear(value); }} options={[{ value: "rolling", label: "Last 12 months" }, ...[currentYear, currentYear - 1, currentYear - 2].map(value => ({ value: String(value), label: String(value) }))]} /></div></div>
    {state.status === "loading" && <div className="activity-loading" role="status">Connecting to GitHub…</div>}
    {state.status === "error" && <div className="activity-error" role="status"><p>GitHub activity is temporarily unavailable.</p><button className="info-button" onClick={() => { setState({ status: "loading" }); setAttempt(value => value + 1); }} type="button">Try again</button><a href="https://github.com/gavin100305?tab=overview" target="_blank" rel="noopener noreferrer">View activity on GitHub</a></div>}
    {state.status === "ready" && state.data && <>
      <div className="activity-summary"><strong>{state.data.total.toLocaleString()}<span> contributions</span></strong><span>{dateLabel(days[0].date)} — {dateLabel(days.at(-1)!.date)}</span></div>
      <p className="visually-hidden" id="activity-help">Explore daily contributions with arrow keys. Home goes to the first date; End goes to the latest. Tap or hover a square to see its date and count.</p>
      <div className="activity-scroll" ref={scrollRef} aria-label="Contribution calendar" onPointerLeave={() => { setHovered(null); setTooltip(null); }}>
        <div className="activity-calendar" style={{ "--activity-weeks": Math.ceil((days.length + offset) / 7) } as CSSProperties}>
          <div className="activity-months" aria-hidden="true">{months.map((month, index) => <span key={index} style={{ gridColumn: month.column }}>{month.label}</span>)}</div>
          <div className="activity-weekdays" aria-hidden="true"><span>Mon</span><span>Wed</span><span>Fri</span></div>
          <div className="activity-days" role="group" aria-label="Daily contribution counts" aria-describedby="activity-help">
            {Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} />)}
            {days.map((day, index) => <button className="group/tile relative overflow-hidden" key={day.date} ref={element => { buttons.current[index] = element; }} type="button" data-level={day.level} aria-label={dayLabel(day)} aria-describedby={tooltip?.index === index ? tooltipId : undefined} aria-pressed={index === selected} tabIndex={index === selected ? 0 : -1} onKeyDown={event => handleKey(event, index)} onFocus={event => { setSelected(index); setHovered(null); showTooltip(event.currentTarget, index); }} onBlur={() => setTooltip(null)} onPointerEnter={event => { setHovered(index); showTooltip(event.currentTarget, index); }} onClick={event => { setSelected(index); setHovered(null); showTooltip(event.currentTarget, index); }}><span aria-hidden="true" className="pointer-events-none absolute -top-1/2 -left-full h-[200%] w-1/2 -skew-x-12 bg-white/60 opacity-0 group-hover/tile:animate-[calendar-tile-shine_550ms_ease-out] group-focus-visible/tile:animate-[calendar-tile-shine_550ms_ease-out] motion-reduce:animate-none" /></button>)}
          </div>
        </div>
      </div>
      <p className="activity-scroll-hint">Swipe to explore more months.</p>
      <div className="activity-footer"><p className="activity-day-detail" role="status" aria-live="polite">{activeDay ? dayLabel(activeDay) : "Choose a day to explore."}</p><span className="activity-legend" aria-label="Color intensity: fewer to more contributions">Less{[0, 1, 2, 3, 4].map(level => <i key={level} data-level={level} />)}More</span></div>
      <div className="activity-source"><span>Contributions include commits, pull requests, and other GitHub activity.</span><a href={`https://github.com/gavin100305?tab=overview&from=${activeDay?.date ?? days[0].date}&to=${activeDay?.date ?? days.at(-1)!.date}`} target="_blank" rel="noopener noreferrer">View on GitHub <PortfolioIcon name="external" /></a></div>
    </>}
    {state.status === "ready" && tooltip && days[tooltip.index] && createPortal(<div id={tooltipId} role="tooltip" className="activity-tooltip pointer-events-none fixed z-[100] w-[190px] -translate-x-1/2 -translate-y-full rounded-md border border-[#c3bbac] bg-[#fffdf6] px-3 py-2 text-center font-sans text-[#263c53] shadow-[0_4px_14px_#263c5326] data-[below=true]:translate-y-0" data-below={tooltip.below} style={{ left: tooltip.left, top: tooltip.top, "--tooltip-arrow": `${tooltip.arrow}px` } as CSSProperties}><strong className="block text-xs leading-normal">{days[tooltip.index].count.toLocaleString()} {days[tooltip.index].count === 1 ? "contribution" : "contributions"}</strong><span className="mt-1 block text-[11px] text-[#607284]">{dateLabel(days[tooltip.index].date)}</span></div>, document.body)}
  </section>;
}
