"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore, type KeyboardEvent, type MouseEvent } from "react";
import { getSection, type SectionId } from "@/data/sections";
import { StationMap } from "@/components/station-map";
import { PortfolioPage, type InfoSectionId } from "@/components/portfolio-page";

import { useSpaceMood } from "@/components/use-space-mood";

const SECTION_URL_EVENT = "portfolio:sectionchange";

function sectionFromLocation(): SectionId | null {
  return getSection(window.location.hash.slice(1))?.id ?? null;
}

function subscribeToLocation(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener("hashchange", callback);
  window.addEventListener(SECTION_URL_EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("hashchange", callback);
    window.removeEventListener(SECTION_URL_EVENT, callback);
  };
}

export function StationShell() {
  const { mood } = useSpaceMood();
  const activeId = useSyncExternalStore(subscribeToLocation, sectionFromLocation, () => null);
  const dialogRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (activeId && activeId !== "football") {
      titleRef.current?.focus({ preventScroll: true });
      dialogRef.current?.scrollTo(0, 0);
      document.title = `${getSection(activeId)?.label} | Gavin Soares`;
      document.body.classList.add("dialog-open");
    } else {
      document.body.classList.remove("dialog-open");
      document.title = activeId === "football" ? "Orbital Training Deck | Gavin Soares" : "Space Station | Gavin Soares";
      if (activeId !== "football") {
        const opener = openerRef.current;
        if (opener?.isConnected) opener.focus({ preventScroll: true });
        else document.querySelector<HTMLElement>(".map-viewport")?.focus({ preventScroll: true });
      }
      // Keep the map launcher for a subsequent browser Forward traversal.
      // A fresh map activation replaces it with that room's launcher.
    }

    return () => document.body.classList.remove("dialog-open");
  }, [activeId]);

  const activateSection = useCallback((id: SectionId, opener: HTMLElement | null) => {
    const previous = sectionFromLocation();
    // Preserve the original map launcher while navigating between info pages.
    if (!previous || previous === "football") openerRef.current = opener;
    if (window.location.hash === `#${id}`) return;
    const previousDepth = window.history.state?.stationDepth;
    // Directly loaded section URLs have no station entry behind them.
    const stationDepth = !previous ? 1
      : Number.isInteger(previousDepth) && previousDepth > 0 ? previousDepth + 1 : 0;
    // Retain the router's state as well as our own. Replacing it can make a
    // history traversal reload the whole station during early hydration.
    window.history.pushState({ ...window.history.state, section: id, stationDepth }, "", `#${id}`);
    window.dispatchEvent(new Event(SECTION_URL_EVENT));
  }, []);

  const openSection = (id: SectionId, event: MouseEvent<HTMLElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    activateSection(id, event.currentTarget);
  };

  const closeSection = useCallback(() => {
    if (!activeId) return;
    const depth = window.history.state?.stationDepth;
    if (window.history.state?.section === activeId && Number.isInteger(depth) && depth > 0) {
      // Return to the station in one action, even after visiting several pages.
      window.history.go(-depth);
      return;
    }

    window.history.replaceState({ ...window.history.state, section: null, stationDepth: 0 }, "", window.location.pathname + window.location.search);
    window.dispatchEvent(new Event(SECTION_URL_EVENT));
  }, [activeId]);

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSection();
      return;
    }

    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable.item(0);
    const last = focusable.item(focusable.length - 1);

    // The title receives initial focus but is intentionally outside the tab
    // order. Some information pages have only the Return button to tab to.
    if (!Array.from(focusable).includes(document.activeElement as HTMLElement)) {
      event.preventDefault();
      (event.shiftKey ? last : first)?.focus();
      return;
    }

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  const activeSection = activeId === "football" ? undefined : getSection(activeId);

  return (
    <main className="station-shell" data-theme={mood}>
      <section className="station-stage" aria-label="Space station map" inert={Boolean(activeSection)}>
        <h1 className="visually-hidden">Explore Gavin Soares’s portfolio space station</h1>
        <StationMap activeId={activeId} onOpen={openSection} onActivate={activateSection} onLeaveArena={closeSection} />
      </section>

      {activeSection && <PortfolioPage key={activeSection.id} id={activeSection.id as InfoSectionId}
        pageRef={dialogRef} titleRef={titleRef} onKeyDown={handleDialogKeyDown}
        onClose={closeSection} onOpen={openSection} />}

    </main>
  );
}
