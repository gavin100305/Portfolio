import type { Metadata } from "next";
import { StationShell } from "@/components/station-shell";
import "../space-backgrounds.css";
import "../station-discoveries.css";
import "../portfolio-pages.css";

export const metadata: Metadata = {
  title: "Space Station | Gavin Soares",
  description: "Explore Gavin Soares’s interactive space station: projects, experience, discoveries, and an orbital football pitch.",
};

export default function SpacePage() {
  return <StationShell />;
}
