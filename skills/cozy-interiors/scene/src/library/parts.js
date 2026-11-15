// @js:library-parts — shared part generators that base assets combine: legs, handles, arms. A new part style is the only reason to write geometry; assets only choose.
// legs(kit, style, pts, top, o): one leg per [x, z] in pts, from the floor (y 0) up to `top`; styles in LEGS. o: { r half-width, tone, out: [cx, cz] the centre legs splay away from }
// handle(kit, style, x, y, z, o): on a front facing +z at (x, y, z); styles in HANDLES. o: { w, tone }
// arms(kit, style, o): a pair of sofa or armchair arms; styles in ARMS. o: { w, d, y0, top, armW }
export const LEGS = ['block', 'tapered', 'turned', 'hairpin', 'sled', 'splay', 'ball'];
export const HANDLES = ['bar', 'knob', 'cup', 'cutout'];
export const ARMS = ['track', 'rolled', 'flared', 'none'];

// a rod between two points (radius r at A, r2 at B)
export function rod(kit, a, b, r, r2 = r, tone) {
  const T = kit.THREE, A = new T.Vector3(...a), B = new T.Vector3(...b), d = B.clone().sub(A), len = d.length();
  const m = kit.solid(new T.CylinderGeometry(r2, r, len, 12), 0, 0, 0, { smooth: true, tone });
  m.position.copy(A.clone().add(B).multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
  return m;
}
export function legs(kit, style, pts, top, o = {}) {
  const T = kit.THREE, g = kit.group(), r = o.r ?? 22, tone = o.tone, cx = o.out?.[0] ?? 0, cz = o.out?.[1] ?? 0;
  if (style === 'sled') {   // a runner on each side: down at both ends, along the floor
    const xs = [...new Set(pts.map((p) => p[0]))];
    for (const x of xs) { const zs = pts.filter((p) => p[0] === x).map((p) => p[1]), z0 = Math.min(...zs), z1 = Math.max(...zs), rr = Math.max(r * 0.42, 6);
      g.add(rod(kit, [x, top, z0], [x, rr, z0], rr, rr, tone)); g.add(rod(kit, [x, top, z1], [x, rr, z1], rr, rr, tone)); g.add(rod(kit, [x, rr, z0], [x, rr, z1], rr, rr, tone));
      const e = kit.solid(new T.SphereGeometry(rr, 10, 8), x, rr, z0, { smooth: true, tone }); g.add(e); g.add(kit.solid(new T.SphereGeometry(rr, 10, 8), x, rr, z1, { smooth: true, tone })); }
    return g;
  }
  for (const [x, z] of pts) {
    const sx = Math.sign(x - cx) || 1, sz = Math.sign(z - cz) || 1;
    if (style === 'block') g.add(kit.box(x - r, 0, z + r, 2 * r, top, 2 * r, { tone }));
    else if (style === 'tapered') { const geo = new T.CylinderGeometry(r, r * 0.55, top, 4, 1); geo.rotateY(Math.PI / 4); const m = kit.solid(geo, x, top / 2, z, { tone }); m.scale.set(1.0, 1, 1.0); g.add(m); }
    else if (style === 'turned') {
      const pr = [[r * 0.55, 0], [r * 0.7, top * 0.03], [r * 0.5, top * 0.08], [r * 0.5, top * 0.35], [r * 0.85, top * 0.42], [r * 0.5, top * 0.5], [r * 0.6, top * 0.85], [r * 0.95, top * 0.9], [r, top]].map(([a, y]) => new T.Vector2(a, y));
      g.add(kit.solid(new T.LatheGeometry(pr, 16), x, 0, z, { smooth: true, tone }));
    } else if (style === 'hairpin') { const rr = Math.max(r * 0.2, 4), s = r * 0.9; for (const k of [-1, 1]) g.add(rod(kit, [x + k * s * (Math.abs(x - cx) > Math.abs(z - cz) ? 0 : 1), top, z + k * s * (Math.abs(x - cx) > Math.abs(z - cz) ? 1 : 0)], [x, 0, z], rr, rr, tone)); }
    else if (style === 'splay') { const out = Math.min(top * 0.22, 90); g.add(rod(kit, [x, top, z], [x + sx * out * 0.7, 4, z + sz * out * 0.7], r * 0.62, r * 0.42, tone)); }
    else if (style === 'ball') { g.add(rod(kit, [x, top, z], [x, r * 1.1, z], r * 0.5, r * 0.5, tone)); g.add(kit.solid(new T.SphereGeometry(r * 0.9, 14, 10), x, r * 0.9, z, { smooth: true, tone })); }
  }
  return g;
}

export function handle(kit, style, x, y, z, o = {}) {
  const T = kit.THREE, g = kit.group(), w = o.w ?? 110, tone = o.tone ?? 'lo';
  if (style === 'bar') { for (const s of [-1, 1]) g.add(kit.cyl(x + s * w / 2, y, z + 24, 5, 24, { axis: 'z', seg: 10, tone })); g.add(kit.cyl(x - w / 2, y, z + 24, 6, w, { axis: 'x', seg: 12, tone })); }
  else if (style === 'knob') { g.add(kit.cyl(x, y, z + 16, 5, 16, { axis: 'z', seg: 10, tone })); g.add(kit.solid(new T.SphereGeometry(15, 14, 10), x, y, z + 28, { smooth: true, tone })); }
  else if (style === 'cup') { const m = kit.solid(new T.SphereGeometry(w * 0.32, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), x, y, z + 3, { smooth: true, tone }); m.rotation.x = Math.PI / 2; m.scale.set(1.15, 1, 0.5); g.add(m); }
  else if (style === 'cutout') { g.add(kit.lines([[x - w / 2, y + 7, z + 1], [x + w / 2, y + 7, z + 1], [x - w / 2, y - 7, z + 1], [x + w / 2, y - 7, z + 1], [x - w / 2, y + 7, z + 1], [x - w / 2, y - 7, z + 1], [x + w / 2, y + 7, z + 1], [x + w / 2, y - 7, z + 1]], 'mid')); }
  return g;
}

// An extruded profile (x, y polygon) along z from zFront back to zFront - depth.
const prism = (kit, poly, depth, zFront, o = {}) => {
  const T = kit.THREE, s = new T.Shape(poly.map(([x, y]) => new T.Vector2(x, y)));
  const geo = new T.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: o.bevel ?? 12, bevelSize: o.bevel ?? 12, bevelSegments: 3, curveSegments: 10 });
  return kit.solid(geo, 0, 0, zFront - depth, { smooth: true, ...o });
};
export function arms(kit, style, { w, d, y0, top, armW = 170, tone } = {}) {
  const g = kit.group(), h = top - y0, zF = d / 2 - 12, depth = d - 24;
  if (style === 'none') return g;
  for (const s of [-1, 1]) {
    const cx = s * (w / 2 - armW / 2);
    if (style === 'track') g.add(kit.rbox(cx - armW / 2, y0, zF, armW, h, depth, 26, { tone }));
    else if (style === 'rolled') {
      g.add(kit.rbox(cx - armW / 2, y0, zF, armW, h - armW * 0.5, depth, 22, { tone }));
      g.add(kit.cyl(cx, y0 + h - armW * 0.52, zF, armW * 0.52, depth, { axis: 'z', seg: 28, tone }));
      g.add(kit.cyl(cx, y0 + h - armW * 0.52, zF + 1, armW * 0.34, 2, { axis: 'z', seg: 28, tone: 'lo' }));
    } else if (style === 'flared') {
      const a = armW * 0.42, b = armW * 0.56, x0 = cx, poly = [[x0 - s * a, y0], [x0 + s * a, y0], [x0 + s * b, y0 + h], [x0 - s * b + s * 0, y0 + h]];
      g.add(prism(kit, poly.map(([x, y]) => [x, y]), depth - 24, zF - 12, { tone, bevel: 12 }));
    }
  }
  return g;
}
