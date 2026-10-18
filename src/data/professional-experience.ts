import { experience } from "./portfolio-content";

export const professionalExperience = [
  {
    ...experience[0],
    label: "Pillow Tax", initials: "PT", logo: "/companies/pillowtax.png",
    description: "Full-stack product development for a tax and financial services platform, spanning the public website, customer experience, and internal tools.",
    highlights: [
      "Developed responsive product pages and dashboard interfaces, connecting frontend features with backend APIs.",
      "Worked on customer onboarding, profiles, and document workflows, including upload validation and access controls.",
      "Integrated consultation booking through Zoho Bookings alongside the platform’s Next.js and Supabase services.",
    ],
    stack: ["Next.js", "Supabase", "Zoho Bookings", "Vercel"],
  },
  {
    ...experience[1],
    label: "Freelance", initials: "FW", logo: null,
    description: "Built analytics tooling for e-commerce platforms, combining an installable event-tracking SDK with a client portal.",
    highlights: [
      "Developed an npm package for event tracking and a client portal for managing integrations and API keys.",
      "Connected tracking events to backend APIs and integrated Brevo-powered email and web notifications.",
    ],
    stack: ["npm", "Brevo", "REST APIs"],
  },
  {
    ...experience[2],
    label: "Rayeva", initials: "R", logo: "/companies/rayeva.png",
    stack: ["React", "Node.js", "Razorpay", "Supabase"],
  },
] as const;
