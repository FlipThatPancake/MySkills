// @js:library-small — small floor pieces that belong to one kind of room, so each area can pick its own foreground piece instead of a basket or pouf everywhere.
// stepStool({ w = 380, h = 420 }) and crate({ w = 520 }) and wateringCan() for a kitchen; umbrellaStand() and shoes() for a hallway; wasteBin({ h = 340 }) and fileBox() for an office. Origins in the middle of the footprint on the floor; fronts face +z.
const lo = { tone: 'lo' };
const bx = (kit) => (cx, y, cz, w, h, d, o) => kit.box(cx - w / 2, y, cz + d / 2, w, h, d, o), rb = (kit) => (cx, y, cz, w, h, d, r, o) => kit.rbox(cx - w / 2, y, cz + d / 2, w, h, d, r, o);
const bar = (kit, a, b, r, o = {}) => { const T = kit.THREE, A = new T.Vector3(...a), B = new T.Vector3(...b), d = B.clone().sub(A), m = kit.solid(new T.CylinderGeometry(r, r, d.length(), 12), 0, 0, 0, { smooth: true, ...o }); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); return m; };
export function stepStool(kit, { w = 380, h = 420 } = {}) {   // two wooden steps between slatted sides
  const g = kit.group(), B = bx(kit), R = rb(kit), d = 320;
  for (const s of [-1, 1]) g.add(B(s * (w / 2 - 16), 0, 0, 32, h - 30, d - 40));
  g.add(R(0, h - 30, 0, w, 30, d, 6)); g.add(R(0, h * 0.48, 40, w - 40, 26, d - 40, 5, lo)); g.add(B(0, 120, -d / 2 + 40, w - 60, 90, 18, lo));
  return kit.merge(g);
}
export function crate(kit, { w = 520, d = 340, h = 260 } = {}) {   // a slatted wooden crate of fruit
  const T = kit.THREE, g = kit.group(), B = bx(kit), pts = [], t = 16;
  g.add(B(0, 0, 0, w, 20, d)); g.add(B(0, 20, d / 2 - t / 2, w, h - 20, t)); g.add(B(0, 20, -d / 2 + t / 2, w, h - 20, t)); for (const s of [-1, 1]) g.add(B(s * (w / 2 - t / 2), 20, 0, t, h - 20, d - 2 * t));
  for (const y of [20 + (h - 20) / 3, 20 + 2 * (h - 20) / 3]) pts.push([-w / 2, y, d / 2 + 0.6], [w / 2, y, d / 2 + 0.6]);
  g.add(kit.lines(pts, 'mid'));
  for (const [x, z, r, y] of [[-150, 0, 62, 0], [-30, 40, 58, 0], [100, -20, 64, 0], [190, 30, 56, 0], [-90, -60, 56, 70], [50, 20, 60, 80], [150, -30, 54, 62]]) g.add(kit.solid(new T.SphereGeometry(r, 18, 12), x, h - 90 + y, z, { smooth: true, ...(x > 0 ? {} : lo) }));
  return kit.merge(g);
}
export function wateringCan(kit, { h = 260 } = {}) {   // a round can with a long spout and a curved handle
  const T = kit.THREE, g = kit.group(), r = h * 0.34, bh = h * 0.62, pts = [];
  g.add(kit.cyl(0, 0, 0, r, bh, { rTop: r * 0.92, seg: 28 })); g.add(kit.cyl(0, bh, 0, r * 0.92, 10, { seg: 28, ...lo }));
  g.add(bar(kit, [r * 0.8, 40, 0], [r * 2.2, h * 0.88, 0], 14)); g.add(kit.cyl(r * 2.2, h * 0.88, 0, 26, 14, { rTop: 30, seg: 14, ...lo }));
  const hd = kit.solid(new T.TorusGeometry(h * 0.27, 9, 8, 24, Math.PI * 1.1), -r * 0.9, h * 0.52, 0, { smooth: true, ...lo }); hd.rotation.z = Math.PI * 0.4; g.add(hd);
  return kit.merge(g);
}
export function umbrellaStand(kit, { h = 520 } = {}) {   // a tall round bin holding two furled umbrellas (one tapered form, a hooked handle, two seams) and a walking stick
  const T = kit.THREE, g = kit.group();
  g.add(kit.cyl(0, 0, 0, 110, h, { rTop: 125, seg: 32, ...lo })); g.add(kit.cyl(0, h - 24, 0, 125, 24, { rTop: 125, seg: 32 }));
  const umbrella = (x, z, tilt, len, spin) => {
    const u = kit.group(), c = len * 0.7, n = len * 0.9;
    u.add(kit.cyl(0, 0, 0, 8, c, { rTop: 34, seg: 16 })); u.add(kit.cyl(0, c, 0, 34, n - c, { rTop: 9, seg: 16 })); u.add(kit.cyl(0, n, 0, 5, len - n, { seg: 8 }));
    const hook = kit.solid(new T.TorusGeometry(26, 6, 8, 16, Math.PI * 1.1), 26, len, 0, { smooth: true, ...lo }); hook.rotation.z = Math.PI * 0.95; u.add(hook);
    u.add(kit.lines([[34 * 0.97, c, 0], [8, 0, 0], [-34 * 0.97, c, 0], [-8, 0, 0]], 'lo'));   // two seams down the furled canopy
    u.position.set(x, h * 0.45, z); u.rotation.set(0, spin, tilt); return u;
  };
  g.add(umbrella(-40, 10, 0.16, 760, 0)); g.add(umbrella(45, -20, -0.1, 700, 0));
  g.add(bar(kit, [0, h * 0.5, 50], [30, h * 0.5 + 780, 40], 12, lo));
  return kit.merge(g);
}
export function shoes(kit, { pairs = 2 } = {}) {   // pairs of shoes side by side, toes to the front
  const g = kit.group(), R = rb(kit);
  for (let p = 0; p < pairs; p++) for (const s of [-1, 1]) { const x = p * 300 + s * 70 - (pairs - 1) * 150, L = p ? 260 : 290; g.add(R(x, 0, 0, 100, 24, L, 10, lo)); g.add(R(x, 24, -L * 0.1, 96, 92, L * 0.78, 40)); g.add(R(x, 24, L * 0.36, 90, 46, L * 0.3, 34)); }
  return kit.merge(g);
}
export function wasteBin(kit, { h = 340 } = {}) {   // a slim round waste bin with a rolled rim
  const T = kit.THREE, g = kit.group(), r = 130, pts = [];
  g.add(kit.cyl(0, 0, 0, r * 0.82, h, { rTop: r, seg: 32 }));
  const rim = kit.solid(new T.TorusGeometry(r, 8, 8, 36), 0, h, 0, { smooth: true, ...lo }); rim.rotation.x = Math.PI / 2; g.add(rim);
  for (let i = 0; i < 36; i += 3) { const a = i / 36 * 6.2832, rr0 = r * 0.82 + 0.5, rr1 = r + 0.5; pts.push([Math.cos(a) * rr0, 6, Math.sin(a) * rr0], [Math.cos(a) * rr1, h - 6, Math.sin(a) * rr1]); }
  g.add(kit.lines(pts, 'lo'));
  return kit.merge(g);
}
export function fileBox(kit, { w = 300, h = 290, d = 380 } = {}) {   // an archive box with a lid, a hand hole and a label
  const g = kit.group(), R = rb(kit), z = d / 2 + 0.6;
  g.add(R(0, 0, 0, w, h - 30, d, 6)); g.add(R(0, h - 30, 0, w + 14, 30, d + 14, 6, lo));
  const pts = []; const hole = (cx, cy, rx, ry) => { for (let i = 0; i < 24; i++) { const a = i / 24 * 6.2832, b = (i + 1) / 24 * 6.2832; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, z], [cx + Math.cos(b) * rx, cy + Math.sin(b) * ry, z]); } };
  hole(0, h * 0.62, 52, 20);
  pts.push([-w * 0.3, h * 0.25, z], [w * 0.3, h * 0.25, z], [w * 0.3, h * 0.25, z], [w * 0.3, h * 0.4 - 10, z], [w * 0.3, h * 0.4 - 10, z], [-w * 0.3, h * 0.4 - 10, z], [-w * 0.3, h * 0.4 - 10, z], [-w * 0.3, h * 0.25, z]);
  g.add(kit.lines(pts, 'lo'));
  return kit.merge(g);
}
