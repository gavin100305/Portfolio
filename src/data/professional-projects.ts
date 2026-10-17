import { projects, type Project } from "./portfolio-content";

export type GalleryProject = Project & { image: string; lightImage: string };

function existing(id: string, image: string): GalleryProject {
  const project = projects.find(item => item.id === id);
  if (!project?.deployment) throw new Error(`Gallery project needs a live demo: ${id}`);
  return { ...project, image, lightImage: image.replace(".webp", "-light.webp") };
}

// Live homepages captured October 18, 2026; details checked against the linked repositories.
export const galleryProjects: readonly GalleryProject[] = [
  existing("draft-xi", "/projects/draft-xi.webp"),
  {
    id: "citypulse", name: "City Pulse", category: "Civic infrastructure platform", visual: "earth", featured: true,
    summary: "A shared workspace for citizens, authorities, and field teams to report infrastructure issues and follow them through to resolution.",
    highlights: ["Location-based reports, a public dashboard, and workflows for assigning and resolving issues.", "AI-assisted categorization and duplicate detection, with an audit trail for accountability."],
    technologies: ["React", "Node.js", "Supabase", "Leaflet"],
    repository: "https://github.com/gavin100305/HackFusion-CityPulse",
    deployment: "https://hack-fusion-city-pulse.vercel.app/", image: "/projects/citypulse.webp", lightImage: "/projects/citypulse-light.webp",
  },
  existing("money-council", "/projects/money-council.webp"),
  {
    id: "nomoreproxies", name: "NoMoreProxies", category: "Attendance & leave management", visual: "tools", featured: true,
    summary: "Attendance and leave management for students, teachers, and administrators, with multiple ways to verify attendance.",
    highlights: ["QR sessions, biometric and passkey workflows, and real-time attendance updates.", "AI-assisted leave-document verification and a Chrome extension for Google Meet attendance."],
    technologies: ["React", "Node.js", "MongoDB", "Socket.io"],
    repository: "https://github.com/Hike-12/Team-Pony-HackCrypt",
    deployment: "https://nomoreproxies-hackcrypt.vercel.app/", image: "/projects/nomoreproxies.webp", lightImage: "/projects/nomoreproxies-light.webp",
  },
  existing("pashu-pehchan", "/projects/pashu-pehchan.webp"),
];
