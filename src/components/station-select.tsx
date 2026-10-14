"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

export function StationSelect({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const selected = Math.max(0, options.findIndex(option => option.value === value));
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  const choose = (index: number) => { onChange(options[index].value); setOpen(false); };
  const handleKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); return; }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const start = open ? active : selected;
      setActive(event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : Math.max(0, Math.min(options.length - 1, start + (event.key === "ArrowDown" ? 1 : -1))));
      setOpen(true);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) choose(active); else { setActive(selected); setOpen(true); }
    } else if (event.key === "Tab") setOpen(false);
    else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const match = options.findIndex(option => option.label.toLowerCase().startsWith(event.key.toLowerCase()));
      if (match >= 0) { setActive(match); setOpen(true); }
    }
  };
  return <div className="station-select" ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button className="station-select-trigger" type="button" role="combobox" aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-list`} aria-activedescendant={open ? `${id}-option-${active}` : undefined} onKeyDown={handleKey} onClick={() => { setActive(selected); setOpen(!open); }}>
      <span>{options[selected].label}</span><svg viewBox="0 0 16 16" aria-hidden="true" fill="none"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.8" /></svg>
    </button>
    {open && <div id={`${id}-list`} className="station-select-menu" role="listbox" aria-label={label}>{options.map((option, index) => <button key={option.value} id={`${id}-option-${index}`} type="button" role="option" aria-selected={value === option.value} tabIndex={-1} data-active={active === index} onPointerMove={() => setActive(index)} onPointerDown={event => event.preventDefault()} onClick={() => choose(index)}><span>{option.label}</span>{value === option.value && <svg viewBox="0 0 16 16" aria-hidden="true" fill="none"><path d="m3 8 3 3 7-7" stroke="currentColor" strokeWidth="1.8" /></svg>}</button>)}</div>}
  </div>;
}
