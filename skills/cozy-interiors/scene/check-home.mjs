#!/usr/bin/env node
// node check-home.mjs [scenes/x.json] → builds the scene (?check keeps every part) and prints the rules a `home` scene breaks.
// Rules: openings (1200 mm of clear wall between two openings, round corners too), sash (nothing in an inward sash's sweep), table (centred on a pendant or rug, 900 mm clear or against a wall), path (a door or arch keeps 1000 x 1500 mm clear), overlap (two floor pieces, or two wall pieces, pass through each other), wall (an object straddles a wall plane), floor (below it),
// swing (a door leaf or sash, at every angle from shut to wide open, touches an object or another opening's frame; so does an opening front of a cabinet run),
// Per area (scenes with `areas`): enough to look at (at least 8 objects in the floor, waist and wall bands, a hero, something living, something soft, something on a wall, every object in a group of two or more, one or two backing walls),
// and the home view at 1200 x 750 (every object inside the frame with a 6% margin, nothing of a neighbour in front, no lamp over an opening or another lamp, seating: sofa backs onto a wall, chairs face the table, no seat shows its back, the coffee table visible).
// Needs Playwright (global) and esbuild (global).
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url)), scene = resolve(process.argv[2] || join(here, 'scenes/kitchen-view.json'));
execSync(`node ${join(here, 'build.mjs')} ${scene}`, { stdio: 'ignore' });
const { chromium } = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 750 } }); const errors = [];
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
  // an object turned off the grid (a sofa on a wall at 60 degrees) is measured by its own box, turned with it: corners are its 8 corners in the world
  const cornersOf = (g) => {
    g.updateMatrixWorld(true); const inv = g.matrixWorld.clone().invert(), b = new T.Box3(), bb = new T.Box3();
    g.traverse((o) => { if (!o.isMesh || o.isLineSegments2 || o.material.isMeshBasicMaterial || kit.hulls.includes(o.material) || o.material === kit.depth) return; o.geometry.computeBoundingBox(); b.union(bb.copy(o.geometry.boundingBox).applyMatrix4(inv.clone().multiply(o.matrixWorld))); });
    const pts = []; for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) pts.push(new T.Vector3(x, y, z).applyMatrix4(g.matrixWorld));
    if (sc0(g) === 'baseRun') for (const p of pts) p.y = Math.min(p.y, 940);
    return pts;
  };
  function sc0(g) { return g.userData.scene.asset; }
  for (const id of Object.keys(objs)) boxes[id].pts = cornersOf(objs[id]);
  const foot = (id) => { const p = boxes[id].pts, ys = p.map((q) => q.y), y0 = Math.min(...ys); const f = p.filter((q) => q.y < y0 + 1).map((q) => [q.x, q.z]); const cx = f.reduce((a, q) => a + q[0], 0) / f.length, cz = f.reduce((a, q) => a + q[1], 0) / f.length; return f.sort((a, b) => Math.atan2(a[1] - cz, a[0] - cx) - Math.atan2(b[1] - cz, b[0] - cx)); };
  const sat = (A, B, tol) => {   // two convex footprints penetrate by more than tol along every edge normal
    for (const P of [A, B]) for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], nx = b[1] - a[1], nz = a[0] - b[0], l = Math.hypot(nx, nz) || 1; let lo1 = 1e9, hi1 = -1e9, lo2 = 1e9, hi2 = -1e9; for (const q of A) { const d = (q[0] * nx + q[1] * nz) / l; lo1 = Math.min(lo1, d); hi1 = Math.max(hi1, d); } for (const q of B) { const d = (q[0] * nx + q[1] * nz) / l; lo2 = Math.min(lo2, d); hi2 = Math.max(hi2, d); } if (Math.min(hi1, hi2) - Math.max(lo1, lo2) <= tol) return false; }
    return true;
  };
  const solid = Object.keys(objs).filter((id) => ['floor', 'wall'].includes(sc(id).mount) && sc(id).asset !== 'rug' && sc(id).asset !== 'curtain');
  const inter = (a, b, tol = 4) => Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x) > tol && Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y) > tol && Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z) > tol;
  const baseRuns = (x, y) => sc(x).asset === 'baseRun' && sc(y).asset === 'baseRun';
  for (let i = 0; i < solid.length; i++) for (let j = i + 1; j < solid.length; j++) {
    const a = solid[i], b = solid[j];
    if (sc(a).mount !== sc(b).mount || baseRuns(a, b)) continue;
    if (Math.min(boxes[a].max.y, boxes[b].max.y) - Math.max(boxes[a].min.y, boxes[b].min.y) > 4 && sat(foot(a), foot(b), 4)) out.push({ rule: 'overlap', what: `${a} and ${b} pass through each other: move one, or shrink what is around it` });
  }
  for (const id of Object.keys(objs)) {
    const m = sc(id).mount, b = boxes[id];
    if (m === 'ceiling' || m === 'lines') continue;
    if (b.min.y < -3) out.push({ rule: 'floor', what: `${id} reaches ${b.min.y.toFixed(0)} mm below the floor: the asset's origin is not where you think (node assets.mjs), set y` });
    for (const W of home.walls) {
      let lo = 1e9, hi = -1e9, inside = false;
      for (const { x, z } of b.pts) { const dx = x - W.to[0], dz = z - W.to[1], d = dx * W.n[0] + dz * W.n[1], s = -(dx * W.d[0] + dz * W.d[1]); lo = Math.min(lo, d); hi = Math.max(hi, d); if (s > 0 && s < W.len) inside = true; }
      if (inside && lo < -3 && hi > 3) out.push({ rule: 'wall', what: `${id} crosses wall ${W.id || W.i} (${lo.toFixed(0)} to ${hi.toFixed(0)} mm): stand it off the wall so its back touches rather than crosses` });
    }
  }
  // swings: every opening front, shut to wide, against every object and every other opening
  const openings = home.walls.flatMap((W) => W.built.map((b) => ({ ...b, wall: W.id || W.i })));
  const fronts = [];
  for (const W of home.walls) for (const b of W.built) for (const f of b.openables) fronts.push({ f, label: `${b.op.kind} on ${W.id || W.i} at ${b.op.at}`, own: b.group, kind: 'opening' });
  for (const id of Object.keys(objs)) for (const f of objs[id].userData.openables || []) fronts.push({ f, label: `${id} ${f.userData.open.kind}`, own: objs[id], kind: 'run' });
  const hide = (g, v) => g.traverse((o) => { if (o.isLineSegments2) o.visible = v; });
  for (const { f, label, own, kind } of fronts) {
    const o = f.userData.open, keep = o.v, rot = f.rotation.y, pos = f.position.z, hit = new Set();
    for (const v of [0.25, 0.5, 0.75, 1]) {
      if (o.kind === 'door') f.rotation.y = o.dir * Math.PI / 180 * o.max * v; else f.position.z = o.max * v;
      f.updateMatrixWorld(true);
      const fb = box(f);
      for (const id of Object.keys(objs)) { if (kind === 'run' && sc(id).asset === 'baseRun') continue; if (objs[id] === own || sc(id).mount === 'ceiling' || ['rug', 'curtain', 'plant', 'pan', 'fruitBowl', 'cuttingBoard'].includes(sc(id).asset)) continue; if (kind === 'run' && ['on', 'wall'].includes(sc(id).mount) && !(sc(id).mount === 'wall' && f.userData.open.yr)) { if (sc(id).mount === 'on') continue; } if (inter(fb, boxes[id], 6)) hit.add(id); }
      if (kind === 'opening') for (const op of openings) { if (op.group === own) continue; const ob = box(op.group); if (inter(fb, ob, 6)) hit.add(`the ${op.op.kind} on ${op.wall} at ${op.op.at}`); }
    }
    f.rotation.y = rot; f.position.z = pos; f.updateMatrixWorld(true);
    if (hit.size) out.push({ rule: 'swing', what: `${label} reaches ${[...hit].join(', ')} when it opens: move the thing, turn the hinge away (hinge: 'l' or 'r'), or make the window fixed` });
  }
  // ---- placement rules, in each wall's own frame (x along the wall from its `to` end, z out into the room, y up)
  const toLocal = (W, bb) => { const xs = [], zs = []; for (const { x, z } of bb.pts || [bb.min.x, bb.max.x].flatMap((x) => [bb.min.z, bb.max.z].map((z) => ({ x, z })))) { const dx = x - W.to[0], dz = z - W.to[1]; xs.push(-(dx * W.d[0] + dz * W.d[1])); zs.push(dx * W.n[0] + dz * W.n[1]); } return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), y0: bb.min.y, y1: bb.max.y }; };
  const hit3 = (a, b, tol = 2) => a.x1 - b.x0 > tol && b.x1 - a.x0 > tol && a.z1 - b.z0 > tol && b.z1 - a.z0 > tol && a.y1 - b.y0 > tol && b.y1 - a.y0 > tol;
  const gap2 = (a, b) => Math.hypot(Math.max(a.min.x - b.max.x, b.min.x - a.max.x, 0), Math.max(a.min.z - b.max.z, b.min.z - a.max.z, 0));
  const GAP = 1200;
  // 1. at least 1200 mm of clear wall between two openings, on one wall and round a corner
  const span = (W, b) => [b.op.at - b.op.width / 2, b.op.at + b.op.width / 2];
  for (const W of home.walls) {
    const L = W.built.map((b) => ({ b, s: span(W, b) })).sort((p, q) => p.s[0] - q.s[0]);
    for (let i = 1; i < L.length; i++) if (L[i].s[0] - L[i - 1].s[1] < GAP) out.push({ rule: 'openings', what: `${W.id || W.i}: the ${L[i - 1].b.op.kind} at ${L[i - 1].b.op.at} and the ${L[i].b.op.kind} at ${L[i].b.op.at} leave ${(L[i].s[0] - L[i - 1].s[1]).toFixed(0)} mm of wall (need ${GAP}): move one opening along its wall` });
  }
  const sq = (a, b) => Math.abs(a.d[0] * b.d[0] + a.d[1] * b.d[1]) < 0.5, near = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 40;
  for (const W of home.walls) for (const V of home.walls) {
    if (W === V || !near(W.to, V.from) || !sq(W, V) || !W.built.length || !V.built.length) continue;
    const dw = Math.min(...W.built.map((b) => W.len - span(W, b)[1])), dv = Math.min(...V.built.map((b) => span(V, b)[0]));
    if (dw + dv < GAP) out.push({ rule: 'openings', what: `round the corner of walls ${W.i} and ${V.i} the openings leave ${(dw + dv).toFixed(0)} mm of wall (need ${GAP}): move one opening along its wall` });
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
    for (const t of things) { if (sc(t.id.split("'")[0])?.mount === 'wall' && false) continue; if (hit3(toLocal(W, t.box), zone)) out.push({ rule: 'sash', what: `${t.id} stands in the sweep of the window on ${W.id || W.i} at ${b.op.at} (make that window fixed or move it)` }); }
  }
  // 3. a table has something under its middle (a pendant or a rug), and stands against a wall or keeps 900 mm clear all round
  for (const id of Object.keys(objs).filter((i) => sc(i).asset === 'table')) {
    const tb = boxes[id], c = tb.getCenter(new T.Vector3());
    const centred = Object.keys(objs).some((o) => ['pendantLamp', 'rug'].includes(sc(o).asset) && Math.hypot(objs[o].position.x - c.x, objs[o].position.z - c.z) < 150);
    if (!centred) out.push({ rule: 'table', what: `${id} has no pendant or rug centred on it` });
    for (const W of home.walls) { const l = toLocal(W, tb); if (l.x1 > 0 && l.x0 < W.len && l.z0 >= -3 && l.z0 > 5 && l.z0 < 900) out.push({ rule: 'table', what: `${id} is ${l.z0.toFixed(0)} mm from ${W.id || W.i}: stand it against the wall or keep 900 mm` }); }
    for (const o of Object.keys(objs)) { if (o === id || ['rug', 'chair', 'curtain'].includes(sc(o).asset) || !['floor'].includes(sc(o).mount)) continue; const g = gap2(tb, boxes[o]); if (g < 900) out.push({ rule: 'table', what: `${id} is ${g.toFixed(0)} mm from ${o} (need 900)` }); }
  }
  // 4. a door or arch keeps a path 1000 mm wide and 1500 mm deep straight ahead (floor pieces; rugs and lamps do not count)
  for (const W of home.walls) for (const b of W.built) {
    if (b.op.kind === 'window') continue;
    const xc = W.len - b.op.at, zone = { x0: xc - 500, x1: xc + 500, z0: 0, z1: 1500, y0: 0, y1: 1900 };
    for (const id of Object.keys(objs)) { if (sc(id).mount !== 'floor' || ['rug'].includes(sc(id).asset)) continue; if (hit3(toLocal(W, boxes[id]), zone, 20)) out.push({ rule: 'path', what: `${id} blocks the path in front of the ${b.op.kind} on ${W.id || W.i} at ${b.op.at}` }); }
  }
  // 5. support: a thing that stands `on` something touches its top (or sits inside it, like a cushion on a seat); a thing on a wall touches that wall
  const inside = (poly, [x, z]) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  const topOf = (id) => sc(id).asset === 'baseRun' ? (sc(id).params?.top || 900) : boxes[id].max.y;
  for (const id of Object.keys(objs)) {
    const m = sc(id).mount, b = boxes[id];
    if (m === 'on') {
      const c = b.getCenter(new T.Vector3()), under = Object.keys(objs).filter((o) => o !== id && ['floor', 'on', 'wall'].includes(sc(o).mount) && !['rug'].includes(sc(o).asset) && inside(foot(o), [c.x, c.z]));
      if (!under.length) out.push({ rule: 'support', what: `${id} stands on nothing (no piece under it)` });
      else if (!under.some((o) => b.min.y >= 100 && b.min.y <= topOf(o) + 25 && b.min.y >= topOf(o) - 25 || b.min.y >= 100 && b.min.y < topOf(o) - 25)) out.push({ rule: 'support', what: `${id} floats ${(b.min.y - Math.max(...under.map(topOf))).toFixed(0)} mm above ${under.join(', ')}` });
    }
    if (m === 'wall') {
      const near = home.walls.some((W) => { let lo = 1e9, hi = -1e9, s0 = 1e9, s1 = -1e9; for (const { x, z } of b.pts) { const dx = x - W.to[0], dz = z - W.to[1], d = dx * W.n[0] + dz * W.n[1], s = -(dx * W.d[0] + dz * W.d[1]); lo = Math.min(lo, d); hi = Math.max(hi, d); s0 = Math.min(s0, s); s1 = Math.max(s1, s); } return lo > -12 && lo < 90 && s1 > 0 && s0 < W.len; });
      if (!near) out.push({ rule: 'support', what: `${id} hangs on no wall (its back is not against one)` });
    }
  }
  return out;
});

const areaIssues = await page.evaluate(() => {
  const api = window.cozyScene; if (!api.areaIds) return [];
  const { home, kit, camera } = api, T = kit.THREE, out = [], objs = home.objects, ids = Object.keys(objs), sc = (id) => objs[id].userData.scene;
  const box = (g) => { g.updateMatrixWorld(true); const b = new T.Box3(), bb = new T.Box3(); g.traverse((o) => { if (!o.isMesh || o.isLineSegments2 || o.material.isMeshBasicMaterial || kit.hulls.includes(o.material) || o.material === kit.depth) return; o.geometry.computeBoundingBox(); b.union(bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); }); return b; };
  const boxes = Object.fromEntries(ids.map((id) => [id, box(objs[id])]));
  const areaOf = (id) => sc(id).area || api.areaIds.find((a) => { const b = api.areas[a].bounds, c = boxes[id].getCenter(new T.Vector3()); return c.x >= b.x0 && c.x <= b.x1 && c.z >= b.z0 && c.z <= b.z1; });
  const rect = (b) => { const xs = [], ys = []; for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) { const p = new T.Vector3(x, y, z).project(camera); xs.push(p.x); ys.push(p.y); } return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }; };
  const ov = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)), area2 = (a) => (a.x1 - a.x0) * (a.y1 - a.y0);
  const face = (id) => { const t = objs[id].rotation.y; return new T.Vector3(Math.sin(t), 0, Math.cos(t)); };
  const SOFT = ['rug', 'curtain', 'cushion', 'pouf', 'basket', 'teaTowel'], WALLDEC = ['picture', 'mirror', 'wallShelf', 'curtain', 'teaTowel', 'coatHooks'], LIVING = ['plant', 'cat'], LAMPS = ['pendantLamp', 'floorLamp'], MINOR = ['socket', 'lightSwitch'];
  for (const A of api.areaIds) {
    const mine = ids.filter((i) => areaOf(i) === A), real = mine.filter((i) => !MINOR.includes(sc(i).asset)), as = (list) => real.filter((i) => list.includes(sc(i).asset));
    const walls = home.walls.filter((w) => w.id && w.id.startsWith(A + '-'));
    // enough to look at
    if (real.length < 8) out.push({ rule: 'interest', what: `${A} has ${real.length} objects (need 8)` });
    for (const [band, f] of [['floor', (i) => sc(i).mount === 'floor'], ['waist', (i) => sc(i).mount === 'on'], ['wall or hanging', (i) => ['wall', 'ceiling'].includes(sc(i).mount)]]) if (!real.some(f)) out.push({ rule: 'interest', what: `${A} has nothing in the ${band} band` });
    if (!real.some((i) => sc(i).hero)) out.push({ rule: 'interest', what: `${A} has no hero piece` });
    if (!as(LIVING).length) out.push({ rule: 'interest', what: `${A} has nothing living (a plant or a cat)` });
    if (!as(SOFT).length) out.push({ rule: 'interest', what: `${A} has nothing soft (rug, curtain, cushion, pouf, basket)` });
    if (!as(WALLDEC).length) out.push({ rule: 'interest', what: `${A} has nothing on a wall (picture, mirror, wall shelf, curtain)` });
    if (walls.length < 1 || walls.length > 2) out.push({ rule: 'interest', what: `${A} has ${walls.length} backing walls (need 1 or 2)` });
    const groups = {}; for (const i of real) (groups[sc(i).group || ''] ||= []).push(i);
    for (const [g, m] of Object.entries(groups)) if (!g) out.push({ rule: 'group', what: `${m.join(', ')} belong to no group` }); else if (m.length < 2) out.push({ rule: 'group', what: `${m[0]} stands alone in "${g}": give it a group or remove it` });
    // the home view
    api.setArea(A, true); camera.updateMatrixWorld(true); camera.updateProjectionMatrix();
    const R = Object.fromEntries(ids.map((i) => [i, rect(boxes[i])]));
    for (const i of mine) { const r = R[i]; if (Math.abs(r.x0) > 0.88 || Math.abs(r.x1) > 0.88 || r.y0 < -0.88 || r.y1 > 0.88) out.push({ rule: 'frame', what: `${A}: ${i} reaches ${(Math.max(Math.abs(r.x0), Math.abs(r.x1), Math.abs(r.y0), Math.abs(r.y1)) * 100).toFixed(0)}% toward the edge of the home view (keep within 88%): the area's objects must fit the frame: remove a stray piece or bring it nearer the group` }); }
    for (const W of home.walls) { if (!W.id || !W.id.startsWith(A + '-')) continue; for (const b of W.built) { const r = rect(box(b.group)); if (Math.abs(r.x0) > 0.88 || Math.abs(r.x1) > 0.88 || r.y0 < -0.88 || r.y1 > 0.88) out.push({ rule: 'frame', what: `${A}: the ${b.op.kind} on ${W.id} at ${b.op.at} reaches the edge of the home view (x ${r.x0.toFixed(2)} to ${r.x1.toFixed(2)}, y ${r.y0.toFixed(2)} to ${r.y1.toFixed(2)})` }); } }
    const hero = real.find((i) => sc(i).hero); if (hero) { const c = (R[hero].x0 + R[hero].x1) / 2; if (Math.abs(c) > 0.6) out.push({ rule: 'frame', what: `${A}: the hero ${hero} sits at ${(c * 50 + 50).toFixed(0)}% across the frame (keep it between 20% and 80%)` }); }
    const cp = camera.position, bnd = api.areas[A].bounds, bb = new T.Box3(new T.Vector3(bnd.x0, 0, bnd.z0), new T.Vector3(bnd.x1, bnd.top || 2500, bnd.z1));
    for (const o of ids) {   // a neighbour never stands between the camera and the area
      if (areaOf(o) === A || sc(o).mount === 'lines') continue; if (bb.distanceToPoint(boxes[o].getCenter(new T.Vector3())) > 2600) continue;
      for (const i of mine) { if (cp.distanceTo(boxes[o].getCenter(new T.Vector3())) >= cp.distanceTo(boxes[i].getCenter(new T.Vector3()))) continue; if (ov(R[o], R[i]) > 0.3 * area2(R[i]) && area2(R[i]) > 1e-3) { out.push({ rule: 'front', what: `${A}: ${o} (of ${areaOf(o)}) stands in front of ${i} in the home view` }); break; } }
    }
    // tour shots: the shot's subject (its `subject` group, else the hero's group) is whole in frame and fills 25 to 70 percent of it
    const heroId = real.find((i) => sc(i).hero), shots = api.areas[A].camera.shots || [];
    for (const [si, sh] of shots.entries()) {
      const subj = sh.subject || (heroId && sc(heroId).group), members = real.filter((i) => sc(i).group === subj);
      if (!members.length) { out.push({ rule: 'shot', what: `${A} shot "${sh.name}": no subject group "${subj}" (name one of: ${[...new Set(real.map((i) => sc(i).group))].join(', ')})` }); continue; }
      api.setArea(A, true); api.at(sh.from, sh.look); camera.fov = sh.fov || 30; camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
      let x0 = 9, x1 = -9, y0 = 9, y1 = -9; for (const i of members) { const r = rect(boxes[i]); x0 = Math.min(x0, r.x0); x1 = Math.max(x1, r.x1); y0 = Math.min(y0, r.y0); y1 = Math.max(y1, r.y1); }
      const fill = Math.max((x1 - x0) / 2, (y1 - y0) / 2);
      if (x0 < -1 || x1 > 1 || y0 < -1 || y1 > 1) out.push({ rule: 'shot', what: `${A} shot "${sh.name}": its subject "${subj}" is cut by the frame (x ${x0.toFixed(2)} to ${x1.toFixed(2)}, y ${y0.toFixed(2)} to ${y1.toFixed(2)}): back the camera off or aim at the group` });
      else if (fill < 0.25 || fill > 0.7) out.push({ rule: 'shot', what: `${A} shot "${sh.name}": its subject "${subj}" fills ${(fill * 100).toFixed(0)}% of the frame (want 25 to 70): ${fill < 0.25 ? 'move in or widen the lens' : 'back off'}` });
    }
    camera.fov = 30; camera.updateProjectionMatrix(); api.setArea(A, true); camera.updateMatrixWorld(true);
    // lamps clear of openings and each other; one lamp unless the area is wide
    const lamps = real.filter((i) => LAMPS.includes(sc(i).asset)), wide = bnd.x1 - bnd.x0 > 5000 || bnd.z1 - bnd.z0 > 5000;
    if (lamps.length > (wide ? 2 : 1)) out.push({ rule: 'lamps', what: `${A} has ${lamps.length} lamps (${wide ? 'two at most' : 'one'})` });
    for (const l of lamps) {
      for (const W of home.walls) { if (!W.id || !W.id.startsWith(A + '-')) continue; for (const b of W.built) if (ov(R[l], rect(box(b.group))) > 0.002) out.push({ rule: 'lamps', what: `${A}: ${l} overlaps the ${b.op.kind} on ${W.id} in the home view` }); }
      for (const m of lamps) if (m > l && ov(R[l], R[m]) > 0) out.push({ rule: 'lamps', what: `${A}: ${l} and ${m} overlap in the home view` });
    }
    // seating
    const table = real.find((i) => sc(i).asset === 'coffeeTable'), seats = real.filter((i) => ['sofa', 'armchair'].includes(sc(i).asset));
    for (const s of seats) {
      const f = face(s), c = boxes[s].getCenter(new T.Vector3()), toCam = cp.clone().sub(c).setY(0).normalize();
      if (f.dot(toCam) < -0.2) out.push({ rule: 'seating', what: `${A}: ${s} shows its back to the home camera` });
      if (sc(s).asset === 'armchair' && table) { const tc = boxes[table].getCenter(new T.Vector3()), to = tc.clone().sub(c).setY(0).normalize(), ang = Math.acos(Math.min(1, f.dot(to))) * 180 / Math.PI; if (ang > 50) out.push({ rule: 'seating', what: `${A}: ${s} faces ${ang.toFixed(0)} degrees away from the coffee table (keep within 50)` }); }
      if (sc(s).asset === 'sofa' && walls.length) { const back = c.clone().addScaledVector(f, -(boxes[s].max.z - boxes[s].min.z > 0 ? 0 : 0)); const d = Math.min(...walls.map((W) => { const p = new T.Vector3().copy(c).addScaledVector(f, -450); return Math.abs((p.x - W.to[0]) * W.n[0] + (p.z - W.to[1]) * W.n[1]); })); if (d > 330) out.push({ rule: 'seating', what: `${A}: the back of ${s} is ${d.toFixed(0)} mm from the nearest wall (a sofa backs onto a wall)` }); }
    }
    if (table) { const r = R[table], hid = mine.filter((i) => i !== table && ['floor'].includes(sc(i).mount) && !['rug', 'plant', 'cat'].includes(sc(i).asset) && cp.distanceTo(boxes[i].getCenter(new T.Vector3())) < cp.distanceTo(boxes[table].getCenter(new T.Vector3())) && ov(R[i], r) > 0.35 * area2(r)); if (hid.length) out.push({ rule: 'seating', what: `${A}: ${hid.join(', ')} hides the coffee table in the home view` }); }
  }
  return out;
});
for (const i of areaIssues) issues.push(i);
await browser.close();
for (const e of errors) console.log('PAGE ERROR', e);
for (const i of issues) console.log(`[${i.rule}] ${i.what}`);
console.log(issues.length || errors.length ? `${basename(scene)}: ${issues.length} issue(s)` : `${basename(scene)}: No problems.`);
