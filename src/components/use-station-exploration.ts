"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DOOR_APPROACH_RADIUS, WORLD, footballKicker, nearFootball, cockpitApproach, nearCockpit, cameraFor, moveCharacter, roomAt, rooms, stationDoors, type Rect, type Point } from "@/data/station-world";
import type { SectionId } from "@/data/sections";

export type Direction = "up" | "down" | "left" | "right";
const keys: Record<string, Direction> = { w: "up", arrowup: "up", s: "down", arrowdown: "down", a: "left", arrowleft: "left", d: "right", arrowright: "right" };
const vectors: Record<Direction, Point> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };


/** Walk on the arena floor and its west tunnel, never across the seating tiers. */
function moveInStadium(point:Point,dx:number,dy:number):Point {
  const arena=rooms.football,unit=arena.width/240;
  const walkable=(p:Point)=>{
    const x=(p.x-arena.x)/unit,y=(p.y-arena.y)/unit;
    const inside=(x:number,y:number)=> (x>=-40 && x<=51 && y>=81 && y<=92)
      || Math.pow(Math.abs((x-120)/77),4.6)+Math.pow(Math.abs((y-87)/51),4.6)<=1;
    return [[0,0],[-2,0],[2,0],[0,-2],[0,2]].every(([ox,oy])=>inside(x+ox,y+oy));
  };
  let next={...point};const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/4));
  for(let i=0;i<steps;i++){
    const x={x:next.x+dx/steps,y:next.y};if(walkable(x)) next=x;
    const y={x:next.x,y:next.y+dy/steps};if(walkable(y)) next=y;
  }
  return next;
}

export function useStationExploration(activeId: SectionId | null, onActivate: (id: SectionId, opener: HTMLElement | null) => void, travelling = false, onCockpit?: () => void, onInteract?: (point: Point) => boolean, getRobotPosition?: () => Point | null, penaltyMode = false, onPenalty?: () => void, onArenaExit?: () => void) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const depthFrameRef = useRef<((time: number) => void) | null>(null);
  const doorProgress = useRef(stationDoors.map(() => 0));
  const closedDoors = useRef<Rect[]>(stationDoors);
  const velocity = useRef<Point>({ x: 0, y: 0 });
  const cameraPosition = useRef<Point | null>(null);
  const measuredSize = useRef({ width: 0, height: 0 });
  const keyboardInput = useRef(new Set<string>());
  const walkDistance = useRef(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const characterRef = useRef<HTMLDivElement>(null);
  const position = useRef<Point>({ ...WORLD.spawn });
  const presenceAnchor = useRef<Point | null>(null);
  const facingRef = useRef<Direction>("down");
  const input = useRef(new Set<Direction>());
  const focusedPoint = useRef<Point | null>(null);
  const [atCockpit, setAtCockpit] = useState(false);
  const [atFootball, setAtFootball] = useState(false);
  const footballNearby = useRef(false);
  const arenaEntryArmed = useRef(true);
  const insideArena = useRef(false);
  const wasPenalty = useRef(false);
  const exitRequested = useRef(false);
  const cockpitNearby = useRef(false);
  const previousRoom = useRef<SectionId | null>("about");
  const [location, setLocation] = useState<SectionId | null>("about");

  useEffect(() => {
    const viewport = viewportRef.current;
    const world = worldRef.current;
    const character = characterRef.current;
    if (!viewport || !world || !character) return;
    const doorElements = stationDoors.map((door) => world.querySelector<HTMLElement>(`[data-door-id="${door.id}"]`));
    const footballActive = activeId === "football";
    const panelOpen = Boolean(activeId) && !footballActive;
    if (footballActive && !insideArena.current) {
      insideArena.current=true; exitRequested.current=false;
      presenceAnchor.current={x:rooms.football.x-18,y:rooms.football.y+rooms.football.width/240*86.4};
      position.current={x:rooms.football.x+rooms.football.width/240*48,y:rooms.football.y+rooms.football.width/240*86.4};
      facingRef.current="right";focusedPoint.current=null;viewport.focus();
    } else if(!footballActive && insideArena.current) {
      position.current=presenceAnchor.current ?? position.current;
      presenceAnchor.current=null;insideArena.current=false;exitRequested.current=false;
      arenaEntryArmed.current=false;
    }
    if(penaltyMode && !wasPenalty.current) { position.current={...footballKicker};facingRef.current="up"; }
    wasPenalty.current=penaltyMode;
    let frame = 0;
    let previousTime = 0;
    let width = 0, height = 0, scale = 1;
    let camera: Point | null = cameraPosition.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const measure = () => {
      width = viewport.clientWidth;
      height = viewport.clientHeight;
      scale = footballActive
        ? Math.max(.1, Math.min((width - 12) / rooms.football.width, (height - 32) / rooms.football.height))
        : Math.max(width < 700 ? .9 : 1, width / 1250, height / 860);
      if (!camera || width !== measuredSize.current.width || height !== measuredSize.current.height) {
        camera = cameraFor(position.current, width, height, scale);
      }
      measuredSize.current = { width, height };
      const fit = Math.min(width / WORLD.width, height / (WORLD.height + 160)) * .86;
      viewport.style.setProperty("--flight-scale", String(fit));
      viewport.style.setProperty("--flight-x", `${(width - WORLD.width * fit) / 2}px`);
      viewport.style.setProperty("--flight-y", `${(height - WORLD.height * fit) / 2}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);

    const tick = (time: number) => {
      const delta = previousTime ? Math.min((time - previousTime) / 1000, .04) : 0;
      previousTime = time;
      closedDoors.current = [];
      const robotPosition = getRobotPosition?.();
      stationDoors.forEach((door, index) => {
        const x = Math.max(door.x, Math.min(door.x + door.width, position.current.x));
        const y = Math.max(door.y, Math.min(door.y + door.height, position.current.y));
        const playerApproaching = Math.hypot(position.current.x - x, position.current.y - y) < DOOR_APPROACH_RADIUS;
        const robotX = robotPosition ? Math.max(door.x, Math.min(door.x + door.width, robotPosition.x)) : 0;
        const robotY = robotPosition ? Math.max(door.y, Math.min(door.y + door.height, robotPosition.y)) : 0;
        const robotApproaching = robotPosition && Math.hypot(robotPosition.x - robotX, robotPosition.y - robotY) < DOOR_APPROACH_RADIUS;
        const target = playerApproaching || robotApproaching ? 1 : 0;
        const previous = doorProgress.current[index];
        const progress = motion.matches ? target : previous + Math.sign(target - previous) * Math.min(Math.abs(target - previous), delta * 4);
        doorProgress.current[index] = progress;
        if (progress < .9) closedDoors.current.push(door);
        const element = doorElements[index];
        if (element) {
          element.style.setProperty("--door-open", progress.toFixed(3));
          const state = progress >= .9 ? "open" : progress > 0 ? "moving" : "closed";
          if (element.dataset.state !== state) { element.dataset.state = state; element.setAttribute("aria-label", `Airlock ${index + 1}: ${state}`); }
        }
      });
      let distance = 0;
      if ((!activeId || (footballActive && !penaltyMode)) && !travelling && !document.hidden && !document.querySelector("[data-station-overlay]")) {
        let x = 0, y = 0;
        const held = new Set(input.current);
        keyboardInput.current.forEach((key) => held.add(keys[key]));
        held.forEach((direction) => { x += vectors[direction].x; y += vectors[direction].y; facingRef.current = direction; });
        const length = Math.hypot(x, y) || 1;
        const targetVelocity = { x: x / length * WORLD.speed, y: y / length * WORLD.speed };
        // Reach full speed quickly, then stop within a few pixels on release.
        const rate = x || y ? 2600 : 4200;
        const difference = { x: targetVelocity.x - velocity.current.x, y: targetVelocity.y - velocity.current.y };
        const magnitude = Math.hypot(difference.x, difference.y);
        const fraction = magnitude ? Math.min(1, rate * delta / magnitude) : 1;
        velocity.current.x += difference.x * fraction;
        velocity.current.y += difference.y * fraction;
        const before = position.current;
        if (Math.hypot(velocity.current.x, velocity.current.y) > .1) {
          focusedPoint.current = null;
          position.current = footballActive ? moveInStadium(before,velocity.current.x*delta,velocity.current.y*delta) : moveCharacter(before, velocity.current.x * delta, velocity.current.y * delta, closedDoors.current);
          // Discard velocity into a wall while retaining movement along its edge.
          if (Math.abs(position.current.x - before.x) < Math.abs(velocity.current.x * delta) * .5) velocity.current.x = 0;
          if (Math.abs(position.current.y - before.y) < Math.abs(velocity.current.y * delta) * .5) velocity.current.y = 0;
        }
        distance = Math.hypot(position.current.x - before.x, position.current.y - before.y);
        walkDistance.current += distance;
        const arena = rooms.football;
        const entryX = arena.x + arena.width * 24 / 240;
        if (position.current.x < arena.x + arena.width * 12 / 240) arenaEntryArmed.current = true;
        if (!footballActive && arenaEntryArmed.current && position.current.x >= entryX && position.current.x <= entryX + 40 && Math.abs(position.current.y - (arena.y + arena.height * .49)) < 60) {
          arenaEntryArmed.current = false;
          input.current.clear(); keyboardInput.current.clear(); velocity.current = { x: 0, y: 0 };
          onActivate("football", viewport);
        }
        if(footballActive && !exitRequested.current && position.current.x < arena.x-5) {
          exitRequested.current=true;input.current.clear();keyboardInput.current.clear();velocity.current={x:0,y:0};onArenaExit?.();
        }
        const nextRoom = footballActive ? "football" : roomAt(position.current);
        if (nextRoom !== previousRoom.current) {
          previousRoom.current = nextRoom;
          setLocation(nextRoom);
        }
      }
      if (footballActive && previousRoom.current !== "football") { previousRoom.current = "football"; setLocation("football"); }
      const nearBall = nearFootball(position.current);
      if (nearBall !== footballNearby.current) { footballNearby.current = nearBall; setAtFootball(nearBall); }
      const nearby = nearCockpit(position.current);
      if (nearby !== cockpitNearby.current) { cockpitNearby.current = nearby; setAtCockpit(nearby); }
      const target = footballActive ? { x: rooms.football.x + rooms.football.width / 2, y: rooms.football.y + rooms.football.height / 2 } : focusedPoint.current ?? position.current;

      const desired = footballActive ? { x: target.x - width / scale / 2, y: target.y - height / scale / 2 } : cameraFor(target, width, height, scale);
      const easing = motion.matches ? 1 : 1 - Math.exp(-delta * 18);
      camera ??= desired;
      if (!panelOpen && !travelling) {
        camera.x += (desired.x - camera.x) * (footballActive ? 1 : easing);
        camera.y += (desired.y - camera.y) * (footballActive ? 1 : easing);
      }
      cameraPosition.current = camera;
      const backdrop = backdropRef.current;
      if (backdrop) {
        const origin = cameraFor(WORLD.spawn, width, height, scale);
        backdrop.style.setProperty("--parallax-x", `${motion.matches ? 0 : -Math.round((camera.x - origin.x) * scale)}px`);
        backdrop.style.setProperty("--parallax-y", `${motion.matches ? 0 : -Math.round((camera.y - origin.y) * scale)}px`);
      }
      character.dataset.walking = String(distance > .05 && !motion.matches);
      character.dataset.stride = String(Math.floor(walkDistance.current / 15) % 2);
      world.style.transform = `translate(${-Math.round(camera.x * scale)}px, ${-Math.round(camera.y * scale)}px) scale(${scale})`;
      world.dataset.cameraX = camera.x.toFixed(2);
      world.dataset.cameraY = camera.y.toFixed(2);
      world.dataset.scale = String(scale);
      world.style.setProperty("--scene-scale", String(scale));
      viewport.dataset.ready = "true";
      character.style.transform = `translate(${Math.round(position.current.x)}px, ${Math.round(position.current.y)}px)`;
      character.dataset.x = position.current.x.toFixed(2);
      character.dataset.y = position.current.y.toFixed(2);
      character.dataset.facing = facingRef.current;
      depthFrameRef.current?.(time);
      frame = requestAnimationFrame(tick);
    };

    const keyDown = (event: KeyboardEvent) => {
      if (document.querySelector("[data-station-overlay], .station-airlock")) return;
      if ((activeId && !footballActive) || penaltyMode || travelling || event.target instanceof HTMLSelectElement || (event.target instanceof HTMLElement && Boolean(event.target.closest(".mood-console"))) || event.ctrlKey || event.metaKey || event.altKey || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || (event.target instanceof HTMLElement && event.target.isContentEditable)) return;
      if (footballActive && event.key.toLowerCase() === "e" && !event.repeat && nearFootball(position.current)) { event.preventDefault(); onPenalty?.(); return; }
      if (!footballActive && event.key.toLowerCase() === "e" && !event.repeat && onInteract?.(position.current)) { event.preventDefault(); return; }
      if (!footballActive && event.key.toLowerCase() === "e" && nearFootball(position.current)) { event.preventDefault(); onActivate("football", viewport); return; }
      if (event.key.toLowerCase() === "e" && nearCockpit(position.current)) { event.preventDefault(); onCockpit?.(); return; }
      const direction = keys[event.key.toLowerCase()];
      if (direction) { event.preventDefault(); keyboardInput.current.add(event.key.toLowerCase()); }
      if (!footballActive && (event.key === "Enter" || event.key === " ") && event.target === viewport && previousRoom.current) {
        event.preventDefault(); onActivate(previousRoom.current, viewport);
      }
    };
    const keyUp = (event: KeyboardEvent) => { const direction = keys[event.key.toLowerCase()]; if (direction) keyboardInput.current.delete(event.key.toLowerCase()); };
    const clear = () => { input.current.clear(); keyboardInput.current.clear(); velocity.current = { x: 0, y: 0 }; previousTime = 0; };
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", clear);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); clear();
      window.removeEventListener("keydown", keyDown); window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", clear); document.removeEventListener("visibilitychange", clear);
    };
  }, [activeId, onActivate, travelling, onCockpit, onInteract, getRobotPosition, penaltyMode, onPenalty, onArenaExit]);

  const press = useCallback((direction: Direction) => {
    if ((activeId && activeId !== "football") || penaltyMode || travelling) return;
    const vector = vectors[direction];
    position.current = activeId === "football" ? moveInStadium(position.current,vector.x*12,vector.y*12) : moveCharacter(position.current, vector.x * 12, vector.y * 12, closedDoors.current);
    input.current.add(direction); focusedPoint.current = null;
  }, [activeId, travelling, penaltyMode]);
  const release = useCallback((direction: Direction) => { input.current.delete(direction); }, []);
  const step = useCallback((direction: Direction) => {
    if ((activeId && activeId !== "football") || penaltyMode || travelling) return;
    const vector = vectors[direction];
    focusedPoint.current = null;
    velocity.current = { x: 0, y: 0 };
    position.current = activeId === "football" ? moveInStadium(position.current,vector.x*32,vector.y*32) : moveCharacter(position.current, vector.x * 32, vector.y * 32, closedDoors.current);
  }, [activeId, travelling, penaltyMode]);
  const focusRoom = useCallback((id: SectionId) => { const room = rooms[id]; focusedPoint.current = { x: room.x + room.width / 2, y: room.y + room.height / 2 }; }, []);
  const focusDiscovery = useCallback((point: Point) => { focusedPoint.current = { ...point }; }, []);
  const focusCockpit = useCallback(() => { focusedPoint.current = cockpitApproach; }, []);
  const releaseFocus = useCallback(() => { focusedPoint.current = null; }, []);
  const getMovementSnapshot = useCallback(() => ({ x: (presenceAnchor.current ?? position.current).x, y: (presenceAnchor.current ?? position.current).y, facing: facingRef.current }), []);
  const reset = useCallback(() => {
    input.current.clear(); keyboardInput.current.clear(); velocity.current = { x: 0, y: 0 }; focusedPoint.current = null;
    position.current = { ...WORLD.spawn };
    previousRoom.current = "about"; setLocation("about"); viewportRef.current?.focus();
  }, []);
  return { backdropRef, depthFrameRef, viewportRef, worldRef, characterRef, location, atCockpit, atFootball, focusCockpit, press, release, step, focusRoom, focusDiscovery, releaseFocus, getMovementSnapshot, reset };
}
