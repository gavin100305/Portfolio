import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./space-backgrounds.css";
import "./station-discoveries.css";
import "./portfolio-pages.css";

const manrope = localFont({ src: "./fonts/manrope-latin.woff2", variable: "--font-manrope", weight: "400 800", display: "swap" });
const pixelify = localFont({ src: "./fonts/pixelify-sans-latin.woff2", variable: "--font-pixelify", weight: "400 700", display: "swap" });

export const metadata: Metadata = {
  title: "Gavin Soares — Space Station",
  description: "Explore Gavin Soares’s space station: full-stack projects, AI applications, experience, and more.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} ${pixelify.variable}`}>
      <body>{children}</body>
    </html>
  );
}
