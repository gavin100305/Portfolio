import type { Metadata } from "next";
import Link from "next/link";
import { DotMonogram } from "@/components/professional/brand";
import { ThemeToggle } from "@/components/professional/theme-toggle";
import { ButtonSoundEffects } from "@/components/professional/button-sound-effects";
import { ProjectGrid } from "@/components/professional/project-gallery";
import { PortfolioFooter } from "@/components/professional/portfolio-footer";
import { allProjects } from "@/data/professional-projects";
import { ProjectPageReveals } from "@/components/professional/project-page-reveals";
import "../professional.css";

export const metadata: Metadata = {
  title: "All Projects | Gavin Soares",
  description: "Explore Gavin Soares’s full collection of applications, games, AI projects, and developer tools.",
};

export default function ProjectsPage() {
  return <div className="professional-shell folio-projects-page min-h-svh bg-folio-background font-folio-sans text-folio-foreground antialiased">
    <ButtonSoundEffects />
    <ProjectPageReveals />
    <a href="#main" className="folio-skip">Skip to content</a>
    <div className="relative mx-auto max-w-[800px] px-6 sm:px-8">
      <header id="home" className="flex h-20 items-center justify-between sm:h-24">
        <Link href="/" className="folio-home-mark" aria-label="Home"><DotMonogram /></Link>
        <ThemeToggle />
      </header>
      <main id="main" className="pb-16 pt-6 sm:pb-20 sm:pt-8">
        <Link href="/#projects" className="folio-raised-control folio-projects-entry">← Back to portfolio</Link>
        <div className="folio-all-projects-heading folio-projects-entry">
          <h1 className="text-2xl font-medium tracking-tight">All projects</h1>
          <span className="font-mono text-[10px] text-folio-subtle">{String(allProjects.length).padStart(2, "0")} projects</span>
        </div>
        <p className="folio-projects-entry mb-8 text-xs leading-6 text-folio-muted">Applications, experiments, and tools. Select a project to take a closer look.</p>
        <ProjectGrid />
      </main>
      <PortfolioFooter />
    </div>
  </div>;
}
