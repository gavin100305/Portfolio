"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { artworkOrder, loadArtworkImage, scenicArtworks, type ArtworkId } from "./artwork-scenes";
import { AsciiDesk } from "./ascii-desk";

const storageKey = "gavin:artwork";

export function ArtworkFrame() {
  const [active, setActive] = useState<ArtworkId>("desk");
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
    try {
      if (id !== "desk" && id !== pending.active) await loadArtworkImage(scenicArtworks[id].poster);
    } catch {
      if (sequence !== pending.sequence) return;
      pending.requested = pending.active;
      setLoading(false);
      setFailed(true);
      return;
    }
    if (sequence !== pending.sequence) return;
    pending.active = id;
    setActive(id);
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

  const scene = active === "desk" ? null : scenicArtworks[active];
  return <figure className="artwork-frame">
    <div className="ascii-art-frame">
      <div className="ascii-stage" aria-busy={loading}>
        <div hidden={active !== "desk"}><AsciiDesk /></div>
        {scene && <div
          className="artwork-scenic"
          role="img"
          aria-label={scene.description}
          style={{ backgroundImage: `url(${scene.poster})` }}
        />}
      </div>
    </div>
    <figcaption className="artwork-caption">
      <div className="artwork-controls" role="group" aria-label="Choose artwork" onKeyDown={handleArrowKey}>
        <button type="button" className="artwork-arrow" aria-label="Previous artwork" onClick={() => step(-1)}>
          <span aria-hidden="true">‹</span>
        </button>
        <span className="artwork-title" role="status">{scene?.title ?? "Retro Desk"}</span>
        <button type="button" className="artwork-arrow" aria-label="Next artwork" onClick={() => step(1)}>
          <span aria-hidden="true">›</span>
        </button>
      </div>
      {failed && <p className="artwork-error" role="status">Couldn’t load that artwork. Try again.</p>}
    </figcaption>
  </figure>;
}
