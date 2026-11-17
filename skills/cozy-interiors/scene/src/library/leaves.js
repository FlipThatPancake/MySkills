// @js:library-leaves — leaves drawn as leaves, for every plant: a blade with a pointed tip, a midrib and side veins, folded along the midrib, bowed along its length and curled at the tip;
// a fan leaf for round and split leaves (monstera, pilea); fronds of paired leaflets; stems that carry leaves of changing size. Origin of a leaf: its base, pointing along +y, its fold rising toward +z.
const P = Math.PI;
export const PROFILE = {   // half-width of a blade (0 to 1) at u (0 base to 1 tip)
  lance: (u) => Math.pow(Math.sin(P * Math.pow(u, 0.7)), 0.9) * Math.pow(1 - u, 0.12),
  violin: (u) => Math.pow(Math.sin(P * Math.pow(u, 0.8)), 0.8) * (0.62 + 0.55 * u) * (u > 0.45 && u < 0.62 ? 0.88 : 1),   // a fiddle-leaf: broad toward the tip, waisted in the middle
  sword: (u) => Math.min(1, u * 9) ** 0.5 * Math.pow(1 - Math.pow(u, 2.6), 0.9) * (1 - 0.15 * u),
  heart: (u) => Math.pow(Math.sin(P * Math.pow(u, 0.62)), 0.95) * (u < 0.35 ? 1.05 : 1),
  grass: (u) => (1 - u) ** 0.8 * Math.min(1, u * 14) ** 0.5,
  oval: (u) => Math.sin(P * Math.pow(u, 0.85)) ** 0.85,
};
// blade(kit, len, wid, { profile, fold, bow, curl, veins, ribs }) -> group: a folded leaf with its midrib and side veins drawn in green
export function blade(kit, len, wid, { profile = 'lance', fold = 0.2, bow = 0.15, curl = 0.1, veins = 4, N = 12, bands = 0, M = 6, edge = 0, wave = 0.012 } = {}) {
  const T = kit.THREE, W = PROFILE[profile] || profile, pos = [], idx = [], g = kit.group();
  const at = (u, v) => { const w = W(u) * wid / 2, y = len * u; return [v * w, y, Math.abs(v) * w * fold + bow * len * u * u + curl * len * Math.pow(Math.max(0, u - 0.6) / 0.4, 2) * 0.35]; };
  for (let i = 0; i <= N; i++) for (let j = 0; j <= M; j++) pos.push(...at(i / N, -1 + 2 * j / M));
  const n0 = pos.length / 3; for (let q = 0; q < n0; q++) pos.push(pos[3 * q], pos[3 * q + 1], pos[3 * q + 2] - 1.4);   // the back face: a copy set 1.4 mm behind, so the two never fight
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = i * (M + 1) + j, b = a + 1, c = a + M + 1, d = c + 1; idx.push(a, b, d, a, d, c, n0 + a, n0 + d, n0 + b, n0 + a, n0 + c, n0 + d); }
  const ge = new T.BufferGeometry(); ge.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); ge.setIndex(idx); ge.computeVertexNormals();
  g.add(kit.solid(ge, 0, 0, 0, { smooth: true, leaf: true }));
  const L = [];
  for (let i = 0; i < N; i++) { const a = at(i / N, 0), b = at((i + 1) / N, 0); L.push([a[0], a[1], a[2] + 1.2], [b[0], b[1], b[2] + 1.2]); }   // the midrib
  for (let k = 1; k <= veins; k++) { const u0 = 0.12 + 0.72 * k / (veins + 1); for (const s of [-1, 1]) { const a = at(u0, 0), b = at(Math.min(0.97, u0 + 0.16), s * 0.8); L.push([a[0], a[1], a[2] + 1.2], [b[0], b[1], b[2] + 1]); } }
  for (let k = 1; k <= bands; k++) { const u = k / (bands + 1); for (let j = 0; j < M; j++) { const a = at(u + wave * ((j % 2) - 0.5) * (k % 2 ? 1 : -1), -1 + 2 * j / M), b = at(u + wave * (((j + 1) % 2) - 0.5) * (k % 2 ? 1 : -1), -1 + 2 * (j + 1) / M); L.push([a[0], a[1], a[2] + 1], [b[0], b[1], b[2] + 1]); } }   // cross-bands (snake plant): wavy, not a grid
  if (edge) for (const s of [-1, 1]) for (let i = 1; i < N - 1; i++) { const a = at(i / N, s * (1 - edge)), b = at((i + 1) / N, s * (1 - edge)); L.push([a[0], a[1], a[2] + 1.2], [b[0], b[1], b[2] + 1.2]); }   // a pale border along each edge (snake plant 'Laurentii')
  if (L.length) g.add(kit.lines(L, 'green'));
  return g;
}
// fan(kit, R, { radii: (t) => 0..1 }) -> a round or split leaf lying in the x/y plane: base at the origin, tip along +y, about 2R long. `t` runs 0 at the tip to 1 at the stalk (round either side)
export function fan(kit, R, { radii, cup = 0.14, rings = 5, K = 44, veins = 8 } = {}) {
  const T = kit.THREE, pos = [0, R, 0], idx = [], g = kit.group();
  const pt = (r, k) => { const t = Math.abs(k / K * 2 - 1), a = Math.PI / 2 + (k / K * 2 - 1) * Math.PI, rr = R * r * radii(t); return [Math.cos(a) * rr * 0.92, R + Math.sin(a) * rr, cup * rr * rr / R * 0.5]; };
  for (let r = 1; r <= rings; r++) for (let k = 0; k <= K; k++) pos.push(...pt(r / rings, k));
  for (let k = 0; k < K; k++) idx.push(0, 1 + k, 2 + k);
  const n0 = pos.length / 3; for (let q = 0; q < n0; q++) pos.push(pos[3 * q], pos[3 * q + 1], pos[3 * q + 2] - 1.4);
  for (let k = 0; k < K; k++) idx.push(n0, n0 + 2 + k, n0 + 1 + k);
  for (let r = 1; r < rings; r++) for (let k = 0; k < K; k++) { const a = 1 + (r - 1) * (K + 1) + k, b = a + 1, c = a + K + 1, d = c + 1; idx.push(a, d, b, a, c, d, n0 + a, n0 + b, n0 + d, n0 + a, n0 + d, n0 + c); }
  const ge = new T.BufferGeometry(); ge.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); ge.setIndex(idx); ge.computeVertexNormals();
  g.add(kit.solid(ge, 0, 0, 0, { smooth: true, leaf: true }));
  const L = [];
  for (let v = 0; v <= veins; v++) { const k = Math.round(v / veins * K); for (let s = 0; s < 6; s++) { const a = pt(s / 6 * 0.96, k), b = pt((s + 1) / 6 * 0.96, k); a[2] += 1.2; b[2] += 1.2; L.push(a, b); } }
  g.add(kit.lines(L, 'green'));
  return g;
}
// a monstera leaf: a heart with deep splits from the edge toward the midrib, and a notch at the stalk
export const splitHeart = (slits = 4, depth = 0.6) => (t) => {
  let r = 0.95 - 0.2 * t * t;                                   // a heart: fullest near the tip
  if (t > 0.8) r *= 1 - 0.5 * Math.pow((t - 0.8) / 0.2, 2);      // the notch where the stalk joins
  const ph = t * slits * 1.25, f = Math.abs(ph - Math.round(ph));
  if (t > 0.12 && t < 0.86 && f < 0.1) r *= 1 - depth * (1 - f / 0.1);   // a slit
  return r;
};
export const roundish = () => (t) => 0.95 - 0.35 * Math.pow(Math.max(0, t - 0.85) / 0.15, 2);
// a stem from a to b (mm), tapered, filled like a leaf
export function stem(kit, a, b, r0 = 5, r1 = 3.5) { const T = kit.THREE, d = new T.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length(), m = kit.solid(new T.CylinderGeometry(r1, r0, L, 6), (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, { smooth: true, leaf: true }); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); return m; }
// place(kit, group, obj, from, dir (unit, the way the leaf points), roll) points a leaf built along +y in `dir`, with its fold turned by `roll`
export function place(kit, g, obj, from, dir, roll = 0, hint = null) {
  const T = kit.THREE, y = new T.Vector3(...dir).normalize(), w = new T.Group(); w.add(obj);
  if (hint) { const h = new T.Vector3(...hint), z = h.sub(y.clone().multiplyScalar(h.dot(y))); if (z.length() > 1e-3) { z.normalize(); const x = new T.Vector3().crossVectors(y, z); w.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(x, y, z)); } else w.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), y); }
  else { w.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), y); obj.rotation.y = roll; }
  w.position.set(...from); g.add(w); return w;
}
// a curved stem: points along a bent path, returns them; the stem is drawn as short tapered pieces
export function curvedStem(kit, g, from, dir, len, bend, n = 6, r = 5) {
  const pts = [from.slice()], d = dir.slice(); let p = from.slice();
  for (let i = 1; i <= n; i++) { const t = i / n; d[1] -= bend * 0.5 / n; const L = Math.hypot(...d); p = [p[0] + d[0] / L * len / n, p[1] + d[1] / L * len / n, p[2] + d[2] / L * len / n]; pts.push(p); g.add(stem(kit, pts[i - 1], p, r * (1 - 0.5 * (i - 1) / n), r * (1 - 0.5 * i / n))); }
  const e = pts[n], pr = pts[n - 1], dd = [e[0] - pr[0], e[1] - pr[1], e[2] - pr[2]]; return { pts, end: e, dir: dd };
}

// a monstera leaf in the x/y plane: the stalk joins at the origin, the tip points along +y about L away. A heart outline with slits cut in from the edge toward the stalk, a midrib and a vein up each lobe;
// slits: slits on each side (0 = a young whole leaf), depth 0..1 how far they cut, fold and bow lift the sides and droop the tip.
export function monsteraLeaf(kit, L, { slits = 5, depth = 0.65, seed = 3, fold = 0.16, bow = 0.2, K = 120 } = {}) {
  const T = kit.THREE, g = kit.group(), rr = (() => { let r = seed * 7 + 3; return () => { r = (r * 9301 + 49297) % 233280; return r / 233280; }; })();
  const ang = []; for (let k = 1; k <= slits; k++) ang.push((17 + (k - 1) * (128 / Math.max(1, slits))) * P / 180 * (1 + 0.04 * (rr() - 0.5)));
  const dep = ang.map(() => depth * (0.8 + 0.4 * rr())), W = 0.048;
  // outline radius at angle th (0 at the tip, P at the notch), as a fraction of L: a heart whose lobes fall away to a notch at the stalk, with slits cut in toward the middle
  const rSlit = (th) => { let r = 0.58 + 0.42 * Math.cos(th); if (th > 2.5) r *= Math.max(0.12, 1 - 1.2 * (th - 2.5) * (th - 2.5) / 0.4); r *= 1 + 0.03 * Math.sin(th * 7); for (let k = 0; k < ang.length; k++) { const d = Math.abs(th - ang[k]); const hw = W; if (d < hw) { const f = d / hw, rin = r * (1 - dep[k]) + 0.16; r = Math.min(r, rin + (r - rin) * Math.pow(f, 1.6)); } } return r; };
  const pos = [], idx = [], rings = 3, at = (th, rad) => { const s = Math.sign(th) || 1, a = Math.abs(th), x = s * Math.sin(a) * rad * L, y = Math.cos(a) * rad * L; return [x, y, Math.abs(x) * fold + bow * L * Math.pow(Math.max(0, y) / L, 2) * 0.5]; };
  const ths = []; for (let i = 0; i <= 2 * K; i++) ths.push(-P + P * 2 * i / (2 * K));   // from the notch round the left, over the tip, round the right
  pos.push(0, 0, 0); for (let r = 1; r <= rings; r++) for (const th of ths) pos.push(...at(-th, rSlit(Math.abs(th)) * r / rings)); // -th puts the tip at th = 0
  const n = ths.length; for (let i = 0; i < n - 1; i++) idx.push(0, 2 + i, 1 + i);
  for (let r = 1; r < rings; r++) for (let i = 0; i < n - 1; i++) { const a = 1 + (r - 1) * n + i, b = a + 1, c = a + n, d = c + 1; idx.push(a, d, b, a, c, d); }
  const n0 = pos.length / 3; for (let q = 0; q < n0; q++) pos.push(pos[3 * q], pos[3 * q + 1], pos[3 * q + 2] - 1.4);
  const base = idx.length; for (let q = 0; q < base; q += 3) idx.push(n0 + idx[q], n0 + idx[q + 2], n0 + idx[q + 1]);
  const ge = new T.BufferGeometry(); ge.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); ge.setIndex(idx); ge.computeVertexNormals();
  g.add(kit.solid(ge, 0, 0, 0, { leaf: true, crease: 40 }));
  const Ln = [], mid = []; for (let i = 0; i < n - 1; i++) { const a = pos.slice(3 * (1 + (rings - 1) * n + i), 3 * (1 + (rings - 1) * n + i) + 3), b = pos.slice(3 * (2 + (rings - 1) * n + i), 3 * (2 + (rings - 1) * n + i) + 3); Ln.push([a[0], a[1], a[2] + 1.2], [b[0], b[1], b[2] + 1.2]); }   // the outline, drawn by hand: a silhouette hull would pile up where the triangles meet at the stalk
  for (let i = 0; i < 12; i++) { const a = at(0, i / 12 * 0.93), b = at(0, (i + 1) / 12 * 0.93); Ln.push([a[0], a[1], a[2] + 1.3], [b[0], b[1], b[2] + 1.3]); }
  const lobes = [0, ...ang].map((a, k, A) => (k === 0 ? 0 : (A[k - 1] + a) / 2)).slice(1); lobes.push(ang.length ? ang[ang.length - 1] + 0.3 : 0.9);
  const vs = ang.length ? lobes.slice(0, -1).concat([ang[ang.length - 1] + 0.32]) : [0.7, 1.3, 1.9];
  for (const th of vs) for (const s of [-1, 1]) { let p = at(0, 0.04); for (let i = 1; i <= 6; i++) { const rad = rSlit(th) * 0.9 * i / 6, q = at(s * th, rad); Ln.push([p[0], p[1], p[2] + 1.3], [q[0], q[1], q[2] + 1.3]); p = q; } }
  g.add(kit.lines(Ln, 'green'));
  return g;
}
