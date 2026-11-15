// @js:library-soft — the soft-forms toolkit: things that give, so they are never slabs.
// softBox: a rounded box with a bulge and piping (cushions, seat pads, pillows, pouf, bag body); drape: a cloth hung from a line (coat, towel, throw); vessel: a lathe profile with rim, dip and contents (pots, vases, mugs).
// Every builder returns a group in millimetres, ready to add; thickness of a softBox runs along z (turn it for a seat pad: rotation.x = -PI/2).
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);

// A rounded box w x h x d centred on the origin: r rounds every edge, bulge pushes the two big faces out in a pillow curve (0 at the edge), dent presses a soft hollow into the front face.
export function softGeometry(T, { w, h, d, r = 40, bulge = 0, dent = 0, dentAt = [0, 0], sag = 0, seg = 22 }) {
  const a = w / 2, b = h / 2, c = d / 2, rr = Math.min(r, a * 0.9, b * 0.9, c * 0.98), nz = (len) => Math.min(48, Math.max(seg >> 1, Math.round(len / Math.max(rr * 0.8, 8))));   // more rows on a long side, so a round edge stays round
  const g = new T.BoxGeometry(w, h, d, Math.max(seg, nz(w)), Math.max(seg, nz(h)), Math.max(seg >> 1, nz(d))), P = g.attributes.position, v = new T.Vector3(), q = new T.Vector3();
  for (let i = 0; i < P.count; i++) {
    v.fromBufferAttribute(P, i);
    const nzz = v.z / c;
    q.set(clamp(v.x, -(a - rr), a - rr), clamp(v.y, -(b - rr), b - rr), clamp(v.z, -(c - rr), c - rr));
    v.sub(q); const l = v.length(); if (l > 1e-6) v.multiplyScalar(rr / l);
    v.add(q);
        const fx = 1 - Math.pow(Math.abs(clamp(v.x / a, -1, 1)), 2), fy = 1 - Math.pow(Math.abs(clamp(v.y / b, -1, 1)), 2);
    if (bulge && Math.abs(nzz) > 0.5) v.z += Math.sign(nzz) * bulge * Math.pow(Math.max(0, fx * fy), 0.8) * smooth(clamp((Math.abs(nzz) - 0.5) * 2, 0, 1));
    if (dent && nzz > 0.5) { const dx = (v.x - dentAt[0]) / (a * 0.55), dy = (v.y - dentAt[1]) / (b * 0.55); v.z -= dent * Math.exp(-(dx * dx + dy * dy)) * smooth(clamp((nzz - 0.5) * 2, 0, 1)); }
    if (sag) v.y -= sag * (1 - Math.pow(Math.abs(v.x / a), 2)) * (v.y > 0 ? 1 : 0.3) * 0.5;
    P.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}
// The piping: a seam line round the rim of each big face, drawn as one loop (the ring where the rounded edge turns from the face into the side).
function ringPoints(w, h, d, rr, z, inset) {
  const a = w / 2 - inset, b = h / 2 - inset, n = 8, pts = [], c = [[a - rr, b - rr, 0], [-(a - rr), b - rr, Math.PI / 2], [-(a - rr), -(b - rr), Math.PI], [a - rr, -(b - rr), Math.PI * 1.5]], loop = [];
  for (const [cx, cy, a0] of c) for (let k = 0; k <= n; k++) { const t = a0 + k / n * Math.PI / 2; loop.push([cx + Math.cos(t) * rr, cy + Math.sin(t) * rr, z]); }
  for (let i = 0; i < loop.length; i++) pts.push(loop[i], loop[(i + 1) % loop.length]);
  return pts;
}
// Where the surface of a softBox's front face stands (z) at (x, y): the same bulge and dent as softGeometry, so a line drawn there lies on the cloth.
export function faceZ(w, h, d, { bulge = 0, dent = 0, dentAt = [0, 0] } = {}, x, y) {
  const fx = 1 - Math.pow(Math.min(1, Math.abs(x / (w / 2))), 2), fy = 1 - Math.pow(Math.min(1, Math.abs(y / (h / 2))), 2), dx = (x - dentAt[0]) / (w / 2 * 0.55), dy = (y - dentAt[1]) / (h / 2 * 0.55);
  return d / 2 + bulge * Math.pow(Math.max(0, fx * fy), 0.8) - dent * Math.exp(-(dx * dx + dy * dy)) + 1.5;
}
// Line pairs [x, y] -> [x, y] (in the box's own frame, y up from its middle) cut into short pieces that follow the face.
export function onFace(w, h, d, shape, pairs, cut = 14) {
  const out = [];
  for (let i = 0; i < pairs.length; i += 2) { const [x0, y0] = pairs[i], [x1, y1] = pairs[i + 1]; let p = [x0, y0, faceZ(w, h, d, shape, x0, y0)]; for (let k = 1; k <= cut; k++) { const x = x0 + (x1 - x0) * k / cut, y = y0 + (y1 - y0) * k / cut, q = [x, y, faceZ(w, h, d, shape, x, y)]; out.push(p, q); p = q; } }
  return out;
}
// kit.solid wrapper: opts { r, bulge, dent, dentAt, sag, piping: 'none' | 'edge' | 'double', tone, seam: true to add a centre seam on the big faces }.
export function softBox(kit, w, h, d, o = {}) {
  const T = kit.THREE, g = kit.group(), r = Math.min(o.r ?? 40, d * 0.48, w * 0.45, h * 0.45);
  const geo = softGeometry(T, { w, h, d, r, bulge: o.bulge ?? 0, dent: o.dent ?? 0, dentAt: o.dentAt, sag: o.sag ?? 0, seg: o.seg ?? 22 });
  g.add(kit.solid(geo, 0, 0, 0, { smooth: true, tone: o.tone, smoothShade: false }));
  const z0 = d / 2 - r * 0.27 + (o.bulge ?? 0) * 0, ins = r * 0.27, pts = [];   // the 45-degree line of the rounded edge
  if (o.piping === 'edge' || o.piping === 'double') for (const s of [-1, 1]) pts.push(...ringPoints(w, h, d, r * 0.73, s * z0, ins));
  if (o.piping === 'double') for (const s of [-1, 1]) pts.push(...ringPoints(w, h, d, Math.max(4, r * 0.5), s * (d / 2 + (o.bulge ?? 0) * 0.02), r * 1.1 + 12));
  if (o.crease) { const [x0, y0, x1, y1] = o.crease, zf = d / 2 + (o.bulge ?? 0) * 0.6; pts.push([x0, y0, zf], [x1, y1, zf]); }
  if (o.tufts) for (const [x, y] of o.tufts) { const zf = d / 2 + (o.bulge ?? 0) * 0.55; pts.push([x - 9, y, zf], [x + 9, y, zf], [x, y - 9, zf], [x, y + 9, zf]); }
  if (pts.length) g.add(kit.lines(pts, 'mid'));
  return g;
}

// A pillow: thin at the seam all round (edge mm), puffy in the middle (thick mm), corners a little pointed. Centred on the origin, thickness along z. dent presses a hollow into the front.
export function pillowGeometry(T, { w, h, thick, edge = 26, dent = 0, n = 28 }) {
  const pos = [], idx = [], N = n + 1, bump = (u, v) => Math.pow(Math.max(0, (1 - u * u) * (1 - v * v)), 0.62);
  const at = (i, j) => { const u = i / n * 2 - 1, v = j / n * 2 - 1, k = 1 - 0.07 * Math.pow(Math.abs(u * v), 2), t = edge + (thick - edge) * bump(u, v); return [u * w / 2 * k, v * h / 2 * k, t / 2, u, v]; };
  for (const s of [1, -1]) for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) { const [x, y, z, u, v] = at(i, j); pos.push(x, y, s * (z - (s > 0 ? dent * Math.exp(-((u * u + v * v) / 0.28)) : 0))); }
  for (const s of [0, 1]) for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = s * N * N + j * N + i, b = a + 1, c = a + N, d = c + 1; if (s === 0) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d); }
  const ring = []; for (let i = 0; i < n; i++) ring.push([i, 0]); for (let j = 0; j < n; j++) ring.push([n, j]); for (let i = 0; i < n; i++) ring.push([n - i, n]); for (let j = 0; j < n; j++) ring.push([0, n - j]);
  for (let k = 0; k < ring.length; k++) { const [i0, j0] = ring[k], [i1, j1] = ring[(k + 1) % ring.length]; if (i0 === i1 && j0 === j1) continue; const a = j0 * N + i0, b = j1 * N + i1, c = N * N + a, d = N * N + b; idx.push(a, c, b, b, c, d); }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// The surface height (z) of a pillow's front at (x, y) in its own frame, for lines that lie on it.
export function pillowZ(w, h, thick, edge, dent, x, y) {
  const u = clamp(x / (w / 2), -1, 1), v = clamp(y / (h / 2), -1, 1);
  return (edge + (thick - edge) * Math.pow(Math.max(0, (1 - u * u) * (1 - v * v)), 0.62)) / 2 - dent * Math.exp(-((u * u + v * v) / 0.28)) + 1.2;
}
// A cloth sheet w x h hung from its top edge (y = 0 at the line, hanging down to -h) with soft vertical folds; thickness gives it an edge. folds: number of folds across, depth: how far they stand out, flare: wider at the hem.
export function drape(kit, w, h, { folds = 4, depth = 28, thick = 10, flare = 0.08, phase = 0.4, nx = 36, ny = 14, slope = 0, profile, tone } = {}) {
  const T = kit.THREE, ix = (i, j, s) => (s * (ny + 1) + j) * (nx + 1) + i, pos = [], idx = [];
  for (const s of [0, 1]) for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const u = i / nx - 0.5, t = j / ny, wide = profile ? profile(t) : 1 + flare * t, x = u * w * wide, amp = depth * (0.25 + 0.75 * smooth(t)), z = Math.sin((u * folds * 2 * Math.PI) + phase) * amp * 0.5 + (s ? -thick : 0);
    pos.push(x, -t * h - slope * Math.pow(2 * Math.abs(u), 2) * (1 - t), z * (1 - 0.15 * Math.abs(u)));
  }
  for (const s of [0, 1]) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = ix(i, j, s), b = ix(i + 1, j, s), c = ix(i, j + 1, s), d = ix(i + 1, j + 1, s);
    if (s === 0) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
  }
  for (let j = 0; j < ny; j++) for (const i of [0, nx]) { const a = ix(i, j, 0), b = ix(i, j + 1, 0), c = ix(i, j, 1), d = ix(i, j + 1, 1); if (i === 0) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c); }
  for (let i = 0; i < nx; i++) { const a = ix(i, ny, 0), b = ix(i + 1, ny, 0), c = ix(i, ny, 1), d = ix(i + 1, ny, 1); idx.push(a, b, c, b, d, c); }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const grp = kit.group(); grp.add(kit.solid(g, 0, 0, 0, { smooth: true, tone }));
  const fl = []; for (let k = 1; k < folds; k++) { const i = Math.round(k / folds * nx); for (let j = 1; j < ny - 1; j += 1) { const a = j * (nx + 1) + i, b = (j + 1) * (nx + 1) + i; if (j % 3 !== 1) fl.push([pos[a * 3], pos[a * 3 + 1], pos[a * 3 + 2] + 1], [pos[b * 3], pos[b * 3 + 1], pos[b * 3 + 2] + 1]); } }
  if (fl.length) grp.add(kit.lines(fl, 'lo'));
  return grp;
}

// A vessel from a profile of [radius, height] points from the foot up to the rim (outer wall), with a rolled rim and the contents dipped below it. o: { seg, contents: 'soil' | 'tea' | 'none', dip, tone, rim: true }.
export function vessel(kit, profile, o = {}) {
  const T = kit.THREE, g = kit.group(), seg = o.seg ?? 40, pts = profile.map(([r, y]) => new T.Vector2(Math.max(r, 0.01), y)), [rt, ht] = profile[profile.length - 1];
  g.add(kit.solid(new T.LatheGeometry(pts, seg), 0, 0, 0, { smooth: true, tone: o.tone }));
  const k = Math.max(rt * 0.06, 3), dip = o.dip ?? Math.min(30, Math.max(rt * 0.22, 20));
  if (o.rim !== false) { const rim = kit.solid(new T.TorusGeometry(rt - k, k, 8, seg), 0, ht, 0, { smooth: true, tone: o.tone }); rim.rotation.x = Math.PI / 2; g.add(rim); }
  if (o.contents !== 'none') {
    const soil = kit.cyl(0, ht - dip, 0, rt - 2 * k, dip, { seg, tone: 'lo', soil: true }); g.add(soil);
    if (o.contents !== 'tea') { const sp = []; for (let i = 0; i < 6; i++) { const a = i * 2.4 + 0.6, d = (rt - 3 * k) * (0.25 + 0.6 * ((i * 37) % 10) / 10), x = Math.cos(a) * d, z = Math.sin(a) * d; sp.push([x - 5, ht - dip + 0.6, z], [x + 5, ht - dip + 0.6, z + 3]); } g.add(kit.lines(sp, 'lo')); }
  }
  return g;
}
// Profiles for vessel(): radius at the foot, belly, rim and height. Named so a parameter can pick them.
export const PROFILES = {
  straight: (r, h) => [[r * 0.82, 0], [r, h * 0.04], [r, h]],
  tapered: (r, h) => [[r * 0.62, 0], [r * 0.7, h * 0.04], [r, h]],
  belly: (r, h) => [[r * 0.6, 0], [r * 0.72, h * 0.05], [r * 1.12, h * 0.5], [r * 1.0, h * 0.85], [r * 0.9, h]],
  tulip: (r, h) => [[r * 0.5, 0], [r * 0.6, h * 0.06], [r * 1.02, h * 0.55], [r * 1.08, h * 0.8], [r, h]],
  urn: (r, h) => [[r * 0.45, 0], [r * 0.62, h * 0.08], [r * 0.5, h * 0.16], [r * 0.9, h * 0.5], [r * 1.0, h * 0.82], [r * 0.95, h]],
};
