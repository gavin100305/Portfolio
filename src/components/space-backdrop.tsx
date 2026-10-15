import type { CSSProperties, RefObject } from "react";
import { moods, type SpaceMood } from "@/components/use-space-mood";

// Stable seeds keep server/client output identical and avoid synchronized streaks.
function seed(index: number, salt: number) {
  let value = Math.imul(index + 1, 374761393) ^ Math.imul(salt, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

function Stars({ count, drifting = false }: { count: number; drifting?: boolean }) {
  return <svg className={`sky-stars${drifting ? " sky-stars-drifting" : ""}`} viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges">
    {Array.from({ length: count }, (_, i) => <rect key={i} x={Math.round(seed(i, 3) * 1200)} y={Math.round(seed(i, 7) * 900)} width={i % 13 === 0 ? 2 : 1} height={i % 13 === 0 ? 2 : 1} fill="currentColor" opacity={.3 + seed(i, 11) * .6} />)}
  </svg>;
}

function OrbitPlanet() {
  return <div className="sky-orbit-system">
    <svg className="sky-orbit-planet" viewBox="0 0 600 600">
      <defs>
        <clipPath id="sky-orbit-disc"><circle cx="300" cy="300" r="187" /></clipPath>
        <radialGradient id="sky-orbit-ocean" cx="28%" cy="24%" r="80%"><stop stopColor="#4aabb7" /><stop offset=".38" stopColor="#225b80" /><stop offset=".76" stopColor="#122b4b" /><stop offset="1" stopColor="#080f23" /></radialGradient>
        <linearGradient id="sky-orbit-shadow"><stop offset=".25" stopColor="#030911" stopOpacity="0" /><stop offset=".68" stopColor="#030911" stopOpacity=".22" /><stop offset="1" stopColor="#030911" stopOpacity=".9" /></linearGradient>
      </defs>
      <g transform="rotate(-23 300 300)">
        <ellipse cx="300" cy="300" rx="285" ry="72" fill="none" stroke="#5b899f" strokeWidth="20" opacity=".35" />
        <ellipse cx="300" cy="300" rx="268" ry="65" fill="none" stroke="#b1d7df" strokeWidth="3" opacity=".6" />
      </g>
      <circle cx="300" cy="300" r="191" fill="#5cd7e5" opacity=".12" />
      <circle cx="300" cy="300" r="187" fill="url(#sky-orbit-ocean)" />
      <g clipPath="url(#sky-orbit-disc)" shapeRendering="crispEdges">
        <g className="sky-cloud-bands">
          <path d="M104 181h48v-12h42v-9h72v14h30v18h-38v16h-44v12h-50v-16h-60zM342 218h52v-14h62v16h42v24h-32v12h-58v-16h-34v16h-32zM126 314h46v-16h54v12h28v24h-36v16h-42v28h-30v-16h-20zM310 356h36v-20h50v14h54v18h-30v14h-36v32h-34v-20h-40zM220 440h48v-10h40v20h-22v18h-66z" fill="#559b9c" opacity=".7" />
          <path d="M108 230h52v8h50v8h80v8h58v8h138v8H342v-6h-70v-8h-76v-8h-88zM122 282h110v8h60v-6h68v10h126v8H356v-8h-64v6h-68v-10H122zM118 386h50v8h82v8h98v-6h120v8H350v6H240v-8h-80v-8h-42z" fill="#c6edeb" opacity=".7" />
          <path d="M152 148h80v6h-80zM192 172h58v5h-58zM346 236h70v6h-70zM178 326h50v5h-50zM324 370h60v5h-60z" fill="#a7d5ca" opacity=".65" />
        </g>
        <circle cx="300" cy="300" r="187" fill="url(#sky-orbit-shadow)" />
      </g>
      <path d="M154 183a187 187 0 0 1 226-52" fill="none" stroke="#a5f3ff" strokeWidth="3" opacity=".8" />
      <g className="sky-ring" transform="rotate(-23 300 300)">
        <path d="M15 300a285 72 0 0 0 570 0" fill="none" stroke="#72a9bc" strokeWidth="19" opacity=".65" />
        <path d="M15 300a285 72 0 0 0 570 0" fill="none" stroke="#d0e7df" strokeWidth="3" opacity=".85" />
        <path d="M32 300a268 65 0 0 0 536 0" fill="none" stroke="#4DCFFF" strokeWidth="2" opacity=".55" />
      </g>
    </svg>
    <div className="sky-orbit-moon"><span /><i /></div>
    <div className="sky-orbit-moon sky-orbit-moon-small"><span /><i /></div>
  </div>;
}

function NebulaPlanet() {
  return <div className="sky-nebula-planet-drift"><svg className="sky-nebula-planet" viewBox="0 0 240 180">
    <defs><radialGradient id="sky-nebula-disc" cx="30%" cy="25%"><stop stopColor="#a09acb" /><stop offset=".5" stopColor="#555482" /><stop offset="1" stopColor="#17162d" /></radialGradient><clipPath id="sky-nebula-clip"><circle cx="120" cy="90" r="49" /></clipPath></defs>
    <ellipse cx="120" cy="94" rx="106" ry="24" transform="rotate(-24 120 94)" fill="none" stroke="#a78cce" strokeWidth="9" opacity=".35" />
    <circle cx="120" cy="90" r="49" fill="url(#sky-nebula-disc)" />
    <g clipPath="url(#sky-nebula-clip)" fill="none" stroke="#cfb9eb" opacity=".2"><path d="M72 68q46-15 100 12M70 92q46-12 100 10M80 112q46-8 90 8" strokeWidth="5" /></g>
    <path d="M84 56a49 49 0 0 1 63-7" fill="none" stroke="#d8b6f3" strokeWidth="2" opacity=".8" />
    <path d="M23 123q-6 24 103-11t91-47" fill="none" stroke="#d2b4e5" strokeWidth="3" opacity=".75" />
  </svg></div>;
}

function SpaceSparks() {
  return <svg className="sky-sparks" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges">
    {Array.from({ length: 14 }, (_, i) => <g key={i} className="sky-spark" style={{ animationDelay: `${-seed(i, 43) * 12}s`, animationDuration: `${6 + seed(i, 47) * 8}s` }} transform={`translate(${Math.round(seed(i, 53) * 1200)} ${Math.round(seed(i, 59) * 900)})`}><path d="M-3 0h7M0-3v7" stroke="currentColor" strokeWidth="1" opacity=".5" /><rect x="0" y="0" width="1" height="1" fill="#fff5ff" /></g>)}
  </svg>;
}

function MeteorSky() {
  return <>
    <div className="sky-sun-corona"><div className="sky-sun" /></div>
    <div className="sky-meteor-haze" />
    {Array.from({ length: 11 }, (_, i) => <div key={i} className={`sky-meteor-track${i % 5 === 0 ? " sky-meteor-prominent" : ""}`} style={{
      left: `${-20 + seed(i, 13) * 100}%`, top: `${-12 + seed(i, 17) * 88}%`,
      "--meteor-angle": `${24 + seed(i, 19) * 30}deg`,
      "--meteor-period": `${8 + seed(i, 23) * 15}s`,
      "--meteor-delay": `${-seed(i, 29) * 24}s`,
      "--meteor-length": `${44 + seed(i, 31) * 100}px`,
      "--meteor-distance": `${320 + seed(i, 37) * 500}px`,
      "--meteor-color": i % 3 === 0 ? "#FF8A24" : i % 3 === 1 ? "#FFD47A" : "#FFF1CF",
    } as CSSProperties}><span className="sky-meteor"><i /></span></div>)}
  </>;
}

export function SpaceBackdrop({ backdropRef, mood }: { backdropRef: RefObject<HTMLDivElement | null>; mood: SpaceMood }) {
  return <div ref={backdropRef} className="space-backdrop" aria-hidden="true">
    {moods.map(({ id }) => <div key={id} className="space-scene" data-sky={id} data-active={id === mood}>
      {id === "deep-space" && <><div className="sky-dark-planet sky-dark-planet-one" /><div className="sky-dark-planet sky-dark-planet-two" /><Stars count={52} /><Stars count={6} drifting /></>}
      {id === "nebula-drift" && <><div className="sky-nebula-depth sky-nebula-far"><div className="sky-nebula-cloud" /></div><div className="sky-nebula-depth sky-nebula-middle"><div className="sky-nebula-cloud" /></div><div className="sky-nebula-depth sky-nebula-near"><div className="sky-nebula-cloud" /></div><div className="sky-nebula-rift" /><svg className="sky-nebula-filaments" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice"><defs><filter id="sky-cloud-soften"><feGaussianBlur stdDeviation="16" /></filter></defs><g fill="none" filter="url(#sky-cloud-soften)"><path d="M-120 390C60 430 66 202 216 240S378 58 540 96" stroke="#a864be" strokeWidth="45" opacity=".19" /><path d="M-80 370C90 386 94 228 210 250S356 100 500 102" stroke="#d79ac8" strokeWidth="12" opacity=".22" /><path d="M720 920C640 730 924 840 930 634S1140 632 1280 450" stroke="#8252b7" strokeWidth="64" opacity=".2" /></g></svg><NebulaPlanet /><Stars count={130} /><Stars count={26} drifting /><SpaceSparks /></>}
      {id === "meteor-shower" && <><MeteorSky /><Stars count={95} /></>}
      {id === "planetary-orbit" && <><div className="sky-orbit-haze" /><OrbitPlanet /><Stars count={96} /><Stars count={24} drifting /><SpaceSparks /></>}
    </div>)}
  </div>;
}
