"use client";

import { useEffect, useId, useRef } from "react";
import "@/app/bernabeu.css";

function MadridScarf() {
  const id=useId();
  return <svg className="madrid-scarf" viewBox="0 0 760 300" role="img" aria-label="A white, royal-blue and gold scarf reading Real Madrid C. F. and Hala Madrid">
    <defs><linearGradient id={`${id}-fabric`} x2="0" y2="1"><stop stopColor="#fffef6"/><stop offset=".45" stopColor="#e8e6df"/><stop offset=".8" stopColor="#fffdf2"/><stop offset="1" stopColor="#bfc4cf"/></linearGradient><pattern id={`${id}-knit`} width="6" height="5" patternUnits="userSpaceOnUse"><path d="m0 0 3 3L6 0M0 5l3-2 3 2" fill="none" stroke="#6b7190" strokeWidth=".4" opacity=".25"/></pattern><filter id={`${id}-shadow`} x="-20%" y="-40%" width="140%" height="200%"><feDropShadow dx="0" dy="15" stdDeviation="10" floodColor="#050c1c" floodOpacity=".5"/></filter></defs>
    <g transform="rotate(-5 380 150)" filter={`url(#${id}-shadow)`}>
      <path d="M62 74Q380 110 698 74v133Q380 243 62 207Z" fill={`url(#${id}-fabric)`} stroke="#9299af" strokeWidth="2"/>
      <path d="M62 74Q380 110 698 74v17Q380 127 62 91ZM62 191Q380 227 698 191v16Q380 243 62 207Z" fill="#303777"/>
      <path d="M62 96Q380 132 698 96M62 185Q380 221 698 185" stroke="#b69a59" strokeWidth="2" fill="none"/>
      <path d="M62 74Q380 110 698 74v133Q380 243 62 207Z" fill={`url(#${id}-knit)`}/>
      <path d="M62 74h47v138l-47-5ZM651 79l47-5v133l-47 5Z" fill="#252c67"/>
      <path d="M75 78v124m20-122v124m570-124v124m20-126v124" stroke="#d0b374" strokeWidth="2"/>
      <text x="380" y="162" textAnchor="middle" fill="#252c67" fontSize="42" letterSpacing="2" fontFamily="var(--font-pixel),monospace">REAL MADRID C. F.</text>
      <text x="380" y="190" textAnchor="middle" fill="#806c40" fontSize="12" letterSpacing="7" fontFamily="var(--font-pixel),monospace">HALA MADRID</text>
      {[0,1,2,3,4,5,6,7,8,9,10,11].map(i=><g key={i} stroke={i%3===0?"#c7ac71":i%2?"#e5e4db":"#303777"} strokeWidth="3"><path d={`M62 ${80+i*10}l-20 ${i%2?6:2}`} /><path d={`M698 ${80+i*10}l20 ${i%2?-2:-6}`} /></g>)}
      <path d="M112 108v84M647 107v85" stroke="#fff" strokeWidth="1" strokeDasharray="2 3" opacity=".65"/>
    </g>
  </svg>;
}

export function MadridistaJournal({ onClose }: { onClose: () => void }) {
  const dialog=useRef<HTMLDialogElement>(null);
  const close=useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    const el=dialog.current;
    const opener=document.activeElement;
    el?.showModal(); close.current?.focus({preventScroll:true});
    return ()=>{ el?.close(); if(opener instanceof HTMLElement && opener.isConnected) opener.focus({preventScroll:true}); };
  },[]);
  return <dialog ref={dialog} className="madrid-journal" data-madrid-dialog="true" data-station-overlay="true" aria-labelledby="madrid-journal-title" onCancel={event=>{event.preventDefault();onClose();}}>
    <header className="madrid-journal-toolbar"><span>MATCHDAY PROGRAMME / GS · 07</span><button ref={close} type="button" onClick={onClose}>Back to the pitch <span aria-hidden="true">↵</span></button></header>
    <div className="madrid-journal-hero"><span className="madrid-journal-overline">OFF DUTY. ALWAYS A MADRIDISTA.</span><MadridScarf/><div className="madrid-journal-title"><span>FOOTBALL / REAL MADRID</span><h2 id="madrid-journal-title">A little Madrid.<br/>A little further from Earth.</h2></div></div>
    <div className="madrid-journal-body"><section className="madrid-journal-story"><span className="madrid-journal-index">01 / THE FOOTBALL SIDE OF ME</span><h3>My all-time favourite club.</h3><p>Real Madrid is my all-time favourite football club. This corner of my station is a tribute to that part of me: the white shirt, the Bernabéu, and a ball waiting for the next penalty.</p><p>Outside the projects and code, there’s football. So it only felt right to give it a proper home here.</p><div className="madrid-journal-facts"><div><span>THE CLUB</span><strong>Real Madrid C. F.</strong></div><div><span>THE GROUND</span><strong>Bernabéu</strong></div><div><span>THE SETTING</span><strong>Somewhere in orbit.</strong></div></div></section>
    <section className="madrid-journal-ground"><span className="madrid-journal-index">02 / THE BERNABÉU, REIMAGINED</span><h3>From Madrid to this station.</h3><p>The layered silver shell, enclosed roof, blue seating bowl, and wraparound scoreboard take their cues from the renovated Bernabéu. Here, they’ve become a small, playable stadium connected to the station.</p><div className="madrid-journal-ticket"><span>YOUR MATCHDAY TICKET</span><strong>One astronaut.<br/>One goalkeeper.<br/>Your next penalty.</strong><span className="madrid-ticket-code" aria-hidden="true"/><button type="button" onClick={onClose}>Step onto the pitch <span aria-hidden="true">→</span></button></div></section>
    <footer className="madrid-journal-footer"><span>A personal fan tribute by Gavin Soares.</span><a href="https://bernabeu.realmadrid.com/en-US" target="_blank" rel="noreferrer">Explore the real Bernabéu ↗</a></footer></div>
  </dialog>;
}
