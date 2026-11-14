// @js:library-kitchenware — small kitchen things, drawn like the rest. Origins: the middle of the foot (jars, kettle, herbs, trolley); teaTowel at the middle of its rail on the wall face.
// jars({ n = 3 }), kettle(), herbs({ n = 3 }), trolley({ w = 650, d = 400, h = 820 }), teaTowel({ w = 480 }).
const lo = { tone: 'lo' };
export function jars(kit, { n = 3 } = {}) {   // canisters of different heights, each with a lid and a knob
  const g = kit.group(), hs = [190, 150, 220, 170];
  for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * 150, h = hs[i % hs.length]; g.add(kit.cyl(x, 0, 0, 62, h, { seg: 24 })); g.add(kit.cyl(x, h, 0, 66, 22, { seg: 24, ...lo })); g.add(kit.cyl(x, h + 22, 0, 12, 14, { seg: 12 })); }
  return kit.merge(g);
}
export function kettle(kit) {   // a stovetop kettle: tapered body, lid with a knob, a spout and an arched handle
  const T = kit.THREE, g = kit.group();
  g.add(kit.cyl(0, 0, 0, 105, 150, { rTop: 85, seg: 28 })); g.add(kit.cyl(0, 150, 0, 78, 22, { rTop: 40, seg: 28, ...lo })); g.add(kit.cyl(0, 172, 0, 14, 20, { seg: 12 }));
  const sp = kit.cyl(0, 0, 0, 24, 120, { rTop: 14, seg: 12, ...lo }); sp.position.set(112, 100, 0); sp.rotation.z = -0.9; g.add(sp);
  const arc = new T.CatmullRomCurve3([[-80, 150, 0], [-110, 215, 0], [-20, 245, 0], [60, 215, 0], [75, 150, 0]].map((p) => new T.Vector3(...p)));
  g.add(kit.solid(new T.TubeGeometry(arc, 16, 8, 8), 0, 0, 0, { smooth: true, ...lo }));
  return kit.merge(g);
}
export function herbs(kit, { n = 3 } = {}) {   // small pots of herbs in a row: short fans of leaves drawn as lines
  const g = kit.group(), pts = [];
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 120; g.add(kit.cyl(x, 0, 0, 38, 70, { rTop: 46, seg: 20, ...lo }));
    for (let k = 0; k < 7; k++) { const a = (k - 3) * 0.28 + i * 0.1, L = 90 + (k % 3) * 25; pts.push([x, 70, 0], [x + Math.sin(a) * L, 70 + Math.cos(a) * L, (k % 2 - 0.5) * 20]); }
  }
  g.add(kit.lines(pts, 'mid'));
  return kit.merge(g);
}
export function trolley(kit, { w = 650, d = 400, h = 820 } = {}) {   // a kitchen trolley: three tiers on four posts, wheels, a rail along one side
  const g = kit.group(), T = 24;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { g.add(kit.cyl(sx * (w / 2 - 25), 60, sz * (d / 2 - 25), 14, h - 60, { seg: 12 })); g.add(kit.cyl(sx * (w / 2 - 25), 0, sz * (d / 2 - 25), 30, 50, { seg: 16, ...lo })); }
  for (const y of [h - T, 380, 130]) g.add(kit.rbox(-w / 2, y, d / 2, w, T, d, 6));
  g.add(kit.cyl(-w / 2 + 25, h - 120, d / 2 - 10, 7, w - 50, { axis: 'x', seg: 12 }));
  return kit.merge(g);
}
export function teaTowel(kit, { w = 480 } = {}) {   // a rail on the wall with a tea towel folded over it; the rail is at the bottom of the piece, the cloth hangs below it
  const g = kit.group();
  for (const sx of [-1, 1]) g.add(kit.cyl(sx * (w / 2 - 20), 0, 60, 10, 60, { axis: 'z', seg: 12, ...lo }));
  g.add(kit.cyl(-w / 2, 0, 60, 10, w, { axis: 'x', seg: 14 }));
  g.add(kit.rbox(-w * 0.2, -400, 78, w * 0.4, 410, 10, 4));
  g.add(kit.rbox(-w * 0.2, -300, 66, w * 0.4, 310, 10, 4, lo));
  const pts = []; for (const y of [-60, -120, -180, -260, -320, -380]) pts.push([-w * 0.2 + 12, y, 89], [w * 0.2 - 12, y, 89]);   // woven stripes so the cloth reads against the wall
  g.add(kit.lines(pts, 'mid'));
  return kit.merge(g);
}
