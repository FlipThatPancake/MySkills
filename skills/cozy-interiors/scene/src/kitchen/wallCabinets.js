// @js:kitchen-wallCabinets — four 600 mm wall cabinets, x 0..2400, y 1450..2170, 320 deep, front at z = 0.
export function wallCabinets(kit) {
  const g = kit.group();
  const Y0 = 1450, Y1 = 2170, PLINTH = 20, TRIM = 20, D = 320, W = 600;
  for (let i = 0; i < 4; i++) {
    const x0 = i * W, hingeLeft = i % 2 === 0;
    // carcass between plinth and top trim; the plinth sits 10 mm back so a shadow gap shows
    g.add(kit.box(x0, Y0 + PLINTH, -14, W, Y1 - Y0 - PLINTH - TRIM, D - 14));   // 14 mm behind the door backs
    g.add(kit.box(x0 + 8, Y0, -10, W - 16, PLINTH, D - 20));
    g.add(kit.box(x0, Y1 - TRIM, 0, W, TRIM, D));
    // door: 3 mm gaps to the carcass edges, front plane 2 mm proud
    const dx = x0 + 3, dy = Y0 + PLINTH + 3, dw = W - 6, dh = Y1 - Y0 - PLINTH - TRIM - 6;
    g.add(kit.box(dx, dy, 2, dw, dh, 18));
    // vertical bar handle near the lower corner on the free side
    const hx = hingeLeft ? dx + dw - 35 : dx + 35;
    const hy = dy + 40;
    g.add(kit.cyl(hx, hy + 15, 14, 3, 12, { axis: 'z', seg: 16 }));
    g.add(kit.cyl(hx, hy + 85, 14, 3, 12, { axis: 'z', seg: 16 }));
    g.add(kit.rbox(hx - 6, hy, 14, 12, 100, 10, 5));
  }
  return kit.merge(g);
}
