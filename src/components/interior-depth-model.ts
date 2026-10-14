import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { airlocks, MAP_SCALE, obstacles, rooms, ROOM_FLOOR_OUTLINE, type Point } from "@/data/station-world";
import type { SectionId } from "@/data/sections";
import { moduleOutline } from "@/data/ship-observation";

const svgNS = "http://www.w3.org/2000/svg";
type Polygon = readonly Point[];
const rectangle = (x: number, y: number, w: number, h: number): Polygon => [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }];
function inside(point: Point, polygon: Polygon) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) result = !result;
  }
  return result;
}

/** Only existing equipment footprints gain shallow sides; paths do not move. */
function equipmentPolygons(id: SectionId): Polygon[] {
  const room = rooms[id], scale = room.width / 240;
  const boxes = obstacles.filter(b => b.x >= room.x && b.y >= room.y && b.x + b.width <= room.x + room.width && b.y + b.height <= room.y + room.height)
    .map(b => ({ x: (b.x - room.x) / scale, y: (b.y - room.y) / scale, w: b.width / scale, h: b.height / scale }));
  const result: Polygon[] = [];
  for (const b of boxes) {
    // Leave foliage on its original art layer; lift its pot with the room art.
    if (Math.abs(b.w - 15) < .01 && Math.abs(b.h - 20) < .01) continue;
    if (id === "projects" && b.x >= 54 && b.x <= 84 && b.w <= 50) continue;
    if (id === "contact" && Math.abs(b.x - 42) < .01) continue;
    result.push(rectangle(b.x, b.y, b.w, b.h));
  }
  if (id === "projects") result.push([[74,60],[84,60],[84,72],[92,72],[92,106],[104,106],[104,132],[88,132],[88,142],[70,142],[70,132],[54,132],[54,106],[66,106],[66,72],[74,72]].map(([x,y]) => ({x,y})));
  if (id === "contact") {
    result.push([[60,60],[84,60],[84,64],[94,64],[94,72],[100,72],[100,108],[94,108],[94,116],[84,116],[84,120],[60,120],[60,116],[50,116],[50,108],[44,108],[44,72],[50,72],[50,64],[60,64]].map(([x,y]) => ({x,y})));
    result.push(rectangle(56,122,32,12));
  }
  return result;
}

function styledClone(source: SVGSVGElement, width: number) {
  const clone = source.cloneNode(true) as SVGSVGElement;
  const originals = [source, ...source.querySelectorAll<SVGElement>("*")];
  const copies = [clone, ...clone.querySelectorAll<SVGElement>("*")];
  originals.forEach((node, i) => {
    const computed = getComputedStyle(node);
    for (const property of ["fill", "stroke", "stroke-width", "opacity", "rx", "ry"] as const) {
      copies[i].style.setProperty(property, i === 0 && property === "opacity" ? "1" : computed.getPropertyValue(property).replace(/url\(["']?[^)]*#([^"')]+)["']?\)/g, "url(#$1)"));
    }
  });
  clone.setAttribute("xmlns", svgNS);
  clone.setAttribute("width", String(width)); clone.setAttribute("height", String(Math.round(width * 176 / 240)));
  clone.removeAttribute("class");
  return clone;
}

function addMask(svg: SVGSVGElement, id: string, polygons: Polygon[], inverse = false) {
  const mask = document.createElementNS(svgNS, "mask");
  mask.id = id;
  const background = document.createElementNS(svgNS, "rect");
  background.setAttribute("width", "240"); background.setAttribute("height", "176"); background.setAttribute("fill", inverse ? "white" : "black");
  mask.appendChild(background);
  for (const polygon of polygons) {
    const shape = document.createElementNS(svgNS, "polygon");
    shape.setAttribute("points", polygon.map(p => `${p.x},${p.y}`).join(" "));
    shape.setAttribute("fill", inverse ? "black" : "white");
    mask.appendChild(shape);
  }
  svg.querySelector("defs")!.appendChild(mask);
  return `url(#${id})`;
}

/** Real depth under the original drawing, using its exact masks and colors. */
export async function createInteriorDepthModel(world: HTMLDivElement, textureWidth: number) {
  const group = new THREE.Group();
  const geometry = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const urls = new Set<string>();
  let disposed = false;
  const blinkMaterials: THREE.MeshBasicMaterial[] = [];
  const sweeps: THREE.Group[] = [];
  let animationStep = -1;
  const side = new THREE.MeshStandardMaterial({ color: "#405463", roughness: .76, metalness: .22 });
  const wallSide = new THREE.MeshStandardMaterial({ color: "#30445f", roughness: .8, metalness: .2 });
  const shadow = new THREE.ShadowMaterial({ opacity: .2, depthWrite: false });
  shadow.side = THREE.DoubleSide;
  materials.add(side); materials.add(wallSide); materials.add(shadow);
  function dispose() {
    if (disposed) return;
    disposed = true;
    geometry.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
    urls.forEach(url => URL.revokeObjectURL(url)); urls.clear(); group.clear();
  }
  function addGeometry(parent: THREE.Group, shape: THREE.BufferGeometry, material: THREE.Material, height = 0) {
    geometry.add(shape);
    const object = new THREE.Mesh(shape, material);
    object.position.y = height;
    parent.add(object);
    return object;
  }
  async function materialFrom(svg: SVGSVGElement) {
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" }));
    urls.add(url);
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Unable to prepare the original deck drawing")); image.src = url; });
    URL.revokeObjectURL(url); urls.delete(url);
    if (disposed) throw new Error("Depth scene closed");
    const texture = new THREE.Texture(image);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    textures.add(texture);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: .02, depthWrite: false });
    materials.add(material);
    return material;
  }
  function artPlane(bay: THREE.Group, w: number, d: number, height: number, material: THREE.Material) {
    const object = addGeometry(bay, new THREE.PlaneGeometry(w, d), material, height);
    object.rotation.x = -Math.PI / 2;
    object.position.x = w / 2; object.position.z = d / 2;
    object.renderOrder = height;
  }
  const loader = new SVGLoader();
  try {
    await Promise.all((Object.entries(rooms) as [SectionId, typeof rooms[SectionId]][]).filter(([id]) => id !== "football").map(async ([id, room]) => {
      const source = world.querySelector<SVGSVGElement>(`a[href="#${id}"] .room-artwork`);
      if (!source) throw new Error("Missing original room artwork");
      const scale = room.width / 240;
      const bay = new THREE.Group(); bay.position.set(room.x, 0, room.y); group.add(bay);
      const solids = equipmentPolygons(id);
      const floor = styledClone(source, textureWidth);
      floor.querySelectorAll(":scope > g[mask]").forEach(g => g.remove());
      floor.querySelector(".room-props")!.setAttribute("mask", addMask(floor, `depth-floor-${id}`, solids, true));
      const tops = styledClone(source, textureWidth);
      tops.querySelectorAll(":scope > g:not(.room-props)").forEach(g => g.remove());
      tops.querySelector(".room-props")!.setAttribute("mask", addMask(tops, `depth-equipment-${id}`, solids));
      tops.querySelectorAll(".radar-sweep, rect.console-status-light").forEach(node => node.remove());
      const rim = styledClone(source, textureWidth);
      rim.querySelectorAll(":scope > g:not([mask])").forEach(g => g.remove());
      rim.querySelector(".hull-underlayer")?.remove();
      const rimMask = document.createElementNS(svgNS, "mask"); rimMask.id = `depth-rim-${id}`;
      rimMask.innerHTML = `<rect width="240" height="176" fill="white"/>`;
      const deckPath = source.querySelector<SVGPathElement>(`#deck-clip-${id} path`)!.getAttribute("d")!;
      const cutout = document.createElementNS(svgNS, "path"); cutout.setAttribute("d", deckPath); cutout.setAttribute("fill", "black"); rimMask.appendChild(cutout);
      rim.querySelector("defs")!.appendChild(rimMask);
      const wrapper = document.createElementNS(svgNS, "g"); wrapper.setAttribute("mask", `url(#${rimMask.id})`);
      rim.querySelectorAll(":scope > g").forEach(g => wrapper.appendChild(g)); rim.appendChild(wrapper);
      const [floorMaterial, topMaterial, rimMaterial] = await Promise.all([materialFrom(floor), materialFrom(tops), materialFrom(rim)]);
      if (disposed) return;
      artPlane(bay, room.width, room.height, 0, floorMaterial);
      artPlane(bay, room.width, room.height, 22.2, topMaterial);
      artPlane(bay, room.width, room.height, 17.2, rimMaterial);

      // Physical equipment sides match the existing collision footprints.
      const sides = solids.flatMap(polygon => {
        const shape = new THREE.Shape(polygon.map(p => new THREE.Vector2(p.x * scale, -p.y * scale)));
        return [new THREE.ExtrudeGeometry(shape, { depth: 22, bevelEnabled: false }).rotateX(-Math.PI / 2)];
      });
      const equipment = mergeGeometries(sides); sides.forEach(g => g.dispose());
      if (equipment) { const object = addGeometry(bay, equipment, side); object.castShadow = true; }
      // Fill only the existing wall band; cut every real entrance out of it.
      const entries = airlocks.filter(a => a.x * MAP_SCALE < room.x + room.width && (a.x + a.width) * MAP_SCALE > room.x && a.y * MAP_SCALE < room.y + room.height && (a.y + a.height) * MAP_SCALE > room.y)
        .map(a => rectangle((a.x * MAP_SCALE - room.x) / scale, (a.y * MAP_SCALE - room.y) / scale, a.width * MAP_SCALE / scale, a.height * MAP_SCALE / scale));
      const polygons = [moduleOutline, ROOM_FLOOR_OUTLINE, ...entries];
      const xs = [...new Set(polygons.flatMap(p => p.map(v => v.x)))].sort((a,b) => a-b);
      const ys = [...new Set(polygons.flatMap(p => p.map(v => v.y)))].sort((a,b) => a-b);
      const pieces: THREE.BufferGeometry[] = [];
      for (let x = 1; x < xs.length; x++) for (let y = 1; y < ys.length; y++) {
        const p = { x: (xs[x-1]+xs[x])/2, y: (ys[y-1]+ys[y])/2 };
        if (!inside(p, moduleOutline) || inside(p, ROOM_FLOOR_OUTLINE) || entries.some(e => inside(p,e))) continue;
        pieces.push(new THREE.BoxGeometry((xs[x]-xs[x-1])*scale, 17, (ys[y]-ys[y-1])*scale).toNonIndexed().translate(p.x*scale, 8.5, p.y*scale));
      }
      const walls = mergeGeometries(pieces); pieces.forEach(g => g.dispose());
      if (walls) { const object = addGeometry(bay, walls, wallSide); object.castShadow = true; }
      const floorShapes = loader.parse(`<svg xmlns="${svgNS}"><path d="${deckPath}"/></svg>`).paths.flatMap(path => SVGLoader.createShapes(path));
      const shadowGeometry = new THREE.ShapeGeometry(floorShapes).scale(scale, -scale, 1).rotateX(-Math.PI/2);
      const receiver = addGeometry(bay, shadowGeometry, shadow, .1); receiver.receiveShadow = true; receiver.renderOrder = 1;

      // The existing signals remain live rather than being frozen in a texture.
      const rootMatrix = source.getCTM()?.inverse();
      for (const indicator of source.querySelectorAll<SVGGraphicsElement>(".console-status-light")) {
        // A compound radar path contains separate dots; its bounding box must
        // not become one large illuminated rectangle. Keep that original art.
        if (indicator.tagName !== "rect") continue;
        const matrix = indicator.getCTM();
        if (!rootMatrix || !matrix) continue;
        const bounds = indicator.getBBox();
        const center = new DOMPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2).matrixTransform(rootMatrix.multiply(matrix));
        const style = getComputedStyle(indicator);
        const color = style.stroke !== "none" ? style.stroke : style.fill;
        const light = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1, depthWrite: false });
        materials.add(light); blinkMaterials.push(light);
        const object = addGeometry(bay, new THREE.PlaneGeometry(Math.max(1, bounds.width) * scale, Math.max(1, bounds.height) * scale), light, 22.5);
        object.position.x = center.x * scale; object.position.z = center.y * scale; object.rotation.x = -Math.PI / 2;
        object.renderOrder = 24;
      }
      if (id === "contact") {
        const sweep = new THREE.Group(); sweep.position.set(72 * scale, 22.5, 90 * scale); bay.add(sweep); sweeps.push(sweep);
        const glow = new THREE.MeshBasicMaterial({ color: "#65c8ff", transparent: true, opacity: .16, depthWrite: false, side: THREE.DoubleSide });
        materials.add(glow);
        const wedge = addGeometry(sweep, new THREE.CircleGeometry(20 * scale, 24, 0, Math.PI / 4), glow);
        wedge.rotation.x = -Math.PI / 2; wedge.renderOrder = 24;
        const lineMaterial = new THREE.MeshBasicMaterial({ color: "#b2e4da", depthWrite: false }); materials.add(lineMaterial);
        const line = addGeometry(sweep, new THREE.PlaneGeometry(20 * scale, .8 * scale), lineMaterial);
        line.rotation.x = -Math.PI / 2; line.position.x = 10 * scale; line.renderOrder = 25;
      }
    }));
    if (disposed) throw new Error("Depth scene closed");
    return { group, dispose, animate(time: number, reduced: boolean) {
      const step = reduced ? 0 : Math.floor(time / 100);
      if (step === animationStep) return false;
      animationStep = step;
      blinkMaterials.forEach((material, index) => { material.opacity = reduced || (step + index * 7) % 38 < 29 ? 1 : .3; });
      sweeps.forEach(sweep => { sweep.rotation.y = reduced ? 0 : time / 9_000 * Math.PI * 2; });
      return true;
    } };
  } catch (error) { dispose(); throw error; }
}
