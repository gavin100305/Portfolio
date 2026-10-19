import * as THREE from "three";
import { stadiumPoint, bernabeuEnvelopePoint } from "@/data/bernabeu-shape";

/** Continuous, curved stainless envelope based on the renovated Bernabéu. */
export function addBernabeuModel(parent: THREE.Group, width: number, depth: number, trackGeometry: (g: THREE.BufferGeometry) => void, trackMaterial: (m: THREE.Material) => void, trackTexture: (t: THREE.Texture) => void) {
  const material = (color: string, metalness = .5, roughness = .55) => {
    const m = new THREE.MeshStandardMaterial({ color, metalness, roughness }); trackMaterial(m); return m;
  };
  const silver = material("#adb8c4",.65,.5), rim = material("#d6dee3",.6,.4), dark = material("#182536",.3,.5), glazing=material("#223b49",.45,.32), roof=material("#e1e4df",.2,.7);
  function mesh(g: THREE.BufferGeometry,m: THREE.Material,x=0,y=0,z=0, container:THREE.Group=parent) {
    trackGeometry(g);const item=new THREE.Mesh(g,m);item.position.set(x,y,z);item.castShadow=true;item.receiveShadow=true;container.add(item);return item;
  }
  // Profile wraps the façade up and over its shoulders into the fixed roof.
  const profile = [
    {r:.86,y:.015},{r:.90,y:.10},{r:.97,y:.20},{r:1,y:.32},
    {r:.99,y:.44},{r:.96,y:.54},{r:.87,y:.61},{r:.75,y:.64},{r:.61,y:.65},
  ];
  const steps=128;
  function point(angle:number,row:number) {
    const lower=Math.min(profile.length-2,Math.floor(row));const blend=row-lower;
    const a=profile[lower],b=profile[lower+1];const r=THREE.MathUtils.lerp(a.r,b.r,blend);
    const y=THREE.MathUtils.lerp(a.y,b.y,blend);
    let p=bernabeuEnvelopePoint(angle,width*.49*r,depth*.49*r,0,0);
    if(row>6) {
      const blend=(row-6)/2;
      const shoulder=bernabeuEnvelopePoint(angle,width*.49*.87,depth*.49*.87,0,0);
      const opening=stadiumPoint(angle,width*.205,depth*.245,12,-width*.025,-depth*.025);
      p={x:THREE.MathUtils.lerp(shoulder.x,opening.x,blend),y:THREE.MathUtils.lerp(shoulder.y,opening.y,blend)};
    }
    const wave=(Math.sin(angle+.6)*.04 + Math.cos(angle*2-.2)*.035) * Math.sin(Math.min(1,y/.65)*Math.PI);
    return new THREE.Vector3(p.x,y+wave,p.y);
  }
  function surface(rowStart:number,rowEnd:number,m:THREE.Material) {
    const vertices:number[]=[];const indices:number[]=[];const uv:number[]=[];
    for(let i=0;i<=steps;i++) for(const row of [rowStart,rowEnd]) {const p=point(i/steps*Math.PI*2,row);vertices.push(p.x,p.y,p.z);uv.push(i/steps,row/8);}
    for(let i=0;i<steps;i++){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
    const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();mesh(g,m);
  }
  // Thin, nearly flush louvres read as a single sculpted surface, not floors.
  for(let band=0;band<64;band++) {
    const a=band/64*8,b=(band+1)/64*8;
    surface(a,b-.011,band%8===0?rim:silver);
    surface(b-.011,b,dark);
  }
  // Glazed undercroft and a broad recessed entrance beneath the west overhang.
  const foot=new THREE.Shape();const outline=Array.from({length:128},(_,i)=>bernabeuEnvelopePoint(i/128*Math.PI*2,width*.43,depth*.43,0,0));
  foot.setFromPoints(outline.map(p=>new THREE.Vector2(p.x,-p.y)));
  const base=mesh(new THREE.ExtrudeGeometry(foot,{depth:.14,bevelEnabled:false,curveSegments:8}),glazing);base.rotation.x=-Math.PI/2;base.position.y=-.11;
  // Recessed opening: the fixed metal roof meets its rim instead of a raised slab.
  const openingX=-width*.025,openingZ=-depth*.025;
  function ring(rx:number,rz:number,ix:number,iz:number,y:number,mat:THREE.Material,cx=0,cz=0) {
    const points=(x:number,z:number)=>Array.from({length:128},(_,i)=>stadiumPoint(i/128*Math.PI*2,x,z,8,0,0));
    const shape=new THREE.Shape(points(rx,rz).map(p=>new THREE.Vector2(p.x,-p.y)));
    const hole=new THREE.Path(points(ix,iz).reverse().map(p=>new THREE.Vector2(p.x,-p.y)));shape.holes.push(hole);
    const item=mesh(new THREE.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:false}),mat,cx,y,cz);item.rotation.x=-Math.PI/2;
  }
  ring(width*.211,depth*.251,width*.199,depth*.238,.622,dark,openingX,openingZ);
  ring(width*.208,depth*.248,width*.204,depth*.243,.647,rim,openingX,openingZ);

  // A real bowl below the aperture, with three stepped blue seating tiers.
  const blue=material("#355980",.1,.8), seats=material("#7496b2",.1,.8);
  for(let tier=0;tier<3;tier++) {
    const rx=width*(.35-tier*.05),rz=depth*(.35-tier*.05),y=.52-tier*.01;
    ring(rx,rz,rx-width*.045,rz-depth*.04,y,blue,openingX,openingZ);
    for(let row=0;row<3;row++) ring(rx-width*(row*.012+.004),rz-depth*(row*.011+.004),rx-width*(row*.012+.007),rz-depth*(row*.011+.007),y+.027,seats,openingX,openingZ);
  }
  const pitchCanvas=document.createElement("canvas");pitchCanvas.width=512;pitchCanvas.height=768;
  const field=pitchCanvas.getContext("2d");
  if(field) {
    field.fillStyle="#286946";field.fillRect(0,0,512,768);
    for(let i=0;i<12;i++){field.fillStyle=i%2?"#2f744e":"#286946";field.fillRect(0,i*64,512,64);}
    field.strokeStyle="#e8eedc";field.lineWidth=5;field.strokeRect(24,24,464,720);
    field.beginPath();field.moveTo(24,384);field.lineTo(488,384);field.stroke();
    field.beginPath();field.arc(256,384,67,0,Math.PI*2);field.stroke();
    field.strokeRect(110,24,292,130);field.strokeRect(175,24,162,50);
    field.strokeRect(110,614,292,130);field.strokeRect(175,694,162,50);
    const tex=new THREE.CanvasTexture(pitchCanvas);tex.colorSpace=THREE.SRGBColorSpace;trackTexture(tex);
    const turf=new THREE.MeshBasicMaterial({map:tex});trackMaterial(turf);
    const pitch=mesh(new THREE.PlaneGeometry(width*.32,depth*.39),turf,openingX,.485,openingZ);pitch.rotation.x=-Math.PI/2;
  }

  // Two thin fabric leaves travel under the fixed roof on parallel rails.
  const leaves=[new THREE.Group(),new THREE.Group()];leaves.forEach(leaf=>parent.add(leaf));
  const leafWidth=width*.195,leafDepth=depth*.468;
  leaves.forEach((leaf,index)=>{
    mesh(new THREE.BoxGeometry(leafWidth,.012,leafDepth),roof,0,.59,openingZ,leaf);
    for(let row=-3;row<=3;row++) mesh(new THREE.BoxGeometry(leafWidth-.01,.002,.003),rim,0,.597,openingZ+row*leafDepth/8,leaf);
    for(let col=-1;col<=1;col++) mesh(new THREE.BoxGeometry(.003,.002,leafDepth-.01),rim,col*leafWidth/3,.597,openingZ,leaf);
    leaf.position.x=openingX+(index===0?-1:1)*leafWidth/2;
  });
  let open=false,progress=0,startProgress=0,startTime:number|null=null;
  const apply=(value:number)=>leaves.forEach((leaf,index)=>{
    leaf.position.x=openingX+(index===0?-1:1)*(leafWidth/2+value*width*.205);
    // The rail drops beneath the sloping shoulder so corners never pierce the skin.
    leaf.position.y=-value*.13;
  });
  // Pressure corridor meets this low, integrated portal; no door floats on the roof.
  mesh(new THREE.BoxGeometry(width*.15,.22,.30),dark,-width*.465,.08,-.02);
  mesh(new THREE.BoxGeometry(width*.18,.025,.34),rim,-width*.47,.205,-.02);
  mesh(new THREE.BoxGeometry(.012,.16,.26),glazing,-width*.555,.08,-.02);
  return {
    setOpen(value:boolean){if(open===value)return;open=value;startProgress=progress;startTime=null;},
    toggle(){this.setOpen(!open);return open;},
    animate(time:number,reduced:boolean){
      if(startTime===null) startTime=time;
      const t=reduced?1:Math.min(1,(time-startTime)/2400);
      const eased=t*t*(3-2*t);
      const previous=progress;
      progress=THREE.MathUtils.lerp(startProgress,open?1:0,eased);apply(progress);
      return progress !== previous;
    },
  };
}
