// @js:library-pots — the top of a plant pot: a rolled rim, soil dipped below it, a few specks of earth. Origin at the middle of the pot's top.
export function potTop(kit, r, { dip = 18 } = {}) {
  const T = kit.THREE, g = kit.group(), pts = [], k = Math.max(r * 0.07, 3);
  const rim = kit.solid(new T.TorusGeometry(r - k, k, 8, 36), 0, 0, 0, { smooth: true }); rim.rotation.x = Math.PI / 2; g.add(rim);
  const soil = kit.cyl(0, -dip, 0, r - 2 * k, dip, { seg: 32, tone: 'lo' }); g.add(soil);   // the soil surface sits below the rim
  for (let i = 0; i < 6; i++) { const a = i * 2.4 + 0.6, d = (r - 3 * k) * (0.25 + 0.6 * ((i * 37) % 10) / 10), x = Math.cos(a) * d, z = Math.sin(a) * d; pts.push([x - 6, 0.6, z], [x + 6, 0.6, z + 3]); }
  g.add(kit.lines(pts, 'lo'));
  return g;
}
