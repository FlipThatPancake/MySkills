#!/usr/bin/env node
// node check-home.mjs [scenes/x.json] → builds the scene (?check keeps every part) and prints the rules a `home` scene breaks.
// Rules: overlap (two floor pieces, or two wall pieces, pass through each other), wall (an object straddles a wall plane), floor (below it),
// swing (a door leaf or sash, at every angle from shut to wide open, touches an object or another opening's frame; so does an opening front of a cabinet run),
// window (a tall piece stands in the 600 mm in front of a window). Needs Playwright (global) and esbuild (global).
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url)), scene = resolve(process.argv[2] || join(here, 'scenes/kitchen-view.json'));
execSync(`node ${join(here, 'build.mjs')} ${scene}`, { stdio: 'ignore' });
const { chromium } = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage(); const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('file://' + scene.replace(/\.json$/, '.html') + '?check');
await page.waitForFunction(() => window.cozyScene);
const issues = await page.evaluate(() => {
  const { home, kit } = window.cozyScene, T = kit.THREE, out = [], objs = home.objects;
  home.group.updateMatrixWorld(true);
  const sc = (id) => objs[id].userData.scene;
  const box = (g) => {   // the solid parts only: painted sheets (light, shadow, sky) and lines are not things
    g.updateMatrixWorld(true); const b = new T.Box3(), bb = new T.Box3();
    g.traverse((o) => { if (!o.isMesh || o.isLineSegments2 || o.material.isMeshBasicMaterial || kit.hulls.includes(o.material) || o.material === kit.depth) return; o.geometry.computeBoundingBox(); b.union(bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); });
    return b;
  };
  const boxes = Object.fromEntries(Object.keys(objs).map((id) => { const b = box(objs[id]); if (sc(id).asset === 'baseRun') b.max.y = Math.min(b.max.y, 940); return [id, b]; }));   // a run's tap is not part of its body
  const solid = Object.keys(objs).filter((id) => ['floor', 'wall'].includes(sc(id).mount) && sc(id).asset !== 'rug' && sc(id).asset !== 'curtain');
  const inter = (a, b, tol = 4) => Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x) > tol && Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y) > tol && Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z) > tol;
  const baseRuns = (x, y) => sc(x).asset === 'baseRun' && sc(y).asset === 'baseRun';
  for (let i = 0; i < solid.length; i++) for (let j = i + 1; j < solid.length; j++) {
    const a = solid[i], b = solid[j];
    if (sc(a).mount !== sc(b).mount || baseRuns(a, b)) continue;
    if (inter(boxes[a], boxes[b])) out.push({ rule: 'overlap', what: `${a} and ${b} pass through each other` });
  }
  for (const id of Object.keys(objs)) {
    const m = sc(id).mount, b = boxes[id];
    if (m === 'ceiling' || m === 'lines') continue;
    if (b.min.y < -3) out.push({ rule: 'floor', what: `${id} reaches ${b.min.y.toFixed(0)} mm below the floor` });
    for (const W of home.walls) {
      let lo = 1e9, hi = -1e9, inside = false;
      for (const x of [b.min.x, b.max.x]) for (const z of [b.min.z, b.max.z]) { const dx = x - W.to[0], dz = z - W.to[1], d = dx * W.n[0] + dz * W.n[1], s = -(dx * W.d[0] + dz * W.d[1]); lo = Math.min(lo, d); hi = Math.max(hi, d); if (s > 0 && s < W.len) inside = true; }
      if (inside && lo < -3 && hi > 3) out.push({ rule: 'wall', what: `${id} crosses wall ${W.i} (${lo.toFixed(0)} to ${hi.toFixed(0)} mm)` });
    }
  }
  // swings: every opening front, shut to wide, against every object and every other opening
  const openings = home.walls.flatMap((W) => W.built.map((b) => ({ ...b, wall: W.i })));
  const fronts = [];
  for (const W of home.walls) for (const b of W.built) for (const f of b.openables) fronts.push({ f, label: `${b.op.kind} on wall ${W.i} at ${b.op.at}`, own: b.group, kind: 'opening' });
  for (const id of Object.keys(objs)) for (const f of objs[id].userData.openables || []) fronts.push({ f, label: `${id} ${f.userData.open.kind}`, own: objs[id], kind: 'run' });
  const hide = (g, v) => g.traverse((o) => { if (o.isLineSegments2) o.visible = v; });
  for (const { f, label, own, kind } of fronts) {
    const o = f.userData.open, keep = o.v, rot = f.rotation.y, pos = f.position.z, hit = new Set();
    for (const v of [0.25, 0.5, 0.75, 1]) {
      if (o.kind === 'door') f.rotation.y = o.dir * Math.PI / 180 * o.max * v; else f.position.z = o.max * v;
      f.updateMatrixWorld(true);
      const fb = box(f);
      for (const id of Object.keys(objs)) { if (kind === 'run' && sc(id).asset === 'baseRun') continue; if (objs[id] === own || sc(id).mount === 'ceiling' || ['rug', 'curtain', 'plant', 'pan', 'fruitBowl', 'cuttingBoard'].includes(sc(id).asset)) continue; if (kind === 'run' && ['on', 'wall'].includes(sc(id).mount) && !(sc(id).mount === 'wall' && f.userData.open.yr)) { if (sc(id).mount === 'on') continue; } if (inter(fb, boxes[id], 6)) hit.add(id); }
      if (kind === 'opening') for (const op of openings) { if (op.group === own) continue; const ob = box(op.group); if (inter(fb, ob, 6)) hit.add(`the ${op.op.kind} on wall ${op.wall} at ${op.op.at}`); }
    }
    f.rotation.y = rot; f.position.z = pos; f.updateMatrixWorld(true);
    if (hit.size) out.push({ rule: 'swing', what: `${label} reaches ${[...hit].join(', ')} when it opens` });
  }
  // a tall piece in front of a window
  for (const W of home.walls) for (const b of W.built) {
    if (b.op.kind !== 'window') continue;
    const xc = W.len - b.op.at, w = b.op.width, y0 = b.op.sill ?? 1000, y1 = y0 + (b.op.height ?? 1100), a = new T.Vector3();
    for (const id of solid) {
      const bb = boxes[id]; let lo = 1e9, hi = -1e9, d0 = 1e9;
      for (const x of [bb.min.x, bb.max.x]) for (const z of [bb.min.z, bb.max.z]) { const dx = x - W.to[0], dz = z - W.to[1]; const s = -(dx * W.d[0] + dz * W.d[1]); lo = Math.min(lo, s); hi = Math.max(hi, s); d0 = Math.min(d0, dx * W.n[0] + dz * W.n[1]); }
      if (hi > xc - w / 2 + 40 && lo < xc + w / 2 - 40 && d0 < 600 && d0 > -3 && bb.max.y > y0 + 100 && bb.min.y < y1 - 100 && sc(id).asset !== 'sideboard') out.push({ rule: 'window', what: `${id} stands in front of the window on wall ${W.i} at ${b.op.at}` });
    }
  }
  return out;
});
await browser.close();
for (const e of errors) console.log('PAGE ERROR', e);
for (const i of issues) console.log(`[${i.rule}] ${i.what}`);
console.log(issues.length || errors.length ? `${basename(scene)}: ${issues.length} issue(s)` : `${basename(scene)}: No problems.`);
