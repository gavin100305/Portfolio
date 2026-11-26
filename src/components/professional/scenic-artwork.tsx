import { useEffect, useRef, useState } from "react";
import { scenicArtworks, type ScenicId } from "./artwork-scenes";

export function ScenicArtwork({ id, active }: { id: ScenicId; active: boolean }) {
  const scene = scenicArtworks[id];
  const videoRef = useRef<HTMLVideoElement>(null);
  const syncRef = useRef<() => void>(() => {});
  const intent = useRef<"auto" | "play" | "pause">("auto");
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = videoRef.current;
    if (!element || !active) return;
    const video = element;
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;

    function syncPlayback() {
      const canPlay = visible && !document.hidden && root.dataset.folioIntro !== "pending";
      const wantsMotion = intent.current === "play" || (intent.current === "auto" && !reduced.matches);
      if (canPlay && wantsMotion) {
        if (video.paused) void video.play().catch(() => {});
      } else {
        video.pause();
      }
    }

    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncPlayback();
    });
    const intro = new MutationObserver(syncPlayback);
    visibility.observe(video);
    intro.observe(root, { attributes: true, attributeFilter: ["data-folio-intro"] });
    document.addEventListener("visibilitychange", syncPlayback);
    reduced.addEventListener("change", syncPlayback);
    syncRef.current = syncPlayback;

    return () => {
      syncRef.current = () => {};
      video.pause();
      visibility.disconnect();
      intro.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      reduced.removeEventListener("change", syncPlayback);
    };
  }, [active]);

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    intent.current = video.paused ? "play" : "pause";
    if (video.error) {
      setFailed(false);
      video.load();
    }
    syncRef.current();
  }

  const control = failed ? "Retry video" : playing ? "Pause video" : "Play video";
  return <div className="artwork-scenic">
    <video
      ref={videoRef}
      className="artwork-video"
      src={`/artwork/${scene.file}.mp4`}
      poster={`/artwork/${scene.file}.webp`}
      muted
      loop
      playsInline
      preload="none"
      disablePictureInPicture
      aria-label={scene.description}
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onError={() => setFailed(true)}
    />
    {active && <button type="button" className="artwork-playback" aria-label={control} title={control} onClick={togglePlayback}>
      <span aria-hidden="true">{failed ? "↻" : playing ? "Ⅱ" : "▶"}</span>
    </button>}
  </div>;
}
