"use client";

import { useEffect, useRef, type RefObject } from "react";
import { moods, type SpaceMood } from "@/components/use-space-mood";

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
    dialog.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
    return () => {
      dialog.close();
      launcher?.focus({ preventScroll: true });
    };
  }, [open, controlRef]);
  return <dialog ref={dialogRef} className="cockpit-mood-dialog" aria-labelledby="cockpit-title" aria-describedby="cockpit-description"
    onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <div className="cockpit-dialog-heading"><h2 id="cockpit-title">Cockpit · Space mood</h2><button type="button" className="cockpit-close" aria-label="Close cockpit controls" onClick={onClose}>×</button></div>
    <p id="cockpit-description">Choose the station’s next atmosphere.</p>
    <div className="cockpit-mood-options" role="group" aria-label="Space moods">
      {moods.map((item) => <button key={item.id} type="button" aria-pressed={mood === item.id} onClick={() => onChoose(item.id)}>
        <span>{item.label}</span><span aria-hidden="true">{mood === item.id ? "✓" : "→"}</span>
      </button>)}
    </div>
    <button type="button" className="cockpit-return" onClick={onClose}>Return to station</button>
  </dialog>;
}
