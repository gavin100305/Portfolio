"use client";

import Image from "next/image";
import { playButtonSound } from "@/lib/button-sound";

const rows = [
  [["Python", "python"], ["JavaScript", "javascript"], ["TypeScript", "typescript"], ["C++", "cplusplus"], ["React", "react"], ["Next.js", "nextjs"], ["Node.js", "nodejs"], ["Express", "express"], ["FastAPI", "fastapi"], ["PostgreSQL", "postgresql"], ["MongoDB", "mongodb"], ["React Native", "react"]],
  [["Expo", "expo"], ["Git", "git"], ["Docker", "docker"], ["AWS", "amazonwebservices"], ["TensorFlow", "tensorflow"], ["Scikit-learn", "scikitlearn"], ["Pandas", "pandas"], ["NumPy", "numpy"], ["Firebase", "firebase"], ["Postman", "postman"], ["Razorpay", "razorpay"]],
] as const;

export function TechStack() {
  return <section aria-labelledby="tech-title" className="folio-tech mt-16 sm:mt-20">
    <h2 id="tech-title" className="mb-6 text-xl font-medium tracking-tight">Tech stack</h2>
    <div className="folio-keyboard">
      {rows.map((tools, rowIndex) => <div className="folio-key-row" data-double={tools.length % 2 !== 0} key={rowIndex}>
        <div className="folio-key-track">
          {(tools.length % 2 === 0 ? [0, 1] : [0, 1, 2, 3]).map(copy => <ul className="folio-key-group" key={copy} aria-hidden={copy > 0 ? true : undefined} aria-label={copy === 0 ? (rowIndex === 0 ? "Languages and application development" : "Data and development tools") : undefined}>
            {tools.map(([name, icon], toolIndex) => <li className="folio-keycap" data-tone={(toolIndex + copy * tools.length + rowIndex) % 2 === 1 ? "cobalt" : "neutral"} key={name}>
              <button type="button" className="folio-keycap-face" onPointerDown={event => {
                if (event.button !== 0) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                void playButtonSound("down", toolIndex);
              }} onPointerUp={() => { void playButtonSound("up", toolIndex); }} onPointerCancel={() => { void playButtonSound("up", toolIndex); }} onKeyDown={event => {
                if (!event.repeat && (event.key === "Enter" || event.key === " ")) void playButtonSound("down", toolIndex);
              }} onKeyUp={event => {
                if (event.key === "Enter" || event.key === " ") void playButtonSound("up", toolIndex);
              }} tabIndex={copy > 0 ? -1 : 0}>
                <span className="folio-tool-socket"><Image src={`/tech-icons/${icon}.svg`} alt="" width={21} height={21} className="folio-tool-icon" /></span>
                <span>{name}</span>
              </button>
            </li>)}
          </ul>)}
        </div>
      </div>)}
    </div>
  </section>;
}
