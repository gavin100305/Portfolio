import Link from "next/link";
import { AsciiDesk } from "@/components/professional/ascii-desk";
import { ThemeToggle } from "@/components/professional/theme-toggle";
import { profile } from "@/data/portfolio-content";
import "./professional.css";

const themeScript = `(function(){try{var t=localStorage.getItem('gavin:professional-theme');document.documentElement.dataset.professionalTheme=t==='light'||t==='dark'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch{document.documentElement.dataset.professionalTheme='light'}})()`;

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4" aria-hidden="true">{diagonal ? <path d="M6 18 18 6M6 6h12v12" /> : <path d="M4 12h15m-6-6 6 6-6 6" />}</svg>;
}

export default function Home() {
  return <div className="professional-shell min-h-svh bg-folio-background font-folio-sans text-folio-foreground antialiased">
    <script dangerouslySetInnerHTML={{ __html: themeScript }} />
    <a href="#main" className="folio-skip">Skip to content</a>
    <div className="relative mx-auto max-w-[848px] px-6 sm:px-8">
      <header className="flex h-20 items-center justify-between sm:h-24">
        <Link href="/" className="folio-wordmark text-sm font-semibold tracking-tight">Gavin Soares</Link>
        <ThemeToggle />
      </header>
      <main id="main" className="pb-14 pt-2 sm:pb-20">
        <AsciiDesk />
        <section aria-labelledby="intro-title" className="folio-introduction mt-11 max-w-[660px] sm:mt-14">
          <p className="mb-4 flex items-center gap-2.5 font-mono text-[10px] tracking-[.14em] text-folio-muted"><span className="size-1.5 rounded-full bg-folio-accent" aria-hidden="true" />COMPUTER ENGINEERING · MUMBAI</p>
          <h1 id="intro-title" className="font-folio-display text-[clamp(3.5rem,8vw,5.2rem)] leading-[1.02] font-normal tracking-[-.035em]">Gavin Soares<span className="text-folio-accent">.</span></h1>
          <p className="mt-5 max-w-[570px] text-base leading-[1.85] text-folio-muted sm:text-[17px]">I build full-stack applications and explore what AI can do. I like making useful things, figuring out how they work, and giving the details a little extra thought.</p>
          <div className="mt-7 flex flex-wrap items-center gap-6">
            <a href={`mailto:${profile.email}`} className="folio-primary inline-flex items-center gap-4 rounded-md bg-folio-accent px-5 py-3 text-xs font-semibold text-folio-accent-ink">Get in touch <Arrow diagonal /></a>
            <a href={profile.github} target="_blank" rel="noreferrer" className="folio-text-link text-xs font-medium">View my GitHub <Arrow /></a>
          </div>
        </section>
        <aside className="folio-space-note mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-folio-border pt-6 sm:mt-16">
          <p className="max-w-[360px] text-xs leading-6 text-folio-muted">There’s another side to this portfolio.<br /><span className="text-folio-foreground">A space station you can actually explore.</span></p>
          <Link href="/space" className="folio-text-link gap-3 font-mono text-[11px] text-folio-accent">Enter the station <Arrow diagonal /></Link>
        </aside>
      </main>
      <footer className="flex items-center justify-between border-t border-folio-border py-6 font-mono text-[9px] tracking-wide text-folio-subtle"><span>BUILT WITH CURIOSITY.</span><a href={profile.linkedin} target="_blank" rel="noreferrer" className="folio-text-link">LinkedIn <Arrow diagonal /></a></footer>
    </div>
  </div>;
}
