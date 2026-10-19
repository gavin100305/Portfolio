export const sections = [
  {
    id: "projects",
    label: "Projects",
    roomName: "Project Hangar",
    marker: "01",
    description: "Explore full-stack applications, AI platforms, and a football career-mode game.",
  },
  {
    id: "achievements",
    label: "Achievements",
    roomName: "Achievement Archive",
    marker: "02",
    description: "Hackathon results and milestones from building and learning.",
  },
  {
    id: "stack",
    label: "Tech Stack",
    roomName: "Engineering Bay",
    marker: "03",
    description: "Languages, frameworks, AI tools, and infrastructure from my engineering kit.",
  },
  {
    id: "experience",
    label: "Experience",
    roomName: "Mission Log",
    marker: "04",
    description: "Full-stack development experience across marketplace workflows and analytics tools.",
  },
  {
    id: "about",
    label: "About",
    roomName: "Command Deck",
    marker: "05",
    description: "Meet Gavin Soares, a Computer Engineering student and developer.",
  },
  {
    id: "contact",
    label: "Contact",
    roomName: "Communications",
    marker: "06",
    description: "Get in touch by email, GitHub, or LinkedIn.",
  },
  {
    id: "football",
    label: "Bernabéu",
    roomName: "Orbital Bernabéu",
    marker: "07",
    description: "Step inside a Real Madrid-inspired stadium and practise penalties.",
  },
] as const;

export type SectionId = (typeof sections)[number]["id"];

export function getSection(id: string | null | undefined) {
  return sections.find((section) => section.id === id);
}
