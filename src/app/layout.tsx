import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const manrope = localFont({ src: "./fonts/manrope-latin.woff2", variable: "--font-manrope", weight: "400 800", display: "swap" });
const pixelify = localFont({ src: "./fonts/pixelify-sans-latin.woff2", variable: "--font-pixelify", weight: "400 700", display: "swap" });
const geistMono = localFont({ src: "./fonts/geist-mono-regular.ttf", variable: "--font-geist-mono", weight: "400", display: "swap" });

const dmSans = localFont({ src: "./fonts/dm-sans.ttf", variable: "--font-dm-sans", weight: "400", display: "swap" });
const instrumentSerif = localFont({ src: "./fonts/instrument-serif.ttf", variable: "--font-instrument-serif", weight: "400", display: "swap" });

export const metadata: Metadata = {
  title: "Gavin Soares — Developer",
  description: "Gavin Soares, a Computer Engineering student in Mumbai building full-stack applications and AI-driven tools.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${manrope.variable} ${pixelify.variable} ${geistMono.variable} ${dmSans.variable} ${instrumentSerif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
