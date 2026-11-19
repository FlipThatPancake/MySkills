// @js:library-softpieces — soft household things built on the soft toolkit (soft.js): a coat hung on a hook, a tote bag, a shoe, a pouf. Each returns parts to add to a group; units mm.
import { softBox, drape } from './soft.js';
import { rod } from './parts.js';
const lo = { tone: 'lo' };
// A coat hung by its collar at (x, y, z): one body that narrows from the slumped shoulders to the hook and flares a little at the hem, a lapel V and front opening, two sleeves hanging at the sides over the front.
export function coat(kit, x, y, z, { w = 400, len = 900, tone = 'lo', grey = false } = {}) {
  const g = kit.group(), sm = (t) => t * t * (3 - 2 * t), prof = (t) => (t < 0.1 ? 0.3 + 0.5 * sm(t / 0.1) : 0.8 + 0.4 * (t - 0.1) / 0.9);
  const body = drape(kit, w, len, { folds: 2, depth: 40, thick: 36, phase: 0.8, ny: 30, profile: prof, tone, grey }); body.position.set(x, y - 6, z); g.add(body);
  for (const s of [-1, 1]) {   // a sleeve: a tapered tube from the shoulder point, hanging behind the body's side edge, a sliver and the cuff showing below it
    const a = [x + s * w * 0.4, y - 60, z - 36], b = [x + s * (w * 0.5 + 8), y - 60 - len * 0.56, z - 34];
    g.add(rod(kit, a, b, 58, 44, tone)); g.add(rod(kit, [b[0], b[1] + 18, b[2]], [b[0], b[1] - 4, b[2]], 46, 46, 'mid'));
  }
  const lp = []; for (let k = 0; k < 14; k++) { const p0 = k / 14 * 6.2832, p1 = (k + 1) / 14 * 6.2832; lp.push([x + Math.cos(p0) * 14, y + 26 + Math.sin(p0) * 24, z - 2], [x + Math.cos(p1) * 14, y + 26 + Math.sin(p1) * 24, z - 2]); }
  g.add(kit.lines(lp, 'mid'));   // a small fabric loop on the hook
  g.add(kit.lines([[x - 46, y - 22, z + 26], [x, y - 190, z + 30], [x + 46, y - 22, z + 26], [x, y - 190, z + 30], [x, y - 190, z + 30], [x, y - len + 40, z + 30]], 'mid'));   // the lapel V and the front opening
  return g;
}
// A tote bag hung by its straps from a hook at (x, y, z): a thin soft body that sags a touch, its top edge an opening, the straps running up to the hook.
export function tote(kit, x, y, z, { w = 270, h = 340, d = 70, strap = 170, tone = 'mid' } = {}) {
  const g = kit.group(), T = kit.THREE, top = y - strap, zb = 3 + d / 2 + 22;
  const body = softBox(kit, w, h, d, { r: 24, bulge: 14, sag: 10, tone }); body.position.set(x, top - h / 2, zb); g.add(body);
  const op = new T.CircleGeometry(1, 28); op.scale(w * 0.4, d * 0.34, 1); const mouth = kit.solid(op, x, top - 2, zb, { soil: true }); mouth.rotation.x = -Math.PI / 2; g.add(mouth);
  const sp = []; for (const s of [-1, 1]) { const a = [x + s * w * 0.27, top, zb], m = [x + s * w * 0.15, top + strap * 0.55, (zb + z) / 2], b = [x, y, z]; sp.push(a, m, m, b); }
  g.add(kit.lines(sp, 'mid')); for (const s of [-1, 1]) g.add(rod(kit, [x + s * w * 0.27, top, zb], [x + s * w * 0.15, top + strap * 0.55, (zb + z) / 2], 5, 5, 'lo'));
  for (const s of [-1, 1]) g.add(rod(kit, [x + s * w * 0.15, top + strap * 0.55, (zb + z) / 2], [x, y, z], 5, 5, 'lo'));
  return g;
}
// A shoe standing at (x, 0, z), toe toward +z, length L, lofted: a top footprint (narrow heel, wide ball, round toe) swept along a side profile (spring at the toe, collar, dipped opening, tongue, vamp), a thin sole band, a dark oval opening. kind: sneaker (~270 x 100 x 90) or boot.
const lerpAt = (pts, s) => { for (let i = 1; i < pts.length; i++) if (s <= pts[i][0]) { const [a, ha] = pts[i - 1], [b, hb] = pts[i], t = (s - a) / (b - a), e = t * t * (3 - 2 * t); return ha + (hb - ha) * e; } return pts[pts.length - 1][1]; };
const SIDE = { sneaker: [[0, 62], [0.05, 70], [0.3, 74], [0.46, 100], [0.64, 76], [0.82, 48], [0.95, 32], [1, 26]], boot: [[0, 150], [0.07, 168], [0.3, 160], [0.4, 128], [0.5, 96], [0.7, 66], [0.88, 44], [1, 28]] };
export function shoe(kit, x, z, L = 270, o = {}) {
  const g = kit.group(), T = kit.THREE, kind = o.kind === 'boot' ? 'boot' : 'sneaker', W = L * 0.37, side = SIDE[kind], sole = 16 * L / 270, NS = o.light ? 36 : 84, NA = o.light ? 26 : 60;
  const fw = (s) => { const base = s < 0.66 ? 0.6 + 0.4 * Math.pow(s / 0.66, 0.8) : 1, toe = s > 0.78 ? Math.max(0.1, Math.sqrt(Math.max(0, 1 - Math.pow((s - 0.78) / 0.22, 2)))) : 1, heel = s < 0.06 ? Math.sqrt(Math.max(0, 1 - Math.pow((0.06 - s) / 0.06, 2))) : 1; return W / 2 * base * toe * heel; };
  const spring = (s) => (s > 0.68 ? 16 * Math.pow((s - 0.68) / 0.32, 2) * L / 270 : 0), sp = (c, e) => Math.sign(c) * Math.pow(Math.abs(c), e);
  const loft = (yb, yt, wf, ex, ey, hole) => { const pos = [], idx = []; for (let i = 0; i <= NS; i++) { const s = 1 - Math.pow(1 - i / NS, 1.6); for (let j = 0; j < NA; j++) { const a = j / NA * 6.2832, b = yb(s), t = yt(s); let yy = (b + t) / 2 + (t - b) / 2 * sp(Math.sin(a), ey); if (hole && Math.sin(a) > 0.2 && Math.pow(Math.cos(a) / 0.72, 2) + Math.pow((s - hole.s) / hole.ds, 2) < 1) yy = Math.min(yy, hole.y); pos.push((i === NS ? 0 : fw(s)) * wf * sp(Math.cos(a), ex), yy, (s - 0.5) * L); } } for (let i = 0; i < NS; i++) for (let j = 0; j < NA; j++) { const a = i * NA + j, b = i * NA + (j + 1) % NA, c = a + NA, d = b + NA; idx.push(a, b, c, b, d, c); } const ge = new T.BufferGeometry(); ge.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); ge.setIndex(idx); ge.computeVertexNormals(); return ge; };
  g.add(kit.solid(loft((s) => sole + spring(s), (s) => lerpAt(side, s) + spring(s) * 0.6, 0.97, 0.62, 0.5, { s: 0.2, ds: 0.105, y: sole + 10 }), x, 0, z, { smooth: true, tone: o.tone }));   // the upper, with a hole cut down to the insole
  g.add(kit.solid(loft((s) => spring(s), (s) => sole + spring(s), 1.03, 0.3, 0.3), x, 0, z, { smooth: true, tone: 'lo' }));   // the sole band
  const s0 = 0.2, hy = sole + 13, oa = fw(s0) * 0.62, ob = L * 0.09;   // the insole, a shade darker, at the bottom of the hole
  const mo = new T.CircleGeometry(1, 28); mo.scale(oa, ob, 1); const mouth = kit.solid(mo, x, hy, z + (s0 - 0.5) * L, { soil: true }); mouth.rotation.x = -Math.PI / 2; g.add(mouth);
  if (kind === 'sneaker') {   // laces across the vamp and a toe-cap line
    const ln = [], top = (t) => lerpAt(side, t) + spring(t) * 0.6 + 1.5;
    for (let k = 0; k < 5; k++) { const t = 0.4 + k * 0.05, w = fw(t) * 0.3; ln.push([x - w, top(t), z + (t - 0.5) * L], [x, top(t) + 3, z + (t - 0.5) * L], [x, top(t) + 3, z + (t - 0.5) * L], [x + w, top(t), z + (t - 0.5) * L]); }
    for (let k = 0; k < 6; k++) { const t0 = 0.4 + k * 0.05, t1 = t0 + 0.05; if (t1 <= 0.65) ln.push([x, top(t0) + 3, z + (t0 - 0.5) * L], [x, top(t1) + 3, z + (t1 - 0.5) * L]); }
    for (let k = 0; k < 10; k++) { const a = -1 + k / 5, b = -1 + (k + 1) / 5, t = (u) => 0.8 + 0.04 * u * u; ln.push([x + a * fw(0.8) * 0.8, top(t(a)), z + (t(a) - 0.5) * L], [x + b * fw(0.8) * 0.8, top(t(b)), z + (t(b) - 0.5) * L]); }
    g.add(kit.lines(ln, 'mid'));
  }
  return g;
}
// A pouf: a soft drum, fuller at the shoulder, with a seam round the middle and one button in the top.
export function poufBody(kit, r, h, tone) {
  const g = kit.group(), T = kit.THREE, pr = [[0.01, 0], [r * 0.82, 0], [r * 0.96, h * 0.1], [r * 1.02, h * 0.45], [r * 0.99, h * 0.8], [r * 0.82, h * 0.95], [r * 0.45, h * 0.99], [0.01, h * 0.93]].map(([a, b]) => new T.Vector2(a, b));
  g.add(kit.solid(new T.LatheGeometry(pr, 40), 0, 0, 0, { smooth: true, tone }));
  const seam = [], n = 40; for (let i = 0; i < n; i++) { const a = i / n * 6.2832, b = (i + 1) / n * 6.2832, rr = r * 1.02 + 1; seam.push([Math.cos(a) * rr, h * 0.45, Math.sin(a) * rr], [Math.cos(b) * rr, h * 0.45, Math.sin(b) * rr]); }
  seam.push([-9, h * 0.93 + 1, 0], [9, h * 0.93 + 1, 0], [0, h * 0.93 + 1, -9], [0, h * 0.93 + 1, 9]);
  g.add(kit.lines(seam, 'lo'));
  return g;
}
// A cloth frozen in place by cloth.js: a double-skinned sheet through the grid points (area-local mm), edges closed, folds read from the shading.
export function cloth(kit, { nx = 2, ny = 2, pts = [0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1], thick = 6, tone = 'lo', folds = [0.3, 0.5, 0.72], linen = false, grey = false, relax = 7 } = {}) {
  const T = kit.THREE, g = kit.group(), n = nx * ny, pos = new Float32Array(n * 6), idx = [];
  const P = Float32Array.from(pts);   // relax the frozen grid a little, so a crumpled edge draws as a soft line
  for (let pass = 0; pass < relax; pass++) { const B = P.slice(); for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const k = (j * nx + i) * 3, nb = [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < nx && b < ny); for (let c = 0; c < 3; c++) { let m = 0; for (const [a, b] of nb) m += B[(b * nx + a) * 3 + c]; P[k + c] = B[k + c] * 0.5 + m / nb.length * 0.5; } } }
  for (let i = 0; i < n * 3; i++) pos[i] = P[i];
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx.push(a, c, b, b, c, d); }
  geo.setIndex(idx); geo.computeVertexNormals();
  const nrm = geo.attributes.normal;
  for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) pos[(n + i) * 3 + k] = pos[i * 3 + k] - nrm.getComponent(i, k) * thick;
  const all = [...idx]; for (let t = 0; t < idx.length; t += 3) all.push(n + idx[t], n + idx[t + 2], n + idx[t + 1]);
  const edge = []; for (let i = 0; i < nx; i++) edge.push(i, (ny - 1) * nx + i); for (let j = 0; j < ny; j++) edge.push(j * nx, j * nx + nx - 1);
  for (let i = 0; i < nx - 1; i++) { for (const base of [0, (ny - 1) * nx]) { const a = base + i, b = a + 1; all.push(a, b, n + a, b, n + b, n + a); } }
  for (let j = 0; j < ny - 1; j++) { for (const off of [0, nx - 1]) { const a = j * nx + off, b = a + nx; all.push(a, b, n + a, b, n + b, n + a); } }
  const solid = new T.BufferGeometry(); solid.setAttribute('position', new T.BufferAttribute(pos, 3)); solid.setIndex(all); solid.computeVertexNormals(); solid.userData.soft = true;
  g.add(kit.solid(solid, 0, 0, 0, { smooth: true, tone, crease: 100, linen, grey }));
  const fl = []; for (const f of folds || []) { const i = Math.round((nx - 1) * f); for (let j = 2; j < ny - 3; j++) { for (const jj of [j, j + 1]) { const k = jj * nx + i; fl.push([pos[k * 3] + nrm.getX(k) * 1.5, pos[k * 3 + 1] + nrm.getY(k) * 1.5, pos[k * 3 + 2] + nrm.getZ(k) * 1.5]); } } }   // two or three fold lines along the cloth
  if (fl.length) g.add(kit.lines(fl, 'lo')); g.userData.size = { w: 1, d: 1, h: 1 };
  return g;
}

// A folded throw lying on a surface: one soft body, w x d on the surface, about 26 mm per layer high. Ends and edges are rounded, each fold edge is a shallow groove with the layers a few mm out of line, the top sags `sag` mm between its ends, and short lines follow the folds. Origin the middle of its footprint at the surface.
export function foldedThrow(kit, { w = 1400, d = 380, layers = 3, tone = 'lo', sag = 14, seed = 1 } = {}) {
  const T = kit.THREE, g = kit.group(), H = layers * 26 + 6, a = w / 2, c = d / 2, rr = Math.min(18, H * 0.45), NX = 64, NP = 56, ph = Math.sin(seed * 12.9898) * 2, lo = [];
  const hump = (t) => Math.min(1, Math.min(t, 1 - t) * 7);   // 0 on a fold line, 1 between
  const section = (u, j) => {   // u along the length -1..1, j round the cross-section 0..NP-1 (0 = front, +z, going up and over)
    const ang = j / NP * 2 * Math.PI, ca = Math.cos(ang), sa = Math.sin(ang), e = Math.max(0, Math.abs(u) * a - (a - rr * 1.8)) / (rr * 1.8), end = Math.max(0.03, Math.sqrt(Math.max(0, 1 - e * e)));
    const sx = Math.sign(ca) * Math.pow(Math.abs(ca), 0.18), sy = Math.sign(sa) * Math.pow(Math.abs(sa), 0.22);
    const top = H - sag * (1 - u * u) - 1.5 * Math.sin(u * 3 + ph), y = (sy + 1) / 2 * top * end, t = y / Math.max(top, 1) * layers, k = Math.floor(Math.min(layers - 1e-6, Math.max(0, t))), f = t - k;
    const open = ca > 0 ? 1 : 0, groove = open * 9 * Math.exp(-Math.pow(Math.min(f, 1 - f) / 0.1, 2)) * (y > 4 && y < top - 4 ? 1 : 0), off = (k % 2 ? 1 : -1) * 3 * hump(f);
    return [u * a * (1 - 0.001), y, sx * c * end - groove * (ca > 0 ? 1 : 0) + off * end];
  };
  const pos = [], idx = [];
  for (let i = 0; i <= NX; i++) for (let j = 0; j < NP; j++) pos.push(...section(i / NX * 2 - 1, j));
  for (let i = 0; i < NX; i++) for (let j = 0; j < NP; j++) { const A = i * NP + j, B = i * NP + (j + 1) % NP, C = (i + 1) * NP + j, D = (i + 1) * NP + (j + 1) % NP; idx.push(A, C, B, B, C, D); }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  g.add(kit.solid(geo, 0, 0, 0, { smooth: true, tone, crease: 100 }));
  for (let k = 1; k < layers; k++) {   // the groove of each fold edge on the open side, in two runs with a gap, so the line reads as cloth
    let jj = 0, best = 1e9; for (let j = 0; j < NP; j++) { const [, y, z] = section(0, j); if (z > 0 && Math.abs(y - k / layers * (H - sag)) < best) { best = Math.abs(y - k / layers * (H - sag)); jj = j; } }
    for (const [i0, i1] of [[8, 30], [36, NX - 8]]) for (let i = i0; i < i1; i++) { const p = section(i / NX * 2 - 1, jj), q = section((i + 1) / NX * 2 - 1, jj); lo.push([p[0], p[1], p[2] + 1], [q[0], q[1], q[2] + 1]); }
  }
  if (lo.length) g.add(kit.lines(lo, 'lo'));
  g.userData.size = { w: 1, d: 1, h: 1 };
  return g;
}

// A throw over the arm of a sofa or chair: laid across the arm's top, hanging down its outer side, and falling onto the seat on the inner side with a soft tongue along the seat. Origin the middle of the arm's top at the surface (y 0 = the arm top), x pointing in toward the seat, z along the arm (the throw is `d` wide in z).
// aw: the arm's width, drop: how far the seat lies below the arm top, hang: the outer hanging length, lay: the tongue along the seat. Folds ripple the hanging part, the hem is soft and slightly uneven.
export function armThrow(kit, { aw = 200, drop = 240, hang = 420, lay = 380, d = 760, tone = 'lo', seed = 1 } = {}) {
  const NX = 30, NY = 44, pts = [], ph = Math.sin(seed * 12.9898) * 3, sm = (t) => t * t * (3 - 2 * t);
  const path = [[-aw / 2 - 8, -hang], [-aw / 2 - 8, 0], [-aw / 2 + 24, 7], [aw / 2 - 24, 7], [aw / 2 + 8, 0], [aw / 2 + 12, -drop * 0.55], [aw / 2 + 40, -drop + 14], [aw / 2 + 70, -drop + 8]];   // the section in x/y: out and down, over the top, in and down to the seat
  const seg = []; let L = 0; for (let i = 1; i < path.length; i++) { const l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); seg.push(l); L += l; }
  L += lay;
  for (let j = 0; j < NY; j++) {
    let t = j / (NY - 1) * L, x, y, nx = 0, ny = 1;
    let k = 0; for (; k < seg.length && t > seg[k]; k++) t -= seg[k];
    if (k < seg.length) { const a = path[k], b = path[k + 1], f = t / seg[k]; x = a[0] + (b[0] - a[0]) * f; y = a[1] + (b[1] - a[1]) * f; const dx = b[0] - a[0], dy = b[1] - a[1], dl = Math.hypot(dx, dy); nx = -dy / dl; ny = dx / dl; }
    else { const e = path[path.length - 1], u = Math.min(lay, t); x = e[0] + u; y = e[1]; nx = 0; ny = 1; }
    const hangness = y < -20 ? Math.min(1, -y / 160) : 0, seatness = k >= seg.length - 1 ? sm(Math.min(1, (j / (NY - 1) * L - (L - lay - 40)) / 200)) : 0;
    for (let i = 0; i < NX; i++) {
      const u = i / (NX - 1) - 0.5, z = u * d, edge = 1 - Math.pow(Math.abs(u) * 2, 4) * 0.12, ripple = Math.sin(u * 7.5 + ph) * 26 * hangness + Math.sin(u * 17 + ph * 2) * 8 * hangness + Math.sin(u * 5 + j * 0.15) * 10 * seatness, hem = (j < 3 || j > NY - 4) ? Math.sin(u * 11 + ph) * 8 : 0;
      pts.push(x + nx * ripple + (hangness ? 0 : 0) + hem * (j > NY - 4 ? 1 : 0), y + ny * ripple * 0.3 + (j < 3 ? hem * 0.8 : 0), z * edge);
    }
  }
  const P = pts.slice(); for (let i = 1; i < P.length; i += 3) P[i] += 6;   // lift the whole cloth 6 mm so its underside clears the arm and the seat
  const g = cloth(kit, { nx: NX, ny: NY, pts: P, thick: 8, tone, folds: false, relax: 1 }); return g;
}

// A cloth laid over a box top (bx: x range, bz: z range of the top) and hanging past its edges: the grid for `cloth`. cx / cz: the cloth's own x and z range (past the top = the drop); folds ripple the hanging parts, `ripple` the flat part.
// Hanging parts fall straight down from the edge (y = y0 - distance past it), flare a little, and gather at the corners. All numbers in mm, y relative to the top.
export function hangGrid({ bx, bz, cx, cz, nx = 56, ny = 40, y = 0, fold = 7, amp = 30, ripple = 0, phase = 0.6, flare = 0.07, seed = 1 }) {
  const pts = [], clamp = (v, a, b) => Math.min(b, Math.max(a, v)), Lx = bx[1] - bx[0], Lz = bz[1] - bz[0];
  const ph = (k) => Math.sin(seed * 12.9898 + k * 78.233) * 0.5 + 0.5;   // a small per-seed wobble so the folds differ
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const x = cx[0] + (cx[1] - cx[0]) * i / (nx - 1), z = cz[0] + (cz[1] - cz[0]) * j / (ny - 1);
    const dx = Math.max(bx[0] - x, x - bx[1], 0), dz = Math.max(bz[0] - z, z - bz[1], 0);
    if (!dx && !dz) { pts.push(x, y + ripple * (Math.sin(x * 0.0042 + phase) * Math.sin(z * 0.0051 + phase * 2) + 0.5 * Math.sin(x * 0.011 + z * 0.007)), z); continue; }
    const r = Math.hypot(dx, dz), ex = clamp(x, bx[0], bx[1]), ez = clamp(z, bz[0], bz[1]);
    const ux = dx ? (x > bx[1] ? 1 : -1) * dx / r : 0, uz = dz ? (z > bz[1] ? 1 : -1) * dz / r : 0;   // outward, along the drop
    const along = dx && !dz ? z - bz[0] : dz && !dx ? x - bx[0] : Math.atan2(dz, dx) * 380;
    const k = fold * (0.8 + 0.4 * ph(1)), wave = amp * (0.3 + 0.7 * Math.min(1, r / 260)) * (Math.sin(along * k * 2 * Math.PI / (dx && !dz ? Lz : Lx) + phase) + 0.45 * Math.sin(along * k * 4.3 * Math.PI / (dx && !dz ? Lz : Lx) + 2 * phase)) * Math.min(1, r / 90) * (dx && dz ? 1.5 : 1);
    const out = flare * r + wave * 0.5 + 6;
    pts.push(ex + ux * out, y - r, ez + uz * out);
  }
  return { nx, ny, pts };
}

// A tablecloth: origin the middle of the table top at the surface (y 0 = the top). w, d: the table's top; drop: how far it hangs.
export function tablecloth(kit, { w = 1600, d = 900, r = 0, drop = 400, fold = 6, amp = 64, tone = 'lo', seed = 1 } = {}) {
  if (r) return roundCloth(kit, { r, drop: Math.min(drop, 300), fold: fold + 2, amp: Math.min(amp, 44), tone, seed });   // r: a round table's radius, the cloth falls in a skirt all round
  const hx = w / 2, hz = d / 2, grid = hangGrid({ bx: [-hx, hx], bz: [-hz, hz], cx: [-hx - drop, hx + drop], cz: [-hz - drop, hz + drop], y: 16, fold, amp, seed, nx: Math.round((w + 2 * drop) / 40), ny: Math.round((d + 2 * drop) / 40) });
  return cloth(kit, { ...grid, thick: 5, tone, folds: false });
}
// A round tablecloth: flat over the top (radius r), then a skirt of folds that widens as it falls. The seam of the grid is turned to the back of the table.
export function roundCloth(kit, { r: rt = 520, drop = 260, fold: fold0 = 8, amp = 40, tone = 'lo', seed = 1 } = {}) {
  const T = kit.THREE, fold = Math.round(fold0), fold2 = Math.round(fold0 * 2.3), r = rt + 30, M = 120, top = 6, hang = 11, rings = top + hang, ph = Math.sin(seed * 12.9898) * 3, thick = 5, pos = [0, 16, 0];   // vertex 0 is the centre; ring k holds M points; the grid wraps, so the top is one plain sheet with no seam
  for (let k = 1; k <= rings; k++) for (let m = 0; m < M; m++) {
    const a = (m / M) * Math.PI * 2; let rr, y;
    if (k <= top) { rr = r * k / top; y = 16 + 1.2 * Math.sin(a * 3 + ph) * (k / top) * (k / top); }
    else { const t = (k - top) / hang; rr = r + drop * 0.1 * t + amp * 0.5 * Math.sin(a * fold + ph + t * 2) * Math.min(1, t * 2.5) + amp * 0.18 * Math.sin(a * fold2 + 2 * ph) * t; y = 16 - drop * t * (1 + 0.04 * Math.sin(a * fold + ph)); }
    pos.push(Math.cos(a) * rr, y, Math.sin(a) * rr);
  }
  const N = pos.length / 3, id = (k, m) => 1 + (k - 1) * M + (m % M), idx = [];
  for (let m = 0; m < M; m++) idx.push(0, id(1, m + 1), id(1, m));
  for (let k = 1; k < rings; k++) for (let m = 0; m < M; m++) { const a = id(k, m), b = id(k, m + 1), c = id(k + 1, m), d = id(k + 1, m + 1); idx.push(a, b, c, b, d, c); }
  const top3 = new T.BufferGeometry(); top3.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); top3.setIndex(idx); top3.computeVertexNormals();
  const nrm = top3.attributes.normal, all = [...idx], P = new Float32Array(N * 6); P.set(pos);
  for (let v = 0; v < N; v++) for (let c = 0; c < 3; c++) P[(N + v) * 3 + c] = pos[v * 3 + c] - nrm.getComponent(v, c) * thick;
  for (let t = 0; t < idx.length; t += 3) all.push(N + idx[t], N + idx[t + 2], N + idx[t + 1]);
  for (let m = 0; m < M; m++) { const a = id(rings, m), b = id(rings, m + 1); all.push(a, b, N + a, b, N + b, N + a); }   // the hem
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setIndex(all); geo.computeVertexNormals();
  const g = kit.group(); g.add(kit.solid(geo, 0, 0, 0, { smooth: true, tone, crease: 100 })); g.userData.size = { w: 1, d: 1, h: 1 };
  return g;
}
// A table runner: a linen strip along the table's length, thick at its edge, hanging 200-300 mm over both short ends. rw: its width.
export function tableRunner(kit, { w = 1600, d = 900, rw = 400, drop = 280, fold = 3, amp = 26, tone = 'lo', seed = 1 } = {}) {
  const hx = w / 2, hz = rw / 2, grid = hangGrid({ bx: [-hx, hx], bz: [-hz, hz], cx: [-hx - drop, hx + drop], cz: [-hz, hz], y: 6, fold, amp, seed, nx: Math.round((w + 2 * drop) / 40), ny: Math.max(10, Math.round(rw / 30)), ripple: 3, flare: 0.04 });
  const g = cloth(kit, { ...grid, thick: 9, tone, folds: false, linen: true }), ln = [];
  for (const e of [-1, 1]) for (const k of [-0.28, 0, 0.28]) { const z = k * rw, x = e * (hx + 4); ln.push([x, 5, z], [x + e * 10, -drop * 0.55, z + 8 * Math.sin(k * 9 + seed)]); }   // a few creases down the hanging ends
  g.add(kit.lines(ln, 'lo')); return g;
}
// An unmade duvet over a mattress (x: -w/2..w/2, z from `head` to `foot`, the top at the surface): one side hangs low and the other less, the foot hangs, the top has soft lumps,
// and the pillow-end corner on the getting-out (+x) side is turned back diagonally over the top, showing a triangle of sheet where it lay.
export function duvetCloth(kit, { w = 1600, head = -700, foot = 900, sagL = 130, sagR = 400, sagFoot = 260, turn = 720, tone = 'lo', seed = 1, made = false } = {}) {
  const hx = w / 2, grid = hangGrid({ bx: [-hx, hx], bz: [head, foot], cx: [-hx - sagL, hx + sagR], cz: [head, foot + sagFoot], y: 4, fold: 4, amp: 46, ripple: 8, seed, nx: Math.round((w + sagL + sagR) / 36), ny: Math.round((foot - head + sagFoot) / 36), flare: 0.1 }), P = grid.pts;
  const lumps = [[-hx * 0.35 + 90 * Math.sin(seed), head + 700, 190, 38], [hx * 0.25, head + 1150 + 60 * Math.cos(seed), 230, 30], [-hx * 0.1, foot - 380, 160, 20]];
  for (let i = 0; i < P.length; i += 3) {   // lumps, and the turned-back corner (flipped across its fold line and lifted onto the top)
    const x = P[i], z = P[i + 2]; if (Math.abs(x) <= hx && P[i + 1] > 0) for (const [lx, lz, r, h] of lumps) P[i + 1] += h * Math.exp(-((x - lx) ** 2 + (z - lz) ** 2) / (2 * r * r));
  }
  for (let i = 0; i < P.length; i += 3) {   // the hanging part stays outside the mattress: the grid's waves swing in and out, so lean the whole fall outward by their depth
    const r = 4 - P[i + 1]; if (r <= 0.5) continue; const lean = 30 * Math.min(1, r / 20);
    if (P[i] > hx - 1) P[i] += lean; else if (P[i] < -hx + 1) P[i] -= lean;
    if (P[i + 2] > foot - 1) P[i + 2] += lean; else if (P[i + 2] < head + 1) P[i + 2] -= lean;
  }
  const sOf = (x, z) => (hx - x) + (z - head);
  if (!made) for (let i = 0; i < P.length; i += 3) { const x = P[i], z = P[i + 2]; if (x <= hx + 1 && z >= head - 1 && sOf(x, z) < turn - 8 && P[i + 1] > -1) P[i + 1] = 2; }   // the corner's own spot: bare sheet
  const g = cloth(kit, { ...grid, thick: 7, tone, folds: false }), T = kit.THREE;
  if (made) {   // a made bed: a soft roll of the duvet folded back across the head
    const roll = softBox(kit, w * 0.96, 250, 70, { r: 33, bulge: 8, sag: 0, tone }); roll.rotation.x = -Math.PI / 2; roll.position.set(0, 4 + 34, head + 170); g.add(roll); return g;
  }
  // the flap: a triangle folded back over the top along the diagonal, its wrong side (linen) up, a soft roll along the fold
  const topY = 10 + 6, sh = new T.Shape([new T.Vector2(hx - turn + 12, head + 10), new T.Vector2(hx - 14, head + turn - 4), new T.Vector2(hx - turn + 12, head + turn - 14)]);
  const fg = new T.ExtrudeGeometry(sh, { depth: 18, bevelEnabled: true, bevelThickness: 16, bevelSize: 16, bevelSegments: 7, curveSegments: 4 }); fg.rotateX(Math.PI / 2);   // the turned-back corner: a thick, rounded fold in the duvet's own colour, not a board
  g.add(kit.solid(fg, 0, topY + 34, 0, { smooth: true, tone }));
  g.add(rod(kit, [hx - turn + 10, topY + 30, head + 8], [hx - 10, topY + 30, head + turn - 6], 40, 40, tone));
  return g;
}
