/** Small original vector instruments; no platform-dependent emoji glyphs. */
const paths = {
  projects: "M9 14C8 8 12 4 19 3c0 7-4 11-10 11Zm0 0-4 1v-4l4-2m4 4-2 6h-4v-4M5 17l-2 4 4-2M13 8h3v3h-3Z",
  achievements: "M7 3h10v7a5 5 0 0 1-10 0ZM7 5H3v3a5 5 0 0 0 5 5m9-8h4v3a5 5 0 0 1-5 5M12 15v5m-5 1h10",
  stack: "M6 6h12v12H6Zm4 4h4v4h-4ZM9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4",
  experience: "M6 3h12v18H6Zm3 4h6m-6 5h6m-6 5h4M3 5v14",
  about: "M5 7h14v9H5Zm3-4h8l3 4M8 10h8m-9 6v5h4v-3h2v3h4v-5M2 8v6m20-6v6",
  contact: "m7 5 12 12a8 8 0 0 1-12-12Zm5 7 7-7m-4-2a7 7 0 0 1 6 6M9 17l-1 4m-3 0h10",
  code: "m8 6-5 6 5 6m8-12 5 6-5 6m-3-15-2 18",
  layout: "M3 4h18v16H3Zm0 5h18m-11 0v11",
  api: "M3 7h16l-4-4m6 14H5l4 4M19 7l-4 4M5 17l4-4",
  spark: "m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z",
  database: "M4 6c0-5 16-5 16 0s-16 5-16 0Zm0 0v12c0 5 16 5 16 0V6M4 12c0 5 16 5 16 0",
  tools: "m14 4 6-1-1 6-4 1-9 11-3-3 11-9ZM3 3l4 1 1 4m8 7 5 5-2 2-5-5",
  football: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5 5 4-2 6H9l-2-6ZM12 2v5m9 2-4 2m1 9-3-3M6 20l3-3M3 9l4 2",
  search: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5 12 6 6",
  external: "M14 3h7v7m0-7L10 14M10 4H4v16h16v-6",
  right: "M3 12h18m-7-7 7 7-7 7",
  left: "M21 12H3m7-7-7 7 7 7",
  copy: "M8 8h13v13H8ZM16 8V3H3v13h5",
  github: "M8 4 3 8v8l5 4m8-16 5 4v8l-5 4M14 3l-4 18M3 12h4m10 0h4",
  linkedin: "M4 8v13M4 3v1m6 17V8m0 6c0-8 10-8 10 0v7",
  star: "m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1Z",
} as const;

export type PortfolioIconName = keyof typeof paths;
export function PortfolioIcon({ name, className = "" }: { name: PortfolioIconName; className?: string }) {
  return <svg className={`info-icon ${className}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" strokeLinejoin="round"><path d={paths[name]} /></svg>;
}
