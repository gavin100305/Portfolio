import { ReturnJourneyProvider } from "@/components/return-journey";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Script from "next/script";
import { themeScript } from "@/components/professional/theme-setup";

const manrope = localFont({ src: "./fonts/manrope-latin.woff2", variable: "--font-manrope", weight: "400 800", display: "swap" });
const pixelify = localFont({ src: "./fonts/pixelify-sans-latin.woff2", variable: "--font-pixelify", weight: "400 700", display: "swap" });
const geistMono = localFont({ src: "./fonts/geist-mono-regular.ttf", variable: "--font-geist-mono", weight: "400", display: "swap" });

const dmSans = localFont({ src: "./fonts/dm-sans.ttf", variable: "--font-dm-sans", weight: "400", display: "swap" });
const instrumentSerif = localFont({ src: "./fonts/instrument-serif.ttf", variable: "--font-instrument-serif", weight: "400", display: "swap" });

const siteUrl = "https://gavin-soares.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Gavin Soares | Full-Stack Developer & Software Engineer",
    template: "%s | Gavin Soares",
  },
  description: "Portfolio of Gavin Soares, a Computer Engineering student and Full-Stack Developer in Mumbai building scalable web applications, developer platforms, and AI-driven systems.",
  keywords: [
    "Gavin Soares",
    "Gavin Soares Portfolio",
    "Gavin Soares Developer",
    "Gavin Soares Mumbai",
    "Gavin Soares Software Engineer",
    "Gavin Soares Fr CRCE",
    "gavin100305",
    "Full-Stack Developer Mumbai",
    "Next.js Developer",
    "React Developer",
    "AI Engineer Mumbai",
    "Computer Engineering Mumbai",
  ],
  authors: [{ name: "Gavin Soares", url: "https://github.com/gavin100305" }],
  creator: "Gavin Soares",
  publisher: "Gavin Soares",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Gavin Soares Portfolio",
    title: "Gavin Soares | Full-Stack Developer & Software Engineer",
    description: "Portfolio of Gavin Soares, a Computer Engineering student and Full-Stack Developer in Mumbai building scalable web applications, developer platforms, and AI-driven systems.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gavin Soares | Full-Stack Developer & Software Engineer",
    description: "Portfolio of Gavin Soares, a Computer Engineering student and Full-Stack Developer in Mumbai.",
    creator: "@gavin100305",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const personStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${siteUrl}/#person`,
      name: "Gavin Soares",
      alternateName: ["gavin100305", "Gavin"],
      jobTitle: "Full-Stack Developer & Software Engineer",
      description: "Computer Engineering student and Full-Stack Developer based in Mumbai, building scalable web applications, developer platforms, and AI-driven solutions.",
      url: siteUrl,
      email: "mailto:gavinsoares200510@gmail.com",
      image: "https://github.com/gavin100305.png",
      sameAs: [
        "https://github.com/gavin100305",
        "https://www.linkedin.com/in/gavin-soares-a2a54728b/"
      ],
      address: {
        "@type": "PostalAddress",
        addressLocality: "Mumbai",
        addressCountry: "IN"
      },
      alumnusOf: {
        "@type": "CollegeOrUniversity",
        name: "Fr. Conceicao Rodrigues College of Engineering",
        sameAs: "https://frcrce.ac.in/"
      },
      knowsAbout: [
        "Software Engineering",
        "Full-Stack Web Development",
        "Artificial Intelligence",
        "React",
        "Next.js",
        "TypeScript",
        "Node.js",
        "Python",
        "FastAPI",
        "PostgreSQL",
        "MongoDB"
      ]
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Gavin Soares Portfolio",
      description: "Personal portfolio and software engineering projects of Gavin Soares.",
      publisher: {
        "@id": `${siteUrl}/#person`
      },
      inLanguage: "en-US"
    }
  ]
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${manrope.variable} ${pixelify.variable} ${geistMono.variable} ${dmSans.variable} ${instrumentSerif.variable}`}>
      <head>
        <meta name="google-site-verification" content="GSZWHl9hHUdTvrFxZEAA9RZzU0CgyjOAbVwzDblWvZQ" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personStructuredData) }}
        />
      </head>
      <body><Script id="professional-theme-setup" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeScript }} /><ReturnJourneyProvider>{children}</ReturnJourneyProvider></body>
    </html>
  );
}
