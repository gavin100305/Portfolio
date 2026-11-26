import { useLayoutEffect, useRef } from "react";
import { scenicArtworks, type ScenicId } from "./artwork-scenes";
import { createScenicPainter, scenicHeight, scenicWidth } from "./scenic-motion";

export function ScenicArtwork({ id }: { id: ScenicId }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scene = scenicArtworks[id];
  const interaction = id === "pond" ? "Send a ripple" : id === "plateau" ? "Send a gust through the flowers" : undefined;

  useLayoutEffect(() => {
    const element = canvasRef.current;
    const context = element?.getContext("2d");
    if (!element || !context) return;
    const canvas = element;
    const ctx = context;
    const painter = createScenicPainter(id);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const root = document.documentElement;
    let inView = false;
    let frame = 0;
    let previous = 0;
    let elapsed = 0;

    function paint() {
      ctx.clearRect(0, 0, scenicWidth, scenicHeight);
      painter.draw(ctx, reducedMotion.matches ? 0 : elapsed);
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
    function interact(x: number, y: number) {
      if (!painter.touch) return;
      painter.touch(x, y, reducedMotion.matches ? -.65 : elapsed);
      if (reducedMotion.matches) paint();
    }

    function touch(event: PointerEvent) {
      if (event.button !== 0) return;
      const bounds = canvas.getBoundingClientRect();
      interact(
        (event.clientX - bounds.left) * scenicWidth / bounds.width,
        (event.clientY - bounds.top) * scenicHeight / bounds.height,
      );
    }

    function keydown(event: KeyboardEvent) {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      if (!event.repeat) interact(scenicWidth / 2, scenicHeight / 2);
    }

    canvas.addEventListener("pointerdown", touch);
    if (painter.touch) canvas.addEventListener("keydown", keydown);
    resize();

    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener("pointerdown", touch);
      canvas.removeEventListener("keydown", keydown);
      viewport.disconnect();
      size.disconnect();
      opening.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      reducedMotion.removeEventListener("change", onMotionChange);
    };
  }, [id]);

  return <div className="artwork-scenic">
    <canvas
      ref={canvasRef}
      role={interaction ? "button" : "img"}
      aria-label={interaction ? `${scene.description} ${interaction}.` : scene.description}
      tabIndex={interaction ? 0 : undefined}
    />
  </div>;
}
