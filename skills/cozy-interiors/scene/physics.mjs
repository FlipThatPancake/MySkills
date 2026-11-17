#!/usr/bin/env node
// node physics.mjs <home.html> [--json out.json]
// A rigid-body check for a built cozy-interiors page (check-home runs it and reports its findings; node physics.mjs <home.html> runs it alone).
// It measures the real triangles of every object (page opened with ?check, so parts stay separate), not their boxes:
//   [floating]   nothing under the base of an object that should rest on something
//   [overhangs]  part of its base reaches past the surface it stands on
//   [sunk]       its base lies below the surface it stands on (a chair leg inside a rug)
//   [penetrates] points of one object lie inside the solid of another (deeper than a tolerance)
// Soft things (cushions, throws, cloths) may sink a little into what they lie on; wall and ceiling pieces need no support from below.
// Needs Playwright (global). Units mm.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
const PARTS = process.argv.includes('--parts');   // --parts: also test the parts inside each object against each other (gross penetration, 20 mm), for a sheet of assets
const args = process.argv.slice(2), html = resolve(args.find((a) => !a.startsWith('--'))), jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const { chromium } = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
page.on('pageerror', (e) => console.log('PAGE ERROR', String(e)));
await page.goto('file://' + html + '?check');
await page.waitForFunction(() => window.cozyScene, null, { timeout: 280000 });
const res = await page.evaluate((PARTS) => {
  const { home, kit } = window.cozyScene, T = kit.THREE, objs = home.objects, ids = Object.keys(objs);
  home.group.updateMatrixWorld(true);
  const sc = (id) => objs[id].userData.scene || {};
  const solid = (o) => o.isMesh && !o.isLineSegments2 && !o.userData.lines && !o.material.isMeshBasicMaterial && !kit.hulls.includes(o.material) && o.material !== kit.depth;
  // world-space triangles of an object: Float64Array [ax,ay,az,bx,by,bz,cx,cy,cz, ...] and its box
  const v = new T.Vector3();
  const tris = (g) => {
  const out = [];
    g.traverse((o) => {
      if (!solid(o)) return; const p = o.geometry.attributes.position, ix = o.geometry.index;
      const n = ix ? ix.count : p.count;
      for (let i = 0; i < n; i++) { const k = ix ? ix.getX(i) : i; v.fromBufferAttribute(p, k).applyMatrix4(o.matrixWorld); out.push(v.x, v.y, v.z); }
    });
    return new Float64Array(out);
  };
  const O = {};
  for (const id of ids) {
    const t = tris(objs[id]); if (!t.length) continue;
    const b = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
    for (let i = 0; i < t.length; i += 3) for (let a = 0; a < 3; a++) { if (t[i + a] < b[a]) b[a] = t[i + a]; if (t[i + a] > b[a + 3]) b[a + 3] = t[i + a]; }
    O[id] = { t, b, asset: sc(id).asset, mount: sc(id).mount || 'floor', n: t.length / 9 };
  }
  const list = Object.keys(O);
  // ray (origin o, unit dir d) against triangles: sorted hit distances > eps
  const hits = (t, ox, oy, oz, dx, dy, dz, max = Infinity) => {
    const h = [];
    for (let i = 0; i < t.length; i += 9) {
      const e1x = t[i + 3] - t[i], e1y = t[i + 4] - t[i + 1], e1z = t[i + 5] - t[i + 2], e2x = t[i + 6] - t[i], e2y = t[i + 7] - t[i + 1], e2z = t[i + 8] - t[i + 2];
      const px = dy * e2z - dz * e2y, py = dz * e2x - dx * e2z, pz = dx * e2y - dy * e2x, det = e1x * px + e1y * py + e1z * pz;
      if (det > -1e-9 && det < 1e-9) continue; const inv = 1 / det, tx = ox - t[i], ty = oy - t[i + 1], tz = oz - t[i + 2];
      const u = (tx * px + ty * py + tz * pz) * inv; if (u < 0 || u > 1) continue;
      const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x, w = (dx * qx + dy * qy + dz * qz) * inv; if (w < 0 || u + w > 1) continue;
      const s = (e2x * qx + e2y * qy + e2z * qz) * inv; if (s > 1e-6 && s < max) h.push(s);
    }
    h.sort((a, b) => a - b);
    const u = []; for (const s of h) if (!u.length || s - u[u.length - 1] > 0.01) u.push(s);   // a ray through a shared edge hits two triangles at one distance: count it once
    return u;
  };
  const SOFT = /cushion|throw|cloth|pillow|towel|rug|blanket|curtain|bedding|duvet|windowSeat|sofa|armchair|readingChair|footstool|pouf|daybed|bed/i, soft = (id) => SOFT.test(O[id].asset || '');
  const out = [];
  // ---------- support: the lowest slab of an object, sampled; each sample needs a surface (another object, the floor) right under it.
  // A ray goes down from UP above the base, so a base that has sunk into its support is seen too. Measured in the object's own frame (turned pieces).
  const GAP = 12, SLAB = 12, UP = 60, SINK = 5;   // a few mm of sinking is allowed
  const BUILT_IN = /^(hob|sink|tap|baseRun|wallRun)$/, DRAPE = /cloth|throw|towel|curtain|cushion|pillow|blanket/i;
  for (const id of list) {
    const A = O[id]; if (/^(wall|ceiling|lines)/.test(A.mount) || A.mount.startsWith('in')) continue;
    if (/rug|scuff|leaf|scratch/.test(A.asset || '') || BUILT_IN.test(A.asset || '') || DRAPE.test(A.asset || '')) continue;
    const y0 = A.b[1], pts = new Map();
    for (let i = 0; i < A.t.length; i += 3) if (A.t[i + 1] < y0 + SLAB) pts.set(Math.round(A.t[i] / 15) + ',' + Math.round(A.t[i + 2] / 15), [A.t[i], A.t[i + 2]]);
    for (let i = 0; i < A.t.length; i += 9) if (A.t[i + 1] < y0 + SLAB && A.t[i + 4] < y0 + SLAB && A.t[i + 7] < y0 + SLAB) { const x = (A.t[i] + A.t[i + 3] + A.t[i + 6]) / 3, z = (A.t[i + 2] + A.t[i + 5] + A.t[i + 8]) / 3; pts.set(Math.round(x / 15) + ',' + Math.round(z / 15), [x, z]); }
    const P = [...pts.values()]; if (!P.length) continue;
    const inv = objs[id].matrixWorld.clone().invert(), loc = (x, z) => { v.set(x, y0, z).applyMatrix4(inv); return [v.x, v.z]; };
    const step = Math.max(1, Math.floor(P.length / 150)); let ok = 0, n = 0, drop = 0, sink = 0, sinkInto = null; const under = {};
    const bb = [Infinity, Infinity, -Infinity, -Infinity], sb = [Infinity, Infinity, -Infinity, -Infinity], grow = (q, [x, z]) => { q[0] = Math.min(q[0], x); q[1] = Math.min(q[1], z); q[2] = Math.max(q[2], x); q[3] = Math.max(q[3], z); };
    for (let k = 0; k < P.length; k += step) {
      const [x, z] = P[k]; n++; let gap = y0, by = 'floor';   // the floor is at y 0
      for (const j of list) { if (j === id) continue; const B = O[j]; if (x < B.b[0] || x > B.b[3] || z < B.b[2] || z > B.b[5] || B.b[1] > y0 + UP || B.b[4] < y0 - 400) continue;
        const h = hits(B.t, x, y0 + UP, z, 0, -1, 0, 400 + UP); if (h.length && h[0] - UP < gap) { gap = h[0] - UP; by = j; } }
      const L = loc(x, z); grow(bb, L);
      if (gap <= GAP) { ok++; under[by] = (under[by] || 0) + 1; grow(sb, L); if (-gap > sink) { sink = -gap; sinkInto = by; } } else drop = Math.max(drop, Math.min(gap, 999));
    }
    const area = (q) => Math.max(q[2] - q[0], 1) * Math.max(q[3] - q[1], 1), over = ok ? 1 - area(sb) / area(bb) : 1;
    const softPair = sinkInto && (soft(id) || (sinkInto !== 'floor' && soft(sinkInto) && !/rug/.test(O[sinkInto].asset || '')));
    if (!ok) out.push({ rule: 'floating', id, asset: A.asset, drop: Math.round(drop), y: Math.round(y0) });
    else if (over > 0.15 && A.asset !== 'pan') out.push({ rule: 'overhangs', id, asset: A.asset, over: Math.round(over * 100), on: Object.keys(under), y: Math.round(y0) });
    if (ok && sink > (softPair ? 30 : SINK)) out.push({ rule: 'sunk', id, asset: A.asset, into: sinkInto, depth: Math.round(sink), y: Math.round(y0) });
  }
  // ---------- penetration: sampled points of A inside the solid of B (ray parity agrees in three directions)
  const D = [[0.577, 0.577, 0.577], [-0.267, 0.802, 0.535], [0.802, -0.535, 0.267]], AX = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const inside = (B, x, y, z) => D.every(([a, b, c]) => hits(B.t, x, y, z, a, b, c).length % 2 === 1);
  for (const a of list) for (const b of list) {
    if (a === b) continue; const A = O[a], B = O[b];
    if (A.b[0] > B.b[3] - 3 || A.b[3] < B.b[0] + 3 || A.b[1] > B.b[4] - 3 || A.b[4] < B.b[1] + 3 || A.b[2] > B.b[5] - 3 || A.b[5] < B.b[2] + 3) continue;
    if ((sc(a).mount || '').startsWith('in:') || (sc(b).mount || '').startsWith('in:')) continue;
    if (BUILT_IN.test(A.asset || '') && BUILT_IN.test(B.asset || '')) continue;   // a hob or sink is let into its worktop
    const pts = new Map(), add = (x, y, z) => { if (x > B.b[0] && x < B.b[3] && y > B.b[1] && y < B.b[4] && z > B.b[2] && z < B.b[5]) pts.set(Math.round(x / 8) + ',' + Math.round(y / 8) + ',' + Math.round(z / 8), [x, y, z]); };
    for (let i = 0; i < A.t.length; i += 9) { add(A.t[i], A.t[i + 1], A.t[i + 2]); add(A.t[i + 3], A.t[i + 4], A.t[i + 5]); add(A.t[i + 6], A.t[i + 7], A.t[i + 8]); add((A.t[i] + A.t[i + 3] + A.t[i + 6]) / 3, (A.t[i + 1] + A.t[i + 4] + A.t[i + 7]) / 3, (A.t[i + 2] + A.t[i + 5] + A.t[i + 8]) / 3); }
    const P = [...pts.values()]; if (!P.length) continue;
    const step = Math.max(1, Math.floor(P.length / 250)); let cnt = 0, depth = 0, n = 0;
    for (let k = 0; k < P.length; k += step) { const [x, y, z] = P[k]; n++; if (!inside(B, x, y, z)) continue;
      let d = Infinity; for (const [dx, dy, dz] of AX) { const h = hits(B.t, x, y, z, dx, dy, dz); if (h.length) d = Math.min(d, h[0]); } if (d === Infinity) continue; cnt++; depth = Math.max(depth, d); }
    const tol = soft(a) || soft(b) ? 30 : 4;
    if (cnt >= 2 && depth > tol) out.push({ rule: 'penetrates', id: a, into: b, assets: [A.asset, B.asset], points: cnt, of: n, depth: Math.round(depth), soft: soft(a) || soft(b) });
  }
  if (PARTS) {   // inside one asset: its parts (separate meshes under ?check) must not pass deep into each other (a magazine through the sling, a book through a shelf)
    for (const id of list) {
      const parts = []; objs[id].traverse((o) => { if (!solid(o)) return; const p = o.geometry.attributes.position, ix = o.geometry.index, n = ix ? ix.count : p.count, t = new Float64Array(n * 3); for (let i = 0; i < n; i++) { const k = ix ? ix.getX(i) : i; v.fromBufferAttribute(p, k).applyMatrix4(o.matrixWorld); t[i * 3] = v.x; t[i * 3 + 1] = v.y; t[i * 3 + 2] = v.z; } const b = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity]; for (let i = 0; i < t.length; i += 3) for (let a = 0; a < 3; a++) { if (t[i + a] < b[a]) b[a] = t[i + a]; if (t[i + a] > b[a + 3]) b[a + 3] = t[i + a]; } parts.push({ t, b, n: n / 3, content: !!o.userData.content }); });
      const D3 = [[0.577, 0.577, 0.577], [-0.267, 0.802, 0.535], [0.802, -0.535, 0.267]], AX3 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], ins = (B, x, y, z) => D3.every(([a, b, c]) => hits(B.t, x, y, z, a, b, c).length % 2 === 1);
      let worst = 0, pair = null;
      for (let i = 0; i < parts.length; i++) for (let j = 0; j < parts.length; j++) {
        if (i === j) continue; const A = parts[i], B = parts[j]; if (!A.content || A.n > 3000 || B.n > 3000) continue;   // only things marked kit.content(...) are tested, against every other part of the asset
        if (A.b[0] > B.b[3] - 20 || A.b[3] < B.b[0] + 20 || A.b[1] > B.b[4] - 20 || A.b[4] < B.b[1] + 20 || A.b[2] > B.b[5] - 20 || A.b[5] < B.b[2] + 20) continue;
        const step = Math.max(1, Math.floor(A.t.length / 3 / 120)); let deep = 0, cnt = 0;
        for (let k = 0; k < A.t.length / 3; k += step) { const x = A.t[k * 3], y = A.t[k * 3 + 1], z = A.t[k * 3 + 2]; if (x <= B.b[0] || x >= B.b[3] || y <= B.b[1] || y >= B.b[4] || z <= B.b[2] || z >= B.b[5] || !ins(B, x, y, z)) continue; let d = Infinity; for (const [dx, dy, dz] of AX3) { const h = hits(B.t, x, y, z, dx, dy, dz); if (h.length) d = Math.min(d, h[0]); } if (d !== Infinity) { cnt++; deep = Math.max(deep, d); } }
        { let above = 0, below = 0, nb = 0; const step2 = Math.max(1, Math.floor(A.t.length / 3 / 160));   // crossing a thin part: A has points above B's highest surface at their place and points well below it (a magazine through a sling)
          for (let k = 0; k < A.t.length / 3; k += step2) { const x = A.t[k * 3], y = A.t[k * 3 + 1], z = A.t[k * 3 + 2]; if (x <= B.b[0] || x >= B.b[3] || z <= B.b[2] || z >= B.b[5]) continue; const h = hits(B.t, x, 1e5, z, 0, -1, 0); if (!h.length) continue; const top = 1e5 - h[0], dy = y - top; if (dy > 0) above = Math.max(above, dy); else { below = Math.max(below, -dy); nb++; } }
          if (above > 10 && below > Math.max(deep, 50) && nb >= 2 && below < 400) { deep = below; cnt = nb; } }
        if (cnt >= 2 && deep > worst) { worst = deep; pair = [i, j, cnt]; }
      }
      if (worst > 20) { const px = objs[id].position, rb = (b) => b.map((q, k) => Math.round(q - [px.x, px.y, px.z][k % 3])).join(','); out.push({ rule: 'parts', id, asset: sc(id).asset, depth: Math.round(worst), pair, boxes: [rb(parts[pair[0]].b), rb(parts[pair[1]].b)] }); }
    }
  }
  return { objects: list.length, tris: list.reduce((s, i) => s + O[i].n, 0), out };
}, PARTS);
await browser.close();
console.log(`${res.objects} objects, ${res.tris} triangles`);
const say = (i) => i.rule === 'floating' ? `${i.id} (${i.asset}): nothing under its base (y ${i.y}); the next surface is ${i.drop === 999 ? 'far' : i.drop + ' mm'} below`
  : i.rule === 'overhangs' ? `${i.id} (${i.asset}): ${i.over}% of its base reaches past what it stands on (${i.on.join(', ')})`
  : i.rule === 'parts' ? `${i.id} (${i.asset}): two of its own parts pass ${i.depth} mm into each other (parts ${i.pair[0]} [${i.boxes[0]}] and ${i.pair[1]} [${i.boxes[1]}], ${i.pair[2]} points)`
  : i.rule === 'sunk' ? `${i.id} (${i.asset}): its base is ${i.depth} mm below the surface of ${i.into}`
  : `${i.id} (${i.assets[0]}) passes ${i.depth} mm into ${i.into} (${i.assets[1]}): ${i.points} of ${i.of} sampled points inside${i.soft ? ' (soft pair, tolerance 30 mm)' : ''}`;
for (const i of res.out) { i.text = say(i); console.log(`[${i.rule}] ${i.text}`); }
console.log(`${res.out.length} finding(s)`);
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(res, null, 1));
