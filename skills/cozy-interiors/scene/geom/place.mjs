// place.mjs — what compose needs from the geometry core when it places a thing on another: where its base touches (restOn) and how much of the base is over real surface (fits). Plain geometry, synchronous, no physics engine, so a spec can call it.
// Triangles are flat arrays [ax, ay, az, bx, by, bz, cx, cy, cz] in mm, y up. A thing's triangles are in its own frame (origin at the placed point); `at` is where its origin goes in the target's frame, `turn` is degrees about y.
const rad = (d) => d * Math.PI / 180;

function moved(tris, [x, z], turn = 0) {   // the thing's triangles in the target's frame
  const c = Math.cos(rad(turn)), s = Math.sin(rad(turn)), P = (px, pz) => [x + px * c + pz * s, z - px * s + pz * c], out = [];
  for (const t of tris) { const a = P(t[0], t[2]), b = P(t[3], t[5]), d = P(t[6], t[8]); out.push([a[0], t[1], a[1], b[0], t[4], b[1], d[0], t[7], d[1]]); }
  return out;
}

// base points of a thing: its lowest vertices (within `band` mm of the lowest) in the target's frame
function basePoints(tris, at, turn, band = 4) {
  const m = moved(tris, at, turn); let lo = 1e9; for (const t of m) lo = Math.min(lo, t[1], t[4], t[7]);
  const pts = []; for (const t of m) for (let k = 0; k < 9; k += 3) if (t[k + 1] <= lo + band) pts.push([t[k], t[k + 2]]);
  return { pts, lo: tris.reduce((q, t) => Math.min(q, t[1], t[4], t[7]), 1e9) };
}

function hull(P) {   // convex hull, counter-clockwise (monotone chain)
  const p = [...new Set(P.map((q) => q.join()))].map((s) => s.split(',').map(Number)).sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (p.length < 3) return p;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const q of p) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of [...p].reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
const inside = (H, [x, z]) => { for (let i = 0; i < H.length; i++) { const a = H[i], b = H[(i + 1) % H.length]; if ((b[0] - a[0]) * (z - a[1]) - (b[1] - a[1]) * (x - a[0]) < -1e-6) return false; } return true; };

// the highest surface of the target under (x, z): the top of any triangle whose footprint holds the point; null where nothing is
export function topAt(target, x, z) {
  let best = null;
  for (const t of target) {
    const den = (t[5] - t[8]) * (t[0] - t[6]) + (t[6] - t[3]) * (t[2] - t[8]); if (Math.abs(den) < 1e-6) continue;
    const u = ((t[5] - t[8]) * (x - t[6]) + (t[6] - t[3]) * (z - t[8])) / den, v = ((t[8] - t[2]) * (x - t[6]) + (t[0] - t[6]) * (z - t[8])) / den, w = 1 - u - v;
    if (u < -0.001 || v < -0.001 || w < -0.001) continue;
    const y = u * t[1] + v * t[4] + w * t[7]; if (best === null || y > best) best = y;
  }
  return best;
}

// the lowest y (the thing's origin height) at which its base rests on the highest surface under its footprint
export function restOn(target, thing, at, turn = 0) {
  const { pts, lo } = basePoints(thing, at, turn); let top = 0;
  for (const [x, z] of pts) { const h = topAt(target, x, z); if (h !== null && h > top) top = h; }
  return top - lo;
}

// the share (0..1) of the thing's base that lies over the surface it rests on: the base outline is sampled on a grid and each sample counts when a surface within `tol` mm of the resting height is under it (a hole, an edge, a lower step do not)
export function fits(target, thing, at, turn = 0, { tol = 30, step = 12 } = {}) {
  const { pts } = basePoints(thing, at, turn), H = hull(pts); if (H.length < 3) return 1;
  const y = restOn(target, thing, at, turn) + thing.reduce((q, t) => Math.min(q, t[1], t[4], t[7]), 1e9);
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of H) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  let n = 0, ok = 0; for (let x = x0 + step / 2; x < x1; x += step) for (let z = z0 + step / 2; z < z1; z += step) { if (!inside(H, [x, z])) continue; n++; const h = topAt(target, x, z); if (h !== null && h >= y - tol && h <= y + tol) ok++; }
  return n ? ok / n : 1;
}
