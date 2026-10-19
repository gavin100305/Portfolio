import { contourPath, stadiumContour, stadiumPoint, bernabeuEnvelopePoint } from "@/data/bernabeu-shape";

const tau=Math.PI*2;
const envelope=(rx:number,ry:number,cx:number,cy:number)=>Array.from({length:120},(_,i)=>bernabeuEnvelopePoint(i/120*tau,rx,ry,cx,cy));
const roof=envelope(108,66,120,77);
const portal="M0 79H25V98H0Z";

/** The stadium owns its shell and recessed entrance, without generic room walls. */
export function BernabeuExteriorArtwork() {
  return <svg className="room-artwork bernabeu-closed-art" viewBox="0 0 240 176" role="img" aria-label="Enclosed Bernabéu: curved metal envelope, closed central roof and a recessed entrance" shapeRendering="geometricPrecision">
    <defs>
      <linearGradient id="bernabeu-shell-metal" x1=".1" y1="0" x2=".85" y2="1"><stop stopColor="#edf0ef"/><stop offset=".25" stopColor="#a7b6c2"/><stop offset=".5" stopColor="#d6dee2"/><stop offset=".78" stopColor="#8498a9"/><stop offset="1" stopColor="#526b80"/></linearGradient>
      <linearGradient id="bernabeu-facade-metal" x2="0" y2="1"><stop stopColor="#aebdc8"/><stop offset=".45" stopColor="#768d9f"/><stop offset=".7" stopColor="#bdcbd1"/><stop offset="1" stopColor="#526d84"/></linearGradient>
      <linearGradient id="bernabeu-roof-fabric" x2=".4" y2="1"><stop stopColor="#f1f1e7"/><stop offset="1" stopColor="#cbd5d8"/></linearGradient>
      <mask id="bernabeu-tunnel-recess"><rect width="240" height="176" fill="white"/><path d={portal} fill="black"/></mask>
      <clipPath id="bernabeu-entry-clip"><path d={portal}/></clipPath>
    </defs>
    <path d={contourPath(envelope(109,63,120,109))} fill="#091928" opacity=".7"/>
    <g mask="url(#bernabeu-tunnel-recess)">
      <path d={contourPath(envelope(106,63,120,104))} fill="#263e50" stroke="#8aa0af" strokeWidth=".8"/>
      <path d={`${contourPath(roof.slice(0,61),false)}${contourPath(envelope(105,63,120,102).slice(0,61).reverse(),false).replace(/^M/,"L")}Z`} fill="url(#bernabeu-facade-metal)"/>
      {Array.from({length:19},(_,i)=><path key={i} d={contourPath(Array.from({length:81},(_,j)=>{const a=j/80*Math.PI;const p=bernabeuEnvelopePoint(a,108-i*.13,65-i*.1,120,78+i*1.35);return {x:p.x,y:p.y+Math.sin(a*2+.3)*Math.sin(i/18*Math.PI)*2};}),false)} fill="none" stroke={i%4===0?"#e1e6e6":"#4d697c"} strokeWidth={i%4===0?.45:.3} opacity=".65"/>)}
      <path d={contourPath(roof)} fill="url(#bernabeu-shell-metal)" stroke="#8095a6" strokeWidth=".8"/>
      {/* Concentric, changing contours follow the broad curved fixed roof. */}
      {Array.from({length:30},(_,i)=>{const t=i/29;return <path key={i} d={contourPath(Array.from({length:120},(_,j)=>{
        const a=j/120*tau,outer=bernabeuEnvelopePoint(a,107,65,120,77),inner=stadiumPoint(a,45,32,12,117,69);
        return {x:outer.x*(1-t)+inner.x*t,y:outer.y*(1-t)+inner.y*t};
      }))} fill="none" stroke={i%3===0?"#eff2ef":"#718b9f"} strokeWidth={i%3===0?.5:.32} opacity=".6"/>;})}
      <path d={contourPath(stadiumContour(45,32,12,117,69))} fill="#3d556c" stroke="#cedbe0" strokeWidth=".8"/>
      <path d={contourPath(stadiumContour(42,29,12,117,69))} fill="url(#bernabeu-roof-fabric)"/>
      {[-2,-1,0,1,2].map(i=><g key={i} stroke="#97aaba" strokeWidth=".35"><path d={`M${117+i*14} 42v54`}/><path d={`M77 ${69+i*9}h80`}/></g>)}
      <path d="M117 41v56" stroke="#586e83" strokeWidth=".7"/>
      <text x="120" y="161" textAnchor="middle" fill="#edf0ec" fontSize="6.3" letterSpacing="2" fontFamily="var(--font-pixel),monospace">BERNABÉU</text>
    </g>
    {/* One entrance: the existing corridor terminates beneath this overhang. */}
    <path d="M0 79h25v19H0" fill="#142638"/>
    <path d="M0 84h24v9H0" fill="#d7d5c3"/>
    <g data-door-id="airlock-11" data-state="closed" role="img" aria-label="Stadium entrance: closed" clipPath="url(#bernabeu-entry-clip)" className="bernabeu-entry-door">
      <rect className="bernabeu-entry-leaf-top" x="15" y="80" width="7" height="8" fill="#314b63" stroke="#7e98a9" strokeWidth=".6"/>
      <rect className="bernabeu-entry-leaf-bottom" x="15" y="88" width="7" height="8" fill="#314b63" stroke="#7e98a9" strokeWidth=".6"/>
    </g>
    <path d="M0 78h26v2H0M0 97h26v2H0" fill="#a8bac4"/><path d="M24 80v17" stroke="#253e53" strokeWidth="2"/>
  </svg>;
}

const tiers=[{rx:111,ry:80,p:2.65},{rx:102,ry:73,p:2.8},{rx:91,ry:64,p:3.2},{rx:79,ry:54,p:4.6}];
const ring=(outer:typeof tiers[number],inner:typeof tiers[number])=>contourPath(stadiumContour(outer.rx,outer.ry,outer.p,120,86))+contourPath(stadiumContour(inner.rx,inner.ry,inner.p,120,86).reverse());

export function BernabeuBowl({ goals = 0, saves = 0 }: { goals?: number | string; saves?: number | string }) {
  return <g className="bernabeu-bowl">
    <defs>
      <linearGradient id="bernabeu-stand-depth" x2="0" y2="1"><stop stopColor="#1b2949"/><stop offset=".5" stopColor="#3f6087"/><stop offset="1" stopColor="#14243c"/></linearGradient>
      <linearGradient id="bernabeu-turf" x2="1" y2="1"><stop stopColor="#2f6d4e"/><stop offset="1" stopColor="#194935"/></linearGradient>
      <clipPath id="bernabeu-pitch-clip"><rect x="53" y="49" width="134" height="88"/></clipPath>
      <mask id="bernabeu-bowl-entrance"><rect width="240" height="176" fill="white"/><path d="M0 79h45v15H0" fill="black"/></mask>
      <path id="bernabeu-upper-led" d={contourPath(Array.from({length:81},(_,i)=>stadiumPoint(Math.PI+i/80*Math.PI,89,62,3.4,120,86)),false)}/>
      <path id="bernabeu-lower-seats" d={contourPath(Array.from({length:81},(_,i)=>stadiumPoint(Math.PI-i/80*Math.PI,101,72,2.8,120,86)),false)}/>
    </defs>
    <g mask="url(#bernabeu-bowl-entrance)">
      <path d={contourPath(stadiumContour(116,84,2.65,120,88))} fill="#0a1424"/>
      <path d={contourPath(stadiumContour(113,81,2.65,120,85))} fill="#a0b2c1" stroke="#d5dfe3" strokeWidth="1.2"/>
      <path d={contourPath(stadiumContour(110,78,2.65,120,86))} fill="url(#bernabeu-stand-depth)"/>
      {tiers.slice(0,3).map((tier,index)=>{
        const next=tiers[index+1];
        return <g key={index}>
          <path d={ring(tier,next)} fill={index===0?"#253c5b":index===1?"#314c70":"#1c3655"} fillRule="evenodd"/>
          {Array.from({length:3},(_,row)=>{
            const t=(row+.4)/3;const rx=tier.rx*(1-t)+next.rx*t,ry=tier.ry*(1-t)+next.ry*t,p=tier.p*(1-t)+next.p*t;
            return <g key={row}>{Array.from({length:120},(_,seat)=>{
              if(seat%15===0||seat%15===1)return null;
              const a=seat/120*tau;const pos=stadiumPoint(a,rx,ry,p,120,86);
              return <rect key={seat} x={pos.x-.8} y={pos.y-.65} width="1.6" height="1.3" rx=".2" fill={seat%7===0?"#91a6bc":row===0?"#688baa":"#47729b"}/>;
            })}</g>;
          })}
          <path d={contourPath(stadiumContour(next.rx,next.ry,next.p,120,86))} fill="none" stroke="#0d2038" strokeWidth="2.1"/>
          <path d={contourPath(stadiumContour(next.rx+.5,next.ry+.6,next.p,120,85.5))} fill="none" stroke="#96a8b6" strokeWidth=".5"/>
        </g>;
      })}
      {Array.from({length:16},(_,i)=>{const a=i/16*tau;const o=stadiumPoint(a,110,79,2.65,120,86),p=stadiumPoint(a,80,55,4.6,120,86);return <path key={i} d={`M${o.x} ${o.y}L${p.x} ${p.y}`} stroke="#17283d" strokeWidth="1.2"/>;})}
      <path d={contourPath(stadiumContour(78,53,4.6,120,87))} fill="#142a31"/>
      <rect x="53" y="49" width="134" height="88" fill="url(#bernabeu-turf)"/>
      <g clipPath="url(#bernabeu-pitch-clip)">{Array.from({length:8},(_,i)=><rect key={i} x="53" y={49+i*11} width="134" height="5.5" fill="#78ac6c" opacity=".12"/>)}</g>
      <rect x="56" y="52" width="128" height="82" fill="none" stroke="#ecf1d9" strokeWidth=".9"/>
      <path d="M56 93h128M90 52v31h60V52M103 52v11h34V52M101 83a22 22 0 0 0 38 0M90 134v-23h60v23M104 134v-9h32v9" fill="none" stroke="#edf2dd" strokeWidth=".9"/>
      <circle cx="120" cy="93" r="12" fill="none" stroke="#edf2dd" strokeWidth=".9"/>
      <circle cx="118" cy="80" r="1" fill="#ecf1d9"/>
      <rect x="88" y="32" width="60" height="17" fill="#18333a" stroke="#eff1e9" strokeWidth="1.1"/>
      <path d="M87 50h62" stroke="#f2f2e7" strokeWidth="1.2"/>
      <rect x="108" y="134" width="24" height="4" fill="none" stroke="#dfe7db" strokeWidth=".7"/>
      {/* Suspended continuous halo, with the field visible through its centre. */}
      <path d={contourPath(stadiumContour(87,61,3.5,120,86))} fill="none" stroke="#080f24" strokeWidth="5"/>
      <path d={contourPath(stadiumContour(88,62,3.5,120,85.5))} fill="none" stroke="#8d98bd" strokeWidth=".5"/>
      <text fill="#e9eef4" fontSize="3.9" letterSpacing=".65" fontFamily="var(--font-pixel),monospace"><textPath href="#bernabeu-upper-led" startOffset="50%" textAnchor="middle">BERNABÉU · GOALS {goals} · SAVES {saves}</textPath></text>
      <text fill="#ecf0e6" fontSize="5.7" letterSpacing="1" fontFamily="var(--font-pixel),monospace"><textPath href="#bernabeu-lower-seats" startOffset="50%" textAnchor="middle">REAL MADRID C. F.</textPath></text>
      {/* Roof trusses radiate over the upper tier and finish inside the hull. */}
      {Array.from({length:24},(_,i)=>{const a=i/24*tau,o=stadiumPoint(a,112,80,2.65,120,85),p=stadiumPoint(a,105,74,2.8,120,86);return <path key={i} d={`M${o.x} ${o.y}L${p.x} ${p.y}`} stroke="#bdcbd3" strokeWidth=".7"/>;})}
    </g>
    <path d="M0 79h43v15H0" fill="#a6afb0"/><path d="M0 82h43v9H0" fill="#e3dfca"/><path d="M0 86.5h43" stroke="#f2eddb" strokeWidth=".5" strokeDasharray="2 3"/>
  </g>;
}

export function BernabeuInteriorArtwork({goals=0,saves=0}:{goals?:number|string;saves?:number|string}) {
  return <svg className="room-artwork bernabeu-interior-art" viewBox="0 0 240 176" role="img" aria-label="Inside the Bernabéu: three curved seating tiers, suspended video halo and football pitch" shapeRendering="geometricPrecision"><BernabeuBowl goals={goals} saves={saves}/></svg>;
}
