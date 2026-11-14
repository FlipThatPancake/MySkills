// @js:library-decor — small things that make a corner worth looking at: soft pieces, things that live, things on walls, drawn like the rest (plain solids, soft outlines, real millimetres).
// Origins: floor pieces (sideTable, roundTable, cat, basket, pouf) have it in the middle of the footprint on the floor, front toward +z; pieces that stand on something (cushion, vase, bookStack) at the middle of their foot;
// wall pieces (mirror, wallShelf) at the bottom middle on the wall face, standing out toward +z.
// floorPlant({ h = 950 }), cushion({ w = 440, h = 420, tone }), vase({ h = 280, stems = 5, seed }), bookStack({ n = 4, seed }), mirror({ w = 700, h = 1000, shape: 'arch' | 'round' | 'pill' }), wallShelf({ w = 900, seed }),
// sideTable({ r = 230, h = 520 }), roundTable({ r = 650, h = 750 }), cat({ pose: "sit" | "curl" | "loaf", scale = 1 }), basket({ r = 230, h = 320 }), pouf({ r = 280, h = 380 }).
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
export function cat(kit, { pose = 'sit', scale = 1 } = {}) {   // a cat: 'sit' upright with haunches, front legs and a tail round the feet; 'curl' asleep in a ring with its head on its tail
  const T = kit.THREE, g = kit.group(), V = (x, y, z) => new T.Vector3(x, y, z);
  const sph = (rx, ry, rz, x, y, z, o = {}, rot) => { const ge = new T.SphereGeometry(1, 24, 16); ge.scale(rx, ry, rz); const m = kit.solid(ge, x, y, z, { smooth: true, ...o }); if (rot) m.rotation.set(...rot); return m; };
  const ear = (x, y, z, tilt) => { const m = kit.cyl(x, y, z, 24, 55, { rTop: 0, seg: 4, ...lo }); m.rotation.z = tilt; return m; };
  const tube = (pts, r) => { const t = kit.group(); t.add(kit.solid(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map((p) => V(...p))), 20, r, 8), 0, 0, 0, { smooth: true, ...lo })); const e = pts[pts.length - 1]; t.add(sph(r, r, r, e[0], e[1], e[2], lo)); return t; };
  if (pose === 'curl') {
    const body = sph(210, 95, 170, 0, 95, 0); g.add(body);                                             // the curled body
    g.add(sph(78, 66, 80, 90, 85, 170));                                                              // the head resting forward
    g.add(ear(48, 140, 165, 0.3)); g.add(ear(128, 140, 165, -0.3));
    g.add(tube([[-170, 30, 60], [-120, 30, 200], [40, 28, 250], [170, 28, 210], [230, 28, 110]], 26));   // the tail round the front
  } else {
    g.add(sph(105, 175, 125, 0, 200, -20, {}, [-0.12, 0, 0]));                                          // the chest and body, leaning back a little
    for (const s of [-1, 1]) { g.add(sph(60, 100, 120, s * 85, 100, -45)); g.add(kit.cyl(s * 44, 0, 58, 34, 195, { rTop: 30, seg: 14 })); g.add(sph(30, 16, 48, s * 42, 16, 110, lo)); }   // haunches, front legs, paws
    g.add(sph(78, 72, 76, 0, 375, 30));                                                                // the head
    g.add(ear(-42, 420, 28, 0.18)); g.add(ear(42, 420, 28, -0.18));
    g.add(tube([[70, 32, -110], [175, 34, -70], [200, 36, 60], [120, 32, 150]], 24));                  // the tail curled round the feet
  }
  const m = kit.merge(g); if (scale !== 1) m.scale.setScalar(scale); return m;
}
export function floorPlant(kit, { h = 950, seed = 6 } = {}) {   // a large pot with tall stems and broad leaves, about 950 mm high
  const T = kit.THREE, g = kit.group(), R = rnd(seed), pts = [];
  g.add(kit.cyl(0, 0, 0, 170, 380, { rTop: 215, seg: 32, ...lo })); g.add(kit.cyl(0, 380, 0, 215, 26, { seg: 32 }));
  for (let k = 0; k < 9; k++) {
    const a = k / 9 * Math.PI * 2 + R(), lean = 0.25 + R() * 0.45, len = h - 380 - 80 - R() * 260, sx = Math.sin(a) * Math.sin(lean), sz = Math.cos(a) * Math.sin(lean), cy = Math.cos(lean);
    let px = 0, py = 400, pz = 0; const n = 6;
    for (let i = 1; i <= n; i++) { const t = i / n, nx = sx * len * t * t * 0.9 + 0, nz = sz * len * t * t * 0.9, ny = 400 + cy * len * t; pts.push([px, py, pz], [nx, ny, nz]); px = nx; py = ny; pz = nz; }
    const ge = new T.SphereGeometry(1, 16, 10); ge.scale(70 + R() * 30, 150 + R() * 50, 14);
    const leaf = kit.solid(ge, px, py + 60, pz, { smooth: true }); leaf.rotation.set(Math.cos(a) * lean * 0.9, 0, -Math.sin(a) * lean * 0.9); g.add(leaf);
  }
  g.add(kit.lines(pts, 'mid'));
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
