export type ProfessionalAchievement = {
  id: string;
  event: string;
  venue: string;
  year: string;
  result: string;
  rank: string;
  tone: "gold" | "silver" | "bronze";
  image: string;
  imageAlt: string;
  photoPosition?: string;
  project: string | null;
  description: string;
  highlights: readonly string[];
  stack: readonly string[];
  team: readonly string[];
  repository?: string;
};

// Placements from the supplied awards and existing portfolio records; teams from Gavin.
// Project descriptions/stacks checked against each linked public repository.
export const professionalAchievements: readonly ProfessionalAchievement[] = [
  {
    id: "hackfusion", event: "HackFusion", venue: "Sardar Patel Institute of Technology", year: "2026", result: "1st place", rank: "01", tone: "gold",
    image: "/achievements/hackfusion.webp", imageAlt: "HackFusion 2026 award presentation with the team holding the winner’s cheque.",
    project: "CityPulse",
    description: "A civic infrastructure platform connecting citizens, authorities, and field teams, from reporting a problem to following its resolution.",
    highlights: ["Location-based issue reports and public dashboards.", "AI-assisted categorisation, duplicate detection, and an audit trail for issue resolution."],
    stack: ["React", "Node.js", "Supabase", "Leaflet"],
    team: ["Gavin Soares", "Russel", "Reniyas", "Aliqyaan"],
    repository: "https://github.com/gavin100305/HackFusion-CityPulse",
  },
  {
    id: "auraflix", event: "Auraflix", venue: "InfluenceIQ track", year: "2025", result: "Track winner", rank: "01", tone: "gold",
    image: "/achievements/auraflix.webp", imageAlt: "Auraflix 2025 winner certificate for Team SOS in the InfluenceIQ track.",
    project: "InfluenceIQ",
    description: "An influencer analytics platform for exploring audience engagement, credibility, and how well an influencer’s content aligns with a brand.",
    highlights: ["Predictive follower and engagement trends using linear regression.", "Content analysis with TF-IDF and AI-generated influencer reports."],
    stack: ["React", "Tailwind CSS", "Node.js", "Express", "MongoDB", "Python"],
    team: ["Gavin Soares", "Romeiro", "Aliqyaan", "Liza"],
    repository: "https://github.com/gavin100305/Auraflix",
  },
  {
    id: "coherence", event: "Coherence ’25", venue: "AI / ML hackathon", year: "2025", result: "2nd place", rank: "02", tone: "silver",
    image: "/achievements/coherence.webp", imageAlt: "Coherence participants with certificates and trophies after the hackathon.", photoPosition: "center 68%",
    project: "ScreenSmart",
    description: "An AI-assisted résumé screening system that compares candidate skills and experience against job descriptions and presents the results in a recruiter dashboard.",
    highlights: ["Résumé extraction and semantic analysis using Scrapy and Gemini.", "Candidate scoring with XGBoost, ranked comparisons, and application insights."],
    stack: ["React", "Python", "XGBoost", "Gemini", "Scrapy"],
    team: ["Gavin Soares", "Romeiro", "Russel"],
    repository: "https://github.com/gavin100305/ScreenSmart",
  },
  {
    id: "vijaybhoomi", event: "Neural Nexus 2.0", venue: "Vijaybhoomi University", year: "2025", result: "2nd runner-up", rank: "03", tone: "bronze",
    image: "/achievements/vijaybhoomi.webp", imageAlt: "The Vijaybhoomi University hackathon team with their trophy on campus.",
    project: "Trekky",
    description: "A hackathon platform for trek planning and coordination across web and mobile, with separate interfaces for participants and organisers.",
    highlights: ["A participant-facing React Native app built with Expo.", "A React dashboard backed by Node.js, Express, MongoDB, and Firebase authentication."],
    stack: ["React", "React Native", "Expo", "Node.js", "MongoDB", "Firebase"],
    team: ["Gavin Soares", "Russel", "Aliqyaan", "Shravya"],
    repository: "https://github.com/gavin100305/Trekky",
  },
  {
    id: "academic-rank", event: "Academic distinction", venue: "Second-year Computer Engineering", year: "2025", result: "3rd rank", rank: "03", tone: "bronze",
    image: "/achievements/academic-rank.webp", imageAlt: "Certificate recognising Gavin Soares for third rank in the May / June 2025 second-year Computer Engineering examination.",
    project: null,
    description: "Recognised by Fr. Conceicao Rodrigues College of Engineering for securing third rank in second-year Computer Engineering in the May / June 2025 examination.",
    highlights: [], stack: [], team: [],
  },
];
