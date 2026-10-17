import Link from "next/link";
import { AsciiDesk } from "@/components/professional/ascii-desk";
import { ThemeToggle } from "@/components/professional/theme-toggle";
import { profile } from "@/data/portfolio-content";
import "./professional.css";

const themeScript = `(function(){try{var t=localStorage.getItem('gavin:professional-theme');document.documentElement.dataset.professionalTheme=t==='light'||t==='dark'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch{document.documentElement.dataset.professionalTheme='light'}})()`;

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4" aria-hidden="true">{diagonal ? <path d="M6 18 18 6M6 6h12v12" /> : <path d="M4 12h15m-6-6 6 6-6 6" />}</svg>;
}

function DotMonogram() {
  const letters = [
    ["01110", "10001", "10000", "10111", "10001", "10001", "01110"],
    ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  ];
  return <svg viewBox="0 0 40 26" className="h-5 w-8" aria-hidden="true">
    {letters.flatMap((letter, index) => letter.flatMap((row, y) => [...row].map((dot, x) => dot === "1" ?
      <circle key={`${index}-${x}-${y}`} cx={3 + (index * 6 + x) * 3.4} cy={3 + y * 3.4} r="1.1" fill={index === 0 && y === 3 && x === 4 ? "var(--folio-accent)" : "currentColor"} /> : null)))}
  </svg>;
}

export default function Home() {
  return <div className="professional-shell min-h-svh bg-folio-background font-folio-sans text-folio-foreground antialiased">
    <script dangerouslySetInnerHTML={{ __html: themeScript }} />
    <a href="#main" className="folio-skip">Skip to content</a>
    <div className="relative mx-auto max-w-[800px] px-6 sm:px-8">
      <header className="flex h-20 items-center justify-between sm:h-24">
        <Link href="/" className="folio-home-mark" aria-label="Home" title="Home">
          <DotMonogram />
        </Link>
        <ThemeToggle />
      </header>
      <main id="main" className="pb-14 pt-2 sm:pb-20">
        <AsciiDesk />
        <section aria-label="Introduction" className="folio-introduction mx-auto mt-7 w-full max-w-[760px] text-center sm:mt-9">
          <p className="mx-auto max-w-[700px] text-base leading-[1.85] text-folio-muted sm:text-[17px]">I’m a Computer Engineering student in Mumbai. I build full-stack applications, work with AI, and enjoy getting involved in both how a product works and how it looks.</p>
        </section>
        <aside className="folio-space-note mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-folio-border pt-6 sm:mt-16">
          <p className="max-w-[360px] text-xs leading-6 text-folio-muted">There’s another side to this portfolio.<br /><span className="text-folio-foreground">A space station you can actually explore.</span></p>
          <Link href="/space" className="folio-text-link gap-3 font-mono text-[11px] text-folio-accent">Enter the station <Arrow diagonal /></Link>
        </aside>
      </main>
      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-folio-border py-6 font-mono text-[10px] text-folio-muted">
        <a href={`mailto:${profile.email}`} className="folio-text-link">Email</a>
        <div className="flex items-center gap-5">
          <a href={profile.github} target="_blank" rel="noreferrer" className="folio-text-link">GitHub</a>
          <a href={profile.linkedin} target="_blank" rel="noreferrer" className="folio-text-link">LinkedIn</a>
        </div>
      </footer>
    </div>
  </div>;
}
