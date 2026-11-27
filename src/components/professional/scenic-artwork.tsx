import gsap from "gsap";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { makeCreekCurrent, drawMeadow, makeFireflies } from "./artwork-life";
import { createPondSwim } from "./artwork-pond";
import { scenicArtworks, type ScenicId } from "./artwork-scenes";
import { createArtworkSurface } from "./artwork-water";

const width = 1000;
const height = 562.5;
const pondSources = [
  "/artwork/pond-water.webp", "/artwork/pond-reflections.webp",
  "/artwork/kohaku.webp", "/artwork/sanke.webp", "/artwork/ogon.webp",
];

const grounds = { plateau: "/artwork/poppy-field-ground.webp", grove: scenicArtworks.grove.image };

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
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const surfaceCanvas = surfaceRef.current;
    const lifeCanvas = lifeRef.current;
    const ctx = lifeCanvas?.getContext("2d");
    if (!wrapper || !surfaceCanvas || !lifeCanvas || !ctx) return;

    const root = document.documentElement;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const gust = new Float32Array(4);
    let life: HTMLImageElement[] = [];
    let plate: HTMLImageElement | undefined;
    let reflectionImage: HTMLImageElement | undefined;
    let surface: ReturnType<typeof createArtworkSurface> = null;
    let underwater: CanvasRenderingContext2D | null = null;
    let drawCreek: ReturnType<typeof makeCreekCurrent> | undefined;
    let drawFireflies: ReturnType<typeof makeFireflies> | undefined;
    let disposed = false, ready = false, visible = false, running = false;
    let elapsed = 0, throttle = 0;
    const pond = id === "pond";
    const swim = pond ? createPondSwim() : null;

    function draw() {
      context.clearRect(0, 0, width, height);
      if (swim && plate) {
        const brush = surface && underwater ? underwater : context;
        if (surface) brush.clearRect(0, 0, width, height);
        else brush.drawImage(plate, 0, 0, width, height);
        swim.draw(brush, life, elapsed);

        if (surface) surface.draw(swim, elapsed);
        else if (underwater) {
          if (reflectionImage) {
            // Drift the photographed highlights over both the bed and the koi.
            brush.save();
            brush.globalCompositeOperation = "soft-light";
            brush.globalAlpha = .34;
            brush.drawImage(reflectionImage, -20 + 13 * Math.sin(elapsed * .44),
              -14 + 9 * Math.cos(elapsed * .39), width + 40, height + 28);
            brush.restore();
          }
          // Shade the same simulated surface on devices without WebGL.
          const image = swim.normals;
          const pixels = image.data;
          for (let i = 0; i < pixels.length; i += 4) {
            const slope = (128 - pixels[i]) * .54 + (128 - pixels[i + 1]) * .84;
            pixels[i] = 109;
            pixels[i + 1] = 177;
            pixels[i + 2] = 202;
            pixels[i + 3] = 12 + slope * .45;
          }
          underwater.putImageData(image, 0, 0);
          brush.drawImage(underwater.canvas, 0, 0, image.width, image.height, 0, 0, width, height);
        }
      }
      if (!pond && plate) {
        if (id === "plateau") drawMeadow(context, life[0], life[1], elapsed, gust);
        else {
          drawCreek?.(context, elapsed);
          drawFireflies?.(context, elapsed);
        }
      }
    }

    function tick(_time: number, delta: number) {
      throttle += Math.min(delta, 48);
      if (!pond && throttle < 30) return;
      elapsed += throttle / 1000;
      throttle = 0;
      draw();
    }

    function sync() {
      const shouldRun = ready && visible && !document.hidden
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
    pulseRef.current = (x, y) => {
      if (running && id === "plateau") gust.set([x, y, elapsed, 1]);
    };

    const assets = pond
      ? Promise.all(pondSources.map(loadImage))
      : Promise.all((id === "plateau"
        ? [grounds.plateau, "/artwork/poppy-hills-plants.webp", "/artwork/poppy-field-stems.webp"]
        : [grounds.grove, "/artwork/creek-glints.webp"]).map(loadImage));
    void assets.then(([base, ...subjects]) => {
      if (disposed) return;
      if (base) {
        plate = base;
        if (pond) {
          const [reflections, ...fish] = subjects;
          reflectionImage = reflections;
          life = fish;
          const composition = document.createElement("canvas");
          composition.width = 1024;
          composition.height = 576;
          underwater = composition.getContext("2d");
          if (underwater) {
            underwater.setTransform(1024 / width, 0, 0, 576 / height, 0, 0);
            surface = createArtworkSurface(waterCanvas, composition, base, reflections);
            if (surface) waterCanvas.dataset.ready = "true";
          }
        } else {
          life = subjects;
          if (id === "grove") {
            drawCreek = makeCreekCurrent(base, subjects[0]);
            drawFireflies = makeFireflies();
          }
        }
      }
      ready = Boolean(plate);
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
      pulseRef.current = () => {};
    };
  }, [id]);

  return <div ref={wrapperRef} className="artwork-scenic">
    <Image fill sizes="(max-width: 750px) 100vw, 675px" unoptimized src={isLive && id !== "pond" ? grounds[id] : scene.image} alt={scene.description} />
    <canvas className="artwork-water" ref={surfaceRef} aria-hidden="true" />
    <canvas className="artwork-life" ref={lifeRef} aria-hidden="true" />
    {active && isLive && id === "plateau" && <button
      type="button"
      className="artwork-interact"
      aria-label="Send a gust through the meadow"
      onClick={event => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = event.detail ? (event.clientX - bounds.x) / bounds.width : .5;
        const y = event.detail ? (event.clientY - bounds.y) / bounds.height : .57;
        pulseRef.current(x, y);
      }}
    />}
  </div>;
}
