// @js:library-pieces — base assets built on a parameter space (meta.js SPACE): side table, cushion, pot. Each takes its space's parameters; unset ones fall back to the plain look, compose.mjs deals the rest from the seed.
// sideTable({ r, h, top 'round'|'square'|'rounded', legs, shelf 'low'|'none', drawer 'none'|handle style, tone }) — floor piece, origin the middle of the foot.
// cushion({ w, h, thick, piping, pattern, tone, lean }) — stands on a seat on its edge; origin the middle of its foot, front toward +z; lean tilts it back (15 to 25 against a seat back).
// pot({ r, tall, profile, saucer, plant, tone, seed }) — origin the middle of its foot (on a surface: y 'top').
import { legs as legParts, handle, rod } from './parts.js';
import { vessel, PROFILES, pillowGeometry, pillowZ } from './soft.js';
const rnd = (seed) => { let r = (seed || 1) * 9301 + 49297; return () => { r = (r * 9301 + 49297) % 233280; return r / 233280; }; };

export function sideTable(kit, { r = 230, h = 520, top = 'round', legs = 'splay', shelf = 'low', drawer = 'none', ajar = 0, tone } = {}) {
  const g = kit.group(), T = 30, round = top === 'round', lr = r * 0.62, pts = [];
  const props = { tone };
  if (round) g.add(kit.cyl(0, h - T, 0, r, T, { rTop: r - 5, seg: 40, ...props }));
  else g.add(kit.rbox(-r, h - T, r, 2 * r, T, 2 * r, top === 'rounded' ? r * 0.45 : 8, props));
  if (round) for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3 + 0.5; pts.push([Math.cos(a) * lr, Math.sin(a) * lr]); }
  else for (const sx of [-1, 1]) for (const sz of [-1, 1]) pts.push([sx * (r - 38), sz * (r - 38)]);
  g.add(legParts(kit, legs, pts, h - T + 4, { r: 20, out: [0, 0] }));
  const ls = Math.min(170, h * 0.32);
  if (shelf === 'low' && legs !== 'sled') { if (round) g.add(kit.cyl(0, ls, 0, lr + 40, 18, { seg: 36, tone: 'lo', through: true })); else g.add(kit.rbox(-r + 22, ls, r - 22, 2 * r - 44, 18, 2 * r - 44, 6, { tone: 'lo', through: true })); }
  if (drawer !== 'none' && !round) {
    const dr = kit.group(), a = r - 26, dh = Math.min(110, h * 0.2);
    dr.add(kit.rbox(-a, h - T - dh, a, 2 * a, dh, 2 * a, 6, { tone: 'lo', through: true }));
    dr.add(kit.lines([[-a + 8, h - T - dh + 8, a + 1], [a - 8, h - T - dh + 8, a + 1], [a - 8, h - T - 8, a + 1], [-a + 8, h - T - 8, a + 1], [-a + 8, h - T - 8, a + 1], [-a + 8, h - T - dh + 8, a + 1], [a - 8, h - T - 8, a + 1], [a - 8, h - T - dh + 8, a + 1]], 'lo'));
    dr.add(handle(kit, drawer, 0, h - T - dh / 2, a, { w: Math.min(90, a) }));
    dr.position.z = ajar; g.add(dr);   // ajar: how far the drawer is pulled out, in mm
  }
  return kit.merge(g);
}

export function cushion(kit, { w = 440, h = 420, thick = 120, tone = 'mid', piping = 'edge', pattern = 'plain', lean = 0, skew = 0, crease = 'none' } = {}) {
  const T = kit.THREE, g = kit.group(), edge = Math.min(26, thick * 0.25), dent = pattern === 'tufted' ? thick * 0.22 : thick * 0.08, pz = (x, y) => pillowZ(w, h, thick, edge, dent, x, y);
  g.add(kit.solid(pillowGeometry(T, { w, h, thick, edge, dent, skew: pattern === 'plain' ? skew : 0, crease: crease === 'soft' && pattern === 'plain' ? thick * 0.3 : 0 }), 0, h / 2, 0, { smooth: true, tone }));
  const m = Math.min(46, w * 0.1), P = [], face = (pairs, cut = 14) => { for (let i = 0; i < pairs.length; i += 2) { const [x0, y0] = pairs[i], [x1, y1] = pairs[i + 1]; let p = [x0, y0 + h / 2, pz(x0, y0)]; for (let k = 1; k <= cut; k++) { const x = x0 + (x1 - x0) * k / cut, y = y0 + (y1 - y0) * k / cut, q = [x, y + h / 2, pz(x, y)]; P.push(p, q); p = q; } } };
  const loop = (a, b, c) => [[-a, -b], [a, -b], [a, -b], [a, b], [a, b], [-a, b], [-a, b], [-a, -b]];
  if (piping !== 'none') { const N = 20, edgeP = []; for (let e = 0; e < 4; e++) for (let k = 0; k < N; k++) { const t = k / N * 2 - 1, [u, v] = [[t, -1], [1, t], [-t, 1], [-1, -t]][e], kk = 1 - 0.07 * Math.pow(Math.abs(u * v), 2); edgeP.push([u * w / 2 * kk * 0.995, v * h / 2 * kk * 0.995 + h / 2, edge / 2 + 1.5]); } for (let i = 0; i < edgeP.length; i++) P.push(edgeP[i], edgeP[(i + 1) % edgeP.length]); }   // the seam follows the pulled-in corners
  if (piping === 'double') face(loop(w / 2 - m, h / 2 - m));
  if (pattern === 'stripes') { const yy = [-0.34, 0, 0.34].map((f) => f * h); face(yy.flatMap((y) => [[-w / 2 + m, y], [w / 2 - m, y]])); }
  else if (pattern === 'inset') face(loop(w / 2 - m * 1.4, h / 2 - m * 1.4));
  else if (pattern === 'diamond') face([[-w / 2 + m, 0], [0, h / 2 - m], [0, h / 2 - m], [w / 2 - m, 0], [w / 2 - m, 0], [0, -h / 2 + m], [0, -h / 2 + m], [-w / 2 + m, 0]]);
  else if (pattern === 'tufted') { const bp = (x, y) => [x, y + h / 2, pz(x, y) + 1.5]; for (let k = 0; k < 12; k++) { const a0 = k / 12 * 6.2832, a1 = (k + 1) / 12 * 6.2832; P.push(bp(Math.cos(a0) * 8, Math.sin(a0) * 8), bp(Math.cos(a1) * 8, Math.sin(a1) * 8)); } const L = Math.min(w, h) * 0.2; for (let k = 0; k < 6; k++) { const a = k / 6 * 6.2832 + 0.4, mid = L * 0.55; P.push(bp(Math.cos(a) * 14, Math.sin(a) * 14), bp(Math.cos(a + 0.12) * mid, Math.sin(a + 0.12) * mid), bp(Math.cos(a + 0.12) * mid, Math.sin(a + 0.12) * mid), bp(Math.cos(a) * L, Math.sin(a) * L)); } }   // a button with soft pleats radiating from its dimple
  if (pattern !== 'tufted') for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) for (const k of [0, 1]) {   // soft pinch wrinkles running in from each corner: the stuffing pulls toward the middle
    const a = Math.atan2(h, w) + (k ? 0.22 : -0.1), L = Math.min(w, h) * (k ? 0.17 : 0.24), x0 = sx * (w / 2 - 22), y0 = sy * (h / 2 - 22); let p = [x0, y0 + h / 2, pz(x0, y0)];
    for (let t = 1; t <= 5; t++) { const x = x0 - sx * Math.cos(a) * L * t / 5, y = y0 - sy * Math.sin(a) * L * t / 5 + 4 * Math.sin(t), q = [x, y + h / 2, pz(x, y)]; if (t < 5) P.push(p, q); p = q; }
  }
  if (P.length) g.add(kit.lines(P, 'mid'));
  const out = kit.merge(g); out.rotation.order = "YXZ"; out.rotation.x = -lean * Math.PI / 180; return out;   // YXZ: the lean tilts about the cushion's own x axis, so it follows the turn the scene gives the piece (XYZ tipped a turned cushion sideways)
}

// a pointed leaf standing from `base` along `dir` (unit), length len, width wid
const leaf = (kit, base, dir, len, wid) => { const T = kit.THREE, ge = new T.SphereGeometry(1, 12, 8); ge.scale(wid, len / 2, Math.max(4, wid * 0.22)); const m = kit.solid(ge, 0, 0, 0, { smooth: true, leaf: true }); const d = new T.Vector3(...dir).normalize(); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d); m.position.set(base[0] + d.x * len / 2, base[1] + d.y * len / 2, base[2] + d.z * len / 2); return m; };
export function pot(kit, { r = 110, tall = 1.2, profile = 'straight', saucer = 'yes', plant = 'sprig', tone, seed = 4 } = {}) {
  const g = kit.group(), h = r * tall, foot = saucer === 'yes' ? 14 : 0, R = rnd(seed), pts = [];
  if (foot) g.add(kit.cyl(0, 0, 0, r * 0.78, foot, { rTop: r * 0.86, seg: 36, tone: 'lo' }));
  const v = vessel(kit, (PROFILES[profile] || PROFILES.straight)(r, h), { seg: 36, tone, contents: 'soil' }); v.position.y = foot; g.add(v);
  const top = foot + h, rim = r * (profile === 'belly' ? 0.9 : profile === 'urn' ? 0.95 : 1), soilY = top - Math.min(30, Math.max(r * 0.22, 20));
  const n = plant === 'bush' ? 18 : 7, len0 = plant === 'bush' ? r * 1.6 : r * 1.3;
  for (let k = 0; k < n; k++) {
    const a = k / n * 6.2832 * (plant === 'bush' ? 2.4 : 1) + R() * 0.6, tilt = 0.3 + R() * 0.7 + (plant === 'bush' ? 0.15 * (k % 3) : 0), rad = (plant === 'bush' ? 0.15 + 0.35 * R() : 0.12) * rim, len = len0 * (0.6 + 0.5 * R());
    const b = [Math.sin(a) * rad, soilY, Math.cos(a) * rad], d = [Math.sin(a) * Math.sin(tilt), Math.cos(tilt), Math.cos(a) * Math.sin(tilt)];
    pts.push(b, [b[0] + d[0] * len * 0.45, b[1] + d[1] * len * 0.45, b[2] + d[2] * len * 0.45]);
    g.add(leaf(kit, [b[0] + d[0] * len * 0.3, b[1] + d[1] * len * 0.3, b[2] + d[2] * len * 0.3], d, len * 0.7, len * 0.13));
  }
  g.add(kit.lines(pts, 'green'));
  return kit.merge(g);
}
// A mug: a straight-walled cup with a loop handle and a pale drink inside.
export function mug(kit, { r = 42, h = 92, tone = 'lo' } = {}) {
  const T = kit.THREE, g = kit.group(), pr = [[0.01, 0], [r * 0.9, 0], [r, 4], [r, h], [r - 4, h], [r - 4, 8], [0.01, 8]].map(([a, b]) => new T.Vector2(a, b));
  g.add(kit.solid(new T.LatheGeometry(pr, 24), 0, 0, 0, { smooth: true, tone }));
  const d = new T.CircleGeometry(r - 5, 20); d.rotateX(-Math.PI / 2); g.add(kit.solid(d, 0, h - 14, 0, { soil: true }));
  const hp = [[r - 2, h * 0.8], [r + 22, h * 0.78], [r + 30, h * 0.5], [r + 20, h * 0.25], [r - 2, h * 0.22]]; for (let i = 0; i < hp.length - 1; i++) g.add(rod(kit, [hp[i][0], hp[i][1], 0], [hp[i + 1][0], hp[i + 1][1], 0], 5, 5, tone));
  return kit.merge(g);
}
// An open book lying face down: two covers and a block of pages tented between them.
export function openBook(kit, { w = 150, d = 215, tone = 'mid' } = {}) {
  const T = kit.THREE, g = kit.group(), tilt = 0.2;
  for (const s of [-1, 1]) { const c = kit.box(0, 0, d / 2, w, 6, d, { tone }); c.position.set(s * (w / 2 - 6), 20, 0); c.rotation.z = -s * tilt; g.add(c); const pg = kit.box(0, 0, d / 2 - 4, w - 14, 18, d - 8, { tone: 'lo' }); pg.position.set(s * (w / 2 - 10), 26, 0); pg.rotation.z = -s * tilt * 0.9; g.add(pg); }
  return kit.merge(g);
}
