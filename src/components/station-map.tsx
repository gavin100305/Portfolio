"use client";

import { useSpaceMood } from "@/components/use-space-mood";
import { MoodControl } from "@/components/mood-control";
import { useCallback, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { sections, getSection, type SectionId } from "@/data/sections";
import { contains, cockpitConsole, roomSigns, stationDoors, rooms, WORLD } from "@/data/station-world";
import { RoomArtwork, RoomFocusOutline } from "@/components/room-artwork";
import { Astronaut, StationConnections, StationForeground, StationEngines, SpaceBackdrop } from "@/components/ship-artwork";
import { useStationExploration } from "@/components/use-station-exploration";
import { FootballArenaScene, FootballArenaControls, FootballArenaSpectators, useFootballGame } from "@/components/football-arena";
import { useShipPresence } from "@/components/use-ship-presence";
import { ShipView } from "@/components/ship-view";
import { Spacewalk } from "@/components/spacewalk";
import { StationDiscoveries, AlienTransmission } from "@/components/station-discoveries";
import { discoveryNear, type DiscoveryId } from "@/data/station-discoveries";
import type { Point } from "@/data/station-world";
import { BernabeuExteriorArtwork, BernabeuInteriorArtwork } from "./bernabeu-artwork";
import { MadridistaJournal } from "./madridista-journal";
import { InteriorDepth } from "@/components/interior-depth";

type StationMapProps = {
  activeId: SectionId | null;
  onOpen: (id: SectionId, event: MouseEvent<HTMLElement>) => void;
  onActivate: (id: SectionId, opener: HTMLElement | null) => void;
  onLeaveArena: () => void;
};


export function StationMap({ activeId, onOpen, onActivate, onLeaveArena }: StationMapProps) {
  const footballActive = activeId === "football";
  const [penaltyMode, setPenaltyMode] = useState(false);
  const game = useFootballGame(footballActive);
  const startPenalty = useCallback(() => setPenaltyMode(true), []);
  const stopPenalty = useCallback(() => setPenaltyMode(false), []);
  if (!footballActive && penaltyMode) setPenaltyMode(false);
  const [cockpitOpen, setCockpitOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [exteriorOpen, setExteriorOpen] = useState(false);
  const [discovery, setDiscovery] = useState<Exclude<DiscoveryId, "robot"> | null>(null);
  const [robotAwake, setRobotAwake] = useState(false);
  const robotPosition = useRef<Point | null>(null);
  const discoveryOpener = useRef<HTMLElement | null>(null);
  const openDiscovery = useCallback((id: DiscoveryId) => {
    if (id === "robot") { setRobotAwake(true); return; }
    discoveryOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setDiscovery(id);
  }, []);
  const closeDiscovery = useCallback(() => {
    setDiscovery(null);
    requestAnimationFrame(() => requestAnimationFrame(() => discoveryOpener.current?.focus({ preventScroll: true })));
  }, []);
  const interact = useCallback((point: Point) => { const id = discoveryNear(point); if (!id) return false; openDiscovery(id); return true; }, [openDiscovery]);
  const getRobotPosition = useCallback(() => robotAwake ? robotPosition.current : null, [robotAwake]);
  const reportRobotMovement = useCallback((point: Point) => { robotPosition.current = point; }, []);
  const discoveryModal = discovery === "airlock" || discovery === "signal";
  const [depthReady, setDepthReady] = useState(false);
  const exteriorControlRef = useRef<HTMLButtonElement>(null);
  const closeExterior = useCallback(() => {
    setExteriorOpen(false);
    // The launcher becomes focusable after React removes the interior's inert
    // attribute. Returning focus in the next frame also works in Strict Mode.
    requestAnimationFrame(() => requestAnimationFrame(() => exteriorControlRef.current?.focus({ preventScroll: true })));
  }, []);
  if (activeId && exteriorOpen) setExteriorOpen(false);
  const openCockpit = useCallback(() => setCockpitOpen(true), []);
  const { controlRef, mood, flight, choose, advance } = useSpaceMood();
  const { backdropRef, depthFrameRef, viewportRef, worldRef, characterRef, location, atCockpit, atFootball, focusCockpit, focusDiscovery, press, release, focusRoom, releaseFocus, getMovementSnapshot } = useStationExploration(activeId, onActivate, Boolean(flight) || cockpitOpen || exteriorOpen || discoveryModal || journalOpen, openCockpit, interact, getRobotPosition, penaltyMode, startPenalty, onLeaveArena);
  const remoteVisitors = useShipPresence((!activeId || footballActive) && !flight && !cockpitOpen, getMovementSnapshot);
  const current = getSection(location);
  const dragMoved = useRef(false);
  const suppressRoomClickUntil = useRef(0);
  const [drag, setDrag] = useState<{ id: number; x: number; y: number; direction: "up" | "down" | "left" | "right" | null } | null>(null);
  const onTouchStart = (event: PointerEvent<HTMLDivElement>) => {
    if (penaltyMode || event.pointerType !== "touch" || (event.target as HTMLElement).closest("button, .room-wayfinding")) return;
    dragMoved.current = false;
    suppressRoomClickUntil.current = 0;
    setDrag({ id: event.pointerId, x: event.clientX, y: event.clientY, direction: null });
  };
  const onTouchMove = (event: PointerEvent<HTMLDivElement>) => {
    if (penaltyMode || !drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    const next = Math.hypot(dx, dy) < 18 ? null : Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
    if (next === drag.direction) return;
    if (next) {
      dragMoved.current = true;
      // Capture only once a drag starts, so an ordinary tap reaches the room link.
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (drag.direction) release(drag.direction);
    if (next) press(next);
    setDrag({ ...drag, direction: next });
  };
  const onTouchEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (drag?.id !== event.pointerId) return;
    if (drag.direction) release(drag.direction);
    if (dragMoved.current) suppressRoomClickUntil.current = performance.now() + 350;
    setDrag(null);
  };
  return (
    <div className="exploration-map" data-travelling={Boolean(flight)} data-football={footballActive} data-penalty={penaltyMode} data-exterior={exteriorOpen || discovery === "airlock"} data-depth-ready={depthReady}>
      <SpaceBackdrop backdropRef={backdropRef} mood={mood} />
      <div className="interior-experience" inert={exteriorOpen || discoveryModal}>
      <div className="map-viewport" inert={Boolean(flight)} ref={viewportRef} tabIndex={0} role="region" aria-label="Explore the space station" aria-describedby="movement-instructions" onPointerDown={onTouchStart} onPointerMove={onTouchMove} onPointerUp={onTouchEnd} onPointerCancel={onTouchEnd}>
        <div className="ship-flight" data-flight={flight ?? undefined} onAnimationEnd={(event) => { if (event.target === event.currentTarget) advance(); }}>
        <InteriorDepth theme={mood} worldRef={worldRef} frameRef={depthFrameRef} enabled={!exteriorOpen && !discoveryModal && !footballActive && !activeId} onReady={setDepthReady} />
        <div className="station-world" ref={worldRef} style={{ width: WORLD.width, height: WORLD.height }}>
          <StationEngines />
          <StationConnections />
          {sections.map((section) => {
            const room = rooms[section.id];
            return (
              <a key={section.id} href={`#${section.id}`}
                tabIndex={footballActive ? -1 : undefined}
                className={`world-room${activeId === section.id && section.id !== "football" ? " is-active" : ""}`}
                style={{ left: room.x, top: room.y, width: room.width, height: room.height }}
                aria-label={`Open ${section.label}: ${section.roomName}`}
                aria-current={activeId === section.id ? "page" : undefined}
                onClick={(event) => {
                  if (performance.now() < suppressRoomClickUntil.current) { event.preventDefault(); return; }
                  if(footballActive){event.preventDefault();return;}
                  onOpen(section.id, event);
                }}
                onFocus={() => focusRoom(section.id)} onBlur={releaseFocus}
                onKeyDown={(event) => { if (event.key === " ") { event.preventDefault(); event.currentTarget.click(); } }}>
                {section.id === "football" ? footballActive ? <BernabeuInteriorArtwork goals={game.displayGoals} saves={game.displaySaves} /> : <BernabeuExteriorArtwork /> : <RoomArtwork id={section.id} />}
                <RoomFocusOutline id={section.id} />
                <span className="visually-hidden">{section.roomName}</span>
              </a>
            );
          })}
          <button ref={controlRef} className="cockpit-world-console" type="button" disabled={footballActive} aria-label="Cockpit console: change space mood" aria-haspopup="dialog" aria-expanded={cockpitOpen}
            style={{ left: cockpitConsole.x, top: cockpitConsole.y, width: cockpitConsole.width, height: cockpitConsole.height }}
            onFocus={focusCockpit} onBlur={releaseFocus} onClick={openCockpit}>
            <span className="cockpit-console-switch" aria-hidden="true"><span /></span>
            <span className="visually-hidden">Change space mood</span>
          </button>
          <StationDiscoveries robotAwake={robotAwake} enabled={!activeId && !flight && !cockpitOpen && !exteriorOpen && !discoveryModal} onDiscover={openDiscovery} getMovement={getMovementSnapshot} onRobotMovement={reportRobotMovement} onFocus={focusDiscovery} onBlur={releaseFocus} />
          <FootballArenaScene active={footballActive} playing={penaltyMode} game={game} />

          {stationDoors.filter(door => door.id !== "airlock-11").map((door) => <div key={door.id} className="station-door" data-door-id={door.id} data-axis={door.axis} data-state="closed" role="img" aria-label="Room door: closed"
            style={{ left: door.x, top: door.y, width: door.width, height: door.height }}>
            <div className="door-aperture"><span className="door-leaf" /><span className="door-leaf" /></div>
          </div>)}
          {roomSigns.map((sign) => <div key={sign.id} className="wayfinding-wall" style={{ left: sign.x - 10, top: sign.y - 8, width: sign.width + 20 }}>
            <a tabIndex={footballActive ? -1 : undefined} className="room-wayfinding" href={`#${sign.id}`} aria-label={`Open ${getSection(sign.id)?.roomName}`} onClick={(event) => onOpen(sign.id, event)} onFocus={() => focusRoom(sign.id)} onBlur={releaseFocus}>{getSection(sign.id)?.roomName}</a>
          </div>)}
          <div className="astronaut" data-kicking={footballActive && Boolean(game.flight)} ref={characterRef} role="img" aria-label={`Your astronaut: ${current?.label ?? "corridor"}`}>
            <span className="astronaut-ring" aria-hidden="true" /><Astronaut />
          </div>
          {remoteVisitors.filter((visitor) => !contains(rooms.football, visitor)).map((visitor) => <div key={visitor.guestId} className="astronaut" data-remote="true" data-facing={visitor.facing} aria-label="Another visitor exploring the space station" role="img"
            style={{ left: visitor.x, top: visitor.y }}>
            <span className="astronaut-ring" aria-hidden="true" /><Astronaut palette={visitor.palette} facing={visitor.facing} remote />
          </div>)}
          <FootballArenaSpectators visitors={remoteVisitors} />
          <StationForeground depth={depthReady} />
        </div>
        </div>
      </div>
      <MoodControl open={cockpitOpen} onClose={() => setCockpitOpen(false)} mood={mood} controlRef={controlRef} onChoose={(next) => { setCockpitOpen(false); choose(next); }} />
      {footballActive && <>{penaltyMode ? <FootballArenaControls game={game} onExit={stopPenalty} /> : !atFootball && <p className="stadium-walk-hint"><span className="desktop-instructions">WASD / arrows to move · Walk through the left tunnel to leave</span><span className="touch-instructions">Drag to move · Walk through the left tunnel to leave</span></p>}<button type="button" className="madridista-journal-launch" onClick={() => setJournalOpen(true)}>My Madridista story <span aria-hidden="true">↗</span></button></>}
      {journalOpen && <MadridistaJournal onClose={() => setJournalOpen(false)} />}
      <p hidden={footballActive} id="movement-instructions" className="movement-instructions"><span className="desktop-instructions"><span className="inline-flex items-center gap-2"><span>Move</span><kbd>WASD</kbd><span className="mx-1 opacity-40" aria-hidden="true">/</span><kbd>Enter</kbd><span>open room</span></span></span><span className="touch-instructions">Drag to move<br />Tap a room to open</span></p>
      {atFootball && footballActive && !penaltyMode && <button className="nearby-action" type="button" onClick={startPenalty}>Play penalties <span aria-hidden="true">E</span></button>}
      {atCockpit && !footballActive && <button className="nearby-action" type="button" disabled={Boolean(flight)} onClick={openCockpit}>Change space mood <span aria-hidden="true">E</span></button>}
      {!activeId && <button className="ship-view-launch" type="button" ref={exteriorControlRef} disabled={Boolean(flight) || cockpitOpen} aria-haspopup="dialog" onClick={() => setExteriorOpen(true)}><span className="grid size-7 shrink-0 place-items-center rounded border border-card-edge bg-station-wash" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 3h8v3h3v12h-3v3H8v-3H5V6h3zM2 9v6m20-6v6M9 8h6v8H9z" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg></span><span>Station view</span></button>}
      </div>
      {discovery === "airlock" && <Spacewalk onClose={closeDiscovery} />}
      {discovery === "signal" && <AlienTransmission onClose={closeDiscovery} />}
      {exteriorOpen && <ShipView worldRef={worldRef} mood={mood} onMoodChange={next => choose(next, false)} onClose={closeExterior} />}
    </div>
  );
}
