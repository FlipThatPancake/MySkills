// loadScene(scene.json path | parsed scene, { src }) → the home built in Node with the page's own buildHome (parts kept separate), as plain data:
//   { objects: [{ id, asset, mount, onSill, lift, area, group, parts }], env: [parts], walls, height, ms }
// A part is { tris (Float64Array, world mm, 3 numbers a vertex), kind: convex | concave | open | flat, content, through, box: { mn, mx }, vol, area, type }.
// buildHome, not buildScene: only buildHome passes the ceiling height to the hood and the stove, so it is what the page shows.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classify } from './shapes.mjs';
const SRC = join(dirname(fileURLToPath(import.meta.url)), '../src');
const ctx = new Proxy({}, { get: (t, k) => k === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : k === 'createImageData' ? (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) : () => ({ addColorStop() {} }), set: () => true });
const DOC = { createElement: () => ({ getContext: () => ctx, width: 0, height: 0 }) };

export async function loadScene(scene, { src = SRC } = {}) {
  if (scene && scene.objects && scene.env) return scene;   // already loaded (fixtures build objects by hand)
  globalThis.document ??= DOC;
  const S = typeof scene === 'string' ? JSON.parse(readFileSync(scene, 'utf8')) : scene;
  const { createKit } = await import(join(src, 'kitchen3d.js')), { buildHome } = await import(join(src, 'home.js')), { REGISTRY } = await import(join(src, 'library/index.js'));
  const kit = createKit(); kit.keepParts = true; const T = kit.THREE;
  const t0 = performance.now(), H = buildHome(kit, S.home, REGISTRY, S.areas || []); H.group.updateMatrixWorld(true); const tBuild = performance.now() - t0;
  const solid = (o) => o.isMesh && !o.isLineSegments2 && !o.userData.lines && !o.userData.kitLine && !o.material.isMeshBasicMaterial && !kit.hulls.includes(o.material) && o.material !== kit.depth;
  const v = new T.Vector3();
  const grab = (o) => { const geo = o.geometry, p = geo.attributes.position, ix = geo.index, n = ix ? ix.count : p.count, t = new Float64Array(n * 3); for (let i = 0; i < n; i++) { v.fromBufferAttribute(p, ix ? ix.getX(i) : i).applyMatrix4(o.matrixWorld); t[i * 3] = v.x; t[i * 3 + 1] = v.y; t[i * 3 + 2] = v.z; } return t; };
  const part = (o) => { const tris = grab(o), I = classify(tris); return { tris, kind: I.kind, content: !!o.userData.content, through: !!o.userData.through, box: { mn: I.mn, mx: I.mx }, vol: I.vol, area: I.area, type: o.geometry.type }; };
  const t1 = performance.now(), objects = [], inObj = new Set();
  for (const [id, g] of Object.entries(H.objects)) {
    const sc = g.userData.scene || {}, parts = [];
    g.traverse((o) => { inObj.add(o); if (solid(o)) parts.push(part(o)); });
    objects.push({ id, asset: sc.asset, mount: sc.mount || 'floor', onSill: !!sc.onSill, lift: sc.lift || 0, area: sc.area, group: sc.group, scene: sc, parts });
  }
  // the openings' physical parts (frames, sills, sashes) are the meshes outside the objects that openings.js marks userData.solid
  const env = []; H.group.traverse((o) => { if (inObj.has(o) || !o.userData.solid || !solid(o)) return; env.push(part(o)); });
  // each wall with its openings' holes as [s0, s1, y0, y1]: s runs from the wall's `from` end along it (home.js keeps them in the wall plane's own x, which runs back from `to`)
  const walls = (H.walls || []).map((w) => ({ id: w.id, from: w.from, to: w.to, len: w.len, holes: (w.holes || []).map((h) => { const xs = h.map((p) => w.len - p[0]), ys = h.map((p) => p[1]); return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]; }) }));
  return { objects, env, walls, height: S.home.height || 2700, ms: { build: tBuild, classify: performance.now() - t1 } };
}
