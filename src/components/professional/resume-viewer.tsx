"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist";

export const RESUME_URL = "/documents/gavin-soares-resume.pdf";

function ResumePage({ pdf, number, width, zoom }: { pdf: PDFDocumentProxy; number: number; width: number; zoom: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ratio, setRatio] = useState(595.276 / 841.89);
  const displayWidth = Math.max(180, Math.min(width, 760)) * zoom;

  useEffect(() => {
    let cancelled = false;
    let task: RenderTask | undefined;
    async function render() {
      try {
        const page = await pdf.getPage(number);
        if (cancelled) return;
        const original = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: displayWidth / original.width });
        const density = Math.min(window.devicePixelRatio || 1, 2);
        // Render offscreen so zooming never clears the visible page mid-frame.
        const buffer = document.createElement("canvas");
        buffer.width = Math.ceil(viewport.width * density);
        buffer.height = Math.ceil(viewport.height * density);
        const context = buffer.getContext("2d");
        if (!context) throw new Error("Canvas unavailable");
        task = page.render({ canvas: buffer, canvasContext: context, viewport, transform: [density, 0, 0, density, 0, 0] });
        await task.promise;
        if (cancelled || !canvas.current) return;
        const visible = canvas.current;
        visible.width = buffer.width;
        visible.height = buffer.height;
        visible.getContext("2d")?.drawImage(buffer, 0, 0);
        setRatio(original.width / original.height);
        setReady(true);
      } catch (error) {
        if (!cancelled && !(error instanceof Error && error.name === "RenderingCancelledException")) setFailed(true);
      }
    }
    void render();
    return () => { cancelled = true; task?.cancel(); };
  }, [pdf, number, displayWidth]);

  return <figure className="folio-resume-page" style={{ width: displayWidth, aspectRatio: ratio }}>
    <canvas ref={canvas} role="img" aria-label={`Gavin Soares résumé, page ${number} of ${pdf.numPages}. Open the original PDF to select text and follow its links.`} />
    {!ready && <p className="folio-resume-page-status" role="status">{failed ? "Unable to render this page. Use Open in new tab below." : "Rendering page…"}</p>}
  </figure>;
}

export default function ResumeViewer({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closing = useRef(false);
  const [entered, setEntered] = useState(false);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(0);
  const zoomValue = useRef(1);
  const zoomAnchor = useRef<{ x: number; y: number; pageX: number; pageY: number } | null>(null);

  useLayoutEffect(() => {
    zoomValue.current = zoom;
    const anchor = zoomAnchor.current;
    const element = scroller.current;
    const page = element?.querySelector(".folio-resume-page");
    if (!anchor || !element || !page) return;
    const rect = page.getBoundingClientRect();
    element.scrollLeft += rect.left + anchor.pageX * rect.width - anchor.x;
    element.scrollTop += rect.top + anchor.pageY * rect.height - anchor.y;
    zoomAnchor.current = null;
  }, [zoom]);

  useEffect(() => {
    const element = scroller.current;
    if (!element || !pdf) return;
    let pinch: { distance: number; zoom: number } | null = null;
    let gesture: { scale: number; zoom: number } | null = null;
    function zoomAt(next: number, x: number, y: number) {
      const value = Math.max(.5, Math.min(2.5, next));
      if (value === zoomValue.current) return;
      const page = element!.querySelector(".folio-resume-page");
      if (!page) return;
      const rect = page.getBoundingClientRect();
      zoomAnchor.current = { x, y, pageX: (x - rect.left) / rect.width, pageY: (y - rect.top) / rect.height };
      zoomValue.current = value;
      setZoom(value);
    }
    function wheel(event: WheelEvent) {
      // Chromium and Firefox report trackpad pinches as control-wheel events.
      if (!event.ctrlKey) return;
      event.preventDefault();
      if (!gesture) zoomAt(zoomValue.current * Math.exp(-event.deltaY * .008), event.clientX, event.clientY);
    }
    function touchStart(event: TouchEvent) {
      if (event.touches.length !== 2) return;
      event.preventDefault();
      const [a, b] = Array.from(event.touches);
      pinch = { distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), zoom: zoomValue.current };
    }
    function touchMove(event: TouchEvent) {
      if (!pinch || event.touches.length !== 2) return;
      event.preventDefault();
      const [a, b] = Array.from(event.touches);
      const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      zoomAt(pinch.zoom * distance / Math.max(pinch.distance, 1), (a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
    }
    function touchEnd() { pinch = null; }
    // Safari exposes trackpad pinch as GestureEvent instead of control-wheel.
    type PinchGestureEvent = Event & { scale: number; clientX: number; clientY: number };
    function gestureStart(raw: Event) {
      raw.preventDefault();
      const event = raw as PinchGestureEvent;
      gesture = { scale: event.scale || 1, zoom: zoomValue.current };
    }
    function gestureChange(raw: Event) {
      raw.preventDefault();
      if (!gesture) return;
      const event = raw as PinchGestureEvent;
      const rect = element!.getBoundingClientRect();
      zoomAt(gesture.zoom * event.scale / gesture.scale, event.clientX || rect.left + rect.width / 2, event.clientY || rect.top + rect.height / 2);
    }
    function gestureEnd() { gesture = null; }
    element.addEventListener("wheel", wheel, { passive: false });
    element.addEventListener("touchstart", touchStart, { passive: false });
    element.addEventListener("touchmove", touchMove, { passive: false });
    element.addEventListener("touchend", touchEnd);
    element.addEventListener("touchcancel", touchEnd);
    element.addEventListener("gesturestart", gestureStart, { passive: false });
    element.addEventListener("gesturechange", gestureChange, { passive: false });
    element.addEventListener("gestureend", gestureEnd);
    return () => {
      element.removeEventListener("wheel", wheel);
      element.removeEventListener("touchstart", touchStart);
      element.removeEventListener("touchmove", touchMove);
      element.removeEventListener("touchend", touchEnd);
      element.removeEventListener("touchcancel", touchEnd);
      element.removeEventListener("gesturestart", gestureStart);
      element.removeEventListener("gesturechange", gestureChange);
      element.removeEventListener("gestureend", gestureEnd);
    };
  }, [pdf]);

  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const overflow = document.body.style.overflow;
    const padding = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbar) document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + scrollbar}px`;
    document.body.style.overflow = "hidden";
    element.showModal();
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => {
      cancelAnimationFrame(frame);
      if (closeTimer.current) clearTimeout(closeTimer.current);
      element.close();
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = padding;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let loading: PDFDocumentLoadingTask | undefined;
    async function load() {
      try {
        const library = await import("pdfjs-dist");
        if (cancelled) return;
        library.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
        loading = library.getDocument({ url: RESUME_URL, standardFontDataUrl: "/pdfjs/standard_fonts/", wasmUrl: "/pdfjs/wasm/" });
        const document = await loading.promise;
        if (!cancelled) setPdf(document);
      } catch { if (!cancelled) setError(true); }
    }
    void load();
    return () => { cancelled = true; void loading?.destroy(); };
  }, []);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setWidth(Math.max(180, element.clientWidth - 36)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function dismiss() {
    if (closing.current) return;
    closing.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { onClose(); return; }
    setEntered(false);
    closeTimer.current = setTimeout(onClose, 220);
  }
  function adjustZoom(step: number) { setZoom(previous => Math.max(.5, Math.min(2.5, previous + step))); }

  return <dialog ref={dialog} className="folio-resume-dialog" data-entered={entered} aria-labelledby="resume-title" onCancel={event => { event.preventDefault(); dismiss(); }} onClick={event => {
    if (event.target !== event.currentTarget) return;
    const box = event.currentTarget.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dismiss();
  }} onKeyDown={event => {
    if (event.key === "+" || event.key === "=") { event.preventDefault(); adjustZoom(.25); }
    if (event.key === "-") { event.preventDefault(); adjustZoom(-.25); }
    if (event.key === "0") { event.preventDefault(); setZoom(1); }
  }}>
    <div className="folio-resume-shell">
      <header className="folio-resume-header">
        <div><p className="font-mono text-[10px] text-folio-accent">Gavin Soares</p><h2 id="resume-title" className="mt-1 text-lg font-medium tracking-tight">Résumé</h2></div>
        <button type="button" autoFocus className="folio-raised-control" onClick={dismiss} aria-label="Close résumé viewer">Close <span aria-hidden="true">×</span></button>
      </header>
      <div className="folio-resume-toolbar" aria-label="Document controls">
        <div className="folio-resume-zoom" role="group" aria-label="Zoom controls">
          <button type="button" className="folio-raised-control" onClick={() => adjustZoom(-.25)} disabled={!pdf || zoom <= .5} aria-label="Zoom out">−</button>
          <output aria-live="polite" aria-label="Zoom level">{Math.round(zoom * 100)}%</output>
          <button type="button" className="folio-raised-control" onClick={() => adjustZoom(.25)} disabled={!pdf || zoom >= 2.5} aria-label="Zoom in">+</button>
          <button type="button" className="folio-raised-control" onClick={() => setZoom(1)} disabled={!pdf} aria-label="Fit résumé to width">Fit width</button>
        </div>
        <span className="folio-resume-page-count">{pdf ? `${pdf.numPages} page${pdf.numPages === 1 ? "" : "s"}` : "PDF"}</span>
      </div>
      <div ref={scroller} className="folio-resume-scroller" tabIndex={0} aria-label="Résumé pages. Scroll to read; pinch or use the zoom controls to enlarge.">
        {error ? <p className="folio-resume-loading" role="alert">The preview couldn’t load. You can still download or open the original PDF below.</p> : !pdf || !width ? <p className="folio-resume-loading" role="status">Loading résumé…</p> : <div className="folio-resume-pages">{Array.from({ length: pdf.numPages }, (_, index) => <ResumePage key={index} pdf={pdf} number={index + 1} width={width} zoom={zoom} />)}</div>}
      </div>
      <div className="folio-resume-bottom">
        <a className="folio-raised-control folio-raised-control-primary" href={RESUME_URL} download="Gavin-Soares-Resume.pdf">Download PDF <span aria-hidden="true">↓</span></a>
        <a className="folio-raised-control" href={RESUME_URL} target="_blank" rel="noopener noreferrer">Open in new tab <span aria-hidden="true">↗</span></a>
      </div>
    </div>
  </dialog>;
}
