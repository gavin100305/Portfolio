"use client";

import gsap from "gsap";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { artworkOrder, scenicArtworks, type ArtworkId, type ScenicId } from "./artwork-scenes";
import { AsciiDesk } from "./ascii-desk";
import { ScenicArtwork } from "./scenic-artwork";

const storageKey = "gavin:artwork";
const openingArtwork = artworkOrder[0];
type Display = {
  active: ArtworkId;
  outgoing: ArtworkId | null;
  reveal: { sequence: number; direction: -1 | 1 } | null;
};

export function ArtworkFrame() {
  const [display, setDisplay] = useState<Display>({
    active: openingArtwork, outgoing: null, reveal: { sequence: 0, direction: 1 },
  });
  const navigation = useRef<{ sequence: number; active: ArtworkId }>({ sequence: 0, active: openingArtwork });
  const stageRef = useRef<HTMLDivElement>(null);

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
    // Restore only after hydration so the server and client start with the same scene.
    queueMicrotask(() => {
      if (pending.sequence !== initialRequest) return;
      try {
        const saved = localStorage.getItem(storageKey);
        const artwork = artworkOrder.find(id => id === saved);
        if (artwork) selectArtwork(artwork, 1, true);
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
  const photo = active === "desk" ? null : scenicArtworks[active];
  const title = photo?.title ?? "Retro Desk";
  const scenes = [outgoing, active].filter((artwork): artwork is ScenicId =>
    !!artwork && artwork !== "desk");

  function layerFor(id: ArtworkId) {
    if (active === id) return reveal ? "entering" : "current";
    return outgoing === id ? "outgoing" : "hidden";
  }

  useLayoutEffect(() => {
    const incoming = stageRef.current?.querySelector<HTMLElement>('[data-artwork-layer="entering"]');
    if (!reveal || !incoming) return;
    const sequence = reveal.sequence;
    const onComplete = () => setDisplay(current => current.reveal?.sequence === sequence
      ? { ...current, outgoing: null, reveal: null }
      : current);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      queueMicrotask(onComplete);
      return;
    }

    const forward = reveal.direction === 1;
    const art = incoming.querySelector(".artwork-scenic");
    const timeline = gsap.timeline({ paused: true, onComplete });
    const animation = gsap.context(() => {
      gsap.set(incoming, {
        maskImage: `linear-gradient(${forward ? 105 : 255}deg, #000 39%, transparent 61%)`,
        maskSize: "285% 100%",
        maskRepeat: "no-repeat",
        maskPosition: forward ? "100% 0%" : "0% 0%",
      });
      timeline.to(incoming, {
        maskPosition: forward ? "0% 0%" : "100% 0%",
        duration: reveal.sequence === 0 ? 1 : .84,
        ease: "power2.inOut",
      });
      if (art) timeline.fromTo(art, { scale: 1.045, filter: "blur(3px)" },
        { scale: 1, filter: "blur(0px)", duration: .98, ease: "power3.out" }, .02);
    });
    const root = document.documentElement;
    const begin = () => {
      if (root.dataset.folioIntro !== "pending") timeline.play();
    };
    const opening = new MutationObserver(begin);
    opening.observe(root, { attributes: true, attributeFilter: ["data-folio-intro"] });
    begin();
    return () => {
      opening.disconnect();
      timeline.kill();
      animation.revert();
    };
  }, [reveal]);

  return <figure className="artwork-frame">
    <div className="ascii-art-frame">
      <div className="ascii-stage" ref={stageRef}>
        <div
          className="artwork-layer artwork-desk"
          data-artwork-layer={layerFor("desk")}
          hidden={layerFor("desk") === "hidden"}
          aria-hidden={active !== "desk"}
        >
          <AsciiDesk />
        </div>
        {scenes.map(artwork => <div
          key={artwork}
          className="artwork-layer"
          data-artwork-layer={layerFor(artwork)}
          aria-hidden={artwork !== active}
          inert={artwork !== active}
        >
          <ScenicArtwork id={artwork} active={artwork === active} />
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
      <div className="artwork-credit">
        {photo && <>
          Images by <a href={photo.source}>{photo.creator}</a>
          {photo.additionalCredit && <> and <a href={photo.additionalCredit.source}>{photo.additionalCredit.creator}</a>
            {" "}(adapted, <a href={photo.additionalCredit.license.url}>{photo.additionalCredit.license.label}</a>)</>}
        </>}
      </div>
    </figcaption>
  </figure>;
}
