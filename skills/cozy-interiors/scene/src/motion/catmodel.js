// @js:motion-catmodel — the cat itself, in the kit's paper-and-pencil look: a lofted body with proper anatomy (haunch, ribs, shoulders), a head with muzzle, cheeks, ears and closed eyes, paws, a tail, and tabby stripes in fine line.
// The sleeping cat (cat.js) and the paw (paw.js) both build from here, so a cat reads as the same cat everywhere. Units mm; scale 1 is life size (a curled cat is about 400 mm across).
// sleeper(kit, { seed }) -> { group, breathe(x), ears(x), parts } : curled in a ring, head on the paws and the tail, origin on the surface under the middle of the ring, the head toward +x ... (turn the group about y).
// paw(kit) -> { group, ... } : a forearm and paw reaching along +z from the origin (the cover's edge), pads and claws as fine lines.
const rad = Math.PI / 180;
const lo = { tone: 'lo' };
export const SIZE = 1.3;   // the sleeping cat's scale (sketch units to mm): a curled cat about 380 mm long, 160 mm high at the haunch

// a smooth body swept along a centreline: radius r(t) wide, flat * r(t) high, rounded at both ends (cap = the part of the length that closes to a point)
export function loft(T, pts, rOf, { flat = 0.9, ring = 22, cap = 0.12 } = {}) {
  const n = pts.length, pos = [], idx = [], up = new T.Vector3(0, 1, 0), tan = new T.Vector3(), side = new T.Vector3(), up2 = new T.Vector3();
  let prevSide = null;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    tan.subVectors(b, a).normalize();
    if (!prevSide) side.crossVectors(up, tan).normalize(); else side.copy(prevSide).addScaledVector(tan, -prevSide.dot(tan)).normalize();   // parallel transport: the section never flips when the path climbs
    prevSide = side.clone(); up2.crossVectors(tan, side).normalize();
    let m = 1; if (t < cap) m = Math.sqrt(Math.max(0, 1 - ((cap - t) / cap) ** 2)); else if (t > 1 - cap) m = Math.sqrt(Math.max(0, 1 - ((t - (1 - cap)) / cap) ** 2));
    const r = rOf(t) * Math.max(m, 0.001);
    for (let k = 0; k < ring; k++) {
      const q = k / ring * Math.PI * 2, c = Math.cos(q) * r, s = Math.sin(q) * r * flat;
      pos.push(pts[i].x + side.x * c + up2.x * s, pts[i].y + side.y * c + up2.y * s, pts[i].z + side.z * c + up2.z * s);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < ring; k++) { const a = i * ring + k, b = i * ring + (k + 1) % ring, c = (i + 1) * ring + k, d = (i + 1) * ring + (k + 1) % ring; idx.push(a, c, b, b, c, d); }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  // wind the faces outward whichever way the sweep turned
  const p = g.attributes.position, nn = g.attributes.normal, c0 = pts[Math.floor(n / 2)];
  let out = 0; for (let i = 0; i < p.count; i += 7) out += (p.getX(i) - c0.x) * nn.getX(i) + (p.getY(i) - c0.y) * nn.getY(i) + (p.getZ(i) - c0.z) * nn.getZ(i);
  if (out < 0) { const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } g.computeVertexNormals(); }
  return g;
}

const ellipsoid = (T, rx, ry, rz, seg = 22) => { const g = new T.SphereGeometry(1, seg, Math.round(seg * 0.75)); g.scale(rx, ry, rz); return g; };
// a point on an ellipsoid (radii rx ry rz at the origin) in the direction (a, b, c), pushed out by `k` mm
const onEll = (rx, ry, rz, d, k = 0.8) => { const l = Math.hypot(d[0] / rx, d[1] / ry, d[2] / rz); return [d[0] / l + d[0] * k / Math.hypot(...d), d[1] / l + d[1] * k / Math.hypot(...d), d[2] / l + d[2] * k / Math.hypot(...d)]; };

// ---- the head: one smooth wedge (forward +z, up +y, width x), widest across the cheekbones and tapering to a small short muzzle; no separate cheeks. Closed eyes, nose, whiskers, two small pyramid ears. Origin: the middle of the skull.
const HR = [50, 42, 50];
const wedge = (x, y, z) => {   // a unit-sphere point -> its place on the head
  let px = x * HR[0], py = y * HR[1], pz = z * HR[2];
  const zf = pz / HR[2], k = Math.min(1, Math.max(0, (zf + 0.1) / 1.1)), sk = k * k * (3 - 2 * k);
  px *= (1 - 0.55 * sk) * (1 + 0.1 * Math.exp(-Math.pow(zf * 1.6, 2)));   // cheekbones widest just behind the middle, then a taper to the muzzle
  if (py > 0) py *= 0.88; else py *= 1 - 0.25 * sk;
  py -= 9 * sk;
  return [px, py, pz];
};
export function head(kit, { eyes = 'closed', ears = true } = {}) {
  const T = kit.THREE, g = kit.group(), geo = new T.SphereGeometry(1, 30, 22), pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setXYZ(i, ...wedge(pos.getX(i), pos.getY(i), pos.getZ(i)));
  geo.computeVertexNormals();
  g.add(kit.solid(geo, 0, 0, 0, { smooth: true }));
  const nose = wedge(0, -0.08, 0.995); g.add(kit.solid(ellipsoid(T, 7, 5, 5, 10), nose[0], nose[1] + 1, nose[2], { smooth: true, ...lo }));
  const earMeshes = [];
  if (ears) for (const sx of [-1, 1]) {
    const prof = [[0, 0], [17, 0], [15.5, 6], [11, 13], [6.5, 18], [3.5, 21], [0, 22.5]].map(([x, y]) => new T.Vector2(x, y)), eg = new T.LatheGeometry(prof, 14); eg.scale(1, 1, 0.72);   // a small cone with a rounded tip, about 22 mm tall in sketch units
    const m = kit.solid(eg, sx * 34, 30, -6, { smooth: true, crease: 40 }); m.rotation.set(-0.1, 0, -sx * 0.5); m.rotation.order = 'YXZ';
    g.add(m); earMeshes.push(m);
  }
  // closed eyes: a short downward arc each, on the skin; the mouth line and whiskers
  const lines = [], onHead = (d, k = 1.02) => { const l = Math.hypot(...d), p = wedge(d[0] / l, d[1] / l, d[2] / l); return [p[0] * k, p[1] * k, p[2] * k]; };
  if (eyes === 'closed') for (const sx of [-1, 1]) { const pts = []; for (let i = 0; i <= 7; i++) { const u = i / 7 * 2 - 1; pts.push(onHead([sx * (0.5 - 0.16 * u), 0.2 - 0.12 * (1 - u * u), 0.78 + 0.05 * u], 1.025)); } for (let i = 0; i < 7; i++) lines.push(pts[i], pts[i + 1]); }
  { const m0 = onHead([0, -0.12, 1], 1.02), m1 = onHead([0, -0.3, 0.96], 1.02), ml = onHead([-0.13, -0.38, 0.9], 1.02), mr = onHead([0.13, -0.38, 0.9], 1.02); lines.push(m0, m1, m1, ml, m1, mr); }
  g.add(kit.lines(lines, 'mid'));
  const wh = []; for (const sx of [-1, 1]) for (const k of [-1, 0, 1]) { const s0 = onHead([sx * 0.28, -0.22 + k * 0.05, 0.9], 1.0); wh.push(s0, [s0[0] + sx * 52, s0[1] - 4 + k * 8, s0[2] - 4 - k * 4]); }
  g.add(kit.lines(wh, 'faint'));
  return { group: g, ears: earMeshes };
}

// ---- the sleeping cat: one solid oval body (no hole), a soft haunch and chest contour, the head tucked at the front edge on the crossed forepaws, the tail along the front edge to the nose.
// The body's long axis is x; the head is at +x, front side +z; the model is 1.3 times the sketch units so a curled cat is about 380 mm across.
export function sleeper(kit, { seed = 1 } = {}) {
  const T = kit.THREE, V = (x, y, z) => new T.Vector3(x, y, z), breath = kit.group();
  const body = { c: [0, 60, -6], r: [140, 62, 102] };
  const masses = [body];
  const surfY = (x, z) => Math.max(0, ...masses.map(({ c, r }) => { const q = 1 - Math.pow((x - c[0]) / r[0], 2) - Math.pow((z - c[2]) / r[2], 2); return q > 0 ? c[1] + r[1] * Math.sqrt(q) : 0; }));
  const mass = (c, r, seg = 26) => breath.add(kit.solid(ellipsoid(T, ...r, seg), ...c, { smooth: true }));
  masses.forEach(({ c, r }) => mass(c, r, 34));   // one oval; the haunch is only a soft contour drawn inside its outline
  { const arc = []; for (let k = 0; k <= 16; k++) { const a = (-30 + 250 * k / 16) * rad, x = -84 + 64 * Math.cos(a), z = -10 + 70 * Math.sin(a); arc.push([x, surfY(x, z) + 1.2, z]); } breath.add(kit.lines(arc.slice(1).flatMap((q, k) => [arc[k], q]), 'lo')); }
  // tabby: a few broad soft bands over the top of the back, tapering at both ends
  const band = (x0, w) => {
    const n = 9, pos = [], idx = [];
    for (let k = 0; k <= n; k++) { const u = k / n, z = -78 + 118 * u, x = x0 + 12 * Math.sin(u * 3.1), ww = w * Math.pow(Math.sin(Math.PI * (0.04 + 0.92 * u)), 0.9), y = surfY(x, z) + 2.5; for (const sg of [-1, 1]) pos.push(x + sg * ww / 2, y, z); }
    for (let k = 0; k < n; k++) { const a = k * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }   // one winding, normals up
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = kit.solid(g, 0, 0, 0, { linen: true }); m.clear(); return m;
  };
  for (const [x, w] of [[-52, 15], [-26, 15], [0, 15], [26, 14], [50, 13]]) breath.add(band(x, w));
  // head at the front edge, nose toward -x; forepaws under the chin; tail along the front edge
  const front = kit.group(); front.position.set(112, 52, 100); front.rotation.y = -Math.PI / 2 + 0.25; front.scale.setScalar(1.2);
  for (const [x, z] of [[44, 0], [48, 26]]) { /* placeholder to keep indices simple */ void x; void z; }
  const hd0 = head(kit, {}); hd0.group.rotation.x = 0.15; hd0.group.rotation.z = 0.9; front.add(hd0.group);   // the cheek rests on the paws, the face turned up toward the viewer
  const paws = kit.group(); for (const [x, y, z] of [[52, 15, 78], [54, 15, 100]]) paws.add(kit.solid(ellipsoid(T, 38, 15, 16, 14), x, y, z, { smooth: true }));
  paws.add(kit.lines([[20, 20, 72], [14, 17, 76], [20, 20, 94], [14, 17, 98]], 'lo'));
  const cv = new T.CatmullRomCurve3([V(-112, 34, 6), V(-126, 22, 52), V(-104, 17, 98), V(-52, 15, 126), V(0, 14, 134), V(36, 14, 128)], false, 'centripetal'), tailPts = []; for (let i = 0; i < 30; i++) tailPts.push(cv.getPoint(i / 29));
  const tail = kit.solid(loft(T, tailPts, (t) => 17.5 - 8.5 * t, { flat: 0.95, ring: 14, cap: 0.07 }), 0, 0, 0, { smooth: true });
  const root = kit.group(), parts = { breath: kit.merge(breath), paws: kit.merge(paws), tail: kit.merge(kit.group().add(tail)), front: kit.merge(front), ears: hd0.ears };
  root.add(breath, paws, parts.tail, front); root.scale.setScalar(SIZE);
  const fy = front.position.y;
  const spheres = [[-92, 58, -12, 68], [-20, 62, -6, 66], [62, 56, 6, 64], [110, 50, 98, 56], [-118, 24, 40, 26], [-52, 17, 126, 20], [10, 17, 132, 20], [52, 15, 92, 24]].map(([x, y, z, r]) => ({ c: [x, y, z], r }));
  return {
    group: root, parts, spheres,
    breathe(x) { const k = 0.5 - 0.5 * Math.cos(x * Math.PI * 2); breath.scale.set(1 + 0.012 * k, 1 + 0.06 * k, 1 + 0.012 * k); front.position.y = fy + 3 * k; },
    twitch(x) { const e = hd0.ears[0]; if (e) e.rotation.z = 0.4 + Math.sin(x * Math.PI) * 0.25; },
  };
}

// ---- a forelimb reaching along +z from the shoulder (origin): fur-striped forearm, the wrist, a paw with toes. Length L to the wrist, then the paw ~46 long. Returns { group, L, paw: 46, r: 19 }.
export function foreleg(kit, { L = 190 } = {}) {
  const T = kit.THREE, V = (x, y, z) => new T.Vector3(x, y, z), g = kit.group(), pts = [];
  for (let i = 0; i < 16; i++) pts.push(V(0, 0, L * i / 15));
  const rOf = (t) => 23 - 6 * t + 2 * Math.sin(t * 3);
  g.add(kit.solid(loft(T, pts, rOf, { flat: 0.95, ring: 16, cap: 0.06 }), 0, 0, 0, { smooth: true }));
  const pawAt = L + 16; g.add(kit.solid(ellipsoid(T, 22, 16, 34, 16), 0, -4, pawAt, { smooth: true }));   // the paw
  const toes = []; for (const x of [-14, -5, 5, 14]) { const zt = pawAt + 28 - Math.abs(x) * 0.5; g.add(kit.solid(ellipsoid(T, 8.5, 8, 11, 10), x, -7, zt, { smooth: true })); toes.push([x * 0.8, -3, pawAt + 12], [x, -4, zt + 4]); }
  g.add(kit.lines(toes, 'mid'));
  const st = []; for (const t of [0.25, 0.42, 0.59, 0.76]) { const z = L * t, r = rOf(t) * 1.02; let prev = null; for (let k = 0; k <= 7; k++) { const q = (-60 + 120 * k / 7) * rad, p = [Math.sin(q) * r, Math.cos(q) * r * 0.95, z + Math.sin(k * 2 + t * 9) * 1.5]; if (prev) st.push(prev, p); prev = p; } }
  g.add(kit.lines(st, 'lo'));
  return { group: kit.merge(g), L, paw: 62, r: 22 };
}
