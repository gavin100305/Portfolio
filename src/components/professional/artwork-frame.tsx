"use client";

import { useCallback, useEffect, useRef, useState, type AnimationEvent, type KeyboardEvent } from "react";
import { artworkOrder, loadScenicArtwork, scenicArtworks, type ArtworkId, type ScenicAssets, type ScenicId } from "./artwork-scenes";
import { AsciiDesk } from "./ascii-desk";
import { ScenicArtwork } from "./scenic-artwork";

const storageKey = "gavin:artwork";
type Artwork = { id: "desk" } | { id: ScenicId; assets: ScenicAssets };
type Display = {
  active: Artwork;
  outgoing: Artwork | null;
  reveal: { sequence: number; direction: -1 | 1 } | null;
};

export function ArtworkFrame() {
  const [display, setDisplay] = useState<Display>({ active: { id: "desk" }, outgoing: null, reveal: null });
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const navigation = useRef<{ active: ArtworkId; requested: ArtworkId; sequence: number }>({
    active: "desk", requested: "desk", sequence: 0,
  });

  const selectArtwork = useCallback(async (id: ArtworkId, direction: -1 | 1, restoring = false) => {
    const pending = navigation.current;
    const sequence = ++pending.sequence;
    pending.requested = id;
    setFailed(false);
    setLoading(id !== "desk" && id !== pending.active);
    if (id === pending.active) return;
    let artwork: Artwork;
    try {
      artwork = id === "desk" ? { id } : { id, assets: await loadScenicArtwork(id) };
    } catch {
      if (sequence !== pending.sequence) return;
      pending.requested = pending.active;
      setLoading(false);
      setFailed(!restoring);
      return;
    }
    if (sequence !== pending.sequence) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    pending.active = id;
    setDisplay(previous => ({
      active: artwork,
      outgoing: reducedMotion || restoring || previous.active.id === id ? null : previous.active,
      reveal: reducedMotion ? null : { sequence, direction },
    }));
    setLoading(false);
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
        if (artwork && artwork !== "desk") void selectArtwork(artwork, 1, true);
      } catch {}
    });
    return () => {
      pending.sequence++;
    };
  }, [selectArtwork]);

  function step(direction: -1 | 1) {
    const index = artworkOrder.indexOf(navigation.current.requested);
    void selectArtwork(artworkOrder[(index + direction + artworkOrder.length) % artworkOrder.length], direction);
  }

  function handleArrowKey(event: KeyboardEvent) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    step(event.key === "ArrowRight" ? 1 : -1);
  }

  const { active, outgoing, reveal } = display;
  const title = active.id === "desk" ? "Retro Desk" : scenicArtworks[active.id].title;
  const scenes = [outgoing, active].filter((artwork): artwork is Extract<Artwork, { id: ScenicId }> =>
    !!artwork && artwork.id !== "desk");

  function layerFor(id: ArtworkId) {
    if (active.id === id) return reveal ? "entering" : "current";
    return outgoing?.id === id ? "outgoing" : "hidden";
  }

  function finishReveal(event: AnimationEvent<HTMLDivElement>) {
    if (event.currentTarget !== event.target || !reveal) return;
    setDisplay(current => current.reveal?.sequence === reveal.sequence
      ? { ...current, outgoing: null, reveal: null }
      : current);
  }

  return <figure className="artwork-frame">
    <div className="ascii-art-frame">
      <div className="ascii-stage" data-direction={reveal?.direction} aria-busy={loading}>
        <div
          className="artwork-layer artwork-desk"
          data-artwork-layer={layerFor("desk")}
          hidden={layerFor("desk") === "hidden"}
          aria-hidden={active.id !== "desk"}
          onAnimationEnd={active.id === "desk" ? finishReveal : undefined}
        >
          <AsciiDesk />
        </div>
        {scenes.map(artwork => <div
          key={artwork.id}
          className="artwork-layer"
          data-artwork-layer={layerFor(artwork.id)}
          aria-hidden={artwork.id !== active.id}
          onAnimationEnd={artwork.id === active.id ? finishReveal : undefined}
        >
          <ScenicArtwork id={artwork.id} assets={artwork.assets} />
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
      {failed && <p className="artwork-error" role="status">Couldn’t load that artwork. Try again.</p>}
    </figcaption>
  </figure>;
}
