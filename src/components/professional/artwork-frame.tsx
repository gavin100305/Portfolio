"use client";

import { playDialTick, unlockDialSound } from "@/lib/button-sound";
import gsap from "gsap";
import { useContext, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { artworkOrder, openingArtwork, scenicArtworks, type ArtworkId, type ScenicId } from "./artwork-scenes";
import { PageArtworkSelection } from "./page-artwork";
import { AsciiDesk } from "./ascii-desk";
import { ScenicArtwork } from "./scenic-artwork";

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
  const selectPageArtwork = useContext(PageArtworkSelection);
  const stageRef = useRef<HTMLDivElement>(null);

  function selectArtwork(id: ArtworkId) {
    const pending = navigation.current;
    if (id === pending.active) return;
    const sequence = ++pending.sequence;
    const outgoing = pending.active;
    pending.active = id;
    selectPageArtwork(id);
    playDialTick(artworkOrder.indexOf(id));
    const fade = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    setDisplay({ active: id, outgoing: fade ? outgoing : null, reveal: fade ? { sequence, direction: 1 } : null });
  }

  function step(direction: -1 | 1) {
    const index = artworkOrder.indexOf(navigation.current.active);
    selectArtwork(artworkOrder[(index + direction + artworkOrder.length) % artworkOrder.length]);
  }

  const drag = useRef<{ x: number; index: number; moved: boolean } | null>(null);
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

    if (sequence > 0) {
      const fade = gsap.fromTo(incoming, { opacity: 0 }, { opacity: 1, duration: .26, ease: "sine.inOut",
        clearProps: "opacity", onComplete });
      return () => { fade.revert(); };
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
        <div className="artwork-dial" role="slider" tabIndex={0} aria-label="Artwork dial"
          aria-valuemin={1} aria-valuemax={artworkOrder.length}
          aria-valuenow={artworkOrder.indexOf(active) + 1} aria-valuetext={title}
          onKeyDown={event => {
            if (event.key === "Home" || event.key === "End") {
              event.preventDefault();
              selectArtwork(artworkOrder[event.key === "Home" ? 0 : artworkOrder.length - 1]);
            }
          }}
          onPointerDown={event => {
            if (!event.isPrimary || event.button !== 0) return;
            unlockDialSound();
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { x: event.clientX, index: artworkOrder.indexOf(navigation.current.active), moved: false };
          }}
          onPointerMove={event => {
            const start = drag.current;
            if (!start || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
            const dx = event.clientX - start.x;
            if (Math.abs(dx) > 3) start.moved = true;
            event.currentTarget.style.setProperty("--roll", `${start.index * 18 + dx}px`);
            const index = start.index + Math.round(dx / 18);
            selectArtwork(artworkOrder[((index % artworkOrder.length) + artworkOrder.length) % artworkOrder.length]);
          }}
          onPointerUp={event => {
            if (!drag.current || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
            unlockDialSound();
            if (!drag.current.moved) {
              const rect = event.currentTarget.getBoundingClientRect();
              step(event.clientX < rect.left + rect.width / 2 ? -1 : 1);
            }
          }}
          onLostPointerCapture={event => {
            drag.current = null;
            event.currentTarget.style.removeProperty("--roll");
          }}
        >
          <span aria-hidden="true" className="artwork-barrel"
            style={{ backgroundPositionX: `0px, var(--roll, ${artworkOrder.indexOf(active) * 18}px), 0px` }} />
        </div>
        <span className="artwork-title" role="status">{title}</span>
      </div>
      {photo?.source && <div className="artwork-credit">
          Images by <a href={photo.source}>{photo.creator}</a>
          {photo.additionalCredits?.map((credit, index, credits) => <span key={credit.source}>
            {index === credits.length - 1 ? " and " : ", "}<a href={credit.source}>{credit.creator}</a>
          </span>)}
      </div>}
    </figcaption>
  </figure>;
}
