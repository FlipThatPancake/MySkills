#!/usr/bin/env node
// node check-home.mjs [scenes/x.json] → builds the scene (?check keeps every part) and prints the rules a `home` scene breaks.
// Rules: openings (1200 mm of clear wall between two openings, round corners too), sash (nothing in an inward sash's sweep), table (centred on a pendant or rug, 900 mm clear or against a wall), path (a door or arch keeps 1000 x 1500 mm clear), overlap (two floor pieces, or two wall pieces, pass through each other), wall (an object straddles a wall plane), floor (below it),
// swing (a door leaf or sash, at every angle from shut to wide open, touches an object or another opening's frame; so does an opening front of a cabinet run),
// Needs Playwright (global) and esbuild (global).
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
  // ---- placement rules, in each wall's own frame (x along the wall from its `to` end, z out into the room, y up)
  const toLocal = (W, bb) => { const xs = [], zs = []; for (const x of [bb.min.x, bb.max.x]) for (const z of [bb.min.z, bb.max.z]) { const dx = x - W.to[0], dz = z - W.to[1]; xs.push(-(dx * W.d[0] + dz * W.d[1])); zs.push(dx * W.n[0] + dz * W.n[1]); } return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), y0: bb.min.y, y1: bb.max.y }; };
  const hit3 = (a, b, tol = 2) => a.x1 - b.x0 > tol && b.x1 - a.x0 > tol && a.z1 - b.z0 > tol && b.z1 - a.z0 > tol && a.y1 - b.y0 > tol && b.y1 - a.y0 > tol;
  const gap2 = (a, b) => Math.hypot(Math.max(a.min.x - b.max.x, b.min.x - a.max.x, 0), Math.max(a.min.z - b.max.z, b.min.z - a.max.z, 0));
  const GAP = 1200;
  // 1. at least 1200 mm of clear wall between two openings, on one wall and round a corner
  const span = (W, b) => [b.op.at - b.op.width / 2, b.op.at + b.op.width / 2];
  for (const W of home.walls) {
    const L = W.built.map((b) => ({ b, s: span(W, b) })).sort((p, q) => p.s[0] - q.s[0]);
    for (let i = 1; i < L.length; i++) if (L[i].s[0] - L[i - 1].s[1] < GAP) out.push({ rule: 'openings', what: `wall ${W.i}: the ${L[i - 1].b.op.kind} at ${L[i - 1].b.op.at} and the ${L[i].b.op.kind} at ${L[i].b.op.at} leave ${(L[i].s[0] - L[i - 1].s[1]).toFixed(0)} mm of wall (need ${GAP})` });
  }
  const sq = (a, b) => Math.abs(a.d[0] * b.d[0] + a.d[1] * b.d[1]) < 0.5, near = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 40;
  for (const W of home.walls) for (const V of home.walls) {
    if (W === V || !near(W.to, V.from) || !sq(W, V) || !W.built.length || !V.built.length) continue;
    const dw = Math.min(...W.built.map((b) => W.len - span(W, b)[1])), dv = Math.min(...V.built.map((b) => span(V, b)[0]));
    if (dw + dv < GAP) out.push({ rule: 'openings', what: `round the corner of walls ${W.i} and ${V.i} the openings leave ${(dw + dv).toFixed(0)} mm of wall (need ${GAP})` });
  }
  // 2. an inward sash sweeps a zone as deep as half the window is wide: nothing taller than the sill stands in it (a tap included)
  const things = Object.keys(objs).filter((id) => !['rug', 'curtain'].includes(sc(id).asset)).map((id) => ({ id, box: boxes[id] }));
  for (const id of Object.keys(objs)) {   // each tap is a thing of its own
    const o = objs[id]; if (sc(id).asset !== 'baseRun') continue;
    let x = 0; for (const m of sc(id).params.modules) { if (m.kind === 'sink') { const c = new T.Vector3(x + m.w / 2, 0, -(sc(id).params.depth || 600) + 50).applyMatrix4(o.matrixWorld); things.push({ id: `${id}'s tap`, box: new T.Box3(new T.Vector3(c.x - 25, 900, c.z - 25), new T.Vector3(c.x + 25, 1380, c.z + 25)) }); } x += m.w; }
  }
  for (const W of home.walls) for (const b of W.built) {
    if (b.op.kind !== 'window' || b.op.sash === 'fixed') continue;
    const xc = W.len - b.op.at, w = b.op.width, y0 = b.op.sill ?? 1000, zone = { x0: xc - w / 2, x1: xc + w / 2, z0: 0, z1: w / 2 + 60, y0, y1: y0 + (b.op.height ?? 1100) };
    for (const t of things) { if (sc(t.id.split("'")[0])?.mount === 'wall' && false) continue; if (hit3(toLocal(W, t.box), zone)) out.push({ rule: 'sash', what: `${t.id} stands in the sweep of the window on wall ${W.i} at ${b.op.at} (make that window fixed or move it)` }); }
  }
  // 3. a table has something under its middle (a pendant or a rug), and stands against a wall or keeps 900 mm clear all round
  for (const id of Object.keys(objs).filter((i) => sc(i).asset === 'table')) {
    const tb = boxes[id], c = tb.getCenter(new T.Vector3());
    const centred = Object.keys(objs).some((o) => ['pendantLamp', 'rug'].includes(sc(o).asset) && Math.hypot(objs[o].position.x - c.x, objs[o].position.z - c.z) < 150);
    if (!centred) out.push({ rule: 'table', what: `${id} has no pendant or rug centred on it` });
    for (const W of home.walls) { const l = toLocal(W, tb); if (l.x1 > 0 && l.x0 < W.len && l.z0 >= -3 && l.z0 > 5 && l.z0 < 900) out.push({ rule: 'table', what: `${id} is ${l.z0.toFixed(0)} mm from wall ${W.i}: stand it against the wall or keep 900 mm` }); }
    for (const o of Object.keys(objs)) { if (o === id || ['rug', 'chair', 'curtain'].includes(sc(o).asset) || !['floor'].includes(sc(o).mount)) continue; const g = gap2(tb, boxes[o]); if (g < 900) out.push({ rule: 'table', what: `${id} is ${g.toFixed(0)} mm from ${o} (need 900)` }); }
  }
  // 4. a door or arch keeps a path 1000 mm wide and 1500 mm deep straight ahead (floor pieces; rugs and lamps do not count)
  for (const W of home.walls) for (const b of W.built) {
    if (b.op.kind === 'window') continue;
    const xc = W.len - b.op.at, zone = { x0: xc - 500, x1: xc + 500, z0: 0, z1: 1500, y0: 0, y1: 1900 };
    for (const id of Object.keys(objs)) { if (sc(id).mount !== 'floor' || ['rug'].includes(sc(id).asset)) continue; if (hit3(toLocal(W, boxes[id]), zone, 20)) out.push({ rule: 'path', what: `${id} blocks the path in front of the ${b.op.kind} on wall ${W.i} at ${b.op.at}` }); }
  }
  return out;
});
await browser.close();
for (const e of errors) console.log('PAGE ERROR', e);
for (const i of issues) console.log(`[${i.rule}] ${i.what}`);
console.log(issues.length || errors.length ? `${basename(scene)}: ${issues.length} issue(s)` : `${basename(scene)}: No problems.`);
