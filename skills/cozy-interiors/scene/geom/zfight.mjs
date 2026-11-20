// z-fight inside one asset: two faces of different parts that face the same way, lie within `gap` mm of one plane and overlap, so the depth buffer cannot tell which is in front and the pixels flicker with the camera (a picture on its mat, a label on a box).
// Only parts with different materials (different fills: paper, linen, leaf, a painted image) are compared: two faces of one fill shade alike and do not flicker visibly; opposite-facing faces (back to back) cannot fight. Findings are one per asset: the two parts, the gap and the overlap area.
import { loadScene } from './load.mjs';
export const ZFIGHT = { gap: 2, area: 400 };   // mm to a shared plane, mm² of overlap that is worth a finding

const tri = (t, i) => { const a = [t[i], t[i + 1], t[i + 2]], b = [t[i + 3], t[i + 4], t[i + 5]], c = [t[i + 6], t[i + 7], t[i + 8]], u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]], n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], l = Math.hypot(...n); if (l < 1e-6) return null; n[0] /= l; n[1] /= l; n[2] /= l; return { a, b, c, n, d: n[0] * a[0] + n[1] * a[1] + n[2] * a[2], area: l / 2 }; };
// overlap area of two coplanar triangles: clip one against the other's edges in the plane's 2D frame (Sutherland-Hodgman), then the polygon's area
function overlap(A, B) {
  const n = A.n, ax = Math.abs(n[0]) > 0.9 ? 1 : 0, u = [0, 0, 0]; u[ax] = 1; const e1 = (() => { const d = u[0] * n[0] + u[1] * n[1] + u[2] * n[2]; const e = [u[0] - d * n[0], u[1] - d * n[1], u[2] - d * n[2]], l = Math.hypot(...e); return e.map((x) => x / l); })(), e2 = [n[1] * e1[2] - n[2] * e1[1], n[2] * e1[0] - n[0] * e1[2], n[0] * e1[1] - n[1] * e1[0]];
  const P = (p) => [p[0] * e1[0] + p[1] * e1[1] + p[2] * e1[2], p[0] * e2[0] + p[1] * e2[1] + p[2] * e2[2]];
  let poly = [P(B.a), P(B.b), P(B.c)]; const clip = [P(A.a), P(A.b), P(A.c)], sgn = ((clip[1][0] - clip[0][0]) * (clip[2][1] - clip[0][1]) - (clip[1][1] - clip[0][1]) * (clip[2][0] - clip[0][0])) > 0 ? 1 : -1;
  for (let i = 0; i < 3 && poly.length; i++) {
    const p = clip[i], q = clip[(i + 1) % 3], side = (r) => sgn * ((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])), out = [];
    for (let k = 0; k < poly.length; k++) { const r = poly[k], s = poly[(k + 1) % poly.length], sr = side(r), ss = side(s); if (sr >= 0) out.push(r); if ((sr >= 0) !== (ss >= 0)) { const t = sr / (sr - ss); out.push([r[0] + (s[0] - r[0]) * t, r[1] + (s[1] - r[1]) * t]); } }
    poly = out;
  }
  let a = 0; for (let k = 0; k < poly.length; k++) { const r = poly[k], s = poly[(k + 1) % poly.length]; a += r[0] * s[1] - s[0] * r[1]; } return Math.abs(a) / 2;
}

export async function checkZfight(scene, { src, gap = ZFIGHT.gap, area = ZFIGHT.area } = {}) {
  const L = scene.objects ? scene : await loadScene(scene, { src }), find = [];
  for (const o of L.objects) {
    const T = []; o.parts.forEach((p, k) => { for (let i = 0; i + 8 < p.tris.length; i += 9) { const t = tri(p.tris, i); if (t && t.area > 20) T.push({ ...t, k, mat: p.mat, mn: [0, 1, 2].map((q) => Math.min(t.a[q], t.b[q], t.c[q]) - gap), mx: [0, 1, 2].map((q) => Math.max(t.a[q], t.b[q], t.c[q]) + gap) }); } });
    let worst = null;
    for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
      const A = T[i], B = T[j]; if (A.k === B.k || A.mat === B.mat) continue;
      const dot = A.n[0] * B.n[0] + A.n[1] * B.n[1] + A.n[2] * B.n[2]; if (dot < 0.999) continue;
      if (Math.abs(A.d - B.d) > gap) continue;
      if (A.mn[0] > B.mx[0] || A.mx[0] < B.mn[0] || A.mn[1] > B.mx[1] || A.mx[1] < B.mn[1] || A.mn[2] > B.mx[2] || A.mx[2] < B.mn[2]) continue;
      const m = overlap(A, B); if (m < area) continue;
      if (!worst || m > worst.area) worst = { parts: [A.k, B.k], gap: +Math.abs(A.d - B.d).toFixed(2), area: Math.round(m), at: A.a.map(Math.round) };
    }
    if (worst) find.push({ rule: 'zfight', id: o.id, asset: o.asset, ...worst, text: `${o.id} (${o.asset}): parts ${worst.parts[0]} and ${worst.parts[1]} face the same way ${worst.gap} mm apart over ${worst.area} mm² (near ${worst.at.join(',')}): they flicker; move one at least 3 mm off the other` });
  }
  return find;
}
