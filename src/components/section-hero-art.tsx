import type { InfoSectionId } from "@/components/portfolio-page";

const palette = { ink: "#263c53", edge: "#829cb0", face: "#f5f2e6", screen: "#18384b", blue: "#4b75b8", cyan: "#75cfff", gold: "#f2c577" };

/** Six original station instruments. Shared materials, distinct silhouettes;
 * decorative only, with all portfolio text kept in HTML.
 */
export function SectionHeroArt({ section }: { section: InfoSectionId }) {
  const p = palette;
  return <svg viewBox="0 0 400 270" className="section-hero-art" aria-hidden="true" focusable="false">
    <ellipse cx="204" cy="245" rx="132" ry="10" fill="#263c53" opacity=".09" />
    <g stroke={p.ink} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
      {section === "projects" && <>
        <path d="M54 79h292v145H54Z" fill="#bccbd0" />
        <path d="M54 65h292v148H54Z" fill={p.face} />
        <path d="M65 65V49h270v16" fill={p.edge} />
        <path d="M64 203h272" stroke={p.edge} />
        {[78, 163, 248].map((x, i) => <g key={x}>
          <rect x={x} y="86" width="74" height="96" rx="5" fill={p.screen} />
          <path d={`M${x + 9} 98h56v48h-56Z`} fill={i === 1 ? "#456b9a" : "#2b5865"} stroke="none" />
          <path d={`M${x + 13} 157h34m-34 9h47`} stroke="#acc7d4" strokeWidth="3" />
          <circle cx={x + 59} cy="157" r="3" fill={p.gold} stroke="none" className="hero-instrument-light" />
        </g>)}
        <path d="m94 119 13-10 13 10-13 10Z" fill={p.cyan} /><path d="M184 130v-16h11v-8h11v24" fill={p.gold} stroke="none" />
        <path d="m269 121 10-12m0 24 10-12m-14-13 9 26" stroke={p.cyan} />
        <path d="M82 214v15h28v-15m180 0v15h28v-15" fill={p.ink} /><path d="M161 55h78" stroke="#dbe8eb" strokeWidth="4" />
      </>}
      {section === "achievements" && <>
        <path d="M80 54h240v172H80Z" fill="#bccbd0" /><path d="M71 42h258v174H71Z" fill={p.face} />
        <rect x="86" y="58" width="228" height="138" rx="6" fill={p.screen} />
        {[126, 200, 274].map((x, index) => <g key={x}>
          <path d={`M${x - 13} 79h26v45l-13 12-13-12Z`} fill={index === 1 ? p.blue : "#638795"} stroke="#bdd2dc" />
          <path d={`M${x - 13} 79h8v43l5 6m5-49v43l-5 6`} fill="none" stroke={p.face} strokeWidth="2" />
          <path d={`m${x} 112 18 8 7 19-7 18-18 8-18-8-7-18 7-19Z`} fill={index === 1 ? p.gold : "#b6c7d0"} />
          <circle cx={x} cy="139" r="17" fill={index === 1 ? "#ffe6a8" : "#e9f0ed"} stroke="#688394" strokeWidth="1.5" />
          <path d={`m${x} 128 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z`} fill={p.ink} stroke="none" />
        </g>)}
        <path d="M104 205h192" stroke={p.edge} /><path d="M102 217v14h196v-14" fill={p.edge} />
        <rect x="174" y="45" width="52" height="5" rx="2" fill={p.cyan} stroke="none" className="hero-instrument-light" />
      </>}
      {section === "stack" && <>
        <path d="M84 48h232v178H84Z" fill="#b4c9c8" /><path d="M76 38h248v178H76Z" fill="#dfe9df" />
        <path d="M91 55h218v145H91Z" stroke="#9ab7b3" fill="none" />
        <g stroke="#7eaaa6" fill="none" strokeWidth="3"><path d="M114 81h41v29h22m-65 51h42v-28h23m47-23h31V77h29m-60 56h29v35h31M200 66v22m0 70v31" /></g>
        {[110, 275].map(x => <g key={x}><rect x={x} y="70" width="23" height="24" rx="3" fill={p.blue} /><rect x={x} y="151" width="23" height="23" rx="3" fill={p.face} /><path d={`M${x + 5} 77h13m-13 7h13`} stroke="#a9d7ed" strokeWidth="2" /></g>)}
        <rect x="162" y="86" width="76" height="76" rx="6" fill={p.screen} />
        <rect x="177" y="101" width="46" height="46" rx="3" fill={p.blue} stroke="#a7c9d8" />
        <path d="m190 119 10-8 10 8v11l-10 8-10-8Z" fill={p.cyan} stroke="none" />
        {[174, 187, 200, 213, 226].map(x => <path key={x} d={`M${x} 77v9m0 76v9M153 ${x - 72}h9m76 0h9`} stroke={p.ink} strokeWidth="3" />)}
        <circle cx="294" cy="187" r="4" fill={p.gold} stroke="none" className="hero-instrument-light" />
        <g fill={p.face} stroke={p.edge}><circle cx="87" cy="49" r="3" /><circle cx="313" cy="49" r="3" /><circle cx="87" cy="205" r="3" /><circle cx="313" cy="205" r="3" /></g>
      </>}
      {section === "experience" && <>
        <path d="M99 52h218v181H99Z" fill="#bccbd0" /><path d="M87 40h218v180H87Z" fill={p.face} />
        <path d="M87 40h34v180H87Z" fill={p.edge} /><path d="M99 59v144" stroke="#cddde0" strokeWidth="3" />
        <rect x="141" y="58" width="143" height="35" rx="4" fill={p.screen} />
        <path d="M153 71h64m-64 10h96" stroke="#b4d7e6" strokeWidth="3" /><circle cx="269" cy="75" r="4" fill={p.gold} stroke="none" className="hero-instrument-light" />
        <path d="M155 113v79" stroke={p.blue} strokeWidth="3" />
        {[118, 151, 184].map((y, index) => <g key={y}><circle cx="155" cy={y} r="6" fill={index === 0 ? p.cyan : p.face} /><path d={`M173 ${y - 4}h95m-95 9h${index === 1 ? 58 : 75}`} stroke={index === 0 ? p.ink : p.edge} strokeWidth="3" /></g>)}
        <path d="M228 40V24h40v16m0 180v14h-40v-14" fill={p.blue} />
        <path d="M78 65H68v22h10m0 45H68v22h10m0 45H68v22h10" fill={p.screen} />
      </>}
      {section === "about" && <>
        <path d="M89 53h222v175H89Z" fill="#bccbd0" /><path d="M80 43h222v175H80Z" fill={p.face} />
        <path d="M163 43V31h56v12" fill={p.edge} /><path d="M174 36h34" stroke={p.ink} strokeWidth="3" />
        <rect x="96" y="61" width="112" height="139" rx="7" fill={p.screen} />
        <path d="M126 105v-14h14V79h25v12h14v14h8v38h-8v13h-53v-13h-8v-38Z" fill="#eaf0ed" />
        <path d="M128 106h51v29h-51Z" fill="#274f6c" stroke="#8ba7b9" /><path d="M136 113h22m-22 7h12" stroke={p.cyan} strokeWidth="3" />
        <path d="M137 157v26h32v-26m-32 16h32" fill={p.blue} /><path d="M139 167h10m7 0h10" stroke={p.face} strokeWidth="4" />
        <path d="M224 77h61m-61 12h45M224 119h61m-61 12h52m-52 12h61" stroke={p.edge} strokeWidth="4" />
        <rect x="224" y="166" width="61" height="22" rx="4" fill="#dcebdc" stroke="#96b5aa" /><path d="m236 177 5 5 10-12" stroke="#4e8777" fill="none" />
        <circle cx="281" cy="51" r="3" fill={p.gold} stroke="none" className="hero-instrument-light" />
      </>}
      {section === "contact" && <>
        <path d="M67 157h266v73H67Z" fill="#bccbd0" /><path d="M58 146h266v73H58Z" fill={p.face} />
        <rect x="73" y="160" width="120" height="43" rx="4" fill={p.screen} /><path d="m85 182 12-9 12 18 12-18 12 18 12-18 12 9h23" fill="none" stroke={p.cyan} strokeWidth="3" />
        <rect x="209" y="159" width="96" height="44" rx="4" fill={p.blue} /><path d="M222 172h54m-54 10h38" stroke="#d2e9ed" strokeWidth="3" />
        <circle cx="291" cy="189" r="4" fill={p.gold} stroke="none" className="hero-instrument-light" />
        <path d="M175 146v-22m-19 22h38" stroke={p.ink} strokeWidth="8" />
        <path d="M113 69q47 100 131 13l-131-13Z" fill={p.edge} /><path d="m113 69 131 13" stroke="#cadde5" strokeWidth="5" />
        <path d="M177 79l26-38" stroke={p.ink} strokeWidth="5" /><circle cx="205" cy="38" r="6" fill={p.cyan} />
        <g fill="none" stroke="#638bac" strokeWidth="3"><path d="M226 36q20 2 23 23m-14-40q36 4 41 40m-32-57q54 9 60 58" /></g>
        <path d="M86 219v12h24v-12m168 0v12h24v-12" fill={p.screen} />
      </>}
    </g>
  </svg>;
}
