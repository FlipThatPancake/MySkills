// @js:motion-catmodel — the cat itself, in the kit's paper-and-pencil look: a lofted body with proper anatomy (haunch, ribs, shoulders), a head with muzzle, cheeks, ears and closed eyes, paws, a tail, and tabby stripes in fine line.
// The sleeping cat (cat.js) and the paw (paw.js) both build from here, so a cat reads as the same cat everywhere. Units mm; scale 1 is life size (a curled cat is about 400 mm across).
// sleeper(kit, { seed }) -> { group, breathe(x), ears(x), parts } : curled in a ring, head on the paws and the tail, origin on the surface under the middle of the ring, the head toward +x ... (turn the group about y).
// paw(kit) -> { group, ... } : a forearm and paw reaching along +z from the origin (the cover's edge), pads and claws as fine lines.
const rad = Math.PI / 180;
const lo = { tone: 'lo' };
export const SIZE = 1.0;   // the sleeping cat's scale: a curled cat about 400 mm across and 140 mm tall

// a smooth body swept along a centreline: radius r(t) wide, flat * r(t) high, rounded at both ends (cap = the part of the length that closes to a point)
export function loft(T, pts, rOf, { flat = 0.9, ring = 22, cap = 0.12 } = {}) {
  const n = pts.length, pos = [], idx = [], up = new T.Vector3(0, 1, 0), tan = new T.Vector3(), side = new T.Vector3(), up2 = new T.Vector3();
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    tan.subVectors(b, a).normalize(); side.crossVectors(up, tan).normalize(); up2.crossVectors(tan, side).normalize();
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

// ---- the head: forward is +z, up +y, width x. Skull, cheeks, muzzle, chin, nose, ears (with inner line), closed eyes, whiskers. Origin: the middle of the skull.
export function head(kit, { eyes = 'closed', ears = true } = {}) {
  const T = kit.THREE, g = kit.group(), S = [50, 44, 47];
  g.add(kit.solid(ellipsoid(T, ...S), 0, 0, 0, { smooth: true }));
  for (const sx of [-1, 1]) g.add(kit.solid(ellipsoid(T, 28, 24, 30, 16), sx * 30, -15, 12, { smooth: true }));   // cheek fluff
  g.add(kit.solid(ellipsoid(T, 24, 19, 24, 16), 0, -14, 38, { smooth: true }));                                   // muzzle
  g.add(kit.solid(ellipsoid(T, 13, 9, 13, 12), 0, -30, 40, { smooth: true }));                                    // chin
  g.add(kit.solid(ellipsoid(T, 7, 5, 5, 10), 0, -4, 60, { smooth: true, ...lo }));                                // nose
  const earMeshes = [];
  if (ears) for (const sx of [-1, 1]) {
    const eg = new T.ConeGeometry(17, 34, 4, 1); eg.rotateY(Math.PI / 4); eg.scale(1, 1, 0.75); eg.translate(0, 15, 0);   // a small solid pyramid, 34 mm tall
    const m = kit.solid(eg, sx * 30, 34, -4, { crease: 35 }); m.rotation.set(-0.15, 0, -sx * 0.4); m.rotation.order = 'YXZ';
    g.add(m); earMeshes.push(m);
  }
  // closed eyes: a downward arc each, with a short lash line; the muzzle line and whiskers
  const lines = [], arc = (c, tang, len, bow, n = 7) => { const pts = []; for (let i = 0; i <= n; i++) { const u = i / n * 2 - 1, d = [c[0] + tang[0] * u * len, c[1] + tang[1] * u * len - bow * (1 - u * u), c[2] + tang[2] * u * len]; pts.push(onEll(S[0], S[1], S[2], d, 0.9)); } for (let i = 0; i < n; i++) lines.push(pts[i], pts[i + 1]); };
  if (eyes === 'closed') for (const sx of [-1, 1]) arc([sx * 24, 6, 38], [sx * 0.2, 0, 0.98], 12, 4);
  const mz = (x, y, z) => [x, y, z];
  lines.push(mz(0, -8, 62), mz(0, -17, 60), mz(0, -17, 60), mz(-7, -22, 55), mz(0, -17, 60), mz(7, -22, 55));
  g.add(kit.lines(lines, 'mid'));
  const wh = []; for (const sx of [-1, 1]) for (const k of [-1, 0, 1]) wh.push(mz(sx * 12, -12 + k * 3, 56), mz(sx * 62, -16 + k * 9, 50 - k * 4));
  g.add(kit.lines(wh, 'faint'));
  return { group: g, ears: earMeshes };
}

// ---- the sleeping cat
export function sleeper(kit, { seed = 1 } = {}) {
  const T = kit.THREE, V = (x, y, z) => new T.Vector3(x, y, z), R = 94;
  // spine: a ring of radius R about the origin from the haunch (190 degrees) round the back to the shoulders (440 = 80 degrees); the head rests where the ring is open, touching the shoulder
  const N = 44, ph = (t) => (190 + 250 * t) * rad, spine = [];
  const width = (t) => 60 + 17 * Math.exp(-Math.pow((t - 0.15) / 0.18, 2)) + 9 * Math.exp(-Math.pow((t - 0.88) / 0.15, 2));
  for (let i = 0; i < N; i++) { const t = i / (N - 1); spine.push(V(Math.cos(ph(t)) * R, width(t) * 0.9, Math.sin(ph(t)) * R)); }
  const breath = kit.group();
  breath.add(kit.solid(loft(T, spine, width, { flat: 0.9, ring: 24, cap: 0.1 }), 0, 0, 0, { smooth: true }));
  const hip = spine[6]; breath.add(kit.solid(ellipsoid(T, 52, 52, 56, 18), hip.x * 0.98, 52, hip.z * 0.98, { smooth: true }));   // the haunch, blended into the back
  const sh = spine[N - 3]; breath.add(kit.solid(ellipsoid(T, 50, 46, 54, 18), sh.x * 0.98, 50, sh.z * 0.98, { smooth: true }));   // the chest, blended
  // tabby: a few fine arcs over the back
  const stripes = [];
  for (const t of [0.3, 0.4, 0.5, 0.6, 0.7]) {
    const i = Math.round(t * (N - 1)), a = spine[i - 1], b = spine[i + 1], tan = V().subVectors(b, a).normalize(), side = V().crossVectors(V(0, 1, 0), tan).normalize(), up = V().crossVectors(tan, side).normalize(), r = width(t) * 1.012;
    for (const [q0, q1] of [[25, 70], [110, 155]]) { let prev = null; for (let k = 0; k <= 4; k++) { const q = (q0 + (q1 - q0) * k / 4) * rad, p = [spine[i].x + side.x * Math.cos(q) * r + up.x * Math.sin(q) * r * 0.9, spine[i].y + side.y * Math.cos(q) * r + up.y * Math.sin(q) * r * 0.9, spine[i].z + side.z * Math.cos(q) * r + up.z * Math.sin(q) * r * 0.9]; if (prev) stripes.push(prev, p); prev = p; } }
  }
  breath.add(kit.lines(stripes, 'lo'));
  // head: resting on the front paws, against the shoulder, nose toward the haunch side of the opening
  const hd = V().subVectors(spine[N - 1], spine[N - 4]).normalize(), headAt = spine[N - 1].clone().addScaledVector(hd, 58); headAt.y = 52;
  const front = kit.group(); front.position.copy(headAt); front.rotation.y = Math.atan2(hd.x, hd.z) + 0.25;
  for (const sx of [-1, 1]) { front.add(kit.solid(ellipsoid(T, 17, 15, 36, 14), sx * 17, -36, 26, { smooth: true })); front.add(kit.lines([[sx * 17 - 5, -31, 59], [sx * 17 - 5, -34, 66], [sx * 17 + 5, -31, 59], [sx * 17 + 5, -34, 66]], 'lo')); }
  const hd0 = head(kit, {}); hd0.group.rotation.x = 0.2; front.add(hd0.group);
  // tail: from the rump along the outside of the flank, round the front, tip near the nose
  const tailPts = [], tN = 30, tr = R + 66;
  for (let i = 0; i < tN; i++) { const t = i / (tN - 1), a = (200 - 122 * t) * rad, r = i < 4 ? R + 10 + 14 * i : tr - 6 * t; tailPts.push(V(Math.cos(a) * r, 20, Math.sin(a) * r)); }
  const tail = kit.solid(loft(T, tailPts, (t) => 21 - 7 * t, { flat: 0.95, ring: 14, cap: 0.08 }), 0, 0, 0, { smooth: true });
  const tl = []; for (let i = 6; i < tN - 3; i += 4) { const p = tailPts[i], q = tailPts[i + 1], tan = V().subVectors(q, p).normalize(), side = V().crossVectors(V(0, 1, 0), tan).normalize(); tl.push([p.x + side.x * 9, 38, p.z + side.z * 9], [p.x - side.x * 9, 38, p.z - side.z * 9]); }
  const root = kit.group(), parts = { breath: kit.merge(breath), tail: kit.merge(kit.group().add(tail, kit.lines(tl, 'lo'))), front: kit.merge(front), ears: hd0.ears };
  root.add(breath, parts.tail, front); root.scale.setScalar(SIZE);
  const fy = front.position.y;
  const spheres = [[7, 62], [16, 62], [26, 60], [34, 60], [42, 62]].map(([i, r]) => ({ c: [spine[i].x, spine[i].y, spine[i].z], r })).concat([{ c: [headAt.x, 52, headAt.z], r: 52 }, { c: [tailPts[14].x, 22, tailPts[14].z], r: 24 }, { c: [tailPts[24].x, 22, tailPts[24].z], r: 22 }]);
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
