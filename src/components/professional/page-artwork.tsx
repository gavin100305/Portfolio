"use client";

import { createContext, useEffect, useRef, useState, type ReactNode } from "react";
import { makePageSnow } from "./page-artwork-snow";
import { openingArtwork, type ArtworkId } from "./artwork-scenes";
import { makePageFlowers } from "./page-artwork-flowers";
import {
  loadArtworkImage, loadContourPoints, makePageFireflies, makePagePond,
  type ArtworkViewport, type PageScene,
} from "./page-artwork-scenes";

export const PageArtworkSelection = createContext<(artwork: ArtworkId) => void>(() => {});

const desktopMotion = "(min-width: 1024px) and (any-pointer: fine) and (prefers-reduced-motion: no-preference)";
const fadeDuration = .72;

type ActiveLayer = {
  id: ArtworkId; scene: PageScene; time: number; opacity: number;
};

export function PageArtwork({ children }: { children: ReactNode }) {
  const [artwork, selectArtwork] = useState<ArtworkId>(openingArtwork);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flowerLayer = useRef<HTMLDivElement>(null);
  const desired = useRef<ArtworkId>(openingArtwork);
  const resume = useRef<() => void>(() => {});

  useEffect(() => {
    desired.current = artwork;
    resume.current();
  }, [artwork]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const shell = canvas.closest<HTMLElement>(".professional-shell");
    if (!shell) return;
    const media = matchMedia(desktopMotion);
    const root = document.documentElement;
    let cleanUp = () => {};

    function start() {
      const ctx = canvas.getContext("2d");
      const gardenLayer = flowerLayer.current;
      if (!ctx || !shell || !gardenLayer) return () => {};
      const view: ArtworkViewport = {
        width: 0, height: 0, scroll: 0, pageHeight: 0, contourWidth: 0, dark: false,
      };
      let ratio = 1;
      let frame = 0;
      let previous = 0;
      let disposed = false;
      let koi: HTMLImageElement[] | undefined;
      let garden: [Awaited<ReturnType<typeof loadContourPoints>>, HTMLImageElement[]] | undefined;
      let active: ActiveLayer | undefined;
      let outgoing: ActiveLayer | undefined;
      let elapsed = 0;
      const requested = new Set<ArtworkId>();

      function schedule() {
        if (!frame && !disposed && !document.hidden &&
          root.dataset.folioIntro !== "pending" &&
          (desired.current !== "desk" || active || outgoing)) {
          frame = requestAnimationFrame(draw);
        }
      }

      function sync() {
        if (document.hidden || root.dataset.folioIntro === "pending") {
          if (frame) cancelAnimationFrame(frame);
          frame = 0;
          previous = 0;
        } else {
          schedule();
        }
      }

      function resize() {
        if (!shell) return;
        const { clientWidth: width, clientHeight: height } = canvas;
        if (!width || !height) return;
        view.pageHeight = shell.offsetHeight;
        if (width !== view.width || height !== view.height || ratio !== Math.min(devicePixelRatio, 1.5)) {
          ratio = Math.min(devicePixelRatio, 1.5);
          view.width = width;
          view.height = height;
          canvas.width = Math.round(width * ratio);
          canvas.height = Math.round(height * ratio);
          if (koi && active?.id === "pond") {
            active.scene = makePagePond(koi, view);
            active.time = 0;
          }
          if (outgoing?.id === "pond") outgoing = undefined;
        }
        view.contourWidth = parseFloat(getComputedStyle(shell, "::before").width) || 128;
        schedule();
      }

      function sceneFor(id: ArtworkId) {
        if (id === "pond") {
          if (koi) return makePagePond(koi, view);
          if (!requested.has(id)) {
            requested.add(id);
            Promise.all(["kohaku", "sanke", "ogon"].map(name => loadArtworkImage(`/artwork/${name}.webp`)))
              .then(images => { koi = images; schedule(); }).catch(() => {});
          }
        }
        if (id === "plateau") {
          if (garden && gardenLayer) return makePageFlowers(gardenLayer, ...garden);
          if (!requested.has(id)) {
            requested.add(id);
            Promise.all([
              loadContourPoints(),
              Promise.all([1, 2, 3, 4].map(index => loadArtworkImage(`/artwork/contour-meadow-${index}.webp`))),
            ]).then(assets => { garden = assets; schedule(); }).catch(() => {});
          }
        }
        if (id === "snow" && shell) return makePageSnow(shell);
        if (id === "grove") return makePageFireflies();
      }

      function draw(now: number) {
        frame = 0;
        const dt = previous ? Math.min(.05, (now - previous) / 1000) : 0;
        previous = now;
        view.scroll = window.scrollY;
        view.dark = root.dataset.professionalTheme === "dark";
        const id = desired.current;
        if (id !== (active?.id ?? "desk")) {
          const scene = sceneFor(id);
          if (scene || id === "desk") {
            if (active) {
              outgoing?.scene.dispose?.();
              outgoing = active;
            }
            active = scene ? { id, scene, time: 0, opacity: 0 } : undefined;
            elapsed = 0;
          }
        }
        elapsed += dt;
        const blend = Math.min(1, elapsed / fadeDuration);
        const ease = blend * blend * (3 - 2 * blend);

        ctx!.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx!.clearRect(0, 0, view.width, view.height);
        if (outgoing) {
          const opacity = outgoing.opacity * (1 - ease);
          outgoing.time += dt;
          ctx!.save();
          if (opacity > 0) outgoing.scene.draw(ctx!, view, outgoing.time, opacity);
          ctx!.restore();
          if (blend === 1) {
            outgoing.scene.dispose?.();
            outgoing = undefined;
          }
        }
        if (active) {
          active.time += dt;
          active.opacity = ease;
          ctx!.save();
          active.scene.draw(ctx!, view, active.time, ease);
          ctx!.restore();
        }
        // Waiting for an image to decode does not require its own render loop.
        if (active || outgoing) schedule();
        else previous = 0;
      }

      function touch(event: PointerEvent) {
        active?.scene.brush?.({ x: event.clientX, y: event.clientY }, active.time);
      }

      function press(event: PointerEvent | KeyboardEvent) {
        if (!active?.scene.press || !(event.target instanceof Element)) return;
        if (event instanceof KeyboardEvent) {
          if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
        } else if (event.button !== 0 || !event.isPrimary) return;
        const control = event.target.closest<HTMLElement>("button, a[href], [role=slider]");
        if (control && !control.matches(":disabled, [aria-disabled=true]")) active.scene.press(control);
      }

      const bounds = new ResizeObserver(resize);
      const opening = new MutationObserver(sync);
      bounds.observe(shell);
      opening.observe(root, { attributes: true, attributeFilter: ["data-folio-intro"] });
      window.addEventListener("resize", resize);
      window.addEventListener("pointermove", touch, { passive: true });
      window.addEventListener("pointerdown", touch, { passive: true });
      window.addEventListener("pointerdown", press, { capture: true, passive: true });
      window.addEventListener("keydown", press, true);
      document.addEventListener("visibilitychange", sync);
      resume.current = sync;
      resize();
      sync();

      return () => {
        disposed = true;
        active?.scene.dispose?.();
        outgoing?.scene.dispose?.();
        cancelAnimationFrame(frame);
        bounds.disconnect();
        opening.disconnect();
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", touch);
        window.removeEventListener("pointerdown", touch);
        window.removeEventListener("pointerdown", press, true);
        window.removeEventListener("keydown", press, true);
        document.removeEventListener("visibilitychange", sync);
        resume.current = () => {};
        canvas.width = 1;
        canvas.height = 1;
      };
    }

    function syncMedia() {
      cleanUp();
      cleanUp = media.matches ? start() : () => {};
    }
    media.addEventListener("change", syncMedia);
    syncMedia();
    return () => {
      media.removeEventListener("change", syncMedia);
      cleanUp();
    };
  }, []);

  return <PageArtworkSelection.Provider value={selectArtwork}>
    <canvas className="folio-page-artwork" ref={canvasRef} aria-hidden="true" />
    <div className="folio-page-flowers" ref={flowerLayer} aria-hidden="true" />
    {children}
  </PageArtworkSelection.Provider>;
}
