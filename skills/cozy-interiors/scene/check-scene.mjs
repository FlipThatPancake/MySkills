#!/usr/bin/env node
// node check-scene.mjs → measures the built kitchen (kitchen-scene.html?check) and prints every rule it breaks.
// It measures each object's true parts (the page keeps them unmerged in check mode), never a padded box.
// Rules: support (each object rests where scene.json's `mount` says), overlap (two objects pass through each other), room (nothing pokes through a wall or the floor).
// Needs Playwright (global) and a fresh build: node build.mjs.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright');

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('file://' + join(here, 'kitchen-scene.html') + '?check');
await page.waitForFunction(() => window.kitchenScene);
const report = await page.evaluate(() => {
  const { room, kit } = window.kitchenScene, T = kit.THREE, SCENE = room.userData.SCENE, objs = room.userData.objects, R = SCENE.room;
  const TOUCH = 2, REST = 3;   // mm: less overlap than TOUCH counts as touching; a resting object's foot is within REST of what holds it
  room.updateMatrixWorld(true);
  const toRoom = room.matrixWorld.clone().invert();
  // Every closed, solid part of an object, baked to room millimetres (lines, outline hulls, depth twins and flat pictures are not parts).
  const partsOf = (g) => {
    const list = [];
    g.traverse((o) => {
      if (!o.isMesh || o.isLineSegments2 || kit.hulls.includes(o.material) || o.material === kit.depth) return;
      const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      geo.applyMatrix4(new T.Matrix4().multiplyMatrices(toRoom, o.matrixWorld));
      geo.computeBoundingBox();
      const b = geo.boundingBox, s = b.getSize(new T.Vector3());
      if (Math.min(s.x, s.y, s.z) < 0.5) return;   // flat: a picture or a decal, it cannot pass through anything
      const p = geo.attributes.position, keys = new Set();
      for (let i = 0; i < p.count; i++) keys.add([p.getX(i), p.getY(i), p.getZ(i)].map((x) => x.toFixed(2)).join());
      const onBox = [...keys].every((k) => k.split(',').every((x, i) => [b.min, b.max].some((m) => Math.abs(m.getComponent(i) - x) < 0.01)));
      list.push({ geo, box: b, isBox: keys.size === 8 && onBox, mesh: new T.Mesh(geo, new T.MeshBasicMaterial({ side: T.DoubleSide })) });
    });
    return list;
  };
  const ids = Object.keys(objs).filter((id) => objs[id].userData.scene.mount !== 'lines');
  const parts = Object.fromEntries(ids.map((id) => [id, partsOf(objs[id])]));
  const sceneOf = (id) => objs[id].userData.scene;
  const issues = [], v = new T.Vector3(), rc = new T.Raycaster();

  // support and room
  for (const id of ids) {
    const o = sceneOf(id), all = parts[id], box = new T.Box3(), m = o.mount;
    all.forEach((p) => box.union(p.box));
    if (m === 'floor' && Math.abs(box.min.y - R.floor) > REST) issues.push({ rule: 'support', what: `${id} should stand on the floor; its lowest point is at ${box.min.y.toFixed(0)} mm` });
    if (m === 'wall' && Math.abs(box.min.z - R.backWall) > REST) issues.push({ rule: 'support', what: `${id} should hang on the back wall; its back is ${(box.min.z - R.backWall).toFixed(0)} mm off it` });
    if (m === 'ceiling') issues.push({ rule: 'support', soft: true, what: `${id} hangs from a ceiling, but the room has none (its cord fades out)` });
    if (m.startsWith('in:')) { const host = new T.Box3(); parts[m.slice(3)].forEach((p) => host.union(p.box)); if (!host.containsBox(box)) issues.push({ rule: 'support', soft: true, what: `${id} reaches outside ${m.slice(3)}` }); }
    if (m === 'on') {   // its bottom layer must sit on the top of another object's part (`inset` mm lower when it is set into it, like a hob in a worktop)
      const sink = o.inset || 0, foot = new T.Box3();
      for (const p of all) { const pos = p.geo.attributes.position; for (let k = 0; k < pos.count; k++) { v.fromBufferAttribute(pos, k); if (v.y <= box.min.y + 1) foot.expandByPoint(v); } }
      // rays straight down from a 24 x 24 grid over that bottom layer: something must be within REST (plus the inset) under at least one of them
      let held = null;
      const down = new T.Vector3(0, -1, 0), N = 24;
      rc.far = REST + sink + 0.5;
      for (let i = 0; i <= N && !held; i++) for (let j = 0; j <= N && !held; j++) {
        rc.set(new T.Vector3(foot.min.x + (foot.max.x - foot.min.x) * i / N, box.min.y + sink + 0.5, foot.min.z + (foot.max.z - foot.min.z) * j / N), down);
        for (const other of ids) if (other !== id && !held) for (const q of parts[other]) if (q.box.max.y > box.min.y - REST && rc.intersectObject(q.mesh, false).length) { held = other; break; }
      }
      rc.far = Infinity;
      if (held) o._on = held;
      else issues.push({ rule: 'support', what: `${id} floats: nothing is under its lowest point (${box.min.y.toFixed(0)} mm up)` });
      const fs = foot.getSize(new T.Vector3());
      if (held && Math.max(fs.x, fs.z) < 5) issues.push({ rule: 'support', soft: true, what: `${id} rests on a point, not a foot (its base is ${Math.max(fs.x, fs.z).toFixed(1)} mm across)` });
    }
    const out = [];
    if (box.min.z < R.backWall - 1) out.push(`${(R.backWall - box.min.z).toFixed(0)} mm through the back wall`);
    if (box.min.x < R.sideWall - 1) out.push(`${(R.sideWall - box.min.x).toFixed(0)} mm through the side wall`);
    if (box.min.y < R.floor - 1) out.push(`${(R.floor - box.min.y).toFixed(0)} mm into the floor`);
    if (out.length) issues.push({ rule: 'room', what: `${id} reaches ${out.join(', ')}` });
  }

  // overlap. A point is inside a closed part when rays from it cross the surface an odd number of times (two of three directions must agree).
  const inside = (pt, part) => {
    let votes = 0;
    for (const d of [[1, 0.0013, 0.0007], [0.0011, 1, 0.0017], [0.0019, 0.0005, 1]]) {
      rc.set(pt, new T.Vector3(...d).normalize());
      const dist = [];
      rc.intersectObject(part.mesh, false).forEach((h) => { if (!dist.some((x) => Math.abs(x - h.distance) < 1e-3)) dist.push(h.distance); });
      if (dist.length % 2) votes++;
    }
    return votes >= 2;
  };
  const overlapBox = (a, b) => { const i = a.box.clone().intersect(b.box); if (i.isEmpty()) return null; const s = i.getSize(new T.Vector3()); return Math.min(s.x, s.y, s.z) < TOUCH ? null : i; };
  const pokes = (a, b, i) => {   // does a vertex of a, 1 mm in from the overlap's faces, sit inside b?
    const p = a.geo.attributes.position, shrunk = i.clone().expandByScalar(-1);
    for (let k = 0; k < p.count; k++) { v.fromBufferAttribute(p, k); if (shrunk.containsPoint(v) && inside(v, b)) return v.clone(); }
    return null;
  };
  for (let x = 0; x < ids.length; x++) for (let y = x + 1; y < ids.length; y++) {
    const A = ids[x], B = ids[y], sa = sceneOf(A), sb = sceneOf(B);
    let worst = null;
    for (const a of parts[A]) for (const b of parts[B]) {
      const i = overlapBox(a, b); if (!i) continue;
      const hit = a.isBox && b.isBox ? i.getCenter(new T.Vector3()) : pokes(a, b, i) || pokes(b, a, i);
      if (hit) { const s = i.getSize(new T.Vector3()), depth = Math.min(s.x, s.y, s.z); if (!worst || depth > worst.depth) worst = { depth, at: hit }; }
    }
    // a part set into its holder may sink `inset` mm into it
    if (worst && ((sa._on === B && worst.depth <= (sa.inset || 0) + 1) || (sb._on === A && worst.depth <= (sb.inset || 0) + 1))) worst = null;
    if (worst) issues.push({ rule: 'overlap', what: `${A} and ${B} pass through each other by about ${worst.depth.toFixed(0)} mm`, at: worst.at.toArray().map(Math.round) });
  }
  const rests = ids.filter((id) => sceneOf(id)._on).map((id) => `${id} on ${sceneOf(id)._on}`);
  return { objects: ids.length, parts: ids.reduce((n, id) => n + parts[id].length, 0), issues, rests };
});
await browser.close();
if (errors.length) console.log('page errors:', errors);
console.log(`${report.objects} objects, ${report.parts} parts measured. Resting: ${report.rests.join('; ')}`);
for (const i of report.issues) console.log(`${i.soft ? 'note' : 'FAIL'} [${i.rule}] ${i.what}${i.at ? ' near ' + i.at.join(', ') : ''}`);
const hard = report.issues.filter((i) => !i.soft);
console.log(hard.length ? `${hard.length} problem(s).` : 'No problems.');
process.exit(hard.length ? 1 : 0);
