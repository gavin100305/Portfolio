import gsap from "gsap";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { drawFallbackRipples, drawKoi, drawMeadow, makeFireflies } from "./artwork-life";
import { scenicArtworks, type ScenicId } from "./artwork-scenes";
import { createArtworkSurface } from "./artwork-water";

const width = 1000;
const height = 562.5;
const koiSources = ["/artwork/kohaku.webp", "/artwork/sanke.webp", "/artwork/ogon.webp"];

function loadImage(src: string) {
  const image = new window.Image();
  image.src = src;
  return image.decode().then(() => image);
}

export function ScenicArtwork({ id, active }: { id: ScenicId; active: boolean }) {
  const scene = scenicArtworks[id];
  const wrapperRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLCanvasElement>(null);
  const lifeRef = useRef<HTMLCanvasElement>(null);
  const pulseRef = useRef<(x: number, y: number) => void>(() => {});
  const syncRef = useRef<() => void>(() => {});
  const paused = useRef(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const surfaceCanvas = surfaceRef.current;
    const lifeCanvas = lifeRef.current;
    const ctx = lifeCanvas?.getContext("2d");
    if (!wrapper || !surfaceCanvas || !lifeCanvas || !ctx) return;

    const root = document.documentElement;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const waves = new Float32Array(12);
    let life: HTMLImageElement[] = [];
    let plate: HTMLImageElement | undefined;
    let surface: ReturnType<typeof createArtworkSurface> = null;
    let underwater: CanvasRenderingContext2D | null = null;
    let drawFireflies: ReturnType<typeof makeFireflies> | undefined;
    let disposed = false, ready = false, visible = false, running = false;
    let elapsed = 0, throttle = 0, waveIndex = 0;
    const pond = id === "pond";

    function draw() {
      context.clearRect(0, 0, width, height);
      if (pond && plate) {
        const brush = surface && underwater ? underwater : context;
        brush.drawImage(plate, 0, 0, width, height);
        drawKoi(brush, life, elapsed);
        if (surface) surface.draw(elapsed, waves);
        else drawFallbackRipples(context, elapsed, waves);
      }
      if (id === "plateau" && plate) {
        context.drawImage(plate, 0, 0, width, height);
        drawMeadow(context, life[0], elapsed, waves);
      }
      drawFireflies?.(context, elapsed);
    }

    function tick(_time: number, delta: number) {
      throttle += Math.min(delta, 48);
      if (throttle < 30) return;
      elapsed += throttle / 1000;
      throttle = 0;
      draw();
    }

    function sync() {
      const shouldRun = ready && visible && !document.hidden && !paused.current
        && !reduced.matches && root.dataset.folioIntro !== "pending"
        && host.closest(".artwork-layer")?.getAttribute("data-artwork-layer") !== "outgoing";
      if (shouldRun === running) return;
      running = shouldRun;
      if (running) gsap.ticker.add(tick);
      else gsap.ticker.remove(tick);
    }

    function resize() {
      const bounds = host.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const ratio = Math.min(devicePixelRatio || 1, 1.65);
      const pixelWidth = Math.round(bounds.width * ratio);
      const pixelHeight = Math.round(bounds.height * ratio);
      if (overlay.width !== pixelWidth || overlay.height !== pixelHeight) {
        overlay.width = waterCanvas.width = pixelWidth;
        overlay.height = waterCanvas.height = pixelHeight;
      }
      context.setTransform(pixelWidth / width, 0, 0, pixelHeight / height, 0, 0);
      if (ready) draw();
    }

    const host = wrapper;
    const waterCanvas = surfaceCanvas;
    const overlay = lifeCanvas;
    const context = ctx;
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    const size = new ResizeObserver(resize);
    const opening = new MutationObserver(sync);
    visibility.observe(host);
    size.observe(host);
    opening.observe(root, { attributes: true, attributeFilter: ["data-folio-intro"] });
    const layer = host.closest(".artwork-layer");
    if (layer) opening.observe(layer, { attributes: true, attributeFilter: ["data-artwork-layer"] });
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    syncRef.current = sync;
    pulseRef.current = (x, y) => {
      if (!running) return;
      if (id === "grove") return;
      const index = pond ? (waveIndex++ % 3) * 4 : 0;
      waves.set([x, y, elapsed, 1], index);
    };

    const assets = pond
      ? Promise.all(["/artwork/pond-water.webp", ...koiSources].map(loadImage))
      : id === "plateau"
        ? Promise.all(["/artwork/meadow-ground.webp", "/artwork/meadow-plants.webp"].map(loadImage))
        : Promise.resolve([]);
    void assets.then(([base, ...subjects]) => {
      if (disposed) return;
      if (base) {
        plate = base;
        life = subjects;
        if (pond) {
          const composition = document.createElement("canvas");
          composition.width = 1024;
          composition.height = 576;
          underwater = composition.getContext("2d");
          if (underwater) {
            underwater.setTransform(1024 / width, 0, 0, 576 / height, 0, 0);
            surface = createArtworkSurface(waterCanvas, composition, base);
            if (surface) waterCanvas.dataset.ready = "true";
          }
        }
      } else {
        drawFireflies = makeFireflies();
      }
      ready = Boolean(plate || drawFireflies);
      if (!ready) return;
      resize();
      setIsLive(true);
      sync();
    }).catch(() => {});

    function loseSurface(event: Event) {
      event.preventDefault();
      surface = null;
      delete waterCanvas.dataset.ready;
      draw();
    }
    waterCanvas.addEventListener("webglcontextlost", loseSurface);

    return () => {
      disposed = true;
      gsap.ticker.remove(tick);
      visibility.disconnect();
      size.disconnect();
      opening.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
      waterCanvas.removeEventListener("webglcontextlost", loseSurface);
      surface?.dispose();
      delete waterCanvas.dataset.ready;
      syncRef.current = () => {};
      pulseRef.current = () => {};
    };
  }, [id]);

  function toggleMotion() {
    paused.current = !paused.current;
    setIsPaused(paused.current);
    syncRef.current();
  }

  return <div ref={wrapperRef} className="artwork-scenic">
    <Image fill sizes="(max-width: 750px) 100vw, 675px" unoptimized src={scene.image} alt={scene.description} />
    <canvas className="artwork-water" ref={surfaceRef} aria-hidden="true" />
    <canvas className="artwork-life" ref={lifeRef} aria-hidden="true" />
    {active && isLive && id !== "grove" && <button
      type="button"
      className="artwork-interact"
      aria-label={id === "pond" ? "Send a ripple through the pond" : "Send a gust through the meadow"}
      onClick={event => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = event.detail ? (event.clientX - bounds.x) / bounds.width : .5;
        const y = event.detail ? (event.clientY - bounds.y) / bounds.height : .57;
        pulseRef.current(x, y);
      }}
    />}
    {active && isLive && <button type="button" className="artwork-playback"
      aria-label={isPaused ? "Resume scene motion" : "Pause scene motion"}
      onClick={toggleMotion}
    >
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        {isPaused ? <path d="M6 4l6 4-6 4z" fill="currentColor" /> : <path d="M6 4v8m4-8v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}
      </svg>
    </button>}
  </div>;
}
