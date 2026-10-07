export const sections = [
  {
    id: "projects",
    label: "Projects",
    roomName: "Project Hangar",
    marker: "01",
    description: "Project portfolio content will be added in a later stage.",
  },
  {
    id: "achievements",
    label: "Achievements",
    roomName: "Achievement Archive",
    marker: "02",
    description: "Verified achievements will be added in a later stage.",
  },
  {
    id: "stack",
    label: "Tech Stack",
    roomName: "Engineering Bay",
    marker: "03",
    description: "Technology groups will be added in a later stage.",
  },
  {
    id: "experience",
    label: "Experience",
    roomName: "Mission Log",
    marker: "04",
    description: "Experience content will be added in a later stage.",
  },
  {
    id: "about",
    label: "About",
    roomName: "Command Deck",
    marker: "05",
    description: "Profile content will be added in a later stage.",
  },
  {
    id: "contact",
    label: "Contact",
    roomName: "Communications",
    marker: "06",
    description: "Verified contact details will be added in a later stage.",
  },
  {
    id: "football",
    label: "Orbital Training Deck",
    roomName: "Orbital Training Deck",
    marker: "07",
    description: "Take three penalties against the ship’s goalkeeper. Pick your spot and shoot.",
  },
] as const;

export type SectionId = (typeof sections)[number]["id"];

export function getSection(id: string | null | undefined) {
  return sections.find((section) => section.id === id);
}
