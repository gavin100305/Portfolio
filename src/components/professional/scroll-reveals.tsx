"use client";

import { useEffect } from "react";

/** One entrance per section; final layout and drag positions remain authoritative. */
export function ScrollReveals() {
  useEffect(() => {
    const shell = document.querySelector<HTMLElement>(".professional-shell");
    if (!shell) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return;
    const animations = new Set<Animation>();
    const pending = new Set<HTMLElement>();
    const cleanups: (() => void)[] = [];
    const easing = "cubic-bezier(.22,.7,.25,1)";

    function play(element: HTMLElement, frames: Keyframe[], duration: number, delay = 0) {
      const animation = element.animate(frames, { duration, delay, easing, fill: "backwards" });
      animations.add(animation);
      const cancel = () => animation.cancel();
      element.addEventListener("pointerdown", cancel, { once: true });
      element.addEventListener("keydown", cancel, { once: true });
      cleanups.push(() => {
        element.removeEventListener("pointerdown", cancel);
        element.removeEventListener("keydown", cancel);
      });
      animation.finished.then(() => animations.delete(animation)).catch(() => animations.delete(animation));
    }

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const element = entry.target as HTMLElement;
        observer.unobserve(element);
        pending.delete(element);
        element.style.removeProperty("opacity");
        if (motion.matches) continue;
        const cards = element.querySelectorAll<HTMLElement>(".folio-project-print, .folio-album-print");
        if (cards.length) {
          const board = element.getBoundingClientRect();
          cards.forEach((card, index) => {
            const final = getComputedStyle(card);
            play(card, [
              { left: `${board.width / 2}px`, top: `${board.height / 2}px`, transform: "translate(-50%, -50%) rotate(0deg) scale(.84)", opacity: 0 },
              { left: final.left, top: final.top, transform: final.transform, opacity: 1 },
            ], 950, index * 65);
          });
        } else {
          play(element, [{ opacity: 0, transform: "translateY(26px)" }, { opacity: 1, transform: "translateY(0)" }], 750);
        }
      }
    }, { threshold: 0, rootMargin: "0px 0px -65px 0px" });

    // Animate headings independently from the card fan, never the moving marquee tracks.
    const selectors = [
      ".folio-introduction", ".folio-tech", ".folio-gallery > :first-child",
      ".folio-project-board", ".folio-experience", ".folio-awards > :first-child",
      ".folio-album-stage", ".folio-album-caption", ".folio-github > :first-child", ".folio-contact", ".folio-space-invitation", "footer",
    ];
    shell.querySelectorAll<HTMLElement>(selectors.join(",")).forEach(element => {
      // Already visible content stays visible when hydrating or returning with scroll restoration.
      if (element.getBoundingClientRect().top < window.innerHeight - 65) return;
      element.style.opacity = "0";
      pending.add(element);
      observer.observe(element);
    });
    function finish() {
      if (!motion.matches) return;
      observer.disconnect();
      pending.forEach(element => element.style.removeProperty("opacity"));
      animations.forEach(animation => animation.cancel());
    }
    motion.addEventListener("change", finish);
    return () => {
      observer.disconnect();
      pending.forEach(element => element.style.removeProperty("opacity"));
      animations.forEach(animation => animation.cancel());
      cleanups.forEach(cleanup => cleanup());
      motion.removeEventListener("change", finish);
    };
  }, []);
  return null;
}
