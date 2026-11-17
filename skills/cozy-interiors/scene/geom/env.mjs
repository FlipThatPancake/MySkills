// the fixed surroundings: the floor (top at y 0), each wall as a 200 mm slab behind its face with its openings cut out. Parts shaped like loaded parts, so the rest of the core treats them like any other.
import { classify } from './shapes.mjs';
const T = 200;
const box8 = (c, ux, uz, hw, hd, y0, y1) => { const out = []; for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const y of [y0, y1]) out.push(c[0] + ux[0] * hw * sx + uz[0] * hd * sz, y, c[1] + ux[1] * hw * sx + uz[1] * hd * sz); return new Float64Array(out); };
// a box as 12 triangles (for the settle world and the mesh-free paths all parts are triangles, hulls are built from their points)
const hullTris = (p) => { const t = []; const idx = [[0, 2, 6, 4], [1, 3, 7, 5], [0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6]]; const P = (i) => [p[i * 3], p[i * 3 + 1], p[i * 3 + 2]]; for (const f of idx) for (const k of [[0, 1, 2], [0, 2, 3]]) for (const i of k) t.push(...P(f[i])); return new Float64Array(t); };
const mk = (p, extra) => { const tris = hullTris(p), I = classify(tris); return { tris, kind: 'convex', content: false, through: false, box: { mn: I.mn, mx: I.mx }, vol: I.vol, area: I.area, type: 'wall', ...extra }; };
export function floorPart() { return mk(box8([0, 0], [1, 0], [0, 1], 1e5, 1e5, -300, 0), { role: 'floor' }); }
export function wallSlabs(walls, H) {
  const out = [];
  for (const w of walls) {
    const L = w.len ?? Math.hypot(w.to[0] - w.from[0], w.to[1] - w.from[1]), u = [(w.to[0] - w.from[0]) / L, (w.to[1] - w.from[1]) / L], n = [u[1], -u[0]];   // n points into the room
    const piece = (a, b, y0, y1) => { if (b - a < 1 || y1 - y0 < 1) return; const m = (a + b) / 2, c = [w.from[0] + u[0] * m - n[0] * T / 2, w.from[1] + u[1] * m - n[1] * T / 2]; out.push(mk(box8(c, u, n, (b - a) / 2, T / 2, y0, y1), { role: 'wall', wall: w.id })); };
    const holes = [...(w.holes || [])].sort((a, b) => a[0] - b[0]); let x = 0;
    for (const [a, b, y0, y1] of holes) { piece(x, a, 0, H); piece(a, b, 0, y0); piece(a, b, y1, H); x = Math.max(x, b); }
    piece(x, L, 0, H);
  }
  return out;
}
export const environment = (loaded) => [floorPart(), ...wallSlabs(loaded.walls, loaded.height), ...loaded.env.map((p) => ({ ...p, role: 'opening' }))];
