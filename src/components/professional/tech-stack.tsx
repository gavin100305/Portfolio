"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

const rows = [
  [["Python", "python"], ["JavaScript", "javascript"], ["C++", "cplusplus"], ["React", "react"], ["Node.js", "nodejs"], ["Express", "express"], ["FastAPI", "fastapi"], ["PostgreSQL", "postgresql"], ["MongoDB", "mongodb"], ["React Native", "react"]],
  [["Git", "git"], ["Docker", "docker"], ["AWS", "amazonwebservices"], ["TensorFlow", "tensorflow"], ["Scikit-learn", "scikitlearn"], ["Pandas", "pandas"], ["NumPy", "numpy"], ["Firebase", "firebase"], ["Postman", "postman"], ["Razorpay", "razorpay"]],
] as const;

export function TechStack() {
  const audioRef = useRef<AudioContext | null>(null);
  const sampleRef = useRef<Promise<AudioBuffer> | null>(null);

  useEffect(() => {
    const abort = new AbortController();
    if (typeof AudioContext === "undefined") return;
    const audio = new AudioContext();
    audioRef.current = audio;
    sampleRef.current = fetch("/sounds/key-press.wav", { signal: abort.signal })
      .then(response => {
        if (!response.ok) throw new Error("Keyboard sample unavailable");
        return response.arrayBuffer();
      })
      .then(data => audio.decodeAudioData(data));
    // Loading may be cancelled when navigating away before the first key press.
    void sampleRef.current.catch(() => {});
    return () => {
      abort.abort();
      audioRef.current = null;
      sampleRef.current = null;
      void audio.close();
    };
  }, []);

  async function playClick(phase: "down" | "up", index: number) {
    const audio = audioRef.current;
    const sample = sampleRef.current;
    if (!audio || !sample) return;
    try {
      if (audio.state === "suspended") await audio.resume();
      const buffer = await sample;
      if (audio.state === "closed") return;
      const strokes = phase === "down"
        ? [[0, .109], [.368, .098], [.717, .103], [1.029, .098]]
        : [[.109, .089], [.466, .080], [.820, .084], [1.127, .081]];
      const [offset, duration] = strokes[index % strokes.length];
      const source = audio.createBufferSource();
      source.buffer = buffer;
      source.connect(audio.destination);
      source.start(0, offset, duration);
      source.onended = () => source.disconnect();
    } catch {
      // Key interaction still works when browser audio is unavailable.
    }
  }

  return <section aria-labelledby="tech-title" className="folio-tech mt-16 sm:mt-20">
    <h2 id="tech-title" className="mb-6 text-xl font-medium tracking-tight">Tech stack</h2>
    <div className="folio-keyboard">
      {rows.map((tools, rowIndex) => <div className="folio-key-row" key={rowIndex}>
        <div className="folio-key-track">
          {[0, 1].map(copy => <ul className="folio-key-group" key={copy} aria-hidden={copy === 1 ? true : undefined} aria-label={copy === 0 ? (rowIndex === 0 ? "Languages and application development" : "Data and development tools") : undefined}>
            {tools.map(([name, icon], toolIndex) => <li className="folio-keycap" data-tone={(toolIndex + rowIndex) % 2 === 1 ? "cobalt" : "neutral"} key={name}>
              <button type="button" className="folio-keycap-face" onPointerDown={event => {
                if (event.button !== 0) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                void playClick("down", toolIndex);
              }} onPointerUp={() => { void playClick("up", toolIndex); }} onPointerCancel={() => { void playClick("up", toolIndex); }} onKeyDown={event => {
                if (!event.repeat && (event.key === "Enter" || event.key === " ")) void playClick("down", toolIndex);
              }} onKeyUp={event => {
                if (event.key === "Enter" || event.key === " ") void playClick("up", toolIndex);
              }} tabIndex={copy === 1 ? -1 : 0}>
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
