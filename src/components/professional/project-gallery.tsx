"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { galleryProjects, type GalleryProject } from "@/data/professional-projects";

type PreviewOrigin = { x: number; y: number; width: number; height: number; rotation: number };

function cardOrigin(element: HTMLButtonElement): PreviewOrigin {
  const bounds = element.getBoundingClientRect();
  const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
    width: element.offsetWidth,
    height: element.offsetHeight,
    rotation: Math.atan2(matrix.b, matrix.a) * 180 / Math.PI,
  };
}

type Pose = { x: number; y: number; rotation: number; z: number };
type Drag = { index: number; pointer: number; startX: number; startY: number; origin: Pose; moved: boolean };

function layout(mobile: boolean): Pose[] {
  const desktop = [[.04, .02, -5], [.96, .03, 4], [.5, .43, -2], [.05, .98, -4], [.95, .98, 5]];
  const phone = [[.12, .02, -3], [.88, .255, 3], [.1, .49, -2], [.88, .725, 3], [.12, .96, -3]];
  return (mobile ? phone : desktop).map(([x, y, rotation], index) => ({ x, y, rotation, z: index + 1 }));
}

// Show the opposite website theme for contrast against the portfolio frame.
function ProjectScreenshot({ project, preview = false }: { project: GalleryProject; preview?: boolean }) {
  const alt = preview ? `${project.name} live homepage` : "";
  const sizes = preview ? "(max-width: 700px) 90vw, 700px" : "(max-width: 639px) 80vw, 280px";
  const lightSrc = typeof project.lightImage === "string" && project.lightImage.trim()
    ? project.lightImage
    : project.image;
  return <>
    <Image className="folio-shot-dark" src={project.image} width={1200} height={750} alt={alt} sizes={sizes} draggable={false} />
    <Image className="folio-shot-light" src={lightSrc} width={1200} height={750} alt={alt} sizes={sizes} draggable={false} />
  </>;
}

function ProjectPrintFace({ project, index }: { project: GalleryProject; index: number }) {
  return <>
    <span className="folio-project-handle" data-drag-handle><span className="folio-print-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><span>{project.name}</span><svg viewBox="0 0 12 16" width="10" height="14" fill="currentColor" aria-hidden="true"><circle cx="3" cy="4" r="1"/><circle cx="8" cy="4" r="1"/><circle cx="3" cy="8" r="1"/><circle cx="8" cy="8" r="1"/><circle cx="3" cy="12" r="1"/><circle cx="8" cy="12" r="1"/></svg></span>
    <span className="folio-print-image"><ProjectScreenshot project={project} /></span>
  </>;
}

function ProjectPreview({ project, origin, source, onClose }: { project: GalleryProject; origin: PreviewOrigin; source: HTMLButtonElement | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  const closeTimer = useRef<number | null>(null);
  const enterFrame = useRef<number | null>(null);
  const [isEntered, setIsEntered] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  function setOrigin(element: HTMLDialogElement, next: PreviewOrigin) {
    element.style.setProperty("--preview-origin-width", `${next.width}px`);
    element.style.setProperty("--preview-origin-height", `${next.height}px`);
    element.style.setProperty("--preview-origin-transform", `translate3d(${next.x - window.innerWidth / 2}px, ${next.y - window.innerHeight / 2}px, 0) rotate(${next.rotation}deg)`);
  }

  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element || !content.current) return;
    const overflow = document.body.style.overflow;
    const padding = document.body.style.paddingRight;
    const scrollX = window.scrollX, scrollY = window.scrollY;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbar) document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + scrollbar}px`;
    document.body.style.overflow = "hidden";
    element.dataset.measuring = "true";
    element.style.setProperty("--preview-width", `${Math.min(680, window.innerWidth - 24)}px`);
    element.showModal();
    window.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" });
    element.style.setProperty("--preview-height", `${Math.min(content.current.scrollHeight, window.innerHeight - 32)}px`);
    setOrigin(element, origin);
    // Establish the exact unrotated source dimensions before starting the morph.
    element.getBoundingClientRect();
    element.dataset.measuring = "false";
    enterFrame.current = requestAnimationFrame(() => setIsEntered(true));
    return () => {
      if (enterFrame.current !== null) cancelAnimationFrame(enterFrame.current);
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
      element.close();
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = padding;
    };
  }, [origin]);

  function finishClose() {
    if (!closing.current) return;
    closing.current = false;
    onClose();
  }

  function dismiss() {
    if (closing.current) return;
    closing.current = true;
    // Re-read the real source, including responsive layout changes while open.
    if (dialog.current) setOrigin(dialog.current, source ? cardOrigin(source) : origin);
    if (enterFrame.current !== null) cancelAnimationFrame(enterFrame.current);
    setIsClosing(true);
    setIsEntered(false);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { finishClose(); return; }
    closeTimer.current = window.setTimeout(finishClose, 700);
  }

  return <dialog ref={dialog} className="folio-project-dialog" data-entered={isEntered} data-closing={isClosing} aria-labelledby="project-preview-title" onTransitionEnd={event => { if (event.target === event.currentTarget && event.propertyName === "width" && isClosing) finishClose(); }} onCancel={event => { event.preventDefault(); dismiss(); }} onClick={event => { if (event.target === event.currentTarget) dismiss(); }}>
    <div className="folio-project-print folio-preview-cover" aria-hidden="true"><ProjectPrintFace project={project} index={galleryProjects.indexOf(project)} /></div>
    <div ref={content} className="folio-preview-content">
      <div className="folio-preview-toolbar flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <span className="text-[11px] text-folio-muted">{project.category}</span>
        <button type="button" className="folio-preview-close" onClick={dismiss} aria-label="Close project preview">Close <span aria-hidden="true">×</span></button>
      </div>
      <div>
        <div className="folio-preview-image"><ProjectScreenshot project={project} preview /></div>
        <div className="folio-preview-details p-5 sm:p-7">
        <h3 id="project-preview-title" className="text-2xl font-semibold tracking-tight">{project.name}</h3>
        <p className="mt-3 text-sm leading-7 text-folio-muted">{project.summary}</p>
        <ul className="folio-preview-notes mt-5 space-y-3 text-sm leading-6 text-folio-muted">{project.highlights.map(item => <li key={item}>{item}</li>)}</ul>
        <ul aria-label="Technologies" className="my-6 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[10px] text-folio-muted">{project.technologies.map(tool => <li key={tool}>{tool}</li>)}</ul>
        <div className="flex flex-wrap gap-3 border-t border-folio-border pt-5">
          <a className="folio-raised-control folio-raised-control-primary folio-preview-link" href={project.deployment} target="_blank" rel="noreferrer">Open live demo <span aria-hidden="true">↗</span></a>
          {project.repository && <a className="folio-raised-control folio-preview-link" href={project.repository} target="_blank" rel="noreferrer">Source code <span aria-hidden="true">↗</span></a>}
        </div>
        </div>
      </div>
    </div>
  </dialog>;
}

export function ProjectGallery() {
  const board = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const drag = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const restoringFocus = useRef(false);
  const layer = useRef(10);
  const mobile = useRef(false);
  const [poses, setPoses] = useState(() => layout(false));
  const [dragging, setDragging] = useState<number | null>(null);
  const [selected, setSelected] = useState<{ project: GalleryProject; origin: PreviewOrigin; source: HTMLButtonElement } | null>(null);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      const next = window.matchMedia("(max-width: 639px)").matches;
      if (next !== mobile.current) { mobile.current = next; setPoses(layout(next)); }
    });
    if (board.current) observer.observe(board.current);
    return () => observer.disconnect();
  }, []);

  function bringForward(index: number) {
    const z = ++layer.current;
    setPoses(previous => previous.map((pose, i) => i === index ? { ...pose, z } : pose));
  }

  function startDrag(event: PointerEvent<HTMLButtonElement>, index: number) {
    if (event.button !== 0) return;
    suppressClick.current = false;
    if (event.pointerType !== "mouse" && !(event.target as Element).closest("[data-drag-handle]")) return;
    drag.current = { index, pointer: event.pointerId, startX: event.clientX, startY: event.clientY, origin: poses[index], moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    const active = drag.current;
    const container = board.current;
    if (!active || active.pointer !== event.pointerId || !container) return;
    const dx = event.clientX - active.startX, dy = event.clientY - active.startY;
    if (!active.moved && Math.hypot(dx, dy) < 6) return;
    if (!active.moved) bringForward(active.index);
    active.moved = true;
    setDragging(active.index);
    const width = Math.max(1, container.clientWidth - event.currentTarget.offsetWidth);
    const height = Math.max(1, container.clientHeight - event.currentTarget.offsetHeight);
    const clamp = (value: number, size: number) => Math.max(12 / size, Math.min(1 - 12 / size, value));
    setPoses(previous => previous.map((pose, i) => i === active.index ? { ...pose,
      x: clamp(active.origin.x + dx / width, width), y: clamp(active.origin.y + dy / height, height) } : pose));
  }

  function endDrag(event: PointerEvent<HTMLButtonElement>, cancelled = false) {
    if (!drag.current || drag.current.pointer !== event.pointerId) return;
    suppressClick.current = cancelled || drag.current.moved;
    if (suppressClick.current) window.setTimeout(() => { suppressClick.current = false; }, 0);
    drag.current = null;
    setDragging(null);
  }

  return <section className="folio-gallery mt-16 sm:mt-20" aria-labelledby="projects-title">
    <div className="mb-3 flex items-center justify-between gap-4">
      <h2 id="projects-title" className="text-xl font-medium tracking-tight">Selected projects</h2>
      <button type="button" className="folio-raised-control" onClick={() => { drag.current = null; setDragging(null); setPoses(layout(mobile.current)); }}>Reset layout <span aria-hidden="true">↺</span></button>
    </div>
    <p className="text-xs leading-6 text-folio-muted">Drag to rearrange. Click a project to explore.</p>
    <p id="gallery-keyboard-help" className="sr-only">On a touch screen, drag using a card’s title strip. With a keyboard, use Tab to choose a project, arrow keys to move it, and Enter to open its preview.</p>
    <div ref={board} className="folio-project-board" aria-label="Draggable project gallery">
      {galleryProjects.map((project, index) => {
        const pose = poses[index];
        return <button key={project.id} type="button" className="folio-project-print" aria-label={`Explore ${project.name}`} aria-describedby="gallery-keyboard-help" data-dragging={dragging === index} data-preview={selected?.project.id === project.id} style={{ left: `${pose.x * 100}%`, top: `${pose.y * 100}%`, zIndex: pose.z,
          transform: `translate(${-pose.x * 100}%, ${-pose.y * 100}%) rotate(${dragging === index ? 0 : pose.rotation}deg) scale(${dragging === index ? 1.025 : 1})` }}
          onPointerDown={event => startDrag(event, index)} onPointerMove={moveDrag} onPointerUp={event => endDrag(event)} onPointerCancel={event => endDrag(event, true)}
          onFocus={event => { if (!restoringFocus.current && event.currentTarget.matches(":focus-visible")) bringForward(index); }} onClick={event => { if (suppressClick.current) { suppressClick.current = false; return; } opener.current = event.currentTarget; setSelected({ project, origin: cardOrigin(event.currentTarget), source: event.currentTarget }); }}
          onKeyDown={event => {
            if (!event.key.startsWith("Arrow")) return;
            event.preventDefault();
            const step = event.shiftKey ? .1 : .025;
            setPoses(previous => previous.map((item, i) => i === index ? { ...item,
              x: Math.max(.04, Math.min(.96, item.x + (event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0))),
              y: Math.max(.04, Math.min(.96, item.y + (event.key === "ArrowDown" ? step : event.key === "ArrowUp" ? -step : 0))) } : item));
          }}>
          <ProjectPrintFace project={project} index={index} />
        </button>;
      })}
    </div>
    {selected && <ProjectPreview project={selected.project} origin={selected.origin} source={selected.source} onClose={() => { restoringFocus.current = true; setSelected(null); requestAnimationFrame(() => { opener.current?.focus({ preventScroll: true }); restoringFocus.current = false; }); }} />}
  </section>;
}
