// @js:kitchen-builtinOven — a stand-in built-in oven in the kitchen's own look, for the oven column's niche.
// The oven prototype puts its realistic Blender oven here instead; this file keeps the scene whole without it.
// 880 x 854 mm front frame centred on (cx, cy), front at z = 4; the body reaches `depth` mm back into the niche.
export function builtinOven(kit, { cx, cy, nicheW, nicheH, depth = 560 }) {
  const g = kit.group();
  const W = 880, H = 854, x0 = cx - W / 2, y0 = cy - H / 2, F = 140;   // F: control fascia height at the top
  g.add(kit.box(cx - nicheW / 2 + 4, cy - nicheH / 2 + 4, -20, nicheW - 8, nicheH - 8, depth - 20));   // the body, in the niche
  g.add(kit.box(x0, y0 + H - F, 4, W, F, 19));   // 19 deep, so its back sits on the column's face (z -15)                                                         // control fascia
  g.add(kit.box(x0 + W / 2 - 90, y0 + H - F / 2 - 22, 6, 180, 44, 2, { tone: 'lo' }));                  // display window
  [x0 + 110, x0 + W - 110].forEach((x) => g.add(kit.cyl(x, y0 + H - F / 2, 6, 28, 22, { axis: 'z', seg: 24 })));   // two knobs
  g.add(kit.box(x0, y0, 4, W, H - F - 4, 19));                                                         // door
  g.add(kit.box(x0 + 90, y0 + 90, 6, W - 180, H - F - 4 - 220, 2, { tone: 'lo' }));                     // door window
  const hy = y0 + H - F - 4 - 60;
  [x0 + 120, x0 + W - 120].forEach((x) => g.add(kit.cyl(x, hy, 4 + 24 + 30 - 10, 6, 30, { axis: 'z', seg: 16 })));   // handle posts
  g.add(kit.cyl(x0 + 100, hy, 4 + 24 + 30, 10, W - 200, { axis: 'x', seg: 16 }));                       // bar handle
  return g;
}
