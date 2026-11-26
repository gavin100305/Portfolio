"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { artworkOrder, loadScenicArtwork, scenicArtworks, type ArtworkId, type ScenicAssets, type ScenicId } from "./artwork-scenes";
import { AsciiDesk } from "./ascii-desk";
import { ScenicArtwork } from "./scenic-artwork";

const storageKey = "gavin:artwork";
type Artwork = { id: "desk" } | { id: ScenicId; assets: ScenicAssets };

export function ArtworkFrame() {
  const [active, setActive] = useState<Artwork>({ id: "desk" });
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const navigation = useRef<{ active: ArtworkId; requested: ArtworkId; sequence: number }>({
    active: "desk", requested: "desk", sequence: 0,
  });

  const selectArtwork = useCallback(async (id: ArtworkId) => {
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
      setFailed(true);
      return;
    }
    if (sequence !== pending.sequence) return;
    pending.active = id;
    setActive(artwork);
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
        if (artwork && artwork !== "desk") void selectArtwork(artwork);
      } catch {}
    });
    return () => {
      pending.sequence++;
    };
  }, [selectArtwork]);

  function step(direction: number) {
    const index = artworkOrder.indexOf(navigation.current.requested);
    void selectArtwork(artworkOrder[(index + direction + artworkOrder.length) % artworkOrder.length]);
  }

  function handleArrowKey(event: KeyboardEvent) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    step(event.key === "ArrowRight" ? 1 : -1);
  }

  const title = active.id === "desk" ? "Retro Desk" : scenicArtworks[active.id].title;
  return <figure className="artwork-frame">
    <div className="ascii-art-frame">
      <div className="ascii-stage" aria-busy={loading}>
        <div hidden={active.id !== "desk"}><AsciiDesk /></div>
        {active.id !== "desk" && <ScenicArtwork key={active.id} id={active.id} assets={active.assets} />}
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
