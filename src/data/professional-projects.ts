import { projects, type Project } from "./portfolio-content";

export type GalleryProject = Project & { image?: string; lightImage?: string };

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

/** Authentic live-site captures; single-theme sites reuse their available theme. */
const archiveScreenshots: Record<string, Pick<GalleryProject, "image" | "lightImage">> = {
  "tisd": { image: "/projects/tisd.png", lightImage: "/projects/tisd.png" },
  "vathavaran": { image: "/projects/vathavaran.png", lightImage: "/projects/vathavaran-light.png" },
  "neurolytics": { image: "/projects/neurolytics.png", lightImage: "/projects/neurolytics-light.png" },
  "nourishnet": { image: "/projects/nourishnet.png", lightImage: "/projects/nourishnet-light.png" },
  "zenith": { image: "/projects/zenith-light.png", lightImage: "/projects/zenith-light.png" },
  "influence-iq": { image: "/projects/influence-iq.png", lightImage: "/projects/influence-iq.png" },
};

const additionalProjects: readonly GalleryProject[] = [
  {
    id: "handsfree", name: "Handsfree", category: "Assistive browsing & accessibility", visual: "tools", featured: false, collection: "Developer tools",
    summary: "An assistive browsing platform that combines face movements, broad hand gestures, and voice to navigate the web through an in-page cursor.",
    highlights: ["Face and hand tracking with deliberate dwell selection and tracking-loss safeguards.", "Voice navigation, dictation, and a dashboard for setup, calibration, and personal preferences."],
    technologies: ["Next.js", "React", "TypeScript", "MediaPipe", "Web Speech API"],
    repository: "https://github.com/gavin100305/Handsfree", deployment: "https://team-loondry-college-round.vercel.app/",
    image: "/projects/handsfree.png", lightImage: "/projects/handsfree-light.png",
  },
  {
    id: "trekky", name: "Trekky", category: "Trek planning & coordination", visual: "earth", featured: false, collection: "Platforms",
    summary: "A web and mobile platform for discovering treks, planning outdoor adventures, and coordinating participants and organisers.",
    highlights: ["Participant-facing mobile experiences built with React Native and Expo.", "A React dashboard backed by Node.js, Express, MongoDB, and Firebase authentication."],
    technologies: ["React", "React Native", "Expo", "Node.js", "MongoDB", "Firebase"],
    repository: "https://github.com/gavin100305/Trekky", deployment: "https://trekky-vijaybhoomi.vercel.app/",
    image: "/projects/trekky.png", lightImage: "/projects/trekky-light.png",
  },
];

/** Keep this catalogue independent of the separate /space portfolio. */
export const allProjects: readonly GalleryProject[] = [
  ...galleryProjects,
  ...additionalProjects,
  ...projects
    .filter(project => project.id !== "ecoscan" && !galleryProjects.some(featured => featured.id === project.id))
    .sort((a, b) => Number(a.id === "tisd") - Number(b.id === "tisd"))
    .map(project => ({
      ...project,
      ...(project.id === "neurolytics" ? { deployment: "https://neurolytics-bnb.vercel.app/" } : {}),
      ...(project.id === "vathavaran" ? { deployment: "https://vathavaran-variable.vercel.app/" } : {}),
      ...(project.id === "tisd" ? { deployment: "https://tisd-backend-3-w6k4.onrender.com" } : {}),
      ...archiveScreenshots[project.id],
    })),
];
