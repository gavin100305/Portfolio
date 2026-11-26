import { useLayoutEffect, useRef } from "react";
import { scenicArtworks, type ScenicAssets, type ScenicId } from "./artwork-scenes";
import { createScenicPainter, scenicHeight, scenicWidth } from "./scenic-motion";

export function ScenicArtwork({ id, assets }: { id: ScenicId; assets: ScenicAssets }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scene = scenicArtworks[id];

  useLayoutEffect(() => {
    const element = canvasRef.current;
    const context = element?.getContext("2d");
    if (!element || !context) return;
    const canvas = element;
    const ctx = context;
    const painter = createScenicPainter(id, assets.poster, assets.koi);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const root = document.documentElement;
    let inView = false;
    let frame = 0;
    let previous = 0;
    let elapsed = 0;

    function paint() {
      ctx.clearRect(0, 0, scenicWidth, scenicHeight);
      painter(ctx, reducedMotion.matches ? 0 : elapsed);
    }

    function resize() {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      ctx.setTransform(canvas.width / scenicWidth, 0, 0, canvas.height / scenicHeight, 0, 0);
      paint();
    }

    function tick(now: number) {
      frame = requestAnimationFrame(tick);
      if (previous && now - previous < 30) return;
      if (previous) elapsed += Math.min(now - previous, 60) / 1000;
      previous = now;
      paint();
    }

    function syncPlayback() {
      const shouldPlay = inView && !document.hidden && !reducedMotion.matches && root.dataset.folioIntro !== "pending";
      if (shouldPlay && !frame) frame = requestAnimationFrame(tick);
      if (!shouldPlay && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
        previous = 0;
      }
    }

    function onMotionChange() {
      paint();
      syncPlayback();
    }

    const viewport = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncPlayback();
    });
    viewport.observe(canvas);
    const size = new ResizeObserver(resize);
    size.observe(canvas);
    const opening = new MutationObserver(syncPlayback);
    opening.observe(root, { attributes: true, attributeFilter: ["data-folio-intro"] });
    document.addEventListener("visibilitychange", syncPlayback);
    reducedMotion.addEventListener("change", onMotionChange);
    resize();

    return () => {
      cancelAnimationFrame(frame);
      viewport.disconnect();
      size.disconnect();
      opening.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      reducedMotion.removeEventListener("change", onMotionChange);
    };
  }, [id, assets]);

  return <div
    className="artwork-scenic"
    role="img"
    aria-label={scene.description}
    style={{ backgroundImage: `url(${scene.poster})` }}
  >
    <canvas ref={canvasRef} aria-hidden="true" />
  </div>;
}
