"use client";

import { useEffect, useRef, useState } from "react";
import "@/app/station-music.css";

const preferenceKey = "gavin:station-music";
const volumeKey = "gavin:station-music-volume";
function savedEnabled() { try { return typeof window === "undefined" || localStorage.getItem(preferenceKey) !== "off"; } catch { return true; } }
function savedVolume() { try { const raw=localStorage.getItem(volumeKey);const value=raw===null?18:Number(raw);return Number.isFinite(value)?Math.min(35,Math.max(1,value)):18; } catch { return 18; } }

/** Called synchronously from the welcome click, preserving browser audio activation. */
export function startStationMusic() { window.dispatchEvent(new Event("station:music-start")); }

export function StationMusic({ ready }: { ready:boolean }) {
  const element = useRef<HTMLSpanElement>(null);
  const actions = useRef<{ start:()=>void; toggle:()=>void; volume:(value:number)=>void } | null>(null);
  const [enabled,setEnabled] = useState(savedEnabled);
  const [volume,setVolume] = useState(savedVolume);
  const [playing,setPlaying] = useState(false);
  useEffect(() => {
    const host=element.current;
    if(!host) return;
    // A fresh media element also supports React Strict Mode’s setup/cleanup replay.
    const audio=new Audio("/audio/quiet-orbit.m4a");
    audio.loop=true;audio.preload="none";audio.setAttribute("aria-hidden","true");host.append(audio);
    let wanted=savedEnabled(),level=savedVolume()/100,started=false,disposed=false;
    let context:AudioContext|null=null,gain:GainNode|null=null;
    let pauseTimer:ReturnType<typeof setTimeout>|null=null;
    audio.volume=0;
    const clearPause=()=>{if(pauseTimer)clearTimeout(pauseTimer);pauseTimer=null;};
    const ensureGraph=()=>{
      if(!context && typeof AudioContext!=="undefined") {
        try {
          context=new AudioContext();gain=context.createGain();gain.gain.value=0;
          context.createMediaElementSource(audio).connect(gain);gain.connect(context.destination);audio.volume=1;
        } catch { context?.close();context=null;gain=null;audio.volume=level; }
      }
    };
    const target=()=>{
      if(!wanted || document.hidden || document.querySelector(".station-return-journey")) return 0;
      return document.querySelector(".info-page,[data-station-overlay]")?level*.4:level;
    };
    const fade=()=>{
      const value=target();
      if(gain && context) { gain.gain.cancelScheduledValues(context.currentTime);gain.gain.setTargetAtTime(value,context.currentTime,.55); }
      else audio.volume=value;
    };
    const play=()=>{
      started=true;
      if(!wanted || document.hidden || disposed) return;
      clearPause();ensureGraph();
      if(context?.state==="suspended") void context.resume().catch(()=>{});
      void audio.play().then(()=>{if(!disposed)fade();}).catch(()=>{if(!disposed)setPlaying(false);});
    };
    const stop=()=>{
      clearPause();fade();
      pauseTimer=setTimeout(()=>{audio.pause();pauseTimer=null;},1800);
    };
    const toggle=()=>{
      wanted=!(wanted && !audio.paused);setEnabled(wanted);
      try {localStorage.setItem(preferenceKey,wanted?"on":"off");} catch {}
      if(wanted)play();else stop();
    };
    const changeVolume=(value:number)=>{
      level=value/100;setVolume(value);
      try {localStorage.setItem(volumeKey,String(value));} catch {}
      fade();
    };
    const visibility=()=>{
      if(document.hidden){clearPause();audio.pause();if(gain && context)gain.gain.setValueAtTime(0,context.currentTime);void context?.suspend().catch(()=>{});}
      else if(started && wanted)play();
    };
    const storage=(event:StorageEvent)=>{
      if(event.key===preferenceKey){wanted=savedEnabled();setEnabled(wanted);if(wanted && started)play();else stop();}
      if(event.key===volumeKey){level=savedVolume()/100;setVolume(Math.round(level*100));fade();}
    };
    const onPlaying=()=>{if(!disposed)setPlaying(true);};
    const onPause=()=>{if(!disposed)setPlaying(false);};
    const observer=new MutationObserver(fade);
    observer.observe(document.body,{subtree:true,childList:true});
    actions.current={start:play,toggle,volume:changeVolume};
    window.addEventListener("station:music-start",play);
    window.addEventListener("storage",storage);
    document.addEventListener("visibilitychange",visibility);
    audio.addEventListener("playing",onPlaying);audio.addEventListener("pause",onPause);
    return ()=>{
      disposed=true;actions.current=null;clearPause();observer.disconnect();
      window.removeEventListener("station:music-start",play);window.removeEventListener("storage",storage);
      document.removeEventListener("visibilitychange",visibility);
      audio.removeEventListener("playing",onPlaying);audio.removeEventListener("pause",onPause);
      audio.pause();audio.removeAttribute("src");audio.load();audio.remove();void context?.close().catch(()=>{});
    };
  }, []);
  const active=enabled && playing;
  return <>
    <span ref={element} hidden aria-hidden="true"/>
    {ready && <div className="station-music" data-playing={active}>
      <button className="station-music-toggle" type="button" aria-pressed={active} aria-label={active?"Mute station music":"Play station music"} onClick={()=>actions.current?.toggle()} title="Quiet Orbit · original station soundtrack">
        <span className="station-music-bars" aria-hidden="true"><i/><i/><i/><i/></span><span>{active?"Quiet Orbit":"Music off"}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/>{active?<path d="M17 8q5 4 0 8"/>:<path d="m17 9 5 6m0-6-5 6"/>}</svg>
      </button>
      <details className="station-music-settings"><summary aria-label="Music volume settings" title="Music volume"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4v16M12 4v16M19 4v16M2 9h6m1 7h6m1-9h6"/></svg></summary><div><label htmlFor="station-music-volume">Volume <span>{volume}%</span></label><input id="station-music-volume" type="range" min="1" max="35" value={volume} onChange={event=>actions.current?.volume(Number(event.target.value))}/><p>Quiet Orbit<br/><span>Original ambient loop</span></p></div></details>
    </div>}
  </>;
}
