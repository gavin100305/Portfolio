import Link from "next/link";
import { DotMonogram } from "@/components/professional/brand";
import { OpeningIntro } from "@/components/professional/opening-intro";
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


export default function Home() {
  return <div className="professional-shell min-h-svh bg-folio-background font-folio-sans text-folio-foreground antialiased">
    <ButtonSoundEffects />
    <ScrollReveals />
    <OpeningIntro />
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
