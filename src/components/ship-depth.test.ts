import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { alignInteriorCamera } from "./interior-depth-scene";
import { frameShip } from "./exterior-scene";
import { rooms, airlocks, MAP_SCALE } from "../data/station-world";

test("3D floor projection remains aligned with HTML/collision coordinates at desktop and mobile sizes", () => {
  for (const [width, height, scale] of [[1600,1000,1.28],[390,844,.9],[844,390,1]]) {
    const matrix = { a: scale, e: -1273, f: -805 };
    const camera = new THREE.OrthographicCamera(-1,1,1,-1,1,30_000);
    alignInteriorCamera(camera,matrix,width,height);
    const points = [...Object.values(rooms).map(r => ({x:r.x+r.width/2,y:r.y+r.height/2})), ...airlocks.map(r => ({x:(r.x+r.width/2)*MAP_SCALE,y:(r.y+r.height/2)*MAP_SCALE}))];
    for (const p of points) {
      const projected = new THREE.Vector3(p.x,0,p.y).project(camera);
      assert.ok(Math.abs((projected.x+1)*width/2 - (p.x*scale+matrix.e)) < 1e-6);
      assert.ok(Math.abs((1-projected.y)*height/2 - (p.y*scale+matrix.f)) < 1e-6);
    }
    const floor = new THREE.Vector3(1500,0,1200).project(camera);
    const top = new THREE.Vector3(1500,22,1200).project(camera);
    assert.ok(Math.abs((top.y-floor.y)*height/2 - 11*scale) < 1e-6, "height adds visible depth while the footprint stays fixed");
  }
});

test("exterior camera frames the complete original layout at narrow and wide aspects", () => {
  const bounds = new THREE.Box3(new THREE.Vector3(-8.3,-.4,-3.3),new THREE.Vector3(8.3,1.4,4.4));
  for (const aspect of [.4,.75,1,1.6,2.4]) {
    const camera = new THREE.PerspectiveCamera(35,aspect,.05,150);
    frameShip(camera,bounds); camera.updateMatrixWorld(true);
    for (const x of [bounds.min.x,bounds.max.x]) for (const y of [bounds.min.y,bounds.max.y]) for (const z of [bounds.min.z,bounds.max.z]) {
      const p = new THREE.Vector3(x,y,z).project(camera);
      assert.ok(Math.abs(p.x)<.92 && Math.abs(p.y)<.92 && p.z<1 && p.z>-1);
    }
  }
});
