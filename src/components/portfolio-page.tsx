"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode, type RefObject } from "react";
import { sections, type SectionId } from "@/data/sections";
import { achievements, experience, profile, projects, skillGroups, type Project } from "@/data/portfolio-content";
import { ProjectIllustration } from "@/components/portfolio-illustrations";
import { PortfolioIcon } from "@/components/portfolio-icon";
import { SectionHeroArt } from "@/components/section-hero-art";
import { TechnologyList } from "@/components/technology-list";
import { GitHubCalendar } from "@/components/github-calendar";
import { StationSelect } from "@/components/station-select";
import { PageHatch, usePageEntrance } from "@/components/page-entrance";
import { Astronaut } from "@/components/ship-artwork";

export type InfoSectionId = Exclude<SectionId, "football">;

const pageCopy: Record<InfoSectionId, { title: string; intro: string }> = {
  projects: { title: "Projects", intro: "A collection of things I’ve built and contributed to. From intelligent platforms to a football career of your own." },
  achievements: { title: "Achievements", intro: "A few memorable results from building, learning, and solving problems at hackathons." },
  stack: { title: "Tech Stack", intro: "The languages, frameworks, and tools I use to connect interfaces, services, and intelligent features." },
  experience: { title: "Experience", intro: "Hands-on experience building marketplace workflows, payment systems, and developer tools." },
  about: { title: "About", intro: "Hi, I’m Gavin. A developer, a Computer Engineering student, and a football enthusiast." },
  contact: { title: "Contact", intro: "Have a project in mind, a question, or something interesting to share? Here’s where to find me." },
};

function OutboundLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className={`info-link ${className}`}>{children}<PortfolioIcon name="external" /><span className="visually-hidden"> (opens in a new tab)</span></a>;
}

function Tags({ items }: { items: readonly string[] }) {
  if (!items.length) return null;
  return <ul data-tags aria-label="Technologies and focus areas" className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0">{items.map(item => <li key={item} className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#59697a] before:size-1 before:shrink-0 before:bg-[#8999a3]">{item}</li>)}</ul>;
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return <article className="info-project-card bg-card-surface border-card-edge" data-project={project.id}>
    <div className="info-project-visual" data-visual={project.visual}>
      <span className="info-card-coordinate"><i aria-hidden="true" /> PROJECT / {String(index + 1).padStart(2, "0")}</span>{project.featured && <span className="info-featured"><PortfolioIcon name="star" />Featured</span>}
      <ProjectIllustration kind={project.visual} />
    </div>
    <div className="info-project-copy">
      <div className="info-card-eyebrow">{project.category}</div>
      <h2>{project.name}</h2>
      <p>{project.summary}</p>
      <div className="info-project-links">
        {project.deployment && <OutboundLink href={project.deployment} className="info-link-primary">Open project</OutboundLink>}
        {project.repository && <OutboundLink href={project.repository} className="info-link-source"><PortfolioIcon name="github" />Source code</OutboundLink>}
        <details className="info-project-disclosure"><summary>Details<PortfolioIcon name="right" /></summary><div className="info-project-expanded"><ul className="info-project-details">{project.highlights.map(highlight => <li key={highlight}>{highlight}</li>)}</ul><Tags items={project.technologies} /></div></details>
      </div>
    </div>
  </article>;
}

function ProjectGallery() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All projects");
  const filters = ["All projects", "Featured", "AI & data", "Platforms", "Developer tools", "Games"];
  const collectionFor = (project: Project) => project.collection ?? (project.id === "tisd" || project.id === "neurolytics" ? "Platforms" : "AI & data");
  const visible = projects.filter(project => (filter === "All projects" || (filter === "Featured" ? project.featured : collectionFor(project) === filter))
    && `${project.name} ${project.category} ${project.summary} ${project.technologies.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <>
    <div className="info-gallery-toolbar">
      <div className="info-collection"><span>Collection</span><StationSelect label="Project collection" value={filter} onChange={setFilter} options={filters.map(item => ({ value: item, label: `${item}${item === "All projects" ? ` (${projects.length})` : ""}` }))} /></div>
      <label className="info-search"><PortfolioIcon name="search" /><span className="visually-hidden">Search projects by name or technology</span><input type="search" value={query} placeholder="Find a project or technology" onChange={event => setQuery(event.target.value)} /></label>
    </div>
    <p className="info-result-count" role="status">{visible.length} {visible.length === 1 ? "project" : "projects"}{query.trim() ? ` matching “${query.trim()}”` : " in this collection"}</p>
    <div className="info-project-grid">{visible.map(project => <ProjectCard key={project.id} project={project} index={projects.indexOf(project)} />)}</div>
    {!visible.length && <div className="info-empty"><PortfolioIcon name="search" /><h2>No projects in this orbit.</h2><p>Try another name, technology, or collection.</p><button className="info-button" type="button" onClick={() => { setQuery(""); setFilter("All projects"); }}>Show all projects</button></div>}
    <div className="info-source-note"><p>Selected personal and team projects. Explore the repositories for implementation details and contributors.</p><OutboundLink href={profile.github}>More on GitHub</OutboundLink></div>
  </>;
}

function AchievementsPage() {
  return <>
    <div className="info-award-intro"><span className="info-overline">BUILD. LEARN. REPEAT.</span><p>Four results. Plenty of learning along the way.</p></div>
    <div className="info-awards-grid">{achievements.map(award => <article className="info-award-card bg-card-surface border-card-edge" data-tone={award.tone} key={award.name}>
      <div className="info-award-meta"><span>{award.detail}</span><span>{award.year}</span></div>
      <div className="info-medal" aria-hidden="true"><PortfolioIcon name="star" /><strong>{award.rank}</strong><i /></div>
      <p className="info-award-placement">{award.placement}</p><h2>{award.name}</h2>
      <div className="info-award-rule" aria-hidden="true"><span /><PortfolioIcon name="star" /><span /></div>
    </article>)}</div>
    <div className="info-closing-note"><PortfolioIcon name="star" /><p>Good ideas get better when you build them with people.</p></div>
  </>;
}

function SkillsPage() {
  return <>
    <div className="info-skills-grid">{skillGroups.map(group => <article className="info-skill-card bg-card-surface border-card-edge" key={group.name}>
      <div className="info-skill-heading"><span className="info-skill-icon" aria-hidden="true"><PortfolioIcon name={group.icon} /></span><div><h2>{group.name}</h2><p>{group.description}</p></div></div><TechnologyList items={group.items} />
    </article>)}</div>
    <div className="info-closing-note"><PortfolioIcon name="stack" /><p>Different tools, one goal: useful, well-connected applications.</p></div>
  </>;
}

function ExperiencePage() {
  return <ol className="info-timeline">{experience.map((item, index) => <li key={`${item.organization}-${item.role}`}>
    <div className="info-timeline-rail"><span>0{index + 1}</span></div>
    <article className="info-experience-card bg-card-surface border-card-edge"><div className="info-experience-top"><span className="info-overline">{item.kind}</span><span className="info-period">{item.period}</span></div>
      <h2>{item.role}</h2><div className="my-4"><h3 className="text-sm font-bold text-[#405775]">{item.organization}</h3></div>{item.description && <p>{item.description}</p>}
      {item.highlights.length > 0 && <ul>{item.highlights.map(highlight => <li key={highlight}>{highlight}</li>)}</ul>}<Tags items={item.tags} />
    </article>
  </li>)}</ol>;
}

function AboutPage({ onOpen }: { onOpen: (id: SectionId, event: MouseEvent<HTMLElement>) => void }) {
  return <>
    <div className="info-about-grid">
      <article className="info-biography"><span className="info-overline">GAVIN SOARES / CREW PROFILE</span><h2>Curious by nature.<br /><em>A builder at heart.</em></h2><p>{profile.summary}</p><p>I’m driven by continuous learning and the chance to turn an idea into something useful.</p></article>
      <aside data-profile-card aria-label="Gavin Soares profile" className="relative isolate flex flex-col items-center self-center gap-6 overflow-hidden rounded-xl border-2 border-card-edge bg-card-surface px-6 py-8 text-center shadow-[0_4px_0_#a9b1b4,0_10px_24px_#263c531a,inset_0_1px_0_white] transition-shadow duration-300 hover:shadow-[0_4px_0_#8798a7,0_10px_26px_#263c5326] motion-reduce:transition-none max-[700px]:px-4">
        <div aria-hidden="true" className="grid h-[164px] w-[148px] shrink-0 place-items-center rounded-xl border-2 border-card-edge bg-station-frame shadow-[inset_0_0_0_6px_#405775,0_4px_0_#111722] [&_.astronaut-svg]:h-[138px] [&_.astronaut-svg]:w-[110px]"><Astronaut palette="azure" /></div>
        <div className="flex w-full flex-col gap-2.5"><h2 className="text-[30px] leading-[1.15] tracking-[-0.02em] text-[#263c53] [font-family:var(--font-pixel)]">{profile.name}</h2><p className="text-xs leading-relaxed text-[#59697a]">{profile.role}</p></div>
        <ul aria-label="Interests" className="flex flex-wrap justify-center gap-2 p-0 list-none">{["Full-stack", "AI & ML", "Football"].map(interest => <li key={interest} className="rounded-md border border-[#c9c2b2] bg-[#f3eee2] px-3 py-2 text-[10px] font-bold text-[#405775] shadow-[0_2px_0_#d6cfbf,inset_0_1px_0_white]">{interest}</li>)}</ul>
      </aside>
    </div>
    <section className="info-education" aria-labelledby="education-title"><div><span className="info-overline">LEARNING LOG / 2023 → PRESENT</span><h2 id="education-title">{profile.education.degree}</h2><p>{profile.education.college}<br />{profile.education.location} · {profile.education.period}</p></div></section>
    <GitHubCalendar />
    <a href="#football" className="info-football-invite" onClick={event => onOpen("football", event)}><PortfolioIcon name="football" /><div><span className="info-overline">OFF DUTY</span><h2>Fancy a penalty shootout?</h2><p>Take a detour to the Orbital Bernabéu.</p></div><PortfolioIcon name="right" className="info-invite-arrow" /></a>
  </>;
}

function ContactPage() {
  const [copyStatus, setCopyStatus] = useState("");
  const copyEmail = async () => {
    try { await navigator.clipboard.writeText(profile.email); setCopyStatus("Email address copied."); }
    catch { setCopyStatus("Copy unavailable. You can select the email address or use the email link."); }
  };
  return <div className="info-contact-grid">
    <article className="info-contact-main"><span className="info-overline">DIRECT TRANSMISSION</span><h2>A good conversation<br />starts with <em>hello.</em></h2><p>For projects, collaborations, or a quick introduction, send me an email.</p><a className="info-email" href={`mailto:${profile.email}`}>{profile.email}<PortfolioIcon name="external" /></a><div className="info-contact-actions"><a className="info-button info-button-solid" href={`mailto:${profile.email}`}>Send an email <PortfolioIcon name="external" /></a><button type="button" className="info-button" onClick={copyEmail}>Copy address <PortfolioIcon name="copy" /></button></div><p className="info-copy-status" role="status">{copyStatus}</p></article>
    <div className="info-contact-links"><OutboundLink href={profile.github} className="info-social-card"><span className="info-social-icon"><PortfolioIcon name="github" /></span><div><span className="info-overline">CODE & EXPERIMENTS</span><h2>GitHub</h2><p>@gavin100305</p></div></OutboundLink><OutboundLink href={profile.linkedin} className="info-social-card"><span className="info-social-icon"><PortfolioIcon name="linkedin" /></span><div><span className="info-overline">PROFESSIONAL ORBIT</span><h2>LinkedIn</h2><p>Connect with Gavin</p></div></OutboundLink><div className="info-contact-note"><PortfolioIcon name="star" /><p>Thanks for stopping by my little corner of the universe.</p></div></div>
  </div>;
}

export function PortfolioPage({ id, pageRef, titleRef, onKeyDown, onClose, onOpen }: {
  id: InfoSectionId;
  pageRef: RefObject<HTMLElement | null>;
  titleRef: RefObject<HTMLHeadingElement | null>;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onClose: () => void;
  onOpen: (id: SectionId, event: MouseEvent<HTMLElement>) => void;
}) {
  const section = sections.find(section => section.id === id)!;
  const copy = pageCopy[id];
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  usePageEntrance(pageRef);
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);
  const closePage = () => {
    if (closeTimer.current) return;
    setClosing(true);
    const duration = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 500;
    closeTimer.current = setTimeout(onClose, duration);
  };
  return <section className="info-page bg-page-surface [background-size:280px_280px]" data-section={id} data-closing={closing} ref={pageRef} role="dialog" aria-modal="true" aria-labelledby="info-page-title" tabIndex={-1} onKeyDown={event => { if (event.key === "Escape" && !event.defaultPrevented) { event.preventDefault(); closePage(); } else onKeyDown(event); }}>
    <PageHatch closing={closing} />
    <div className="info-page-hardware" aria-hidden="true"><span className="info-page-bolt" data-corner="top-left" /><span className="info-page-bolt" data-corner="top-right" /><span className="info-page-bolt" data-corner="bottom-left" /><span className="info-page-bolt" data-corner="bottom-right" /></div>
    <div className="info-page-tools"><button type="button" className="info-return" onClick={closePage}><PortfolioIcon name="left" /> Return to station <kbd>Esc</kbd></button></div>
    <div className="info-page-body">
      <div className="info-page-hero"><div className="motion-safe:animate-[station-header-in_600ms_ease-out_650ms_both]"><div className="info-hero-kicker"><PortfolioIcon name={id} /><span>{section.roomName}</span></div><h1 id="info-page-title" ref={titleRef} tabIndex={-1}>{copy.title}</h1><p className="motion-safe:animate-[station-header-in_550ms_ease-out_850ms_both]">{copy.intro}</p></div><div className="motion-safe:animate-[station-header-in_600ms_ease-out_650ms_both]"><SectionHeroArt section={id} /></div></div>
      <div className="info-section-content">
        {id === "projects" && <ProjectGallery />}{id === "achievements" && <AchievementsPage />}{id === "stack" && <SkillsPage />}{id === "experience" && <ExperiencePage />}{id === "about" && <AboutPage onOpen={onOpen} />}{id === "contact" && <ContactPage />}
      </div>

    </div>
  </section>;
}
