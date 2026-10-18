import Link from "next/link";
import { AsciiDesk } from "@/components/professional/ascii-desk";
import { ThemeToggle } from "@/components/professional/theme-toggle";
import { TechStack } from "@/components/professional/tech-stack";
import { ProjectGallery } from "@/components/professional/project-gallery";
import { Achievements } from "@/components/professional/achievements";
import { GitHubCalendar } from "@/components/professional/github-calendar";
import { Experience } from "@/components/professional/experience";
import { ContactSection } from "@/components/professional/contact-section";
import { SectionDock } from "@/components/professional/section-dock";
import { SpaceInvitation } from "@/components/professional/space-invitation";
import { PortfolioFooter } from "@/components/professional/portfolio-footer";
import { ButtonSoundEffects } from "@/components/professional/button-sound-effects";
import { ScrollReveals } from "@/components/professional/scroll-reveals";
import "./professional.css";

const themeScript = `(function(){try{var t=localStorage.getItem('gavin:professional-theme');document.documentElement.dataset.professionalTheme=t==='light'||t==='dark'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch{document.documentElement.dataset.professionalTheme='light'}})()`;

function DotMonogram() {
  const letters = [
    ["01110", "10001", "10000", "10111", "10001", "10001", "01110"],
    ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  ];
  return <svg viewBox="0 0 40 26" className="h-4 w-6" aria-hidden="true">
    {letters.flatMap((letter, index) => letter.flatMap((row, y) => [...row].map((dot, x) => dot === "1" ?
      <circle key={`${index}-${x}-${y}`} cx={3 + (index * 6 + x) * 3.4} cy={3 + y * 3.4} r="1.1" fill={index === 0 && y === 3 && x === 4 ? "var(--folio-accent)" : "currentColor"} /> : null)))}
  </svg>;
}

export default function Home() {
  return <div className="professional-shell min-h-svh bg-folio-background font-folio-sans text-folio-foreground antialiased">
    <ButtonSoundEffects />
    <ScrollReveals />
    <script dangerouslySetInnerHTML={{ __html: themeScript }} />
    <a href="#main" className="folio-skip">Skip to content</a>
    <SectionDock />
    <div className="relative mx-auto bg-transparent max-w-[800px] px-6 sm:px-8">
      <header id="home" className="flex h-20 items-center justify-between sm:h-24">
        <Link href="/" className="folio-home-mark" aria-label="Home" title="Home">
          <DotMonogram />
        </Link>
        <div className="folio-header-actions">
          <ThemeToggle />
        </div>
      </header>
      <main id="main" className="pb-14 pt-2 sm:pb-20">
        <AsciiDesk />
        <section aria-label="Introduction" className="folio-introduction mx-auto mt-7 w-full max-w-[760px] text-center sm:mt-9">
          <p className="mx-auto max-w-[700px] text-base leading-[1.85] text-folio-muted sm:text-[17px]">I’m a Computer Engineering student in Mumbai. I build full-stack applications, work with AI, and enjoy getting involved in both how a product works and how it looks.</p>
        </section>
        <TechStack />
        <ProjectGallery />
        <Experience />
        <Achievements />
        <GitHubCalendar />
        <ContactSection />
        <SpaceInvitation />
      </main>
      <PortfolioFooter />
    </div>
  </div>;
}
