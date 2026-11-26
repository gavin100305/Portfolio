"use client";

import { useCallback, useEffect, useRef, useState, type AnimationEvent, type KeyboardEvent } from "react";
import { artworkOrder, scenicArtworks, type ArtworkId, type ScenicId } from "./artwork-scenes";
import { AsciiDesk } from "./ascii-desk";
import { ScenicArtwork } from "./scenic-artwork";

const storageKey = "gavin:artwork";
type Display = {
  active: ArtworkId;
  outgoing: ArtworkId | null;
  reveal: { sequence: number; direction: -1 | 1 } | null;
};

export function ArtworkFrame() {
  const [display, setDisplay] = useState<Display>({ active: "desk", outgoing: null, reveal: null });
  const navigation = useRef({ sequence: 0, active: "desk" as ArtworkId });

  const selectArtwork = useCallback((id: ArtworkId, direction: -1 | 1, restoring = false) => {
    const pending = navigation.current;
    if (id === pending.active) return;
    const sequence = ++pending.sequence;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    pending.active = id;
    setDisplay(previous => ({
      active: id,
      outgoing: reducedMotion || restoring || previous.active === id ? null : previous.active,
      reveal: reducedMotion ? null : { sequence, direction },
    }));
    try { localStorage.setItem(storageKey, id); } catch {}
  }, []);

  useEffect(() => {
    const pending = navigation.current;
    const initialRequest = pending.sequence;
    // Restore only after hydration, so the server and client start with the same desk.
    queueMicrotask(() => {
      if (pending.sequence !== initialRequest) return;
      try {
        const saved = localStorage.getItem(storageKey);
        const artwork = artworkOrder.find(id => id === saved);
        if (artwork && artwork !== "desk") selectArtwork(artwork, 1, true);
      } catch {}
    });
    return () => {
      pending.sequence++;
    };
  }, [selectArtwork]);

  function step(direction: -1 | 1) {
    const index = artworkOrder.indexOf(navigation.current.active);
    selectArtwork(artworkOrder[(index + direction + artworkOrder.length) % artworkOrder.length], direction);
  }

  function handleArrowKey(event: KeyboardEvent) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    step(event.key === "ArrowRight" ? 1 : -1);
  }

  const { active, outgoing, reveal } = display;
  const title = active === "desk" ? "Retro Desk" : scenicArtworks[active].title;
  const scenes = [outgoing, active].filter((artwork): artwork is ScenicId =>
    !!artwork && artwork !== "desk");

  function layerFor(id: ArtworkId) {
    if (active === id) return reveal ? "entering" : "current";
    return outgoing === id ? "outgoing" : "hidden";
  }

  function finishReveal(event: AnimationEvent<HTMLDivElement>) {
    if (event.currentTarget !== event.target || !reveal) return;
    setDisplay(current => current.reveal?.sequence === reveal.sequence
      ? { ...current, outgoing: null, reveal: null }
      : current);
  }

  return <figure className="artwork-frame">
    <div className="ascii-art-frame">
      <div className="ascii-stage" data-direction={reveal?.direction}>
        <div
          className="artwork-layer artwork-desk"
          data-artwork-layer={layerFor("desk")}
          hidden={layerFor("desk") === "hidden"}
          aria-hidden={active !== "desk"}
          onAnimationEnd={active === "desk" ? finishReveal : undefined}
        >
          <AsciiDesk />
        </div>
        {scenes.map(artwork => <div
          key={artwork}
          className="artwork-layer"
          data-artwork-layer={layerFor(artwork)}
          aria-hidden={artwork !== active}
          inert={artwork !== active}
          onAnimationEnd={artwork === active ? finishReveal : undefined}
        >
          <ScenicArtwork id={artwork} />
        </div>)}
      </div>
    </div>
    <figcaption className="artwork-caption">
      <div className="artwork-controls" role="group" aria-label="Choose artwork" onKeyDown={handleArrowKey}>
        <button type="button" className="artwork-arrow" aria-label="Previous artwork" onClick={() => step(-1)}>
          <span aria-hidden="true">‹</span>
        </button>
        <span className="artwork-title" role="status">{title}</span>
        <button type="button" className="artwork-arrow" aria-label="Next artwork" onClick={() => step(1)}>
          <span aria-hidden="true">›</span>
        </button>
      </div>
    </figcaption>
  </figure>;
}
