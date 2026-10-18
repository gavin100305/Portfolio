"use client";

import { useEffect } from "react";

/** Reveal once without leaving transforms on the cards used by the preview dialog. */
export function ProjectPageReveals() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".folio-projects-page");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!page || motion.matches || !window.IntersectionObserver) return;
    const animations = new Set<Animation>();
    const pending = new Set<HTMLElement>();
    const cleanups: (() => void)[] = [];
    const reveal = (element: HTMLElement, delay = 0, distance = 24) => {
      element.style.removeProperty("opacity");
      pending.delete(element);
      const animation = element.animate([
        { opacity: 0, transform: `translateY(${distance}px)` },
        { opacity: 1, transform: "translateY(0)" },
      ], { duration: 850, delay, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" });
      animations.add(animation);
      const cancel = () => animation.cancel();
      element.addEventListener("pointerdown", cancel);
      element.addEventListener("focusin", cancel);
      cleanups.push(() => {
        element.removeEventListener("pointerdown", cancel);
        element.removeEventListener("focusin", cancel);
      });
      animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
    };
    page.querySelectorAll<HTMLElement>(".folio-projects-entry").forEach((element, index) => reveal(element, index * 90, 14));
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
      visible.forEach((entry, index) => {
        observer.unobserve(entry.target);
        reveal(entry.target as HTMLElement, index * 100);
      });
    }, { threshold: .08, rootMargin: "0px 0px -24px 0px" });
    page.querySelectorAll<HTMLElement>(".folio-all-projects-grid > li, footer").forEach(element => {
      element.style.opacity = "0";
      pending.add(element);
      observer.observe(element);
    });
    const showAll = () => {
      observer.disconnect();
      animations.forEach(animation => animation.cancel());
      pending.forEach(element => element.style.removeProperty("opacity"));
      pending.clear();
    };
    const preferenceChanged = () => { if (motion.matches) showAll(); };
    motion.addEventListener("change", preferenceChanged);
    return () => {
      showAll();
      cleanups.forEach(cleanup => cleanup());
      motion.removeEventListener("change", preferenceChanged);
    };
  }, []);
  return null;
}
