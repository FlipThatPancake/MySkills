// @js:kitchen-hood — the cooker hood with its chimney, on the back wall above the hob. Origin: the hob unit's left-front-floor corner.
export function hood(kit) {
  const T = kit.THREE, g = kit.group();

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
