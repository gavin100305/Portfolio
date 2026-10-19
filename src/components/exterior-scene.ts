import * as THREE from "three";
import type { SectionId } from "@/data/sections";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createExteriorModel, type DeckSources } from "@/components/exterior-model";

/** Fit all original module/array bounds in perspective, including portrait. */
export function frameShip(camera: THREE.PerspectiveCamera, bounds: THREE.Box3) {
  const target = bounds.getCenter(new THREE.Vector3());
  const direction = new THREE.Vector3(.22, .72, .66).normalize();
  const right = new THREE.Vector3().crossVectors(camera.up, direction).normalize();
  const up = new THREE.Vector3().crossVectors(direction, right).normalize();
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const tanH = tanV * camera.aspect;
  let distance = 1;
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
    const offset = new THREE.Vector3(x, y, z).sub(target);
    distance = Math.max(distance, offset.dot(direction) + Math.max(Math.abs(offset.dot(right)) / tanH, Math.abs(offset.dot(up)) / tanV));
  }
  const origin = target.clone().addScaledVector(direction, distance * 1.15);
  camera.position.copy(origin);
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  return { target, origin };
}

export function createExteriorScene(host: HTMLDivElement, sources: DeckSources, onFailure: () => void, onRoomPeek?: (id: SectionId, open: boolean) => void) {
  let disposed = false;
  let frame = 0;
  let lastTime = 0;
  let visible = true;
  let renderer: THREE.WebGLRenderer | undefined;
  let model: ReturnType<typeof createExteriorModel> | undefined;
  let controls: OrbitControls | undefined;
  let resize: ResizeObserver | undefined;
  let intersection: IntersectionObserver | undefined;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const coarse = matchMedia("(pointer: coarse)");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .05, 150);
  let framing = { target: new THREE.Vector3(), origin: new THREE.Vector3() };

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const gestures = new Map<number, { x: number; y: number; cancelled: boolean }>();
  const openedRooms = new Set<SectionId>();
  function toggleRoom(id: SectionId) {
    if (!model || !renderer) return;
    const open = model.toggleRoom(id);
    if (open) openedRooms.add(id); else openedRooms.delete(id);
    host.dataset.openRooms = [...openedRooms].join(",");
    renderer.shadowMap.needsUpdate = true;
    onRoomPeek?.(id, open);
    invalidate();
  }
  function pointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    gestures.set(event.pointerId, { x: event.clientX, y: event.clientY, cancelled: false });
    if (gestures.size > 1) gestures.forEach(gesture => { gesture.cancelled = true; });
  }
  function pointerMove(event: PointerEvent) {
    const gesture = gestures.get(event.pointerId);
    if (gesture && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 7) gesture.cancelled = true;
  }
  function pointerCancel(event: PointerEvent) { gestures.delete(event.pointerId); }
  function pointerUp(event: PointerEvent) {
    const gesture = gestures.get(event.pointerId);
    gestures.delete(event.pointerId);
    if (!gesture || gesture.cancelled || !model || !renderer || Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 7) return;
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    model.group.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    raycaster.setFromCamera(pointer, camera);
    // Hidden roofs must not intercept the next tap on an exposed floor.
    const hit = raycaster.intersectObject(model.group, true).find(({ object }) => {
      for (let node: THREE.Object3D | null = object; node; node = node.parent) if (!node.visible) return false;
      return true;
    });
    for (let node: THREE.Object3D | null = hit?.object ?? null; node; node = node.parent) {
      const id = node.userData.roomId as SectionId | undefined;
      if (id) { toggleRoom(id); break; }
    }
  }

  function stop() { cancelAnimationFrame(frame); frame = 0; }
  function invalidate() {
    if (!disposed && !document.hidden && visible && !frame) frame = requestAnimationFrame(render);
  }
  function render(time: number) {
    frame = 0;
    if (disposed || document.hidden || !visible || !renderer || !model) return;
    const interval = coarse.matches ? 1000 / 24 : 1000 / 30;
    if (time - lastTime >= interval || motion.matches) {
      lastTime = time;
      controls?.update();
      if(model.animate(time, motion.matches)) renderer.shadowMap.needsUpdate = true;
      try { renderer.render(scene, camera); }
      catch { fail(); return; }
      host.dataset.frames = String(renderer.info.render.frame);
    }
    if (!motion.matches) invalidate();
  }
  function measure() {
    if (!renderer || !model || disposed) return;
    const width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, width < 700 ? 1.25 : 1.5));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // A fixed portrait orientation gives the long east wing room to breathe.
    // Resizing never runs a camera spin or changes the floor plan.
    model.group.rotation.y = width < height * .85 ? -Math.PI / 2 : 0;
    model.group.updateMatrixWorld(true);
    framing = frameShip(camera, new THREE.Box3().setFromObject(model.group));
    if (controls) {
      controls.target.copy(framing.target);
      const distance = camera.position.distanceTo(framing.target);
      controls.minDistance = distance * .48;
      controls.maxDistance = distance * 1.65;
      controls.update(); controls.saveState();
    }
    renderer.shadowMap.needsUpdate = true;
    invalidate();
  }
  function visibilityChange() { if (document.hidden) stop(); else { lastTime = 0; invalidate(); } }
  function motionChange() { if (controls) controls.enableDamping = !motion.matches; lastTime = 0; stop(); invalidate(); }
  function contextLost(event: Event) { event.preventDefault(); fail(); }
  function dispose() {
    if (disposed) return;
    disposed = true;
    stop();
    resize?.disconnect(); intersection?.disconnect();
    document.removeEventListener("visibilitychange", visibilityChange);
    motion.removeEventListener("change", motionChange);
    coarse.removeEventListener("change", motionChange);
    controls?.removeEventListener("change", invalidate);
    controls?.dispose();
    renderer?.domElement.removeEventListener("webglcontextlost", contextLost);
    renderer?.domElement.removeEventListener("pointerdown", pointerDown);
    renderer?.domElement.removeEventListener("pointermove", pointerMove);
    renderer?.domElement.removeEventListener("pointerup", pointerUp);
    renderer?.domElement.removeEventListener("pointercancel", pointerCancel);
    gestures.clear();
    model?.dispose();
    scene.traverse(object => { if (object instanceof THREE.Light) object.dispose(); });
    renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove();
    scene.clear();
  }
  function fail() { dispose(); onFailure(); }

  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // One static light map for broad surfaces; orbiting does not rerender it.
    renderer.shadowMap.autoUpdate = false;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    host.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight("#dce8ff", "#253044", .9));
    const key = new THREE.DirectionalLight("#fff3df", 3.2);
    key.position.set(-6, 12, 4); scene.add(key);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -12; key.shadow.camera.right = 12;
    key.shadow.camera.top = 10; key.shadow.camera.bottom = -10;
    key.shadow.camera.near = 1; key.shadow.camera.far = 35;
    key.shadow.normalBias = .015; key.shadow.bias = -.0002;
    const fill = new THREE.DirectionalLight("#a8d8ff", 1.5);
    fill.position.set(5, 3, -8); scene.add(fill);
    model = createExteriorModel(sources, () => { if (renderer) renderer.shadowMap.needsUpdate = true; invalidate(); });
    // Add vertical depth to the existing modules, keeping every X/Z position
    // and stepped room outline intact. There is no surrounding enclosure.
    model.group.scale.y = 2.2;
    scene.add(model.group);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = !motion.matches;
    controls.dampingFactor = .12;
    controls.rotateSpeed = .5;
    controls.zoomSpeed = .7;
    controls.minPolarAngle = .25;
    controls.maxPolarAngle = Math.PI * .44;
    controls.addEventListener("change", invalidate);
    renderer.domElement.addEventListener("pointerdown", pointerDown);
    renderer.domElement.addEventListener("pointermove", pointerMove);
    renderer.domElement.addEventListener("pointerup", pointerUp);
    renderer.domElement.addEventListener("pointercancel", pointerCancel);
    resize = new ResizeObserver(measure); resize.observe(host);
    intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) invalidate(); else stop();
    });
    intersection.observe(host);
    document.addEventListener("visibilitychange", visibilityChange);
    motion.addEventListener("change", motionChange);
    coarse.addEventListener("change", motionChange);
    measure();
  } catch (error) { dispose(); throw error; }
  return {
    dispose,
    toggleRoom,
    setPeek(value: boolean) { model?.setPeek(value); if (renderer) renderer.shadowMap.needsUpdate = true; invalidate(); },
    rotate(direction: number) {
      if (!controls) return;
      const offset = camera.position.clone().sub(controls.target).applyAxisAngle(new THREE.Vector3(0, 1, 0), direction * Math.PI / 12);
      camera.position.copy(controls.target).add(offset); controls.update(); invalidate();
    },
    zoom(direction: number) {
      if (!controls) return;
      const offset = camera.position.clone().sub(controls.target);
      const distance = THREE.MathUtils.clamp(offset.length() * (direction > 0 ? .86 : 1.16), controls.minDistance, controls.maxDistance);
      camera.position.copy(controls.target).add(offset.setLength(distance)); controls.update(); invalidate();
    },
    reset() { controls?.reset(); invalidate(); },
  };
}
