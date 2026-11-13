// @js:kitchen-hob — 900 wide gas hob set into the counter (y 900): its glass slab sinks 8 mm into the worktop. Origin: the hob unit's left-front-floor corner.
export function hob(kit) {
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

  return kit.merge(g);
}
