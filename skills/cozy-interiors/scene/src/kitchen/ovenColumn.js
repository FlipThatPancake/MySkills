// @js:kitchen-ovenColumn — tall oven column, 920 x 2250 x 600: two drawers below an EMPTY oven opening
// (the niche fits the oven's body, see NICHE in room.js; the oven fills it, see view3d.js) and one cupboard door above. Origin: left-front-floor corner.
export function ovenColumn(kit, niche) {   // niche: the oven's opening in the column's own mm (x from the left edge, y of its bottom in the slab's frame, w, h), see NICHE in room.js
  const g = kit.group();
  const add = (m) => { g.add(m); return m; };
  const W = 920, D = 600, T = 20;

  // plinth, recessed 50 mm
  add(kit.box(0, 0, -50, W, 100, D - 50));
  // The carcass is ONE slab: the 920 x 2150 x 600 block with the oven opening cut through it, so its top is a single seamless face like the fridge's
  // (no side, top or back panels meeting there). The opening is open at the back (the oven is deeper than the column: the back wall has a matching hole, see room.js).
  const shape = new kit.THREE.Shape(), hole = new kit.THREE.Path();
  shape.moveTo(0, 0); shape.lineTo(W, 0); shape.lineTo(W, 2150); shape.lineTo(0, 2150); shape.closePath();
  hole.moveTo(niche.x, niche.y); hole.lineTo(niche.x, niche.y + niche.h); hole.lineTo(niche.x + niche.w, niche.y + niche.h); hole.lineTo(niche.x + niche.w, niche.y); hole.closePath();
  shape.holes.push(hole);
  add(kit.solid(new kit.THREE.ExtrudeGeometry(shape, { depth: D - 15, bevelEnabled: false }), 0, 100, -D));   // front 15 mm behind the door backs

  // drawers: zone y 100..790 split evenly, 3 mm gaps, fronts 2 mm proud
  const dh = (690 - 9) / 2, fx = 3, fw = W - 6;
  [103, 103 + dh + 3].forEach((y) => {
    add(kit.box(fx, y, 2, fw, dh, 20));
    const hy = y + dh - 60;
    [-200, 200].forEach((dx) => add(kit.cyl(W / 2 + dx, hy, 32, 5, 30, { axis: 'z', seg: 16 })));
    add(kit.cyl(W / 2 - 260, hy, 32, 6, 520, { axis: 'x', seg: 16 }));
  });

  // cupboard door y 1660..2250, hinged left, bar handle on the right
  const dy = 1663, dH = 2247 - 1613;
  add(kit.box(fx, dy, 2, fw, dH, 20));
  [1760, 2160].forEach((y) => add(kit.cyl(W - 60, y, 32, 5, 30, { axis: 'z', seg: 16 })));
  add(kit.cyl(W - 60, 1760, 32, 6, 400, { axis: 'y', seg: 16 }));

  return { group: kit.merge(g) };
}
