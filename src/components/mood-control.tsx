"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { type SpaceMood } from "@/components/use-space-mood";

import { ThemeSlider } from "@/components/theme-slider";

type Props = {
  open: boolean;
  mood: SpaceMood;
  controlRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onChoose: (mood: SpaceMood) => void;
};

// The instrument is in the world; its chooser stays readable at every camera scale.
export function MoodControl({ open, mood, controlRef, onClose, onChoose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    const launcher = controlRef.current;
    dialog.showModal();
    dialog.querySelector<HTMLInputElement>('input[type="range"]')?.focus();
    return () => {
      dialog.close();
      launcher?.focus({ preventScroll: true });
    };
  }, [open, controlRef]);
  return <dialog ref={dialogRef} className="cockpit-mood-dialog" aria-labelledby="cockpit-title" aria-describedby="cockpit-description"
    onCancel={(event) => { event.preventDefault(); onClose(); }}>
    {open && <CockpitThemeForm mood={mood} onClose={onClose} onChoose={onChoose} />}
  </dialog>;
}

function CockpitThemeForm({ mood, onClose, onChoose }: Pick<Props, "mood" | "onClose" | "onChoose">) {
  const [selection, setSelection] = useState(mood);
  return <>
    <div className="flex items-center justify-between gap-3">
      <h2 id="cockpit-title" className="m-0 font-pixel text-2xl text-station-accent">Space mood</h2>
      <button type="button" className="grid size-11 shrink-0 place-items-center rounded-md border border-card-edge bg-station-wash text-2xl! text-station-accent! transition-colors hover:bg-card-surface" aria-label="Close cockpit controls" onClick={onClose}>×</button>
    </div>
    <p id="cockpit-description" className="mb-7 mt-3 text-sm leading-relaxed text-[#45566a]">Slide to choose the station’s atmosphere.</p>
    <ThemeSlider mood={selection} onChange={setSelection} tone="light" id="cockpit-theme" />
    <button type="button" className="mt-7 min-h-11 w-full rounded-md border border-card-edge bg-station-frame px-4 py-3 font-pixel! text-base! text-[#fffaf0]! shadow-[0_3px_0_#172033] transition-transform hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transform-none" onClick={() => selection === mood ? onClose() : onChoose(selection)}>{selection === mood ? "Return to station" : "Apply theme"}</button>
  </>;
}
