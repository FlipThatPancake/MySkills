#!/usr/bin/env node
// node check-home.mjs <scene.json> → builds the scene (?check keeps every part) and prints the rules a `home` scene breaks.
// Rules: openings (1200 mm of clear wall between two openings, round corners too), sash (nothing in an inward sash's sweep), table (centred on a pendant or rug, 900 mm clear or against a wall), path (a door or arch keeps 1000 x 1500 mm clear), rugs (two rugs overlap), overlap (two floor pieces, or two wall pieces, pass through each other), wall (an object straddles a wall plane), floor (below it),
// swing (a door leaf or sash, at every angle from shut to wide open, touches an object or another opening's frame; so does an opening front of a cabinet run),
// Per area (scenes with `areas`): enough to look at (at least 8 objects in the floor, waist and wall bands, a hero, something living, something soft, something on a wall, every object in a group of two or more, one or two backing walls),
// and the home view at 1200 x 750 (every object inside the frame with a 6% margin, nothing of a neighbour in front, no lamp over an opening or another lamp, seating: sofa backs onto a wall, chairs face the table, no seat shows its back, the coffee table visible).
// Needs Playwright (global) and esbuild (global).
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url)), scene = process.argv.slice(2).find((a) => !a.startsWith('--')) ? resolve(process.argv.slice(2).find((a) => !a.startsWith('--'))) : (console.error('usage: node check-home.mjs <scene.json>   (the scene a spec wrote)'), process.exit(2));
const QUICK = process.argv.includes('--quick'), REUSE = process.argv.includes('--reuse');   // --quick skips the ghost renders (the slow part: run it on the final pass only); --reuse keeps the built page when it is newer than the scene
if (!(REUSE && existsSync(scene.replace(/\.json$/, '.html')) && statSync(scene.replace(/\.json$/, '.html')).mtimeMs > statSync(scene).mtimeMs)) execSync(`node ${join(here, 'build.mjs')} ${scene}`, { stdio: 'ignore' });
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
    g.traverse((o) => { if (!o.isMesh || o.isLineSegments2 || o.userData.lines || o.material.isMeshBasicMaterial || kit.hulls.includes(o.material) || o.material === kit.depth) return; o.geometry.computeBoundingBox(); b.union(bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); });
    g.traverse((o) => { if (o.userData.landing) { const L = new T.Vector3(...o.userData.landing).applyMatrix4(o.matrixWorld), c = b.getCenter(new T.Vector3()); b.expandByPoint(L); b.expandByPoint(new T.Vector3(c.x - 130, L.y, c.z - 130)); b.expandByPoint(new T.Vector3(c.x + 130, L.y, c.z + 130)); } });   // a swaying plant is measured at rest: its blades move with the wind, so their own boxes would change the checks from run to run
    if (b.isEmpty()) b.expandByPoint(new T.Vector3().setFromMatrixPosition(g.matrixWorld));   // a mark drawn only in lines has no solid parts: it counts as a point
    return b;
  };
  const CHIMNEY = { woodStove: 1700, hood: 2250 };
  const boxes = Object.fromEntries(Object.keys(objs).map((id) => { const b = box(objs[id]); if (sc(id).asset === 'baseRun') b.max.y = Math.min(b.max.y, 940); if (CHIMNEY[sc(id).asset]) b.max.y = Math.min(b.max.y, CHIMNEY[sc(id).asset]); return [id, b]; }));   // a chimney or flue runs on up to the ceiling: only its first 1700 (stove) or 2250 (hood) mm count as the object   // a run's tap is not part of its body
  // an object turned off the grid (a sofa on a wall at 60 degrees) is measured by its own box, turned with it: corners are its 8 corners in the world
  const cornersOf = (g) => {
    g.updateMatrixWorld(true); const inv = g.matrixWorld.clone().invert(), b = new T.Box3(), bb = new T.Box3();
    g.traverse((o) => { if (!o.isMesh || o.isLineSegments2 || o.material.isMeshBasicMaterial || kit.hulls.includes(o.material) || o.material === kit.depth) return; o.geometry.computeBoundingBox(); b.union(bb.copy(o.geometry.boundingBox).applyMatrix4(inv.clone().multiply(o.matrixWorld))); });
    if (b.isEmpty()) b.expandByPoint(new T.Vector3().setFromMatrixPosition(g.matrixWorld));
    const pts = []; for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) pts.push(new T.Vector3(x, y, z).applyMatrix4(g.matrixWorld));
    if (sc0(g) === 'baseRun') for (const p of pts) p.y = Math.min(p.y, 940);
    if (CHIMNEY[sc0(g)]) for (const p of pts) p.y = Math.min(p.y, CHIMNEY[sc0(g)]);
    return pts;
  };
  function sc0(g) { return g.userData.scene.asset; }
  for (const id of Object.keys(objs)) boxes[id].pts = cornersOf(objs[id]);
  // an L run (baseRun with joins) is two legs: its own box would count the empty floor inside the L as solid
  const legsOf = (id) => {
    const q = sc(id), J = q.asset === 'baseRun' && q.params?.joins; if (!J) return [boxes[id]];
    const o = objs[id]; o.updateMatrixWorld(true); const D = q.params.depth || 600, L = q.params.modules.reduce((n, m) => n + m.w, 0), j = J.length || D;
    return [[0, -D, L, 0], J.side === 'start' ? [0, 0, D, j] : [L - D, 0, L, j]].map(([x0, z0, x1, z1]) => {
      const b = new T.Box3(); b.pts = []; for (const [x, z] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]) for (const y of [0, 940]) { const v = new T.Vector3(x, y, z).applyMatrix4(o.matrixWorld); b.expandByPoint(v); b.pts.push(v); } return b;
    });
  };
  const footB = (b) => { const p = b.pts, ys = p.map((q) => q.y), y0 = Math.min(...ys); const f = p.filter((q) => q.y < y0 + 1).map((q) => [q.x, q.z]); const cx = f.reduce((a, q) => a + q[0], 0) / f.length, cz = f.reduce((a, q) => a + q[1], 0) / f.length; return f.sort((a, b) => Math.atan2(a[1] - cz, a[0] - cx) - Math.atan2(b[1] - cz, b[0] - cx)); };
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
    if (legsOf(a).some((la) => legsOf(b).some((lb) => Math.min(la.max.y, lb.max.y) - Math.max(la.min.y, lb.min.y) > 4 && sat(footB(la), footB(lb), 4)))) out.push({ rule: 'overlap', what: `${a} and ${b} pass through each other: move one, or shrink what is around it` });
  }
  { const rugs = Object.keys(objs).filter((id) => sc(id).asset === 'rug'); for (let i = 0; i < rugs.length; i++) for (let j = i + 1; j < rugs.length; j++) if (sat(foot(rugs[i]), foot(rugs[j]), 0)) out.push({ rule: 'rugs', what: `${rugs[i]} and ${rugs[j]} overlap: size or move them so each rug lies on its own patch of floor` }); }
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
  // 0. no floating parts: every solid part of an asset touches another part of it (bounding boxes within 8 mm), so the asset is one connected piece
  { const done = new Set(); for (const id of Object.keys(objs)) { const a = sc(id).asset; if (done.has(a + JSON.stringify(sc(id).params?.form)) || ['baseRun', 'wallRun', 'curtain', 'rug', 'floorPlant', 'plant', 'vase', 'cat', 'teaTowel', 'pendantLamp', 'coatHooks', 'cushion', 'bookStack', 'picture', 'mirror', 'jars', 'herbs', 'shelf', 'wallShelf', 'fruitBowl', 'umbrellaStand', 'crate', 'galleryWall', 'wallPlates'].includes(a)) continue;   // frames and plates hang each on the wall itself done.add(a + JSON.stringify(sc(id).params?.form));
      const parts = []; objs[id].updateMatrixWorld(true); objs[id].traverse((o) => { if (!o.isMesh || o.isLineSegments2 || o.material.isMeshBasicMaterial || kit.hulls.includes(o.material) || o.material === kit.depth) return; o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld); if (b.max.x - b.min.x < 3 && b.max.y - b.min.y < 3) return; parts.push(b.expandByScalar(8)); });
      if (parts.length < 2) continue; const comp = parts.map((_, i) => i), find = (i) => comp[i] === i ? i : (comp[i] = find(comp[i]));
      for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) if (parts[i].intersectsBox(parts[j])) comp[find(i)] = find(j);
      const n = new Set(parts.map((_, i) => find(i))).size; if (n > 1) out.push({ rule: 'floating', what: `${a} (${id}) is ${n} loose pieces: a part touches nothing else of it (a plank above its legs, a handle off its body): fix the asset` }); } }
  for (const id of Object.keys(objs)) if (sc(id).asset === 'basket' && sc(id).params?.form === 2 && !/bed|bath/.test(sc(id).area || '')) out.push({ rule: 'accent', what: `${id}: a tall lidded hamper is laundry; in ${sc(id).area} use a magazine rack, log basket, book stack or a different basket form` });
  // 0b. a cushion on a bed or seat leans back (15 to 25 degrees) against the headboard or the back of the seat
  for (const id of Object.keys(objs)) if (sc(id).asset === 'cushion' && ((sc(id).params?.lean ?? 0) < 15 || sc(id).params.lean > 28)) out.push({ rule: 'cushion', what: `${id} stands upright or lies back too far: give it params.lean 15 to 25 so it rests back against the headboard or the seat back` });
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
  // 2b. wall pieces keep 150 mm clear of an opening and its casing (a tea towel rail or a shelf touching a window frame)
  for (const W of home.walls) for (const b of W.built) {
    const xc = W.len - b.op.at, w = b.op.width, y0 = b.op.kind === 'window' ? (b.op.sill ?? 1000) : 0, y1 = b.op.kind === 'window' ? y0 + (b.op.height ?? 1100) : 2400, zone = { x0: xc - w / 2 - 150, x1: xc + w / 2 + 150, z0: -50, z1: 500, y0: y0 - 150, y1: y1 + 150 };
    for (const id of Object.keys(objs)) { if (sc(id).mount !== 'wall' || ['curtain', 'socket', 'lightSwitch'].includes(sc(id).asset)) continue; if (hit3(toLocal(W, boxes[id]), zone, 2)) out.push({ rule: 'casing', what: `${id} is within 150 mm of the ${b.op.kind} on ${W.id || W.i} at ${b.op.at}: move it along the wall to keep 150 mm clear of the casing` }); }
  }
  const SMALLFG1 = ['pouf', 'basket', 'floorPlant', 'plant', 'stool', 'footstool', 'sideTable', 'cat', 'crate', 'stepStool', 'wateringCan', 'umbrellaStand', 'shoes', 'wasteBin', 'fileBox'];
  // 3. a table has something under its middle (a pendant or a rug), and stands against a wall or keeps 900 mm clear all round
  for (const id of Object.keys(objs).filter((i) => sc(i).asset === 'table')) {
    const tb = boxes[id], c = tb.getCenter(new T.Vector3());
    const pend = Object.keys(objs).filter((o) => sc(o).asset === 'pendantLamp'), centred = pend.length ? pend.some((o) => Math.hypot(objs[o].position.x - c.x, objs[o].position.z - c.z) < 100) : Object.keys(objs).some((o) => sc(o).asset === 'rug' && Math.hypot(objs[o].position.x - c.x, objs[o].position.z - c.z) < 150);
    if (!centred) out.push({ rule: 'table', what: `${id} has no pendant centred on it (within 100 mm) or rug centred on it (within 150 mm)` });
    for (const W of home.walls) { const l = toLocal(W, tb); if (l.x1 > 0 && l.x0 < W.len && l.z0 >= -3 && l.z0 > 5 && l.z0 < 900) out.push({ rule: 'table', what: `${id} is ${l.z0.toFixed(0)} mm from ${W.id || W.i}: stand it against the wall or keep 900 mm` }); }
    for (const o of Object.keys(objs)) { if (o === id || ['rug', 'chair', 'curtain'].includes(sc(o).asset) || !['floor'].includes(sc(o).mount)) continue; const g = Math.min(...legsOf(o).map((l) => gap2(tb, l))), need = SMALLFG1.includes(sc(o).asset) ? 600 : 900; if (g < need) out.push({ rule: 'table', what: `${id} is ${g.toFixed(0)} mm from ${o} (need ${need}: 600 for a small piece such as a stool or basket)` }); }
  }
  // 4. a door or arch keeps a path 1000 mm wide and 1500 mm deep straight ahead (floor pieces; rugs and lamps do not count)
  for (const W of home.walls) for (const b of W.built) {
    if (b.op.kind === 'window' || b.op.sill > 0 || /pass$/.test(b.op.style || '')) continue;
    const xc = W.len - b.op.at, zone = { x0: xc - 500, x1: xc + 500, z0: 0, z1: b.op.kind === 'arch' ? 2400 : 1500, y0: 0, y1: 1900 };
    for (const id of Object.keys(objs)) { if (sc(id).mount !== 'floor' || ['rug'].includes(sc(id).asset)) continue; if (hit3(toLocal(W, boxes[id]), zone, 20)) out.push({ rule: 'path', what: `${id} blocks the path in front of the ${b.op.kind} on ${W.id || W.i} at ${b.op.at}` }); }
  }
  // 4b. the front of a console, desk, sideboard or wardrobe keeps 600 mm clear (its own chair, rugs and curtains excepted)
  for (const id of Object.keys(objs)) { if (!['console', 'desk', 'sideboard', 'wardrobe'].includes(sc(id).asset)) continue; for (const W of home.walls) { const l = toLocal(W, boxes[id]); if (l.z0 < -60 || l.z0 > 90 || l.x1 < 0 || l.x0 > W.len) continue; const zone = { x0: l.x0, x1: l.x1, z0: l.z1, z1: l.z1 + 600, y0: 0, y1: 1500 }; for (const o of Object.keys(objs)) { if (o === id || sc(o).mount !== 'floor' || ['rug', 'curtain', 'chair', 'deskChair'].includes(sc(o).asset)) continue; if (hit3(toLocal(W, boxes[o]), zone, 20)) out.push({ rule: 'path', what: `${o} stands within 600 mm in front of ${id}: keep the front of a ${sc(id).asset} clear (move the ${sc(o).asset} to a side or to another group)` }); } break; } }
  // 4c. a tea towel hangs where it is used: within 450 mm of a run's end, or on a wall unit
  for (const t of Object.keys(objs).filter((i) => sc(i).asset === 'teaTowel')) for (const W of home.walls) { const l = toLocal(W, boxes[t]); if (l.z0 < -60 || l.z0 > 120 || l.x1 < 0 || l.x0 > W.len) continue; const ends = Object.keys(objs).filter((i) => ['baseRun', 'wallRun', 'fridge', 'oven'].includes(sc(i).asset) && sc(i).mount !== 'on').map((i) => toLocal(W, boxes[i])).filter((r) => r.z0 < 100); const c = (l.x0 + l.x1) / 2; if (!ends.some((r) => Math.abs(c - r.x0) < 450 || Math.abs(c - r.x1) < 450 || (c > r.x0 - 150 && c < r.x1 + 150 && r.y1 > 1500))) out.push({ rule: 'towel', what: `${t} hangs on bare wall: put it at the end of a run, on a wall unit or beside the sink` }); break; }
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
  // 5b. every chair or stool stands at the thing it serves: a table, desk or counter within 300 mm (a chair faces it), or against a wall
  { const SERVE = ['table', 'roundTable', 'desk', 'baseRun', 'console'], SEATS = ['chair', 'stool', 'deskChair'];
    for (const id of Object.keys(objs).filter((i) => SEATS.includes(sc(i).asset))) {
      const near = Object.keys(objs).filter((o) => o !== id && SERVE.includes(sc(o).asset)).flatMap((o) => legsOf(o).map((b) => ({ o, b }))).map(({ o, b }) => ({ o, g: gap2(boxes[id], b), b })).filter((q) => q.g <= 300);
      const th = objs[id].rotation.y, fx = Math.sin(th), fz = Math.cos(th), facing = (q) => { const c = q.b.getCenter(new T.Vector3()), me = boxes[id].getCenter(new T.Vector3()), dx = c.x - me.x, dz = c.z - me.z, L = Math.hypot(dx, dz) || 1; return (dx * fx + dz * fz) / L > 0.5; };
      const atIt = near.some((q) => sc(id).asset === 'stool' || facing(q));
      const wall = home.walls.some((W) => { let lo = 1e9, s0 = 1e9, s1 = -1e9; for (const { x, z } of boxes[id].pts) { const dx = x - W.to[0], dz = z - W.to[1], d = dx * W.n[0] + dz * W.n[1], s = -(dx * W.d[0] + dz * W.d[1]); lo = Math.min(lo, d); s0 = Math.min(s0, s); s1 = Math.max(s1, s); } return lo > -30 && lo < 150 && s1 > 0 && s0 < W.len; });
      if (!atIt && !wall) out.push({ rule: 'seat', what: `${id} stands ${near.length ? 'at a table but turned away from it' : 'away from any table, desk or counter (300 mm or less) and away from a wall'}: put it at the table, desk or counter it serves (a chair facing it), or push it against a wall` }); } }
  // 6. a small seat or table serves a piece: another floor piece within 600 mm (a stool alone in front of an arch is a prop on its own)
  { const SEAT = ['stool', 'pouf', 'footstool', 'sideTable', 'stepStool', 'floorPlant'], BIG = (i) => sc(i).mount === 'floor' && !['rug', 'plant', 'floorPlant', 'cat', 'basket', 'pouf', 'stool', 'trolley', 'footstool', 'curtain', 'sideTable'].includes(sc(i).asset);
    for (const id of Object.keys(objs).filter((i) => SEAT.includes(sc(i).asset))) { const others = Object.keys(objs).filter((o) => o !== id && (BIG(o) || (sc(id).asset === 'floorPlant' && sc(o).asset === 'rug'))); const framing = sc(id).asset === 'floorPlant' && home.walls.some((W) => W.built.some((b) => { if (b.op.kind === 'window') return false; const l = toLocal(W, boxes[id]), xc = W.len - b.op.at; return l.z0 < 400 && l.x1 > xc - b.op.width / 2 - 700 && l.x0 < xc + b.op.width / 2 + 700; }));   // a plant beside a door or arch frames it
    if (!framing && !others.some((o) => gap2(boxes[id], boxes[o]) <= 600) ) out.push({ rule: 'lone', what: `${id} stands ${others.length ? Math.min(...others.map((o) => gap2(boxes[id], boxes[o]))).toFixed(0) : 'far'} mm from anything it serves (need 600 or less): put it beside a table, desk, bench, sofa or console, or remove it` }); } }
  // 6b. a bar stool (form 0) serves a counter or island, and comes in a pair; anywhere else use a low stool (form 1 or 2) or nothing
  { const ids = Object.keys(objs), tall = ids.filter((i) => sc(i).asset === 'stool' && ((sc(i).params || {}).form ?? 0) === 0);
    for (const id of tall) { const mate = tall.some((o) => o !== id && gap2(boxes[id], boxes[o]) <= 700), counter = ids.some((o) => sc(o).asset === 'baseRun' && gap2(boxes[id], boxes[o]) <= 800);
      if (!mate || !counter) out.push({ rule: 'stool', what: `${id} is a bar stool ${!counter ? 'away from a counter or island' : 'on its own'}: bar stools stand in pairs at a counter or island; elsewhere use a low stool (params.form 1 or 2) or nothing` }); } }
  // 6c. small things sit on a surface that suits them: footwear on the floor, tableware and books never on the floor
  { for (const id of Object.keys(objs)) { const a = sc(id).asset, b = boxes[id];
      if (['shoes', 'boots'].includes(a) && b.min.y > 40) out.push({ rule: 'surface', what: `${id} (${a}) stands ${b.min.y.toFixed(0)} mm above the floor: footwear goes on the floor or a rack, never on a seat or table` });
      if (['mug', 'teaSet', 'jug', 'keyBowl', 'glassesBook', 'breadBasket', 'fruitBowl'].includes(a) && b.min.y < 300) out.push({ rule: 'surface', what: `${id} (${a}) is on the floor: put it on a table, shelf or counter` }); } }
  // 6d. a table carries one centrepiece and one small item at most
  { const ids = Object.keys(objs);
    for (const t of ids.filter((i) => sc(i).asset === 'table')) { const tb = boxes[t], top = tb.max.y, on = ids.filter((o) => o !== t && !['rug', 'chair', 'curtain', 'tablecloth', 'tableRunner', 'pendantForm', 'pendantLamp', 'cloth'].includes(sc(o).asset) && sc(o).mount === 'on' && boxes[o].min.y > top - 30 && boxes[o].min.y < top + 60 && (boxes[o].min.x + boxes[o].max.x) / 2 > tb.min.x && (boxes[o].min.x + boxes[o].max.x) / 2 < tb.max.x && (boxes[o].min.z + boxes[o].max.z) / 2 > tb.min.z && (boxes[o].min.z + boxes[o].max.z) / 2 < tb.max.z);
      if (on.length > 2) out.push({ rule: 'tabletop', what: `${t} carries ${on.length} things (${on.join(', ')}): one centrepiece and one small item at most` }); } }
  // 7. nothing tall stands in front of a window's sill: a piece under or beside a window stays 150 mm below the sill
  for (const W of home.walls) for (const b of W.built) {
    if (b.op.kind !== 'window') continue;
    const xc = W.len - b.op.at, w = b.op.width, y0 = b.op.sill ?? 1000, y1 = y0 + (b.op.height ?? 1100);
    for (const id of Object.keys(objs)) { if (sc(id).mount !== 'floor' || ['rug', 'curtain', 'floorLamp', 'floorPlant', 'chair', 'deskChair', 'baseRun'].includes(sc(id).asset)) continue; const l = toLocal(W, boxes[id]); if (l.x1 > xc - w / 2 && l.x0 < xc + w / 2 && l.z0 < 300 && l.y1 > y0 - 150 && l.y0 < y1) out.push({ rule: 'sill', what: `${id} reaches ${l.y1.toFixed(0)} mm in front of the window on ${W.id || W.i} (sill ${y0}): keep it 150 mm or more below the sill: for a bed lower the headboard (params.head, at most ${Math.max(300, Math.round(y0 - 150))} mm) or move it off the window axis; keep the sill at 900 to 1000 mm` }); }
  }
  // 8. wall units sit over base units (or flank a hood): a lone cabinet hung in the air reads as a mistake
  for (const id of Object.keys(objs).filter((i) => sc(i).asset === 'wallRun')) {
    const bb = boxes[id], W = home.walls.find((w) => { const l = toLocal(w, bb); return l.z0 < 60 && l.x1 > 0 && l.x0 < w.len; }); if (!W) continue; const lw = toLocal(W, bb);
    const under = Object.keys(objs).filter((o) => sc(o).asset === 'baseRun' || sc(o).asset === 'hood' || sc(o).asset === 'fridge').some((o) => { const l = toLocal(W, boxes[o]); return Math.min(l.x1, lw.x1) - Math.max(l.x0, lw.x0) > 0.6 * (lw.x1 - lw.x0) || Math.abs(l.x1 - lw.x0) < 120 && sc(o).asset === 'hood' || Math.abs(lw.x1 - l.x0) < 120 && sc(o).asset === 'hood'; });
    if (!under) out.push({ rule: 'units', what: `${id} hangs over no base unit and does not flank the hood: align it to the base run, pair it round the hood, or use a wallShelf` });
  }
  return out;
});

const areaIssues = await page.evaluate(() => {
  const api = window.cozyScene; if (!api.areaIds) return [];
  const { home, kit, camera } = api, T = kit.THREE, out = [], objs = home.objects, ids = Object.keys(objs), sc = (id) => objs[id].userData.scene;
  const box = (g) => { g.updateMatrixWorld(true); const b = new T.Box3(), bb = new T.Box3(); g.traverse((o) => { if (!o.isMesh || o.isLineSegments2 || o.userData.lines || o.material.isMeshBasicMaterial || kit.hulls.includes(o.material) || o.material === kit.depth) return; o.geometry.computeBoundingBox(); b.union(bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); }); g.traverse((o) => { if (o.userData.landing) { const L = new T.Vector3(...o.userData.landing).applyMatrix4(o.matrixWorld), c = b.getCenter(new T.Vector3()); b.expandByPoint(L); b.expandByPoint(new T.Vector3(c.x - 130, L.y, c.z - 130)); b.expandByPoint(new T.Vector3(c.x + 130, L.y, c.z + 130)); } }); return b; };
  const CHIMNEY = { woodStove: 1700, hood: 2250 }, boxes = Object.fromEntries(ids.map((id) => { const b = box(objs[id]); if (sc(id).asset === 'baseRun') b.max.y = Math.min(b.max.y, 940); if (CHIMNEY[sc(id).asset]) b.max.y = Math.min(b.max.y, CHIMNEY[sc(id).asset]); return [id, b]; }));
  const areaOf = (id) => sc(id).area || api.areaIds.find((a) => { const b = api.areas[a].bounds, c = boxes[id].getCenter(new T.Vector3()); return c.x >= b.x0 && c.x <= b.x1 && c.z >= b.z0 && c.z <= b.z1; });
  const rect = (b) => { const xs = [], ys = []; for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) { const p = new T.Vector3(x, y, z).project(camera); xs.push(p.x); ys.push(p.y); } return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }; };
  const ov = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)), area2 = (a) => (a.x1 - a.x0) * (a.y1 - a.y0);
  const face = (id) => { const t = objs[id].rotation.y; return new T.Vector3(Math.sin(t), 0, Math.cos(t)); };
  const FURN = ['sofa', 'armchair', 'table', 'roundTable', 'chair', 'deskChair', 'bed', 'desk', 'console', 'sideboard', 'wardrobe', 'shelf', 'bench', 'baseRun', 'wallRun', 'fridge', 'coffeeTable', 'chestOfDrawers', 'glazedCabinet', 'woodStove', 'windowSeat', 'daybed', 'readingChair', 'bedsideTable', 'sideTable', 'footstool', 'stool', 'clothesRail', 'shoeRack', 'coatStand', 'hob', 'recordPlayer', 'magazineRack', 'plantStand', 'trolley'];
  const SOFT = ['rug', 'curtain', 'cushion', 'pouf', 'basket', 'teaTowel', 'runner', 'floorCushion', 'benchCushion', 'tablecloth'], WALLDEC = ['picture', 'mirror', 'wallShelf', 'curtain', 'teaTowel', 'coatHooks', 'readShelf', 'pinboard', 'wallCalendar', 'galleryWall', 'wallClock', 'wallPlates', 'openShelf', 'spiceRack', 'potRail', 'wallSconce'], LIVING = ['plant', 'floorPlant', 'cat'], LAMPS = ['pendantLamp', 'floorLamp', 'readingLamp'], MINOR = ['socket', 'lightSwitch'];
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
    for (const [g, m] of Object.entries(groups)) if (m.every((i) => sc(i).asset === 'rug')) continue; else if (!g) out.push({ rule: 'group', what: `${m.join(', ')} belong to no group` }); else if (m.length < 2) out.push({ rule: 'group', what: `${m[0]} stands alone in "${g}": give it a group or remove it` });
    // the home view
    api.setArea(A, true); camera.updateMatrixWorld(true); camera.updateProjectionMatrix();
    const R = Object.fromEntries(ids.map((i) => [i, rect(boxes[i])]));
    for (const i of mine) { const r = R[i]; if (Math.abs(r.x0) > 0.93 || Math.abs(r.x1) > 0.93 || r.y0 < -0.94 || r.y1 > 0.94) out.push({ rule: 'frame', what: `${A}: ${i} reaches ${(Math.max(Math.abs(r.x0), Math.abs(r.x1), Math.abs(r.y0), Math.abs(r.y1)) * 100).toFixed(0)}% toward the edge of the home view (keep within 93%): the area's objects and back-wall openings must fit the frame: remove a stray piece or bring it nearer the group` }); }
    for (const W of home.walls) { if (!W.id || W.id !== A + '-back') continue; for (const b of W.built) { const r = rect(box(b.group)); if (Math.abs(r.x0) > 0.93 || Math.abs(r.x1) > 0.93 || r.y0 < -0.94 || r.y1 > 0.94) out.push({ rule: 'frame', what: `${A}: the ${b.op.kind} on ${W.id} at ${b.op.at} reaches the edge of the home view (x ${r.x0.toFixed(2)} to ${r.x1.toFixed(2)}, y ${r.y0.toFixed(2)} to ${r.y1.toFixed(2)})` }); } }
    const bd = api.areas[A].bounds;
    // ---- what the home view shows (rules from round 1): empty floor, tables, rugs, openings, sunk pieces, bare tops and walls, twins
    const HOMECOV = 0.3, FRAME = { x0: -1, x1: 1, y0: -1, y1: 1 }, loc = (W, b) => { const xs = [], zs = []; for (const x of [b.min.x, b.max.x]) for (const z of [b.min.z, b.max.z]) { const dx = x - W.to[0], dz = z - W.to[1]; xs.push(-(dx * W.d[0] + dz * W.d[1])); zs.push(dx * W.n[0] + dz * W.n[1]); } return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) }; };
    const legRects = (i) => { const q = sc(i), J = q.asset === 'baseRun' && q.params?.joins; if (!J) return [R[i]]; objs[i].updateMatrixWorld(true); const D = q.params.depth || 600, L = q.params.modules.reduce((n, m) => n + m.w, 0), j = J.length || D; return [[0, -D, L, 0], J.side === 'start' ? [0, 0, D, j] : [L - D, 0, L, j]].map(([x0, z0, x1, z1]) => { const b = new T.Box3(); for (const [x, z] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]) for (const y of [0, 940]) b.expandByPoint(new T.Vector3(x, y, z).applyMatrix4(objs[i].matrixWorld)); return rect(b); }); };   // an L run covers its two legs, not the floor inside the L
    { const NX = 36, NY = 20, rs = real.filter((i) => !['rug', 'curtain'].includes(sc(i).asset)).flatMap((i) => legRects(i)), cp0 = camera.position; let empty = 0;   // the floor of the area that no object covers, as a share of the frame
      for (let a = 0; a < NX; a++) for (let b = 0; b < NY; b++) { const px = -1 + (a + 0.5) * 2 / NX, py = -1 + (b + 0.5) * 2 / NY, v = new T.Vector3(px, py, 0.5).unproject(camera).sub(cp0).normalize(); if (v.y > -0.02) continue; const t = -cp0.y / v.y, x = cp0.x + v.x * t, z = cp0.z + v.z * t; if (x < bd.x0 || x > bd.x1 || z < bd.z0 || z > bd.z1) continue; if (!rs.some((r) => px >= r.x0 && px <= r.x1 && py >= r.y0 && py <= r.y1)) empty++; }
      if (empty / (NX * NY) > 1 / 3) out.push({ rule: 'floor', what: `${A}: empty floor fills ${(100 * empty / (NX * NY)).toFixed(0)}% of the home view (a third at most): bring the groups together, or fill the floor with a piece of use` }); }
    { const rs = [...real.filter((i) => !['rug', 'curtain'].includes(sc(i).asset)).flatMap((i) => legRects(i)), ...walls.flatMap((W) => W.built.map((b) => rect(box(b.group))))]; let hit = 0; const NX = 36, NY = 20;   // the share of the home view the area's objects and openings cover: an author brings an opening or group nearer instead of pulling the camera back
      for (let a = 0; a < NX; a++) for (let b = 0; b < NY; b++) { const px = -1 + (a + 0.5) * 2 / NX, py = -1 + (b + 0.5) * 2 / NY; if (rs.some((r) => px >= r.x0 && px <= r.x1 && py >= r.y0 && py <= r.y1)) hit++; }
      if (hit / (NX * NY) < HOMECOV) out.push({ rule: 'frame', what: `${A}: the area's objects and openings cover ${(100 * hit / (NX * NY)).toFixed(0)}% of the home view (${Math.round(HOMECOV * 100)}% at least): move the camera in, or bring the groups and openings nearer each other` }); }
    { const hero = real.find((i) => sc(i).hero); for (const t of real.filter((i) => ['table', 'roundTable'].includes(sc(i).asset) && i !== hero)) { if (!hero) break; const tb = boxes[t]; let wallGap = 1e9; for (const W of walls) { const l = loc(W, tb); if (l.x1 > 0 && l.x0 < W.len) wallGap = Math.min(wallGap, Math.abs(l.z0)); } const hb = boxes[hero], g = Math.hypot(Math.max(tb.min.x - hb.max.x, hb.min.x - tb.max.x, 0), Math.max(tb.min.z - hb.max.z, hb.min.z - tb.max.z, 0)); if (wallGap >= 900 && g > 2500) out.push({ rule: 'table', what: `${t} stands free ${g.toFixed(0)} mm from the hero ${hero} and ${wallGap.toFixed(0)} mm from a wall: stand it against a wall or within 2500 mm of the hero` }); } }
    for (const r of real.filter((i) => sc(i).asset === 'rug')) {   // a rug serves the whole seating or table group: the seats and tables beside it count with the pieces on it
      const rb = boxes[r], SEAT = ['sofa', 'armchair', 'readingChair', 'chair', 'daybed'], TAB = ['coffeeTable', 'table', 'roundTable'], ov1 = (a0, a1, b0, b1) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0)), fa = (b) => (b.max.x - b.min.x) * (b.max.z - b.min.z);
      const inside = (i) => { const c = boxes[i].getCenter(new T.Vector3()); return c.x > rb.min.x && c.x < rb.max.x && c.z > rb.min.z && c.z < rb.max.z; };
      const served = real.filter((i) => i !== r && sc(i).mount === 'floor' && [...SEAT, ...TAB].includes(sc(i).asset) && ov1(boxes[i].min.x, boxes[i].max.x, rb.min.x - 800, rb.max.x + 800) > 0 && ov1(boxes[i].min.z, boxes[i].max.z, rb.min.z - 800, rb.max.z + 800) > 0);
      const on = [...new Set([...real.filter((i) => i !== r && sc(i).mount === 'floor' && !['rug', 'curtain'].includes(sc(i).asset) && inside(i)), ...served])]; if (!on.length) continue;
      for (const i of served.filter((k) => SEAT.includes(sc(k).asset))) { const b = boxes[i], cov = ov1(b.min.x, b.max.x, rb.min.x, rb.max.x) * ov1(b.min.z, b.max.z, rb.min.z, rb.max.z) / fa(b); if (cov < 0.3) out.push({ rule: 'rug', what: `${r} stops short of ${i}: the rug reaches under the front legs of every seat in its group (a sofa's front legs, a chair pulled out): grow the rug or move the seat onto it` }); }
      const ux0 = Math.min(...on.map((i) => boxes[i].min.x)), ux1 = Math.max(...on.map((i) => boxes[i].max.x)), uz0 = Math.min(...on.map((i) => boxes[i].min.z)), uz1 = Math.max(...on.map((i) => boxes[i].max.z)), ex = Math.max(ux0 - rb.min.x, rb.max.x - ux1, uz0 - rb.min.z, rb.max.z - uz1); if (ex > 600) out.push({ rule: 'rug', what: `${r} reaches ${ex.toFixed(0)} mm past the group it serves (600 at most, measured from the outline of its seats, tables and the pieces on it): make it smaller` }); }
    for (const W of walls) for (const b of W.built) { const r = rect(box(b.group)), full = area2(r), inside = ov(r, FRAME);
      if (full > 1e-6 && inside / full < 2 / 3) out.push({ rule: 'frame', what: `${A}: the ${b.op.kind} on ${W.id} is only ${(100 * inside / full).toFixed(0)}% inside the home view (two thirds at least): move the view or the opening` });
      if (b.op.kind === 'window') for (const i of real) { if (['wall', 'ceiling', 'lines'].includes(sc(i).mount) || ['rug', 'curtain', 'cat'].includes(sc(i).asset)) continue; if (sc(i).mount === 'on' && boxes[i].max.y - boxes[i].min.y < 350) continue; if (boxes[i].max.y > (b.op.sill || 900) && ov(R[i], r) > 0.002 && camera.position.distanceTo(boxes[i].getCenter(new T.Vector3())) < camera.position.distanceTo(box(b.group).getCenter(new T.Vector3()))) out.push({ rule: 'sill', what: `${A}: ${i} (${boxes[i].max.y.toFixed(0)} mm) stands in front of the window on ${W.id} (sill ${b.op.sill || 900}) in the home view: move it off the window` }); } }
    for (const o of real.filter((i) => sc(i).mount === 'on' && !['tablecloth', 'cloth', 'cushion', 'foldedThrow', 'tableRunner', 'rug', 'drape'].includes(sc(i).asset))) { const ob = boxes[o], c = ob.getCenter(new T.Vector3()); for (const s2 of real) { if (s2 === o || ['rug', 'curtain', 'tablecloth', 'cloth', 'cushion', 'foldedThrow', 'tableRunner', 'cat', 'plant', 'floorPlant', 'benchCushion', 'floorCushion', 'pouf', 'sofa', 'armchair', 'bed', 'daybed', 'windowSeat', 'basket'].includes(sc(s2).asset) || sc(s2).mount === 'wall') continue; const sb = boxes[s2]; if (c.x < sb.min.x || c.x > sb.max.x || c.z < sb.min.z || c.z > sb.max.z) continue; const top2 = sc(s2).asset === 'baseRun' ? (sc(s2).params?.top || 900) : sb.max.y, sunk = top2 - ob.min.y; if (sunk > 20 && top2 < ob.max.y - 10 && top2 > ob.min.y) out.push({ rule: 'support', what: `${o} sinks ${sunk.toFixed(0)} mm into ${s2}: raise its y to ${top2.toFixed(0)}` }); } }
    for (const t of real.filter((i) => ['table', 'roundTable', 'desk', 'sideboard', 'console'].includes(sc(i).asset))) { const tb = boxes[t], ar = (tb.max.x - tb.min.x) * (tb.max.z - tb.min.z) * (sc(t).asset === 'roundTable' ? 0.785 : 1); if (tb.max.y < 650 || tb.max.y > 1100 || ar < 400000) continue; const n = real.filter((i) => sc(i).mount === 'on' && !['tablecloth', 'tableRunner', 'cloth', 'rug'].includes(sc(i).asset) && boxes[i].getCenter(new T.Vector3()).x > tb.min.x && boxes[i].getCenter(new T.Vector3()).x < tb.max.x && boxes[i].getCenter(new T.Vector3()).z > tb.min.z && boxes[i].getCenter(new T.Vector3()).z < tb.max.z && Math.abs(boxes[i].min.y - tb.max.y) < 80).length; if (n < 2) out.push({ rule: 'bare', what: `${A}: the top of ${t} (${(ar / 1e6).toFixed(1)} m2) holds ${n} thing${n === 1 ? '' : 's'} (two at least)` }); }
    for (const W of walls) { const iv = []; for (const i of real) { const bb = boxes[i]; if (bb.max.y < 1000 || bb.min.y > 2000) continue; const l = loc(W, bb); if (l.z0 > 700 || l.z1 < -50) continue; iv.push([l.x0, l.x1]); } for (const b of W.built) { const xc = W.len - b.op.at; iv.push([xc - b.op.width / 2, xc + b.op.width / 2]); } iv.sort((a, b) => a[0] - b[0]); let at = 0, worst = 0; for (const [a, b] of iv) { worst = Math.max(worst, a - at); at = Math.max(at, b); } worst = Math.max(worst, W.len - at); if (worst > 1800) out.push({ rule: 'bare', what: `${A}: ${W.id} has a ${worst.toFixed(0)} mm stretch with nothing between 1.0 and 2.0 m high (1800 at most): hang a picture, mirror, shelf or curtain there` }); }
    { const DECOR = ['plant', 'floorPlant', 'pot', 'vase', 'picture', 'mirror', 'basket', 'pouf', 'stool', 'jug', 'candlesticks', 'wallPlates'], seen2 = {}; for (const i of real.filter((q) => DECOR.includes(sc(q).asset))) { const k = sc(i).asset + JSON.stringify(sc(i).params || {}); (seen2[k] ||= []).push(i); } for (const l of Object.values(seen2)) if (l.length > 1) out.push({ rule: 'variety', what: `${A}: ${l.join(' and ')} are the same ${sc(l[0]).asset} (same parameters): give one another form or size` }); }
    // fill: the area's objects span 70 to 88 percent of the frame width
    { const xs0 = Math.min(...mine.map((i) => R[i].x0)), xs1 = Math.max(...mine.map((i) => R[i].x1)), span = (xs1 - xs0) / 2; const ys0 = Math.min(...mine.map((i) => R[i].y0)), ys1 = Math.max(...mine.map((i) => R[i].y1)); if (ys0 > -0.7) out.push({ rule: 'fill', what: `${A}: its objects span ${((ys1 - ys0) * 50).toFixed(0)}% of the home view's height and its lowest piece sits ${(ys0 * -50 + 50).toFixed(0)}% down the frame (want 85% or lower: floor below the pieces stays under 15%): the view fits the pieces, so make the arrangement less wide or add a low piece in front` }); if (span < 0.7) out.push({ rule: 'fill', what: `${A}: its objects span ${(span * 100).toFixed(0)}% of the home view's width (want 70 to 88): pull the group forward and nearer together, or lower the view` }); }
    // depth: three layers, floor pieces spread over at least 45 percent of the area's depth from the backing wall
    { const bw = home.walls.find((w) => w.id === A + '-back');
      if (bw) { const dist = (x, z) => (x - bw.to[0]) * bw.n[0] + (z - bw.to[1]) * bw.n[1], cs = [[bd.x0, bd.z0], [bd.x1, bd.z1], [bd.x0, bd.z1], [bd.x1, bd.z0]].map((c) => Math.abs(dist(...c))), D = Math.min(Math.max(...cs), 4800);
        const ds = real.filter((i) => ['floor', 'on'].includes(sc(i).mount) && sc(i).asset !== 'rug').map((i) => { const c = boxes[i].getCenter(new T.Vector3()); return Math.abs(dist(c.x, c.z)); }), spread = Math.max(...ds) - Math.min(...ds);
        { const gd = {}; for (const i of real) { const c = boxes[i].getCenter(new T.Vector3()); (gd[sc(i).group] ||= []).push(['pouf', 'basket', 'floorPlant', 'plant', 'stool', 'trolley', 'cat', 'footstool', 'sideTable', 'bookStack', 'vase', 'crate', 'stepStool', 'wateringCan', 'umbrellaStand', 'shoes', 'wasteBin', 'fileBox'].includes(sc(i).asset) ? Math.abs(dist(c.x, c.z)) : 0); } for (const [g, v] of Object.entries(gd)) if (v.length && Math.min(...v) > 0.6 * D) out.push({ rule: 'foreground', what: `${A}: group "${g}" stands entirely in the front layer: a foreground piece belongs to a group with something in the middle layer (a stool of the island, the end of a bench, a plant beside the sofa)` }); }
        { const gm = {}, rugs = new Set(real.filter((i) => sc(i).asset === 'rug').map((i) => sc(i).group)); for (const i of real) if (sc(i).mount === 'floor' && !['rug', 'curtain'].includes(sc(i).asset)) (gm[sc(i).group] ||= []).push(i);   // a group stands out in the room: two floor pieces (or one on its own rug) clear of the backing wall and past 40% of the depth
          const clear = (i) => { const b = boxes[i], c = b.getCenter(new T.Vector3()), near = Math.min(...[b.min.x, b.max.x].flatMap((x) => [b.min.z, b.max.z].map((z) => Math.abs(dist(x, z))))); return near > 500 && Math.abs(dist(c.x, c.z)) > 0.4 * D; }, freeGroup = Object.entries(gm).some(([g, m]) => { const q = m.filter(clear).length; return q >= 2 || (q >= 1 && rugs.has(g)); });
          if (!freeGroup) out.push({ rule: 'depth', what: `${A}: every group stands along a wall: bring one group (two floor pieces, or one on its own rug) out into the floor, clear of the backing wall by 500 mm and past 40% of the depth, like a desk facing the room, a chair and lamp on their own rug, a table set or an island` }); }
        { const poufs = real.filter((i) => sc(i).asset === 'pouf'); if (poufs.length) (window.__poufAreas ||= new Set()).add(A); }
        if (spread < 0.45 * D) out.push({ rule: 'depth', what: `${A}: its pieces span ${spread.toFixed(0)} mm of the ${D.toFixed(0)} mm depth (want 45%): pull the main group 800 to 1500 mm off the wall and add a low piece in front` }); } }
    // a floor piece lies fully on a rug or clears its edge by 100 mm (a leg on the border looks accidental)
    for (const r of real.filter((i) => sc(i).asset === 'rug')) { const rb = boxes[r]; for (const i of real) { if (i === r || sc(i).mount !== 'floor' || ['rug', 'curtain', 'baseRun', 'wallRun', 'chair', 'deskChair', 'cat'].includes(sc(i).asset)) continue; const b = boxes[i], ox = Math.min(b.max.x, rb.max.x) - Math.max(b.min.x, rb.min.x), oz = Math.min(b.max.z, rb.max.z) - Math.max(b.min.z, rb.min.z); if (ox <= 0 || oz <= 0) continue; const inside = b.min.x >= rb.min.x - 5 && b.max.x <= rb.max.x + 5 && b.min.z >= rb.min.z - 5 && b.max.z <= rb.max.z + 5; if (!inside && Math.min(ox, oz) > 100 && ox * oz < 0.999 * (b.max.x - b.min.x) * (b.max.z - b.min.z)) { if (sc(i).asset === 'sofa' || sc(i).asset === 'bed' || sc(i).asset === 'armchair' || sc(i).asset === 'readingChair') continue; out.push({ rule: 'rug-edge', what: `${i} lies half on ${r}: put it fully on the rug or 100 mm clear of its edge` }); } } }
    // a kettle stands beside the hob, never over a burner
    for (const kt of real.filter((i) => sc(i).asset === 'kettle')) { const c = boxes[kt].getCenter(new T.Vector3()); for (const h of real.filter((i) => sc(i).asset === 'hob')) { const hb = boxes[h]; if (c.x > hb.min.x && c.x < hb.max.x && c.z > hb.min.z && c.z < hb.max.z) out.push({ rule: 'kettle', what: `${kt} sits on the hob ${h}: put it on a worktop module beside the hob` }); } }
    // rugs lie under furniture, never alone
    for (const r of real.filter((i) => sc(i).asset === 'rug' && Math.min(boxes[i].max.x - boxes[i].min.x, boxes[i].max.z - boxes[i].min.z) > 1100)) { const rb = boxes[r];   // a runner (narrower than 1100 mm) lies free
     if (!real.some((i) => i !== r && sc(i).asset !== 'rug' && ['floor'].includes(sc(i).mount) && rb.containsPoint(new T.Vector3(...boxes[i].getCenter(new T.Vector3()).toArray().map((v, k) => (k === 1 ? rb.min.y + 1 : v)))))) out.push({ rule: 'rug', what: `${r} has no furniture on it: put a group on the rug or remove it` }); }
    // ghosts: a piece partly outside the area's bounds fades half-way at the home view
    for (const i of mine) { const b = boxes[i]; if (b.min.x < bd.x0 - 5 || b.max.x > bd.x1 + 5 || b.min.z < bd.z0 - 5 || b.max.z > bd.z1 + 5) out.push({ rule: 'ghost', what: `${A}: ${i} reaches past the area's bounds, so it fades half-way at the home view: grow the rect or move it in` }); }
    for (const W of home.walls) { if (!W.id || !W.id.startsWith(A + '-')) continue; for (const b of W.built) { const q = box(b.group); if (q.min.x < bd.x0 - 400 || q.max.x > bd.x1 + 400 || q.min.z < bd.z0 - 400 || q.max.z > bd.z1 + 400) out.push({ rule: 'ghost', what: `${A}: the ${b.op.kind} on ${W.id} reaches past the area's bounds and fades half-way at the home view` }); } }
    // wall pieces stay visible: a mirror or picture behind a tall piece shows nothing
    for (const w of mine.filter((i) => ['mirror', 'picture', 'wallShelf', 'coatHooks'].includes(sc(i).asset))) for (const o of mine) { if (o === w || sc(o).mount === 'wall' || sc(o).asset === 'rug' || camera.position.distanceTo(boxes[o].getCenter(new T.Vector3())) >= camera.position.distanceTo(boxes[w].getCenter(new T.Vector3()))) continue; if (ov(R[w], R[o]) > 0.4 * area2(R[w]) && area2(R[w]) > 1e-3) { out.push({ rule: 'hidden', what: `${A}: ${w} hangs behind ${o} in the home view: move the ${sc(w).asset} to a clear stretch of wall` }); break; } }
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
      api.setArea(A, true); camera.position.set(...sh.from); camera.lookAt(...sh.look); { const cs = api.controls, off = new T.Vector3(sh.from[0] - sh.look[0], sh.from[1] - sh.look[1], sh.from[2] - sh.look[2]), dd = off.length(), pol = Math.acos(off.y / dd), azi = Math.atan2(off.x, off.z); if (pol < cs.minPolarAngle || pol > cs.maxPolarAngle || dd < cs.minDistance || dd > cs.maxDistance || azi < cs.minAzimuthAngle || azi > cs.maxAzimuthAngle) out.push({ rule: 'shot', what: `${A} shot "${sh.name}": the orbit controls would move this camera (outside their polar, distance or azimuth limits): the tour plays it as written but hands over a different view` }); } camera.fov = sh.fov || 30; camera.updateProjectionMatrix(); camera.updateMatrixWorld(true); const cp2 = camera.position.clone();
      let x0 = 9, x1 = -9, y0 = 9, y1 = -9; for (const i of members) { const r = rect(boxes[i]); x0 = Math.min(x0, r.x0); x1 = Math.max(x1, r.x1); y0 = Math.min(y0, r.y0); y1 = Math.max(y1, r.y1); }
      const fill = Math.max((x1 - x0) / 2, (y1 - y0) / 2);
      if (x0 < -1 || x1 > 1 || y0 < -1 || y1 > 1) out.push({ rule: 'shot', what: `${A} shot "${sh.name}": its subject "${subj}" is cut by the frame (x ${x0.toFixed(2)} to ${x1.toFixed(2)}, y ${y0.toFixed(2)} to ${y1.toFixed(2)}): back the camera off or aim at the group` });
      else if (fill < 0.25 || fill > 0.7) out.push({ rule: 'shot', what: `${A} shot "${sh.name}": its subject "${subj}" fills ${(fill * 100).toFixed(0)}% of the frame (want 25 to 70): ${fill < 0.25 ? 'move in or widen the lens' : 'back off'}` });
      { const cx = (x0 + x1) / 2, fp = sh.from, bb2 = bnd, fovv = sh.fov || 30;
        if (fovv < 26 || fovv > 40) out.push({ rule: 'shot', what: `${A} shot "${sh.name}": lens ${fovv} degrees (use 26 to 40)` });
        if (fp[0] < bb2.x0 - 300 || fp[0] > bb2.x1 + 300 || fp[2] < bb2.z0 - 1 || fp[2] > bb2.z1 + 2500 || fp[1] < 650 || fp[1] > 2200) out.push({ rule: 'shot', what: `${A} shot "${sh.name}": the camera stands outside the area (at most 2500 mm in front of its front edge) or at ${fp[1]} mm (650 to 2200 mm high)` });
        if (Math.abs(cx) > 0.33) out.push({ rule: 'shot', what: `${A} shot "${sh.name}": the subject is at ${(cx * 50 + 50).toFixed(0)}% across the frame (keep it in the middle third: 33% to 67%)` });
        const SMALLFG = ['pouf', 'basket', 'floorPlant', 'plant', 'stool', 'trolley', 'bench', 'footstool', 'sideTable', 'cat', 'crate', 'stepStool', 'wateringCan', 'umbrellaStand', 'shoes', 'wasteBin', 'fileBox'], sx0 = x0, sx1 = x1, sy0 = y0, sy1 = y1, sArea = (sx1 - sx0) * (sy1 - sy0);
        const nearer = real.filter((i) => !members.includes(i) && sc(i).mount !== 'wall' && sc(i).asset !== 'rug' && cp2.distanceTo(boxes[i].getCenter(new T.Vector3())) < Math.min(...members.map((m) => cp2.distanceTo(boxes[m].getCenter(new T.Vector3())))));
        const blocked = nearer.filter((i) => { const r = rect(boxes[i]); return ov(r, { x0: sx0, x1: sx1, y0: sy0, y1: sy1 }) > 0.1 * sArea; });
        if (blocked.length) out.push({ rule: 'shot', what: `${A} shot "${sh.name}": ${blocked.slice(0, 3).join(', ')} stands in front of the subject and hides it: move the camera or the piece` });
        const fg = nearer.concat(members.length > 1 ? members.filter((i) => ['pouf', 'basket', 'floorPlant', 'plant', 'stool', 'footstool', 'sideTable', 'crate', 'bench'].includes(sc(i).asset)) : []).some((i) => { const r = rect(boxes[i]), c = (r.x0 + r.x1) / 2; return SMALLFG.includes(sc(i).asset) && Math.abs(c) > 0.5 && Math.abs(c) < 1.15 && r.y1 > -1; });   // a small piece of the subject's own group at a frame edge counts too
        if (!fg) out.push({ rule: 'shot', what: `${A} shot "${sh.name}": no small foreground piece at a frame edge (it may be cut by one edge), nearer than the subject (a stool, basket, plant, bench end): add one or move the camera` });
        // a foreground piece stays small (10 percent of the frame at most); the area's objects cover 35 percent of the frame; the camera looks down 15 degrees at most unless it is the high shot; the subject holds a piece of furniture
        for (const i of nearer) { if (!SMALLFG.includes(sc(i).asset)) continue; const r = rect(boxes[i]), vis = ov(r, { x0: -1, x1: 1, y0: -1, y1: 1 }) / 4; if (vis > 0.1) out.push({ rule: 'shot', what: `${A} shot "${sh.name}": the foreground ${i} fills ${(vis * 100).toFixed(0)}% of the frame (10% at most): move the camera or use a smaller piece` }); }
        { const cd = camera.getWorldDirection(new T.Vector3()), crossing = (b) => [b.min.x, b.max.x].some((x) => [b.min.y, b.max.y].some((y) => [b.min.z, b.max.z].some((z) => new T.Vector3(x, y, z).sub(camera.position).dot(cd) < 50))), rs = real.filter((i) => !['curtain', 'rug'].includes(sc(i).asset) && !crossing(boxes[i])).map((i) => rect(boxes[i])); let hit = 0, tot = 0; for (let a = 0; a < 24; a++) for (let b = 0; b < 14; b++) { const px = -1 + (a + 0.5) / 12, py = -1 + (b + 0.5) / 7; tot++; if (rs.some((r) => px >= r.x0 && px <= r.x1 && py >= r.y0 && py <= r.y1)) hit++; } if (hit / tot < 0.34) out.push({ rule: 'shot', what: `${A} shot "${sh.name}": the area's objects cover ${(100 * hit / tot).toFixed(0)}% of the frame (35% at least): move in, or aim where things stand` }); }
        { const pitch = Math.atan2(sh.from[1] - sh.look[1], Math.hypot(sh.from[0] - sh.look[0], sh.from[2] - sh.look[2])) * 180 / Math.PI; if (pitch > 15 && sh.from[1] < 1600) out.push({ rule: 'shot', what: `${A} shot "${sh.name}": the camera looks down ${pitch.toFixed(0)} degrees from ${sh.from[1]} mm (15 at most; from 1600 mm up it is the high shot)` }); }
        if (!members.some((i) => FURN.includes(sc(i).asset))) out.push({ rule: 'shot', what: `${A} shot "${sh.name}": its subject group "${subj}" holds no piece of furniture (a table, sofa, chair, bed, run, cabinet): a plant or a cup alone is not a subject` }); }
    }
    { const az = (sh) => Math.atan2(sh.look[0] - sh.from[0], sh.look[2] - sh.from[2]) * 180 / Math.PI; for (let i = 0; i < shots.length; i++) for (let j = i + 1; j < shots.length; j++) { let d = Math.abs(az(shots[i]) - az(shots[j])) % 360; if (d > 180) d = 360 - d; if (d < 25) out.push({ rule: 'shot', what: `${A} shots "${shots[i].name}" and "${shots[j].name}" look the same way (${d.toFixed(0)} degrees apart, 25 at least): the tour would show one view twice` }); } }
    camera.fov = 30; camera.updateProjectionMatrix(); api.setArea(A, true); camera.updateMatrixWorld(true);
    // lamps clear of openings and each other; one lamp unless the area is wide
    const lamps = real.filter((i) => LAMPS.includes(sc(i).asset)), wide = bnd.x1 - bnd.x0 > 5000 || bnd.z1 - bnd.z0 > 5000;
    if (lamps.length > 1) out.push({ rule: 'lamps', what: `${A} has ${lamps.length} lamps (one: a pendant over the table or a floor lamp)` });
    for (const l of lamps) for (const d of as(WALLDEC)) if (ov(R[l], R[d]) > 0.002 && sc(d).asset !== 'curtain') out.push({ rule: 'lamps', what: `${A}: ${l} overlaps ${d} in the home view: move the lamp or the ${sc(d).asset}` });
    for (const l of real.filter((i) => LAMPS.includes(sc(i).asset) || sc(i).asset === 'pendantForm')) {
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
    for (const f of mine.filter((i) => ['console', 'desk', 'sideboard', 'wardrobe'].includes(sc(i).asset))) { const r = R[f], hid = mine.filter((i) => i !== f && sc(i).mount === 'floor' && !['rug', 'curtain', 'chair', 'deskChair', 'cat', 'baseRun'].includes(sc(i).asset) && cp.distanceTo(boxes[i].getCenter(new T.Vector3())) < cp.distanceTo(boxes[f].getCenter(new T.Vector3())) && ov(R[i], r) > 0.08 * area2(r)); if (hid.length && hid.reduce((t, i) => t + ov(R[i], r), 0) > 0.18 * area2(r)) out.push({ rule: 'hidden', what: `${A}: ${hid.join(', ')} stands in front of ${f} in the home view and hides it: move it clear` }); }
    if (table) { const r = R[table], hid = mine.filter((i) => i !== table && ['floor'].includes(sc(i).mount) && !['rug', 'plant', 'cat'].includes(sc(i).asset) && cp.distanceTo(boxes[i].getCenter(new T.Vector3())) < cp.distanceTo(boxes[table].getCenter(new T.Vector3())) && ov(R[i], r) > 0.35 * area2(r)); if (hid.length) out.push({ rule: 'seating', what: `${A}: ${hid.join(', ')} hides the coffee table in the home view` }); }
  }
  { const ACC = ['basket', 'pouf', 'trolley', 'stool', 'footstool', 'stepStool', 'crate'], seen = {}; for (const i of ids) { const a = sc(i).asset; if (ACC.includes(a)) (seen[a] ||= []).push(i); }
    for (const [a, l] of Object.entries(seen)) if (l.length > (a === 'stool' ? 3 : 1) && new Set(l.map((i) => areaOf(i))).size > 1 || l.length > 3) out.push({ rule: 'variety', what: `${l.join(', ')}: ${a} used in ${new Set(l.map((i) => areaOf(i))).size} areas of one home (one accent asset per home: choose a different foreground piece for each area)` });
    const forms = {}; for (const i of ids) { const f = sc(i).params?.form ?? sc(i).params?.shape; if (f !== undefined) (forms[`${sc(i).asset}/${f}`] ||= []).push(i); }
    for (const [k, l] of Object.entries(forms)) if (l.length > 1 && new Set(l.map((i) => areaOf(i))).size > 1) out.push({ rule: 'variety', what: `${l.join(', ')} all use the same ${k.split('/')[0]} (${k.split('/')[1]}): give each area a different form or shape, one decor accent per home` }); }
    for (const A of api.areaIds) { const mine = ids.filter((i) => areaOf(i) === A); if (!mine.some((i) => sc(i).asset === 'baseRun')) continue;   // a kitchen's decor comes from kitchen use: herbs, jars, a plant pot; no vase, picture, mirror or planter sculpture
      for (const i of mine) { const a = sc(i).asset; if (['vase', 'picture', 'mirror'].includes(a) || (a === 'floorPlant' && sc(i).params?.form === 3)) out.push({ rule: 'variety', what: `${A}: ${i} (${a}) is decor that does not come from kitchen use: use jars, herbs, a plant pot, a cutting board or a wall shelf` }); } }
  if ((window.__poufAreas || new Set()).size > 1) out.push({ rule: 'variety', what: `${[...window.__poufAreas].join(', ')} all use a pouf: one area per home at most; use a stool, bench end, basket or plant elsewhere` });
  return out;
});
for (const i of areaIssues) issues.push(i);
// ghosts in tour shots: render each shot twice, once as it is and once with everything of the other areas hidden; any pixels that differ are a partly faded neighbour
{
  const list = QUICK ? [] : await page.evaluate(() => window.cozyScene.areaIds ? window.cozyScene.areaIds.map((id) => [id, (window.cozyScene.areas[id].camera.shots || []).map((x) => x.name)]) : []);
  for (const [id, names] of list) for (let i = 0; i < names.length; i++) {
    const go = () => page.evaluate(([id, i]) => { const c = window.cozyScene, s = c.areas[id].camera.shots[i]; c.setArea(id, true); c.controls.minDistance = 10; c.at(s.from, s.look); c.camera.fov = s.fov || 30; c.camera.updateProjectionMatrix(); for (const g of Object.values(c.objects)) { g.userData.tick = null; g.userData.update = null; } c.tour.update = () => false; }, [id, i]);   // frozen: no sway, no butterfly, so two frames of one shot are the same
    await go(); await page.waitForTimeout(300);
    const snap = async () => (await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 690 } })).toString('base64');
    const a = await snap(), a2 = await snap();   // two untouched frames: whatever moves by itself (the butterfly, the cat's sway) is not a ghost
    await page.evaluate((id) => { const { home } = window.cozyScene; window.__hid = []; for (const k of Object.keys(home.objects)) if (home.objects[k].userData.scene.area !== id) { home.objects[k].visible = false; window.__hid.push(home.objects[k]); } for (const W of home.walls) if (!(W.id || '').startsWith(id + '-')) { W.node.visible = false; window.__hid.push(W.node); } }, id);
    await page.waitForTimeout(150);
    const b = await snap();
    await page.evaluate(() => { for (const o of window.__hid) o.visible = true; });
    const n = await page.evaluate(async ([a, a2, b]) => { const load = (d) => new Promise((r) => { const im = new Image(); im.onload = () => r(im); im.src = 'data:image/png;base64,' + d; }), g = (im) => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); return x.getImageData(0, 0, c.width, c.height).data; }; const A = g(await load(a)), A2 = g(await load(a2)), B = g(await load(b)), d = (P, Q, j) => Math.abs(P[j] - Q[j]) + Math.abs(P[j + 1] - Q[j + 1]) + Math.abs(P[j + 2] - Q[j + 2]); let k = 0; for (let j = 0; j < A.length; j += 4) if (d(A, B, j) > 30 && d(A, A2, j) < 10) k++; return k; }, [a, a2, b]);
    if (n > 150) issues.push({ rule: 'ghost', what: `${id} shot "${names[i]}": ${n} pixels belong to another area, partly faded (a ghost of a neighbour): aim the camera away from the neighbouring area or move the shot` });
  }
}
// variety by parameter distance: two areas may share a base asset when its variants clearly differ (distance 2 or more: two style choices, or the same in sizes), see library/space.js
{
  const { readFileSync } = await import('node:fs'), { distance } = await import('./src/library/space.js'), { SPACE } = await import('./src/library/meta.js');
  const objs = JSON.parse(readFileSync(scene, 'utf8')).home.objects.filter((o) => SPACE[o.asset] && !['cushion'].includes(o.asset));
  for (let i = 0; i < objs.length; i++) for (let j = i + 1; j < objs.length; j++) { const a = objs[i], b = objs[j]; if (a.asset === b.asset && a.area !== b.area && distance(a.asset, a.params, b.params) < 2) issues.push({ rule: 'variety', what: `${a.id} and ${b.id} are the same ${a.asset} (parameter distance ${distance(a.asset, a.params, b.params).toFixed(1)}, needs 2): change two style choices or sizes` }); }
}
await browser.close();
for (const e of errors) console.log('PAGE ERROR', e);
for (const i of issues) console.log(`[${i.rule}] ${i.what}`);
console.log(issues.length || errors.length ? `${basename(scene)}: ${issues.length} issue(s)` : `${basename(scene)}: No problems.`);
