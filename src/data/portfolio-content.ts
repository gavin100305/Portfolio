/** Curated from the supplied CV and public project READMEs.
 * See docs/superpowers/plans/2026-10-14-portfolio-information-pages.md for sources.
 * Keep this static: visitors need no GitHub API request or credentials.
 */
export const profile = {
  name: "Gavin Soares",
  role: "Computer Engineering student",
  email: "gavinsoares200510@gmail.com",
  github: "https://github.com/gavin100305",
  linkedin: "https://www.linkedin.com/in/gavin-soares-a2a54728b/",
  summary: "I’m a Computer Engineering student passionate about software engineering, full-stack development, and AI-driven solutions. I build end-to-end applications with a focus on scalable systems, problem-solving, and user-centric design.",
  education: {
    degree: "B.E. in Computer Engineering",
    college: "Fr. Conceicao Rodrigues College of Engineering",
    location: "Mumbai",
    period: "2023 – Present",
    cgpa: "9.59",
    cgpaNote: "Out of 10 · up to Semester V",
  },
} as const;

export type Project = {
  id: string;
  name: string;
  category: string;
  summary: string;
  highlights: readonly string[];
  technologies: readonly string[];
  repository?: string;
  deployment?: string;
  visual: "career" | "finance" | "analytics" | "research" | "earth" | "scanner" | "livestock" | "food" | "football" | "tools";
  featured: boolean;
  collection?: "AI & data" | "Platforms" | "Developer tools" | "Games";
};

export const projects: readonly Project[] = [
  {
    id: "draft-xi", name: "Draft XI", category: "Football career-mode game", visual: "football", featured: true, collection: "Games",
    summary: "Build a squad across football eras, shape its tactics, and take it through a career where every draft decision carries forward.",
    highlights: ["Club-and-season drafting with squad budgets and tactical profiles.", "Mid-season transfers, player development, and multi-season progression."],
    technologies: ["Next.js", "Football", "Browser game"], deployment: "https://draft-xi-football.vercel.app/",
  },
  {
    id: "zenith", name: "Zenith", category: "AI-powered career platform", visual: "career", featured: true,
    summary: "From understanding a résumé to preparing for an interview: an AI-driven platform for the next step in a career.",
    highlights: ["Résumé parsing, personalized job matching, and skill-gap analysis.", "LLM-powered learning roadmaps, project recommendations, and interview feedback."],
    technologies: ["React", "FastAPI", "MongoDB"], repository: "https://github.com/gavin100305/Zenith", deployment: "https://zenith-sos.vercel.app",
  },
  {
    id: "money-council", name: "Money Council", category: "AI financial advisory platform", visual: "finance", featured: true,
    summary: "A financial planning platform bringing budgeting, savings, debt management, and investment guidance into one place.",
    highlights: ["Financial profiling, transaction tracking, and goal management.", "Scenario-based planning with personalized AI guidance."],
    technologies: ["React", "Node.js", "MongoDB"], repository: "https://github.com/gavin100305/MoneyCouncil", deployment: "https://money-council-mirror-family.vercel.app/",
  },
  {
    id: "influence-iq", name: "InfluenceIQ", category: "Influencer analytics platform", visual: "analytics", featured: true,
    summary: "Data-driven influencer insights, combining credibility, engagement quality, and longevity scoring with trend forecasts.",
    highlights: ["Linear regression for nine-month follower and engagement forecasts.", "TF-IDF analysis for influencer content and brand alignment."],
    technologies: ["React", "Python", "MongoDB"], repository: "https://github.com/gavin100305/Auraflix", deployment: "https://influenceiq-nine.vercel.app",
  },
  {
    id: "neurolytics", name: "Neurolytics", category: "Behavioral research tools", visual: "research", featured: false,
    summary: "A web-based research platform for designing, deploying, and collecting behavioral experiments without a complex coding workflow.",
    highlights: ["Visual experiment builder and precise stimulus-response timing.", "Audio and voice responses, anonymous data handling, and analytics."],
    technologies: ["React", "Node.js", "MongoDB"], repository: "https://github.com/gavin100305/Neurolytics",
  },
  {
    id: "tisd", name: "TISD", category: "Innovation & sustainable development", visual: "earth", featured: false,
    summary: "A collaborative platform for academic project tracking, Sustainable Development Goal alignment, and institutional insights.",
    highlights: ["Project documentation, mentorship matching, and progress monitoring.", "Gemini-powered analytics and reports for institutional collaboration."],
    technologies: ["React", "Django", "Gemini API"], repository: "https://github.com/gavin100305/TISD-Website",
  },
  {
    id: "ecoscan", name: "EcoScan", category: "Image-based sustainability insights", visual: "scanner", featured: false, collection: "AI & data",
    summary: "Product-image analysis for recyclability guidance, carbon-footprint estimates, and more sustainable alternatives.",
    highlights: ["Gemini Vision analysis with image uploads and saved scan history.", "PostgreSQL-backed records, authentication, and PDF history exports."],
    technologies: ["React", "Node.js", "PostgreSQL"], repository: "https://github.com/gavin100305/EcoScan",
  },
  {
    id: "pashu-pehchan", name: "Pashu Pehchan", category: "Connected livestock management", visual: "livestock", featured: false, collection: "Platforms",
    summary: "Web, mobile, and IoT tools connecting digital livestock identities with health monitoring and marketplace services.",
    highlights: ["Sensor-based health tracking, animal profiles, and vaccination schedules.", "React Native mobile app alongside web and backend services."],
    technologies: ["React Native", "Django", "Arduino"], repository: "https://github.com/gavin100305/PashuPehechan", deployment: "https://pashu-pehchaan.vercel.app",
  },
  {
    id: "nourishnet", name: "NourishNet", category: "Food delivery & meal subscriptions", visual: "food", featured: false, collection: "Platforms",
    summary: "A food and meal-subscription platform with dedicated customer, driver, and administration experiences.",
    highlights: ["Meal plans, delivery tracking, and route optimization.", "Razorpay payments and Expo-powered mobile notifications."],
    technologies: ["React Native", "Node.js", "MongoDB"], repository: "https://github.com/gavin100305/BitNBuild-25_TeamCotton", deployment: "https://nourishing-net.vercel.app",
  },
  {
    id: "vathavaran", name: "Vathavaran Variables", category: "Environment-variable developer tools", visual: "tools", featured: false, collection: "Developer tools",
    summary: "A web interface and companion Varte CLI for managing encrypted environment variables across GitHub repositories.",
    highlights: ["GitHub OAuth and repository permission checks.", "Express services, Firebase storage, and Cloudflare Workers integration."],
    technologies: ["React", "Node.js", "Firebase"], repository: "https://github.com/gavin100305/Vathavaran-Variables",
  },
];

export const experience = [
  {
    role: "Freelance Full Stack Developer", organization: "Independent work", period: "May 2026 – June 2026", kind: "Freelance",
    description: "Analytics tooling for e-commerce platforms.",
    highlights: ["Developed an npm-based analytics SDK and a client portal for event tracking and API key management.", "Integrated Brevo-powered email and web notifications."],
    tags: ["Analytics SDK", "Client portal", "Brevo"],
  },
  {
    role: "Full Stack Development Intern", organization: "Rayeva", period: "Dec 2025 – May 2026", kind: "Internship",
    description: "End-to-end workflows for a sustainability-focused marketplace.",
    highlights: ["Built admin verification, seller onboarding, product management, order processing, and AI-powered product automation.", "Developed Razorpay payment infrastructure: subscriptions, webhooks, seller payouts, invoices, and order-payment reconciliation.", "Optimized backend performance across marketplace workflows."],
    tags: ["E-commerce", "Razorpay", "AI automation"],
  },
] as const;

export const achievements = [
  { name: "HackFusion", detail: "SPIT", year: "2026", placement: "1st Place", rank: "01", tone: "gold" },
  { name: "Auraflix", detail: "Hackathon", year: "2025", placement: "1st Place", rank: "01", tone: "gold" },
  { name: "Coherence", detail: "AIML", year: "2025", placement: "2nd Place", rank: "02", tone: "silver" },
  { name: "Neural Nexus 2.0", detail: "Hackathon", year: "2025", placement: "2nd Runner-Up", rank: "03", tone: "bronze" },
] as const;

export const skillGroups = [
  { name: "Languages", icon: "code", description: "The building blocks", items: ["Python", "JavaScript", "C++", "SQL"] },
  { name: "Interfaces", icon: "layout", description: "Web & mobile experiences", items: ["React.js", "React Native"] },
  { name: "Backend & APIs", icon: "api", description: "Services that connect it all", items: ["Node.js", "Express.js", "FastAPI", "REST APIs"] },
  { name: "AI & machine learning", icon: "spark", description: "Intelligent, data-driven features", items: ["Scikit-learn", "TensorFlow", "Pandas", "NumPy", "NLP", "LLM Integration"] },
  { name: "Databases", icon: "database", description: "Where the data lives", items: ["PostgreSQL", "MongoDB", "Firebase"] },
  { name: "Tools & infrastructure", icon: "tools", description: "Build, ship & maintain", items: ["AWS", "Docker", "Git", "Postman", "Razorpay"] },
] as const;
