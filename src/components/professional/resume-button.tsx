"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";

const ResumeViewer = dynamic(() => import("./resume-viewer"), { ssr: false });

export function ResumeButton({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  return <>
    <button ref={button} type="button" className={`folio-raised-control folio-resume-trigger ${className}`} aria-haspopup="dialog" onClick={() => setOpen(true)}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Zm0 0v6h6M8 13h8M8 17h5" /></svg>
      Résumé{!compact && <span aria-hidden="true">↗</span>}
    </button>
    {open && <ResumeViewer onClose={() => { setOpen(false); requestAnimationFrame(() => button.current?.focus({ preventScroll: true })); }} />}
  </>;
}
