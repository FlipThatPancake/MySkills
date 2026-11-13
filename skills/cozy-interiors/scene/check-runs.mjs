// node check-runs.mjs — checks for library/runs.js without a browser.
// 1. fillWidths always returns widths that sum exactly to the run length, every width standard, with at most one filler of under 100 mm.
import { fillWidths, WIDTHS } from './src/library/runs.js';
import { readFileSync } from 'node:fs';
import { createKit } from './src/kitchen3d.js';
import { buildScene } from './src/scene-build.js';
let bad = 0, n = 0;
for (let len = 600; len <= 4800; len += 10) {
  for (const off of [0, 3, 7]) { if (off) { const r = fillWidths(len + off).fill; if (r.reduce((s, m) => s + m.w, 0) !== len + off) { bad++; console.log("BAD odd", len + off); } n++; } }
  for (const fixed of [[], [{ w: 800 }], [{ w: 600 }, { w: 600 }]]) {
    const L = len + fixed.reduce((s, m) => s + m.w, 0), { fill, filler } = fillWidths(L, fixed);
    const sum = fill.reduce((s, m) => s + m.w, 0) + fixed.reduce((s, m) => s + m.w, 0);
    const ok = sum === L && fill.every((m) => m.kind === 'filler' ? m.w < 100 && m.w > 0 : WIDTHS.includes(m.w)) && fill.filter((m) => m.kind === 'filler').length <= 1;
    n++;
    if (!ok) { bad++; if (bad < 8) console.log('BAD', L, JSON.stringify(fill)); }
  }
}
console.log(bad ? `fillWidths: ${bad} of ${n} lengths wrong` : `fillWidths: ${n} lengths sum exactly`);


// 2. Swing check on a scene (node check-runs.mjs [scene.json], default scenes/l-kitchen.json): open every pair of runs' fronts together, stepwise, and report any that touch
// (a door leaf is a line from its hinge, a drawer a box, with no clearance added), or that reach into another run's cabinets. Plan coordinates are world mm.
const rad = Math.PI / 180, PAD = 0, STEPS = [0.25, 0.5, 0.75, 1];
const kit = createKit();
const sceneFile = process.argv[2] || new URL('./scenes/l-kitchen.json', import.meta.url).pathname;
const S = JSON.parse(readFileSync(sceneFile, 'utf8'));
const world = (r, x, z) => [r.x + x * Math.cos(r.rot) + z * Math.sin(r.rot), r.z - x * Math.sin(r.rot) + z * Math.cos(r.rot)];
function shapes() {
  const { objects } = buildScene(kit, S, { assets: ['baseRun', 'wallRun'] });
  const runs = Object.entries(objects).map(([name, g]) => ({ name, obj: g, base: g.userData.scene.asset === 'baseRun', x: g.position.x, z: g.position.z, rot: g.rotation.y, length: g.userData.size.length, depth: g.userData.size.depth }));
  const bodies = runs.filter((r) => r.base).map((r) => ({ name: r.name, pts: [[0, -r.depth], [r.length, -r.depth], [r.length, 0], [0, 0]].map(([x, z]) => world(r, x, z)) }));
  const fronts = [];
  for (const r of runs) for (const m of r.obj.userData.openables) {
    const o = m.userData.open;
    fronts.push({ run: r.name, kind: o.kind, yr: o.yr, at: (v) => {
      if (o.kind === 'door') { const th = o.dir * o.max * rad * v, [hx, hz] = [m.position.x, m.position.z]; return { seg: [world(r, hx, hz), world(r, hx + o.side * o.len * Math.cos(th), hz - o.side * o.len * Math.sin(th))] }; }
      return { box: [[o.x0, 0], [o.x0 + o.w, 0], [o.x0 + o.w, o.max * v + 2], [o.x0, o.max * v + 2]].map(([x, z]) => world(r, x, z)) };
    }, label: `${r.name} ${o.kind} at x ${Math.round(o.kind === 'door' ? m.position.x : o.x0)}` });
  }
  return { fronts, bodies };
}
const segDist = (p, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / L2)); return Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dz * t); };
const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
const segsHit = (a, b, c, d) => cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0;
const edges = (poly) => poly.map((p, i) => [p, poly[(i + 1) % poly.length]]);
const inPoly = (p, poly) => { let i = false; for (const [a, b] of edges(poly)) if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < a[0] + (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1])) i = !i; return i; };
const parts = (s) => s.seg ? [s.seg] : edges(s.box);
const gap = (A, B) => {   // smallest distance between two shapes (0 when they cross or one lies inside the other)
  let d = 1e9; const pa = parts(A), pb = parts(B);
  for (const [a, b] of pa) for (const [c, e] of pb) { if (segsHit(a, b, c, e)) return 0; d = Math.min(d, segDist(a, c, e), segDist(b, c, e), segDist(c, a, b), segDist(e, a, b)); }
  if (A.box && inPoly(pb[0][0], A.box) || B.box && inPoly(pa[0][0], B.box)) return 0;
  return d;
};
function clashes() {
  const { fronts, bodies } = shapes(), out = [];
  for (let i = 0; i < fronts.length; i++) {
    for (const b of bodies) if (b.name !== fronts[i].run && fronts[i].yr[0] < 900 && gap(fronts[i].at(1), { box: b.pts }) <= PAD) out.push(`${fronts[i].label} reaches into run ${b.name}`);
    for (let j = i + 1; j < fronts.length; j++) {
      if (fronts[i].yr[1] <= fronts[j].yr[0] || fronts[j].yr[1] <= fronts[i].yr[0]) continue;   // at different heights they pass each other
      if (fronts[i].run === fronts[j].run && fronts[i].kind === 'door' && fronts[j].kind === 'door') continue;   // neighbouring doors of one run swing apart
      for (const vi of STEPS) for (const vj of STEPS) if (gap(fronts[i].at(vi), fronts[j].at(vj)) <= PAD) { out.push(`${fronts[i].label} and ${fronts[j].label} touch (${vi}, ${vj})`); break; }
    }
  }
  return [...new Set(out)];
}
const found = clashes();
console.log(`swing check (${sceneFile.replace(/^.*\//, '')}): ${found.length ? found.join('; ') : 'no front touches another'}`);
process.exit(bad || found.length ? 1 : 0);
