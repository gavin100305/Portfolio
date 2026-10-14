import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { airlocks, corridorRoutes, MAP_SCALE, rooms, WORLD, type Point } from "@/data/station-world";
import type { SectionId } from "@/data/sections";
import { moduleOutline } from "@/data/ship-observation";

const unit = MAP_SCALE * 100;
const xAt = (x: number) => (x - WORLD.width / 2) / unit;
const zAt = (y: number) => (y - WORLD.height / 2) / unit;
export type DeckSources = Partial<Record<SectionId, SVGSVGElement>>;

/** Procedural observation model. No changes to the playable world or its data. */
export function createExteriorModel(sources: DeckSources, invalidate: () => void) {
  const group = new THREE.Group();
  const peekRoofs: THREE.Group[] = [];
  const geometry = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  let disposed = false;
  function dispose() {
    if (disposed) return;
    disposed = true;
    geometry.forEach(g => g.dispose());
    materials.forEach(m => m.dispose());
    textures.forEach(t => { if (t.image instanceof HTMLImageElement) t.image.onload = null; t.dispose(); });
    group.clear();
  }

  try {
  const metal = (color: string, roughness = .72) => {
    const material = new THREE.MeshStandardMaterial({ color, roughness, metalness: .28 });
    materials.add(material);
    return material;
  };
  const flat = (color: string) => {
    const material = new THREE.MeshBasicMaterial({ color });
    materials.add(material);
    return material;
  };
  const side = metal("#252b38");
  const frame = metal("#405775");
  const edge = metal("#8ba2ba");
  const roof = metal("#718795");
  const panel = metal("#526878");
  const inset = metal("#111824");
  const glass = metal("#183b4b", .38);
  const cream = metal("#d9d4be");
  const cyan = flat("#65c8ff");
  const amber = flat("#ffc875");
  const solar = metal("#182e4c", .56);

  function mesh(parent: THREE.Object3D, shape: THREE.BufferGeometry, material: THREE.Material | THREE.Material[]) {
    geometry.add(shape);
    const object = new THREE.Mesh(shape, material);
    parent.add(object);
    return object;
  }
  function box(parent: THREE.Object3D, x: number, y: number, z: number, w: number, h: number, d: number, material: THREE.Material) {
    const object = mesh(parent, new THREE.BoxGeometry(w, h, d), material);
    object.position.set(x, y, z);
    object.castShadow = h > .025 && w > .12 && d > .12;
    object.receiveShadow = true;
    return object;
  }
  function slab(parent: THREE.Object3D, points: readonly Point[], scale: number, depth: number, height: number, material: THREE.Material) {
    const shape = new THREE.Shape(points.map(p => new THREE.Vector2((p.x - 120) * scale, -(p.y - 88) * scale)));
    const object = mesh(parent, new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: .004, bevelThickness: .004, bevelSegments: 1, steps: 1 }), material);
    object.rotation.x = -Math.PI / 2;
    object.position.y = height;
    object.castShadow = true; object.receiveShadow = true;
    return object;
  }

  // Keep every bend and endpoint from the real floor plan. The tubes have
  // shallow side faces, restrained seams, and an uninterrupted top surface.
  for (const route of corridorRoutes) {
    for (let i = 1; i < route.points.length; i++) {
      const a = route.points[i - 1], b = route.points[i];
      const x = xAt((a.x + b.x) / 2 * MAP_SCALE), z = zAt((a.y + b.y) / 2 * MAP_SCALE);
      const horizontal = a.y === b.y;
      const length = Math.hypot(b.x - a.x, b.y - a.y) / 100;
      const w = horizontal ? length + .22 : .34, d = horizontal ? .34 : length + .22;
      box(group, x, -.065, z, w, .19, d, side);
      box(group, x, .045, z, w, .035, d, edge);
      box(group, x, .075, z, horizontal ? w : .26, .03, horizontal ? .26 : d, frame);
      box(group, x, .095, z, horizontal ? w : .16, .012, horizontal ? .16 : d, cream);
    }
  }

  for (const [id, room] of Object.entries(rooms) as [SectionId, typeof rooms[SectionId]][]) {
    const bay = new THREE.Group();
    bay.name = id;
    bay.position.set(xAt(room.x + room.width / 2), 0, zAt(room.y + room.height / 2));
    group.add(bay);
    const scale = room.width / 240 / unit;
    const w = room.width / unit, d = room.height / unit;
    slab(bay, moduleOutline, scale, .16, -.16, side);
    slab(bay, moduleOutline, scale * .995, .025, -.005, edge);
    const floor = box(bay, 0, .015, 0, w * .85, .025, d * .82, id === "football" ? inset : cream);

    // Perimeter wall segments are cut at the existing entrances. This also
    // makes the two peek decks visibly connected to the real corridors.
    const entrances = airlocks.filter(a => a.x * MAP_SCALE < room.x + room.width && (a.x + a.width) * MAP_SCALE > room.x && a.y * MAP_SCALE < room.y + room.height && (a.y + a.height) * MAP_SCALE > room.y)
      .map(a => ({ x: (a.x * MAP_SCALE - room.x - room.width / 2) / unit, z: (a.y * MAP_SCALE - room.y - room.height / 2) / unit, w: a.width * MAP_SCALE / unit, d: a.height * MAP_SCALE / unit }));
    moduleOutline.forEach((p, index) => {
      const q = moduleOutline[(index + 1) % moduleOutline.length];
      const horizontal = p.y === q.y;
      const cross = horizontal ? (p.y - 88) * scale : (p.x - 120) * scale;
      const start = horizontal ? (Math.min(p.x, q.x) - 120) * scale : (Math.min(p.y, q.y) - 88) * scale;
      const end = horizontal ? (Math.max(p.x, q.x) - 120) * scale : (Math.max(p.y, q.y) - 88) * scale;
      let segments = [[start, end]];
      for (const entry of entrances) {
        if (horizontal ? cross < entry.z - .025 || cross > entry.z + entry.d + .025 : cross < entry.x - .025 || cross > entry.x + entry.w + .025) continue;
        const lo = (horizontal ? entry.x : entry.z) - .025;
        const hi = lo + (horizontal ? entry.w : entry.d) + .05;
        segments = segments.flatMap(([a, b]) => hi <= a || lo >= b ? [[a, b]] : [[a, Math.max(a, lo)], [Math.min(b, hi), b]]).filter(([a, b]) => b - a > .01);
      }
      for (const [a, b] of segments) {
        const x = horizontal ? (a + b) / 2 : cross;
        const z = horizontal ? cross : (a + b) / 2;
        box(bay, x, .13, z, horizontal ? b - a : .055, .22, horizontal ? .055 : b - a, frame);
        box(bay, x, .247, z, horizontal ? b - a : .062, .022, horizontal ? .062 : b - a, edge);
      }
    });

    const lid = new THREE.Group();
    bay.add(lid);
    if (id === "about" || id === "projects") peekRoofs.push(lid);
    const roofOutline = moduleOutline.map(p => ({ x: 120 + (p.x - 120) * .94, y: 88 + (p.y - 88) * .94 }));
    slab(lid, roofOutline, scale, .055, .25, roof);
    box(lid, 0, .323, -.05, w * .58, .036, d * .55, panel);
    box(lid, 0, .344, -.05, w * .56, .009, d * .52, frame);
    // Broad service panels and two matched vent banks, rather than greebles.
    for (const x of [-w * .32, w * .32]) {
      box(lid, x, .316, d * .18, w * .09, .018, d * .24, inset);
      for (let n = 0; n < 5; n++) box(lid, x, .329, d * (.09 + n * .043), w * .07, .009, .014, edge);
    }
    box(lid, 0, .357, d * .13, w * .19, .025, d * .13, roof);
    box(lid, 0, .374, d * .13, w * .13, .007, d * .075, inset);
    box(lid, 0, .379, d * .13, w * .045, .008, .012, amber);
    // Recessed observation glazing along the front of each original module.
    box(lid, 0, .319, -d * .34, w * .52, .025, d * .115, inset);
    box(lid, 0, .337, -d * .34, w * .49, .012, d * .09, glass);
    for (const x of [-.18, 0, .18]) box(lid, x * w, .347, -d * .34, .018, .016, d * .11, edge);
    box(lid, 0, .348, -d * .382, w * .46, .008, .009, cyan);
    for (const x of [-w * .45, w * .45]) box(bay, x, .13, d * .10, .012, .035, d * .14, cyan);

    // Purposeful exterior details describe the existing room below each lid.
    if (id === "about") {
      const skylight = mesh(lid, new THREE.CylinderGeometry(w * .115, w * .125, .035, 8), edge);
      skylight.position.set(0, .376, -.12);
      const window = mesh(lid, new THREE.CylinderGeometry(w * .104, w * .104, .012, 8), glass);
      window.position.set(0, .399, -.12);
      box(lid, 0, .409, -.12, w * .20, .006, .014, frame);
      box(lid, 0, .409, -.12, .014, .006, w * .20, frame);
    } else if (id === "projects") {
      // Twin hangar shutters sit inside the roof, with fine guide rails.
      for (const x of [-w * .125, w * .125]) {
        box(lid, x, .362, -.07, w * .24, .035, d * .42, roof);
        for (let i = 0; i < 4; i++) box(lid, x, .382, -.07 + (i - 1.5) * d * .085, w * .22, .006, .012, panel);
      }
      box(lid, 0, .386, -.07, .018, .008, d * .42, inset);
      for (const x of [-w * .28, w * .28]) box(lid, x, .369, -.07, .015, .008, d * .43, edge);
    } else if (id === "contact") {
      const pedestal = mesh(lid, new THREE.CylinderGeometry(.105, .16, .10, 16), side);
      pedestal.position.set(0, .42, -.06);
      const dish = mesh(lid, new THREE.CylinderGeometry(.27, .21, .035, 20), edge);
      dish.rotation.x = -.24; dish.position.set(0, .49, -.06);
      const receiver = mesh(lid, new THREE.CylinderGeometry(.22, .17, .015, 20), panel);
      receiver.rotation.x = -.24; receiver.position.set(0, .51, -.06);
      box(lid, 0, .55, -.06, .014, .09, .014, edge);
      box(lid, 0, .598, -.06, .025, .012, .025, cyan);
    } else if (id === "football") {
      box(lid, 0, .365, -.05, w * .51, .03, d * .44, inset);
      box(lid, 0, .385, -.05, w * .48, .009, d * .41, glass);
      for (const x of [-w * .16, 0, w * .16]) box(lid, x, .396, -.05, .018, .015, d * .43, edge);
      for (const z of [-d * .14, d * .09]) box(lid, 0, .396, z, w * .49, .015, .018, edge);
    } else if (id === "stack") {
      for (const x of [-w * .15, 0, w * .15]) {
        box(lid, x, .367, -.07, w * .10, .028, d * .35, inset);
        for (let i = 0; i < 7; i++) box(lid, x, .385, -.07 + (i - 3) * d * .042, w * .08, .008, .014, edge);
      }
    } else {
      for (const x of [-w * .13, w * .13]) {
        box(lid, x, .364, -.12, w * .18, .025, d * .21, roof);
        box(lid, x, .381, -.12, w * .14, .006, d * .15, panel);
        box(lid, x, .388, -.12, w * .05, .005, .009, amber);
      }
    }

    if ((id === "about" || id === "projects") && sources[id]) {
      // Reuse only our own SVG art for the decorative preview. The actual
      // interactive rooms, labels and content remain accessible HTML/SVG.
      const source = sources[id]!;
      const clone = source.cloneNode(true) as SVGSVGElement;
      const originals = [source, ...source.querySelectorAll<SVGElement>("*")];
      const copies = [clone, ...clone.querySelectorAll<SVGElement>("*")];
      originals.forEach((node, index) => {
        const computed = getComputedStyle(node);
        for (const property of ["fill", "stroke", "stroke-width", "opacity", "rx", "ry"] as const) {
          const value = computed.getPropertyValue(property).replace(/url\(["']?[^)]*#([^"')]+)["']?\)/g, "url(#$1)");
          copies[index].style.setProperty(property, index === 0 && property === "opacity" ? "1" : value);
        }
      });
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clone.setAttribute("width", "720"); clone.setAttribute("height", "528");
      clone.removeAttribute("class");
      const image = new Image();
      const texture = new THREE.Texture(image);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 2;
      textures.add(texture);
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
      materials.add(material);
      const deck = mesh(bay, new THREE.PlaneGeometry(w, d), material);
      deck.rotation.x = -Math.PI / 2;
      deck.position.y = .035;
      deck.visible = false;
      image.onload = () => {
        if (disposed) return;
        texture.needsUpdate = true; deck.visible = true; floor.visible = false; invalidate();
      };
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
    }
  }

  // Existing side arrays: their native positions and proportions are retained.
  for (const [x, z] of [[24, 476], [1608, 492]]) {
    const ax = xAt(x * MAP_SCALE), az = zAt(z * MAP_SCALE);
    box(group, ax, -.09, az, .48, .07, 1.68, edge);
    box(group, ax, -.045, az, .43, .02, 1.63, solar);
    for (let n = 0; n < 12; n++) box(group, ax, -.03, az - .78 + n * .14, .43, .008, .012, frame);
    for (let n = 0; n < 3; n++) box(group, ax - .14 + n * .14, -.03, az, .012, .008, 1.63, frame);
  }
  const engineGlow = new THREE.MeshBasicMaterial({ color: "#91dcff", transparent: true, opacity: .7, depthWrite: false });
  materials.add(engineGlow);
  for (const x of [550, 698]) {
    const ex = xAt(x * MAP_SCALE), ez = zAt(790 * MAP_SCALE);
    box(group, ex, -.07, ez, .22, .19, .25, side);
    box(group, ex, -.06, ez + .13, .18, .13, .03, edge);
    box(group, ex, -.06, ez + .15, .12, .08, .01, cyan);
    const plume = mesh(group, new THREE.ConeGeometry(.058, .25, 8), engineGlow);
    plume.rotation.x = -Math.PI / 2;
    plume.position.set(ex, -.06, ez + .29);
  }
  // One small sensor on the existing engineering module, no new wing.
  const engineering = rooms.stack;
  const sensor = new THREE.Group();
  sensor.position.set(xAt(engineering.x + engineering.width * .3), .35, zAt(engineering.y + engineering.height * .35));
  group.add(sensor);
  box(sensor, 0, .09, 0, .018, .18, .018, edge);
  const dish = mesh(sensor, new THREE.CylinderGeometry(.09, .065, .022, 12), roof);
  dish.position.y = .19; dish.rotation.z = -.25;
  box(sensor, 0, .215, 0, .014, .025, .014, cyan);

  // Merge static parts per material within each bay/lid. Repeated vent slats
  // and trim should not cost a separate draw call on phones.
  function batch(parent: THREE.Object3D) {
    for (const child of [...parent.children]) if (!(child instanceof THREE.Mesh)) batch(child);
    const buckets = new Map<THREE.Material, THREE.Mesh[]>();
    for (const child of parent.children) {
      if (!(child instanceof THREE.Mesh) || Array.isArray(child.material)) continue;
      const bucket = buckets.get(child.material) ?? [];
      bucket.push(child); buckets.set(child.material, bucket);
    }
    for (const [material, objects] of buckets) {
      if (objects.length < 2) continue;
      const pieces = objects.map(object => {
        object.updateMatrix();
        const piece = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
        return piece.applyMatrix4(object.matrix);
      });
      const merged = mergeGeometries(pieces);
      pieces.forEach(piece => piece.dispose());
      if (!merged) continue;
      for (const object of objects) { parent.remove(object); geometry.delete(object.geometry); object.geometry.dispose(); }
      const combined = mesh(parent, merged, material);
      combined.castShadow = objects.some(object => object.castShadow);
      combined.receiveShadow = objects.some(object => object.receiveShadow);
    }
  }
  batch(group);

  return {
    group,
    setPeek(value: boolean) { peekRoofs.forEach(lid => { lid.visible = !value; }); },
    animate(time: number, reduced: boolean) {
      group.position.y = reduced ? 0 : Math.sin(time / 6000) * .012;
      engineGlow.opacity = reduced ? .65 : .65 + Math.sin(time / 1400) * .09;
    },
    dispose,
  };
  } catch (error) { dispose(); throw error; }
}
