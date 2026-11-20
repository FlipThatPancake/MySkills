// Rapier setup, part classification and part → collider shapes. Units: mm in, Rapier runs in metres around each part's own origin.
import RAPIER from '../src/vendor/rapier/rapier.mjs';
const warn = console.warn, log = console.log; console.warn = () => {}; console.log = (...a) => { if (!/deprecated parameters/.test(String(a[0]))) log(...a); };
await RAPIER.init({}); console.warn = warn; console.log = log;
export { RAPIER };
export const M = 0.001;

// every tool counts how many parts became hulls, meshes or failed (acceptance 6)
export const tally = () => ({ hull: 0, mesh: 0, failed: 0, welded: 0 });

// triangle soup (Float64Array of xyz per vertex, three per triangle) → welded vertex and index arrays; degenerate triangles dropped. Origin c (mm) is subtracted, scale M applied.
export function weld(t, c = [0, 0, 0], q = 0.01, scale = M) {
  const m = new Map(), v = [], ix = [];
  const id = (i) => { const k = Math.round(t[i] / q) + ',' + Math.round(t[i + 1] / q) + ',' + Math.round(t[i + 2] / q); let j = m.get(k); if (j === undefined) { j = v.length / 3; m.set(k, j); v.push((t[i] - c[0]) * scale, (t[i + 1] - c[1]) * scale, (t[i + 2] - c[2]) * scale); } return j; };
  for (let i = 0; i < t.length; i += 9) {
    const a = id(i), b = id(i + 3), e = id(i + 6); if (a === b || b === e || a === e) continue;
    const ux = v[b * 3] - v[a * 3], uy = v[b * 3 + 1] - v[a * 3 + 1], uz = v[b * 3 + 2] - v[a * 3 + 2], wx = v[e * 3] - v[a * 3], wy = v[e * 3 + 1] - v[a * 3 + 1], wz = v[e * 3 + 2] - v[a * 3 + 2];
    if (Math.hypot(uy * wz - uz * wy, uz * wx - ux * wz, ux * wy - uy * wx) < 1e-4 * scale * scale) continue;
    ix.push(a, b, e);
  }
  return { v: new Float32Array(v), ix: new Uint32Array(ix) };
}
const hullPoints = (t, c, q) => { const m = new Map(); for (let i = 0; i < t.length; i += 3) { const x = Math.round(t[i] / q), y = Math.round(t[i + 1] / q), z = Math.round(t[i + 2] / q); m.set(x + ',' + y + ',' + z, [(x * q - c[0]) * M, (y * q - c[1]) * M, (z * q - c[2]) * M]); } return new Float32Array([...m.values()].flat()); };
let PW, PB;
const probe = (d) => { PW ||= new RAPIER.World({ x: 0, y: 0, z: 0 }); PB ||= PW.createRigidBody(RAPIER.RigidBodyDesc.fixed()); try { const c = PW.createCollider(d, PB); const v = c.volume(); PW.removeCollider(c, false); return v; } catch { return null; } };

// a convex hull collider description, welding on a 0.01 mm grid, then 0.1, then 1 mm until Rapier accepts it; null when none does. `volume` is in m³.
// a straight round disc or drum (a table top, a base, a plate: two flat ends, every other point on one circle) becomes a Rapier cylinder: as a hull its flat top is a fan of triangles and a thing standing on it touches one triangle (one contact point, so it rocks)
function drum(t, c) {
  let y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (let i = 0; i < t.length; i += 3) { x0 = Math.min(x0, t[i]); x1 = Math.max(x1, t[i]); y0 = Math.min(y0, t[i + 1]); y1 = Math.max(y1, t[i + 1]); z0 = Math.min(z0, t[i + 2]); z1 = Math.max(z1, t[i + 2]); }
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, r = (x1 - x0) / 2; if (r < 20 || Math.abs((z1 - z0) / 2 - r) > r * 0.01 || y1 - y0 < 1) return null;
  for (let i = 0; i < t.length; i += 3) { if (Math.abs(t[i + 1] - y0) > 0.05 && Math.abs(t[i + 1] - y1) > 0.05) return null; const q = Math.hypot(t[i] - cx, t[i + 2] - cz); if (q > 0.5 && Math.abs(q - r) > r * 0.01) return null; }
  const d = RAPIER.ColliderDesc.cylinder((y1 - y0) / 2 * M, r * M).setTranslation((cx - c[0]) * M, ((y0 + y1) / 2 - c[1]) * M, (cz - c[2]) * M);
  return { d, how: 'drum', q: 0, volume: Math.PI * r * r * (y1 - y0) * M * M * M };
}
// a thin top that is solid (a table top 15 mm or more thick): a round one is a drum, a rectangular one (every vertex on a corner of its box) a cuboid; null for anything else. As a triangle mesh its seams push a book stack sideways.
export function slabDesc(t, c) {
  const dr = drum(t, c); if (dr) return dr;
  let a = [Infinity, Infinity, Infinity], b = [-Infinity, -Infinity, -Infinity]; for (let i = 0; i < t.length; i += 3) for (let k = 0; k < 3; k++) { a[k] = Math.min(a[k], t[i + k]); b[k] = Math.max(b[k], t[i + k]); }
  if (b[1] - a[1] < 15) return null;
  for (let i = 0; i < t.length; i += 3) for (let k = 0; k < 3; k++) if (Math.abs(t[i + k] - a[k]) > 0.05 && Math.abs(t[i + k] - b[k]) > 0.05) return null;
  const d = RAPIER.ColliderDesc.cuboid((b[0] - a[0]) / 2 * M, (b[1] - a[1]) / 2 * M, (b[2] - a[2]) / 2 * M).setTranslation(((a[0] + b[0]) / 2 - c[0]) * M, ((a[1] + b[1]) / 2 - c[1]) * M, ((a[2] + b[2]) / 2 - c[2]) * M);
  return { d, how: 'slab', q: 0, volume: (b[0] - a[0]) * (b[1] - a[1]) * (b[2] - a[2]) * M * M * M };
}
export function hullDesc(t, c, grids = [0.01, 0.1, 1]) {
  const dr = drum(t, c); if (dr) return dr;
  for (const q of grids) { let d = null; try { d = RAPIER.ColliderDesc.convexHull(hullPoints(t, c, q)); } catch {} if (d && d.shape) { const volume = probe(d); if (volume !== null) return { d, how: 'hull', q, volume }; } }
  return null;
}
export function meshDesc(t, c) {
  for (const q of [0.01, 0.1, 1]) { const w = weld(t, c, q); if (!w.ix.length) continue; let d = null; try { d = RAPIER.ColliderDesc.trimesh(w.v, w.ix); } catch {} if (d && probe(d) !== null) return { d, how: 'mesh', q }; }
  return null;
}
// the shape of one part: convex parts as a hull, everything else (and a convex part whose hull fails) as a mesh. Never dropped silently: { how: 'failed' } says so.
export function partDesc(p, c) {
  const pts = p.verts || p.tris;
  if (p.kind === 'convex') { const h = hullDesc(pts, c); if (h) return h; const m = meshDesc(p.tris, c); if (m) return { ...m, how: 'mesh', fallback: true }; }
  else { const m = meshDesc(p.tris, c); if (m) return m; const h = hullDesc(pts, c); if (h) return { ...h, fallback: true }; }
  return { d: null, how: 'failed' };
}

// classify the triangles of one mesh: flat (a decal under 1.5 mm thick), open (not watertight: a vessel, a shade), convex (its hull volume is within 3 %), or concave
export function classify(t, verts) {
  const m = new Map(), pts = [], ids = [];
  for (let i = 0; i < t.length; i += 3) { const k = Math.round(t[i] * 100) + ',' + Math.round(t[i + 1] * 100) + ',' + Math.round(t[i + 2] * 100); let j = m.get(k); if (j === undefined) { j = pts.length; m.set(k, j); pts.push([t[i], t[i + 1], t[i + 2]]); } ids.push(j); }
  const edges = new Map(); let vol = 0, area = 0; const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (const p of pts) for (let a = 0; a < 3; a++) { if (p[a] < mn[a]) mn[a] = p[a]; if (p[a] > mx[a]) mx[a] = p[a]; }
  for (let f = 0; f < ids.length; f += 3) {
    const a = ids[f], b = ids[f + 1], e = ids[f + 2]; if (a === b || b === e || a === e) continue;
    for (const [u, w] of [[a, b], [b, e], [e, a]]) { const k = u < w ? u + '_' + w : w + '_' + u; edges.set(k, (edges.get(k) || 0) + 1); }
    const A = pts[a], B = pts[b], C = pts[e];
    vol += (A[0] * (B[1] * C[2] - B[2] * C[1]) - A[1] * (B[0] * C[2] - B[2] * C[0]) + A[2] * (B[0] * C[1] - B[1] * C[0])) / 6;
    area += Math.hypot((B[1] - A[1]) * (C[2] - A[2]) - (B[2] - A[2]) * (C[1] - A[1]), (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]), (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0])) / 2;
  }
  let open = 0; for (const n of edges.values()) if (n !== 2) open++;
  const ext = mx.map((v, i) => v - mn[i]), closed = open === 0; vol = Math.abs(vol);
  if (Math.min(...ext) < 1.5) return { kind: 'flat', vol, area, ext, mn, mx };
  if (!closed) return { kind: 'open', vol, area, ext, mn, mx };
  const hv = hullVolumeMm3(verts || t);
  return { kind: hv && vol / hv > 0.97 ? 'convex' : 'concave', vol, area, ext, mn, mx };
}
function hullVolumeMm3(t) { const c = [0, 0, 0]; let n = 0; for (let i = 0; i < t.length; i += 3) { c[0] += t[i]; c[1] += t[i + 1]; c[2] += t[i + 2]; n++; } c[0] /= n; c[1] /= n; c[2] /= n; const h = hullDesc(t, c); return h ? h.volume / (M * M * M) : 0; }
