// @js:library-softpieces — soft household things built on the soft toolkit (soft.js): a coat hung on a hook, a tote bag, a shoe, a pouf. Each returns parts to add to a group; units mm.
import { softBox, drape } from './soft.js';
import { rod } from './parts.js';
const lo = { tone: 'lo' };
// A coat hung by its collar at (x, y, z): one body that narrows from the slumped shoulders to the hook and flares a little at the hem, a lapel V and front opening, two sleeves hanging at the sides over the front.
export function coat(kit, x, y, z, { w = 400, len = 900, tone = 'lo' } = {}) {
  const g = kit.group(), sm = (t) => t * t * (3 - 2 * t), prof = (t) => (t < 0.1 ? 0.3 + 0.5 * sm(t / 0.1) : 0.8 + 0.4 * (t - 0.1) / 0.9);
  const body = drape(kit, w, len, { folds: 2, depth: 40, thick: 36, phase: 0.8, ny: 30, profile: prof, tone }); body.position.set(x, y - 6, z); g.add(body);
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
  const g = kit.group(), T = kit.THREE, kind = o.kind === 'boot' ? 'boot' : 'sneaker', W = L * 0.37, side = SIDE[kind], sole = 16 * L / 270, NS = 56, NA = 36;
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
export function cloth(kit, { nx = 2, ny = 2, pts = [0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1], thick = 6, tone = 'lo' } = {}) {
  const T = kit.THREE, g = kit.group(), n = nx * ny, pos = new Float32Array(n * 6), idx = [];
  const P = Float32Array.from(pts);   // relax the frozen grid a little, so a crumpled edge draws as a soft line
  for (let pass = 0; pass < 3; pass++) { const B = P.slice(); for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const k = (j * nx + i) * 3, nb = [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < nx && b < ny); for (let c = 0; c < 3; c++) { let m = 0; for (const [a, b] of nb) m += B[(b * nx + a) * 3 + c]; P[k + c] = B[k + c] * 0.5 + m / nb.length * 0.5; } } }
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
  const solid = new T.BufferGeometry(); solid.setAttribute('position', new T.BufferAttribute(pos, 3)); solid.setIndex(all); solid.computeVertexNormals();
  g.add(kit.solid(solid, 0, 0, 0, { smooth: true, tone, crease: 55 })); g.userData.size = { w: 1, d: 1, h: 1 };
  return g;
}
