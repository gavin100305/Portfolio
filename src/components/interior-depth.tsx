"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { createInteriorDepthScene } from "@/components/interior-depth-scene";

export function InteriorDepth({ worldRef, frameRef, enabled, theme, onReady }: {
  worldRef: RefObject<HTMLDivElement | null>;
  frameRef: RefObject<((time: number) => void) | null>;
  enabled: boolean;
  theme: string;
  onReady: (ready: boolean) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Awaited<ReturnType<typeof createInteriorDepthScene>> | null>(null);
  const enabledRef = useRef(enabled);
  useEffect(() => {
    let cancelled = false;
    void import("@/components/interior-depth-scene").then(async ({ createInteriorDepthScene }) => {
      if (cancelled || !hostRef.current || !worldRef.current) return;
      onReady(false);
      const scene = await createInteriorDepthScene(hostRef.current, worldRef.current, () => onReady(false));
      if (cancelled) { scene.dispose(); return; }
      sceneRef.current = scene;
      scene.setEnabled(enabledRef.current);
      frameRef.current = scene.render;
      if (scene.render(performance.now())) onReady(true);
    }).catch(() => { if (!cancelled) onReady(false); });
    return () => { cancelled = true; frameRef.current = null; sceneRef.current?.dispose(); sceneRef.current = null; };
  }, [worldRef, frameRef, onReady, theme]);
  useEffect(() => { enabledRef.current = enabled; sceneRef.current?.setEnabled(enabled); }, [enabled]);
  return <div className="interior-depth-canvas" ref={hostRef} aria-hidden="true" />;
}
