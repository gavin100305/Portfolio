"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore, type KeyboardEvent, type MouseEvent } from "react";
import { getSection, type SectionId } from "@/data/sections";
import { StationMap } from "@/components/station-map";
import { RoomEquipmentIcon } from "@/components/room-artwork";

const SECTION_URL_EVENT = "portfolio:sectionchange";

const moduleGlyphs: Record<Exclude<SectionId, "football">, string> = {
  projects: "M4 10h8V6h8v4h8v16H4z M8 15h16v2H8z M8 20h10v2H8z",
  achievements: "M16 3l4 8 9 1-6 6 1 9-8-4-8 4 1-9-6-6 9-1z",
  stack: "M8 8h16v16H8z M12 12h8v8h-8z M2 10h6v2H2z M2 16h6v2H2z M24 10h6v2h-6z M24 16h6v2h-6z M12 2h2v6h-2z M18 2h2v6h-2z M12 24h2v6h-2z M18 24h2v6h-2z",
  experience: "M5 4h22v24H5z M9 9h14v2H9z M9 14h14v2H9z M9 19h8v2H9z",
  about: "M14 2h4v8h-4z M14 22h4v8h-4z M2 14h8v4H2z M22 14h8v4h-8z M10 10h12v12H10z M14 14h4v4h-4z",
  contact: "M14 4h4v4h-4z M12 8h8v3h-8z M15 11h2v8h-2z M8 18h16v3H8z M5 24h22v3H5z M3 10h4v2H3z M25 10h4v2h-4z",
};

function ModuleGlyph({ id }: { id: Exclude<SectionId, "football"> }) {
  return <svg viewBox="0 0 32 32" aria-hidden="true" shapeRendering="crispEdges"><path d={moduleGlyphs[id]} fill="currentColor" /></svg>;
}

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
  const activeId = useSyncExternalStore(subscribeToLocation, sectionFromLocation, () => null);
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (activeId && activeId !== "football") {
      closeRef.current?.focus();
      document.body.classList.add("dialog-open");
    } else if (activeId !== "football") {
      document.body.classList.remove("dialog-open");
      const opener = openerRef.current;
      if (opener?.isConnected) opener.focus();
      else if (opener) document.querySelector<HTMLElement>(".map-viewport")?.focus();
      openerRef.current = null;
    }

    return () => document.body.classList.remove("dialog-open");
  }, [activeId]);

  const activateSection = useCallback((id: SectionId, opener: HTMLElement | null) => {
    openerRef.current = opener;
    if (window.location.hash === `#${id}`) return;
    window.history.pushState({ section: id }, "", `#${id}`);
    window.dispatchEvent(new Event(SECTION_URL_EVENT));
  }, []);

  const openSection = (id: SectionId, event: MouseEvent<HTMLElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    activateSection(id, event.currentTarget);
  };

  const closeSection = useCallback(() => {
    if (!activeId) return;
    if (window.history.state?.section === activeId) {
      window.history.back();
      return;
    }

    window.history.replaceState(null, "", window.location.pathname + window.location.search);
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
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable.item(0);
    const last = focusable.item(focusable.length - 1);

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
    <main className="station-shell">
      <section className="station-stage" aria-label="Space station map" inert={Boolean(activeSection)}>
        <h1 className="visually-hidden">Explore Gavin Soares’s portfolio spaceship</h1>
        <StationMap activeId={activeId} onOpen={openSection} onActivate={activateSection} onLeaveArena={closeSection} />
      </section>

      {activeSection && (
        <div className="dialog-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeSection();
        }}>
          <section
            aria-labelledby="section-dialog-title"
            aria-modal="true"
            className="section-dialog"
            onKeyDown={handleDialogKeyDown}
            ref={dialogRef}
            role="dialog"
            tabIndex={-1}
          >
            <div className="dialog-topline">
              <span className="dialog-eyebrow">STATION DIRECTORY</span>
              <button className="icon-button" onClick={closeSection} ref={closeRef} type="button">
                <span className="visually-hidden">Close {activeSection.label}</span>
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="dialog-content">
              <div className="dialog-hero">
                <span className="dialog-illustration"><RoomEquipmentIcon id={activeSection.id as Exclude<SectionId, "football">} /></span>
                <div><span className="dialog-index">{activeSection.roomName}</span>
                  <h1 id="section-dialog-title">{activeSection.label}</h1></div>
              </div>
              <p>{activeSection.description}</p>
              <div className="content-placeholder" data-destination={activeSection.id} aria-live="polite">
                <span className="module-mark"><ModuleGlyph id={activeSection.id as Exclude<SectionId, "football">} /></span>
                <span className="module-copy">
                  <span className="module-kicker">PORTFOLIO UPLINK · STANDBY</span>
                  <span className="module-placeholder">Section content placeholder</span>
                </span>
                <span className="module-status"><i aria-hidden="true" />STANDBY</span>
              </div>
            </div>
            <div className="dialog-footer">
              <span className="dialog-footer-note">PORTFOLIO MODULE</span>
              <button className="home-button" onClick={closeSection} type="button">
                <span aria-hidden="true">←</span> Map / Home
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
