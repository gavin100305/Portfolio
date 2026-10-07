import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const manrope = localFont({ src: "./fonts/manrope-latin.woff2", variable: "--font-manrope", weight: "400 800", display: "swap" });
const pixelify = localFont({ src: "./fonts/pixelify-sans-latin.woff2", variable: "--font-pixelify", weight: "400 700", display: "swap" });

export const metadata: Metadata = {
  title: "Gavin Soares — Portfolio",
  description: "Explore the portfolio station of Gavin Soares.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} ${pixelify.variable}`}>
      <body>{children}</body>
    </html>
  );
}
