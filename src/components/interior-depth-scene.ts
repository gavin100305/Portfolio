import * as THREE from "three";
import { WORLD } from "@/data/station-world";
import { createInteriorDepthModel } from "@/components/interior-depth-model";

/** Oblique orthographic projection: floor coordinates remain exactly aligned
 * with the existing HTML astronaut, room controls and collision system.
 * Only height projects upwards, so depth never changes a walkable path. */
export function alignInteriorCamera(camera: THREE.OrthographicCamera, matrix: Pick<DOMMatrixReadOnly, "a" | "e" | "f">, width: number, height: number) {
  const scale = Math.max(.01, matrix.a);
  const x = (-matrix.e + width / 2) / scale;
  const z = (-matrix.f + height / 2) / scale;
  const vertical = 2 / Math.sqrt(5);
  camera.left = -width / scale / 2; camera.right = width / scale / 2;
  camera.top = height / scale / 2 * vertical; camera.bottom = -camera.top;
  camera.position.set(x, 10_000, z + 5_000);
  camera.up.set(0, 0, -1);
  camera.lookAt(x, 0, z);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
}

export async function createInteriorDepthScene(host: HTMLDivElement, world: HTMLDivElement, onFailure: () => void) {
  let renderer: THREE.WebGLRenderer | undefined;
  let model: Awaited<ReturnType<typeof createInteriorDepthModel>> | undefined;
  let disposed = false;
  let enabled = true;
  let dirty = true;
  let lastRender = 0;
  let previousTransform = "";
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 30_000);
  const resize = new ResizeObserver(() => { dirty = true; });
  function dispose() {
    if (disposed) return;
    disposed = true; resize.disconnect();
    renderer?.domElement.removeEventListener("webglcontextlost", contextLost);
    model?.dispose();
    scene.traverse(object => { if (object instanceof THREE.Light) object.dispose(); });
    renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove(); scene.clear();
  }
  function contextLost(event: Event) { event.preventDefault(); dispose(); onFailure(); }
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.setClearColor(0, 0);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    host.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight("#e8f1ff", "#253044", 1.6));
    const key = new THREE.DirectionalLight("#fff4df", 3);
    key.position.set(WORLD.width * .15, 6_000, WORLD.height * .1);
    key.target.position.set(WORLD.width / 2, 0, WORLD.height / 2);
    key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -3_400; key.shadow.camera.right = 3_400;
    key.shadow.camera.top = 2_700; key.shadow.camera.bottom = -2_700;
    key.shadow.camera.near = 100; key.shadow.camera.far = 12_000;
    key.shadow.normalBias = .6; key.shadow.bias = -.0001;
    scene.add(key, key.target);
    const fill = new THREE.DirectionalLight("#a6d6f1", 1);
    fill.position.set(WORLD.width, 3_000, WORLD.height); scene.add(fill);
    model = await createInteriorDepthModel(world, host.clientWidth < 700 ? 512 : 768);
    if (disposed) { model.dispose(); throw new Error("Depth scene closed during preparation"); }
    scene.add(model.group);
    resize.observe(host);
    renderer.shadowMap.needsUpdate = true;
  } catch (error) { dispose(); throw error; }

  // Called by the existing exploration loop: no second movement/camera loop.
  function render(time: number): boolean {
    if (disposed) return false;
    if (!enabled || document.hidden || !renderer) return true;
    const flying = world.parentElement?.hasAttribute("data-flight");
    const transform = flying ? getComputedStyle(world).transform : world.style.transform;
    if (!transform || transform === "none") return true;
    const changed = transform !== previousTransform;
    const animated = model?.animate(time, motion.matches);
    if (!dirty && !changed && !animated) return true;
    // Camera changes must use the very same frame as HTML actors and doors.
    // Throttle only idle signal animation, never a changed floor transform.
    if (!dirty && !changed && time - lastRender < 1000 / 12) return true;
    lastRender = time; previousTransform = transform;
    if (dirty) {
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, host.clientWidth < 700 ? 1.25 : 1.5));
      renderer.setSize(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight), false);
      dirty = false;
    }
    alignInteriorCamera(camera, new DOMMatrixReadOnly(transform), host.clientWidth, host.clientHeight);
    try { renderer.render(scene, camera); }
    catch { dispose(); onFailure(); return false; }
    return true;
  }
  // Reduced motion already removes easing in the shared exploration camera.
  // This renderer adds no independent idle camera or environmental movement.
  return { render, dispose, setEnabled(value: boolean) { enabled = value; dirty = true; } };
}
