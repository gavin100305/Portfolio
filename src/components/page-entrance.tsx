"use client";

import { useLayoutEffect, type RefObject } from "react";

const panelSelector = ".info-project-card,.info-award-card,.info-skill-card,.info-experience-card,.info-biography,[data-profile-card],.info-education,.activity-panel,.info-contact-main,.info-social-card,.info-football-invite";

/** Observe the scrolling page itself; offscreen panels wait until discovered. */
export function usePageEntrance(pageRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    const seen = new WeakSet<HTMLElement>();
    const openedAt = performance.now();
    const reveal = (panel: HTMLElement, delay: number) => {
      panel.style.setProperty("--entrance-delay", `${delay}ms`);
      panel.dataset.reveal = "shown";
    };
    const observer = new IntersectionObserver(entries => {
      let visibleIndex = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const panel = entry.target as HTMLElement;
        const elapsed = performance.now() - openedAt;
        const opening = elapsed < 1400;
        // Let the hatch and header establish the page before cards arrive.
        reveal(panel, (opening ? Math.max(0, 1150 - elapsed) : 0) + Math.min(visibleIndex++, 3) * (opening ? 140 : 100));
        observer.unobserve(panel);
      }
    }, { root: page, threshold: .06 });
    const register = () => {
      page.querySelectorAll<HTMLElement>(panelSelector).forEach(panel => {
        if (seen.has(panel)) return;
        seen.add(panel);
        panel.dataset.reveal = "pending";
        observer.observe(panel);
      });
    };
    register();
    const changes = new MutationObserver(register);
    changes.observe(page, { childList: true, subtree: true });
    const focus = (event: FocusEvent) => {
      const panel = event.target instanceof Element ? event.target.closest<HTMLElement>(panelSelector) : null;
      if (panel?.dataset.reveal === "pending") { reveal(panel, 0); observer.unobserve(panel); }
    };
    const settled = (event: AnimationEvent) => {
      if (event.animationName === "station-panel-in" && event.target instanceof HTMLElement) event.target.dataset.reveal = "settled";
    };
    page.addEventListener("focusin", focus);
    page.addEventListener("animationend", settled);
    return () => { observer.disconnect(); changes.disconnect(); page.removeEventListener("focusin", focus); page.removeEventListener("animationend", settled); };
  }, [pageRef]);
}

export function PageHatch({ closing }: { closing: boolean }) {
  return <div aria-hidden="true" data-closing={closing} className="group/hatch pointer-events-none fixed inset-3 z-50 overflow-hidden max-[700px]:inset-2.5 motion-reduce:hidden">
    <div className="absolute inset-y-0 left-0 w-1/2 border-r-[3px] border-[var(--card-border)] bg-[var(--frame-dark)] shadow-[inset_-8px_0_0_var(--frame-color)] animate-[station-hatch-left_1200ms_cubic-bezier(.65,0,.35,1)_both] group-data-[closing=true]/hatch:animate-[station-hatch-left-close_500ms_ease-in-out_both]"><span className="absolute inset-y-[16%] right-5 w-px bg-[var(--frame-color)]" /><span className="absolute top-[46%] right-1 h-10 w-1 bg-[var(--ship-light)]" /></div>
    <div className="absolute inset-y-0 right-0 w-1/2 border-l-[3px] border-[var(--card-border)] bg-[var(--frame-dark)] shadow-[inset_8px_0_0_var(--frame-color)] animate-[station-hatch-right_1200ms_cubic-bezier(.65,0,.35,1)_both] group-data-[closing=true]/hatch:animate-[station-hatch-right-close_500ms_ease-in-out_both]"><span className="absolute inset-y-[16%] left-5 w-px bg-[var(--frame-color)]" /><span className="absolute top-[46%] left-1 h-10 w-1 bg-[var(--ship-light)]" /></div>
    <span className="absolute inset-0 rounded-[1px] border-2 border-[var(--ship-light)] opacity-0 animate-[station-frame-light_1400ms_ease-out_both]" />
  </div>;
}
