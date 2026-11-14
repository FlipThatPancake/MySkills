// @js:library-decor — small things that make a corner worth looking at: soft pieces, things that live, things on walls, drawn like the rest (plain solids, soft outlines, real millimetres).
// Origins: floor pieces (sideTable, roundTable, cat, basket, pouf) have it in the middle of the footprint on the floor, front toward +z; pieces that stand on something (cushion, vase, bookStack) at the middle of their foot;
// wall pieces (mirror, wallShelf) at the bottom middle on the wall face, standing out toward +z.
// cushion({ w = 440, h = 420, tone }), vase({ h = 280, stems = 5, seed }), bookStack({ n = 4, seed }), mirror({ w = 700, h = 1000, shape: 'arch' | 'round' | 'pill' }), wallShelf({ w = 900, seed }),
// sideTable({ r = 230, h = 520 }), roundTable({ r = 650, h = 750 }), cat({ pose: 'sit' | 'loaf' }), basket({ r = 230, h = 320 }), pouf({ r = 280, h = 380 }).
const rnd = (seed) => { let r = (seed || 1) * 9301 + 49297; return () => { r = (r * 9301 + 49297) % 233280; return r / 233280; }; };
const lo = { tone: 'lo' };

export function cushion(kit, { w = 440, h = 420, tone = 'mid' } = {}) {   // a square pillow standing on its edge; lean it with the scene's turn or a tilt in params
  const g = kit.group(), D = 120;
  g.add(kit.rbox(-w / 2, 0, D / 2, w, h, D, 70, { tone }));
  g.add(kit.lines([[-w / 2 + 40, 18, D / 2 + 1], [w / 2 - 40, h - 18, D / 2 + 1], [w / 2 - 40, 18, D / 2 + 1], [-w / 2 + 40, h - 18, D / 2 + 1]], 'lo'));
  return kit.merge(g);
}
export function vase(kit, { h = 280, stems = 5, seed = 3 } = {}) {   // a bottle vase with branches: thin curved lines with a few leaves
  const g = kit.group(), R = rnd(seed), pts = [];
  g.add(kit.cyl(0, 0, 0, 70, h * 0.62, { rTop: 80, seg: 24 })); g.add(kit.cyl(0, h * 0.62, 0, 80, h * 0.38, { rTop: 30, seg: 24 }));
  for (let s = 0; s < stems; s++) {
    const lean = (s - (stems - 1) / 2) * 0.24 + (R() - 0.5) * 0.14, len = 420 + R() * 380;
    let x = 0, y = h, z = 0, a = lean; const n = 7;
    for (let i = 1; i <= n; i++) {
      const nx = x + Math.sin(a) * len / n, ny = y + Math.cos(a) * len / n; pts.push([x, y, z], [nx, ny, z]);
      if (i > 2 && i % 2 === 1) { const side = i % 4 === 1 ? 1 : -1; pts.push([nx, ny, z], [nx + side * 52, ny + 26, z], [nx + side * 52, ny + 26, z], [nx + side * 10, ny + 62, z]); }
      x = nx; y = ny; a += 0.05;
    }
  }
  g.add(kit.lines(pts, 'mid'));
  return kit.merge(g);
}
export function bookStack(kit, { n = 4, seed = 5 } = {}) {   // books lying on each other, each turned a little; the top one a thin paperback
  const g = kit.group(), R = rnd(seed); let y = 0;
  for (let i = 0; i < n; i++) {
    const w = 240 - i * 14 + R() * 20, d = 170 - i * 8, th = i === n - 1 ? 18 : 28 + R() * 20, m = kit.box(-w / 2, y, d / 2, w, th, d, i % 2 ? lo : {});
    m.rotation.y = (R() - 0.5) * 0.34; g.add(m); y += th;
  }
  return kit.merge(g);
}
export function mirror(kit, { w = 700, h = 1000, shape = 'arch' } = {}) {
  const g = kit.group(), F = 30, D = 26, pts = [];
  if (shape === 'round') { const r = w / 2; g.add(kit.cyl(0, r, D, r, D, { axis: 'z', seg: 48 })); g.add(kit.cyl(0, r, D + 4, r - F, 4, { axis: 'z', seg: 48, ...lo })); h = w; }
  else { const r = shape === 'pill' ? w / 2 : 90; g.add(kit.rbox(-w / 2, 0, D, w, h, D, shape === 'arch' ? w / 2 : r)); g.add(kit.rbox(-w / 2 + F, F, D + 3, w - 2 * F, h - 2 * F, 3, shape === 'arch' ? w / 2 - F : r - F, lo)); }
  const cy = h * 0.5, z = D + 5;   // two short glints on the glass
  pts.push([-w * 0.16, cy + h * 0.2, z], [w * 0.06, cy + h * 0.32, z], [-w * 0.2, cy + h * 0.1, z], [-w * 0.04, cy + h * 0.2, z]);
  g.add(kit.lines(pts, 'mid'));
  return kit.merge(g);
}
export function wallShelf(kit, { w = 900, seed = 4 } = {}) {   // a floating board with a row of books, a pot and a bowl
  const g = kit.group(), R = rnd(seed), T = 30, D = 230;
  g.add(kit.rbox(-w / 2, 0, D, w, T, D, 6));
  let x = -w / 2 + 40; const end = -w / 2 + w * 0.5;
  while (x < end) { const bw = 26 + R() * 20, bh = 150 + R() * 100; g.add(kit.box(x, T, D - 40, bw, bh, D - 80, lo)); x += bw + 2; }
  g.add(kit.cyl(w * 0.2, T, D / 2, 52, 110, { rTop: 66, seg: 20, ...lo })); g.add(kit.cyl(w * 0.38, T, D / 2, 70, 56, { rTop: 84, seg: 24 }));
  return kit.merge(g);
}
export function sideTable(kit, { r = 230, h = 520 } = {}) {
  const g = kit.group();
  g.add(kit.cyl(0, h - 28, 0, r, 28, { seg: 36 }));
  for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3 + 0.5; g.add(kit.cyl(Math.cos(a) * r * 0.62, 0, Math.sin(a) * r * 0.62, 14, h - 28, { rTop: 11, seg: 10, ...lo })); }
  g.add(kit.cyl(0, 150, 0, r * 0.78, 18, { seg: 32, ...lo }));
  return kit.merge(g);
}
export function roundTable(kit, { r = 650, h = 750 } = {}) {
  const g = kit.group();
  g.add(kit.cyl(0, h - 36, 0, r, 36, { seg: 48 }));
  g.add(kit.cyl(0, 30, 0, 70, h - 66, { rTop: 56, seg: 24, ...lo })); g.add(kit.cyl(0, 0, 0, 280, 30, { rTop: 250, seg: 32 }));
  return kit.merge(g);
}
export function cat(kit, { pose = 'sit' } = {}) {   // a sitting cat seen from the front-left: body, head, ears, a tail curled round the feet
  const T = kit.THREE, g = kit.group(), sph = (rx, ry, rz, x, y, z, o) => { const ge = new T.SphereGeometry(1, 20, 14); ge.scale(rx, ry, rz); return kit.solid(ge, x, y, z, { smooth: true, ...o }); };
  if (pose === 'loaf') {
    g.add(sph(125, 100, 210, 0, 100, -20)); g.add(sph(80, 74, 78, 0, 150, 175));
    for (const s of [-1, 1]) g.add(kit.cyl(s * 46, 200, 175, 24, 58, { rTop: 0, seg: 4, ...lo }));
    for (const s of [-1, 1]) g.add(sph(36, 22, 60, s * 52, 22, 255, lo));
  } else {
    g.add(sph(105, 150, 125, 0, 150, -20)); g.add(sph(78, 72, 78, 0, 330, 20));
    for (const s of [-1, 1]) { g.add(kit.cyl(s * 48, 380, 15, 24, 62, { rTop: 0, seg: 4, ...lo })); g.add(sph(34, 14, 60, s * 52, 14, 110, lo)); }
  }
  const curve = new T.CatmullRomCurve3(pose === 'loaf' ? [[0, 50, -170], [150, 40, -150], [190, 36, -40]].map((p) => new T.Vector3(...p)) : [[60, 40, -100], [170, 34, -60], [190, 32, 70], [110, 30, 130]].map((p) => new T.Vector3(...p)));
  g.add(kit.solid(new T.TubeGeometry(curve, 14, 24, 8), 0, 0, 0, lo));
  return kit.merge(g);
}
export function basket(kit, { r = 230, h = 320 } = {}) {   // a woven basket with a blanket folded over the rim
  const g = kit.group(), pts = [];
  g.add(kit.cyl(0, 0, 0, r * 0.88, h, { rTop: r, seg: 36, ...lo }));
  for (const f of [0.3, 0.55, 0.8]) { const rr = r * (0.88 + 0.12 * f) + 1, n = 36; for (let i = 0; i < n; i++) { const a = i / n * 6.2832, b = (i + 1) / n * 6.2832; pts.push([Math.cos(a) * rr, h * f, Math.sin(a) * rr], [Math.cos(b) * rr, h * f, Math.sin(b) * rr]); } }
  g.add(kit.lines(pts, 'mid'));
  const b1 = kit.rbox(-r * 0.75, h - 30, r * 0.5, r * 1.1, 130, r * 1.0, 55), b2 = kit.rbox(-r * 0.15, h - 10, r * 0.55, r * 0.95, 110, r * 0.9, 50);   // a blanket, two soft folds
  b1.rotation.y = 0.25; b2.rotation.y = -0.3; g.add(b1, b2);
  return kit.merge(g);
}
export function pouf(kit, { r = 280, h = 380 } = {}) {
  const g = kit.group(), pts = [], n = 36;
  g.add(kit.cyl(0, 0, 0, r * 0.94, h * 0.7, { rTop: r, seg: 36 })); g.add(kit.cyl(0, h * 0.7, 0, r, h * 0.3, { rTop: r * 0.82, seg: 36 }));
  for (let i = 0; i < n; i++) { const a = i / n * 6.2832, b = (i + 1) / n * 6.2832, rr = r * 0.6; pts.push([Math.cos(a) * rr, h + 0.5, Math.sin(a) * rr], [Math.cos(b) * rr, h + 0.5, Math.sin(b) * rr]); }
  g.add(kit.lines(pts, 'lo'));
  return kit.merge(g);
}
