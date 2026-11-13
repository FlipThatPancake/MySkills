// @js:kitchen-hobHood — 900 wide gas hob on the counter (y 900) and the hood with chimney above it.
export function hobHood(kit) {
  const T = kit.THREE, g = kit.group();

  // ---- hob: 900 x 520 slab, 16 mm with rolled edge, front edge z -50
  const top = 908, plateZ = -50;
  // a glass slab whose edge rolls down to the counter: a bevel extruded flat, only its silhouette outlined
  const slabShape = new T.Shape(), W = 882, D = 502, R = 30;
  slabShape.moveTo(R, 0); slabShape.lineTo(W - R, 0); slabShape.absarc(W - R, R, R, -Math.PI / 2, 0, false);
  slabShape.lineTo(W, D - R); slabShape.absarc(W - R, D - R, R, 0, Math.PI / 2, false);
  slabShape.lineTo(R, D); slabShape.absarc(R, D - R, R, Math.PI / 2, Math.PI, false);
  slabShape.lineTo(0, R); slabShape.absarc(R, R, R, Math.PI, Math.PI * 1.5, false);
  const slab = kit.solid(new T.ExtrudeGeometry(slabShape, { depth: 0.01, bevelEnabled: true, bevelThickness: 8, bevelSize: 9, bevelOffset: 0, bevelSegments: 8, curveSegments: 16 }),
    9, 900, plateZ - 9, { smooth: true, smoothShade: true, crease: 80, tone: 'mid' });
  slab.rotation.x = -Math.PI / 2;
  g.add(slab);
  const burners = [[225, -200, 1], [675, -200, 0.8], [225, -440, 0.8], [675, -440, 1]];
  for (const [bx, bz, s] of burners) {
    g.add(kit.cyl(bx, top, bz, 52 * s, 5, { seg: 24 }));
    g.add(kit.cyl(bx, top + 5, bz, 40 * s, 9, { seg: 24 }));
    g.add(kit.cyl(bx, top + 14, bz, 28 * s, 6, { seg: 24 }));
    g.add(kit.cyl(bx, top + 20, bz, 12 * s, 3, { seg: 20 }));
    // pan-support grate: frame, cross bars, feet
    const h = 100, y0 = top + 26, b = 6;
    g.add(kit.box(bx - h, y0, bz + h, 2 * h, b, b));
    g.add(kit.box(bx - h, y0, bz - h + b, 2 * h, b, b));
    g.add(kit.box(bx - h, y0, bz + h - b, b, b, 2 * h - b));
    g.add(kit.box(bx + h - b, y0, bz + h - b, b, b, 2 * h - b));
    g.add(kit.box(bx - b / 2, y0, bz + h - b, b, b, 2 * h - 2 * b));
    g.add(kit.box(bx - h + b, y0, bz + b / 2, 2 * h - 2 * b, b, b));
    for (const [fx, fz] of [[-h, h], [h - b, h], [-h, -h + b + b], [h - b, -h + b + b]])
      g.add(kit.box(bx + fx, top, bz + fz, b, 26, b));
  }
  // five control knobs along the front edge, each with a pointer line
  const kp = [];
  for (let i = 0; i < 5; i++) {
    const kx = 90 + i * 180, kz = -78, kh = 20;
    g.add(kit.cyl(kx, top, kz, 22, 6, { seg: 24 }));
    g.add(kit.cyl(kx, top + 6, kz, 18, kh, { seg: 24, rTop: 16 }));
    kp.push([kx, top + 6 + kh + 0.5, kz], [kx, top + 6 + kh + 0.5, kz + 16]);
  }
  g.add(kit.lines(kp));

  // ---- hood: canopy underside y 1500, 900 x 500 (z -100..-600), chimney 300 x 300 to y 2250
  // side profile (depth s from the canopy front, y); extruded 900 along x
  const sh = new T.Shape();
  sh.moveTo(0, 1500); sh.lineTo(500, 1500); sh.lineTo(500, 1650); sh.lineTo(200, 1650); sh.lineTo(0, 1565); sh.lineTo(0, 1500);
  const geo = new T.ExtrudeGeometry(sh, { depth: 900, bevelEnabled: false });
  const canopy = kit.solid(geo, 0, 0, -100);
  canopy.rotation.y = Math.PI / 2;
  g.add(canopy);
  g.add(kit.box(300, 1650, -300, 300, 600, 300));          // chimney
  g.add(kit.box(0, 1500, -90, 900, 30, 20));                // front lower lip (proud 10 mm)
  g.add(kit.box(30, 1536, -96, 840, 22, 4));                // control strip
  g.add(kit.cyl(790, 1547, -92, 7, 4, { axis: 'z', seg: 20 }));   // two buttons
  g.add(kit.cyl(830, 1547, -92, 7, 4, { axis: 'z', seg: 20 }));
  // filter panel on the underside
  const fy = 1499.5, L = [];
  const fx0 = 120, fx1 = 780, fz0 = -170, fz1 = -520;
  L.push([fx0, fy, fz0], [fx1, fy, fz0], [fx1, fy, fz0], [fx1, fy, fz1], [fx1, fy, fz1], [fx0, fy, fz1], [fx0, fy, fz1], [fx0, fy, fz0]);
  for (let i = 1; i < 7; i++) { const z = fz0 + (fz1 - fz0) * i / 7; L.push([fx0 + 20, fy, z], [fx1 - 20, fy, z]); }
  L.push([420, fy, fz0 + 12], [480, fy, fz0 + 12]);
  g.add(kit.lines(L));

  return kit.merge(g);
}
