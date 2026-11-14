// @js:library-living — furniture for a living corner and a dining room, drawn like the kitchen: plain solids with soft outlines, real millimetres, resting on real feet.
// Floor pieces have their origin in the middle of the footprint on the floor and their front toward +z (turn them to face a wall or each other);
// wall pieces (picture, curtain) have it at the bottom middle, on the wall face, standing out toward +z.
// sofa({ seats = 3, w, d = 900 }), armchair({ w = 880, d = 860 }), coffeeTable({ w = 1000, d = 600, h = 380 }), rug({ w = 2400, d = 1700, border = 70 }), shelf({ w = 800, h = 1800, d = 320, shelves = 5, seed }),
// floorLamp({ h = 1650 }), picture({ w = 600, h = 800, seed }), sideboard({ w = 1600, h = 800, d = 420, doors = 3 }), stool({ h = 650 }), bench({ w = 1200, d = 380, h = 450 }), curtain({ w = 1500, h = 2300, panels = 2 }).
const rnd = (seed) => { let r = (seed || 1) * 9301 + 49297; return () => { r = (r * 9301 + 49297) % 233280; return r / 233280; }; };
const lo = { tone: 'lo' };

function boxes(kit) {   // boxes by their middle (x, z) and bottom (y), not by a corner
  return {
    bx: (cx, y, cz, w, h, d, o) => kit.box(cx - w / 2, y, cz + d / 2, w, h, d, o),
    rb: (cx, y, cz, w, h, d, r, o) => kit.rbox(cx - w / 2, y, cz + d / 2, w, h, d, r, o),
  };
}
function seat(kit, { seats, w, d, arm = 200, backTop = 800 }) {
  const { bx, rb } = boxes(kit), g = kit.group(), inner = w - 2 * arm, cw = inner / seats;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(kit.cyl(sx * (w / 2 - 70), 0, sz * (d / 2 - 70), 24, 110, { seg: 14, ...lo }));   // feet
  g.add(rb(0, 110, 0, w, 150, d, 12));                                                                                                           // the base
  for (const sx of [-1, 1]) g.add(rb(sx * (w / 2 - arm / 2), 110, 0, arm, 500, d, 36));                                                          // the arms
  g.add(rb(0, 260, -d / 2 + 110, inner, backTop - 260, 220, 40));                                                                                // the back
  for (let i = 0; i < seats; i++) {
    const cx = -inner / 2 + cw * (i + 0.5);
    g.add(rb(cx, 260, 110, cw - 6, 170, d - 220, 26));                                                                                           // seat cushion
    g.add(rb(cx, 430, -d / 2 + 245, cw - 20, 330, 160, 34, lo));                                                                                 // back cushion
  }
  return kit.merge(g);
}
export const sofa = (kit, { seats = 3, w, d = 900 } = {}) => seat(kit, { seats, w: w || (seats === 2 ? 1650 : 2100), d });
export const armchair = (kit, { w = 880, d = 860 } = {}) => seat(kit, { seats: 1, w, d, arm: 170, backTop: 820 });

export function coffeeTable(kit, { w = 1000, d = 600, h = 380 } = {}) {
  const { bx, rb } = boxes(kit), g = kit.group(), TT = 30;
  g.add(rb(0, h - TT, 0, w, TT, d, 10));
  g.add(rb(0, 120, 0, w - 160, 22, d - 140, 6, lo));   // a low shelf
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(bx(sx * (w / 2 - 70), 0, sz * (d / 2 - 60), 44, h - TT, 44));
  return kit.merge(g);
}
export function rug(kit, { w = 2400, d = 1700, border = 70 } = {}) {
  const { rb } = boxes(kit), g = kit.group(), T = 7, y = T + 0.4, pts = [];
  g.add(rb(0, 0, 0, w, T, d, 24, lo));
  const rect = (i) => { const x = w / 2 - i, z = d / 2 - i, c = [[-x, y, z], [x, y, z], [x, y, -z], [-x, y, -z]]; for (let k = 0; k < 4; k++) pts.push(c[k], c[(k + 1) % 4]); };
  rect(border); rect(border + 28);
  g.add(kit.lines(pts, 'mid'));
  return kit.merge(g);
}
export function shelf(kit, { w = 800, h = 1800, d = 320, shelves = 5, seed = 3 } = {}) {
  const { bx } = boxes(kit), g = kit.group(), R = rnd(seed), T = 22, P = 90;
  g.add(bx(-w / 2 + T / 2, 0, 0, T, h, d)); g.add(bx(w / 2 - T / 2, 0, 0, T, h, d));                // the sides
  g.add(bx(0, 0, -d / 2 + 6, w - 2 * T, h, 12, lo));                                                    // the back
  const ys = []; for (let i = 0; i <= shelves; i++) ys.push(P + (h - P - T) * i / shelves);
  ys.forEach((y) => g.add(bx(0, y, 0, w - 2 * T, T, d - 4)));
  g.add(bx(0, 0, 8, w - 2 * T, P, d - 30, lo));                                                          // the plinth, set back
  for (let s = 1; s < shelves; s++) {   // books on some shelves: spines of mixed heights, one leaning, a pot at the end of the third
    const y = ys[s] + T, gap = ys[s + 1] - y - T;
    if (s % 2 === 1) {
      let x = -w / 2 + T + 20; const end = w / 2 - T - 120;
      while (x < end) { const bw = 24 + R() * 22, bh = Math.min(gap - 30, 170 + R() * 90); g.add(bx(x + bw / 2, y, 0, bw, bh, d - 90, lo)); x += bw + 2; }
    } else if (s === 2) {
      g.add(kit.cyl(w / 2 - T - 90, y, 0, 52, 120, { rTop: 66, seg: 20, ...lo })); g.add(kit.cyl(-w / 2 + T + 110, y, 0, 70, 90, { seg: 20, ...lo }));
    }
  }
  return kit.merge(g);
}
export function floorLamp(kit, { h = 1650 } = {}) {
  const g = kit.group();
  g.add(kit.cyl(0, 0, 0, 150, 18, { seg: 32, ...lo }));
  g.add(kit.cyl(0, 18, 0, 11, h - 290, { seg: 14, ...lo }));
  g.add(kit.cyl(0, h - 290, 0, 190, 260, { rTop: 130, seg: 32 }));
  return kit.merge(g);
}
export function picture(kit, { w = 600, h = 800, seed = 2 } = {}) {
  const g = kit.group(), R = rnd(seed), F = 28, D = 24, pts = [];
  g.add(kit.rbox(-w / 2, 0, D, w, h, D, 4));                                                             // the frame
  g.add(kit.box(-w / 2 + F, F, D + 2, w - 2 * F, h - 2 * F, 2, lo));                                     // the mat
  const x0 = -w / 2 + F + 36, x1 = w / 2 - F - 36, y0 = F + 36, y1 = h - F - 36, z = D + 4.5;
  for (let k = 0; k < 3; k++) {                                                                          // soft hills and a sun, drawn as lines
    let px = x0, py = y0 + (y1 - y0) * (0.18 + 0.2 * k);
    for (let i = 1; i <= 12; i++) { const nx = x0 + (x1 - x0) * i / 12, ny = y0 + (y1 - y0) * (0.18 + 0.2 * k) + Math.sin(i * 0.8 + R() * 2 + k) * (y1 - y0) * 0.05; pts.push([px, py, z], [nx, ny, z]); px = nx; py = ny; }
  }
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, b = (i + 1) / 24 * Math.PI * 2, cx = x1 - (x1 - x0) * 0.22, cy = y1 - (y1 - y0) * 0.16, r = (x1 - x0) * 0.09; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a), z], [cx + r * Math.cos(b), cy + r * Math.sin(b), z]); }
  g.add(kit.lines(pts, 'mid'));
  return kit.merge(g);
}
export function sideboard(kit, { w = 1600, h = 800, d = 420, doors = 3 } = {}) {
  const { bx, rb } = boxes(kit), g = kit.group(), L = 150, pts = [], z = d / 2 + 0.6, bw = w - 40;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(kit.cyl(sx * (w / 2 - 80), 0, sz * (d / 2 - 60), 22, L, { rTop: 16, seg: 12, ...lo }));   // tapered legs
  g.add(rb(0, L, 0, bw, h - L - 22, d - 20, 6));                                                         // the carcass
  g.add(rb(0, h - 22, 0, w, 22, d, 6));                                                                  // the top, overhanging
  const cw = bw / doors;
  for (let i = 0; i < doors; i++) {
    const x0 = -bw / 2 + i * cw + 12, x1 = -bw / 2 + (i + 1) * cw - 12, y0 = L + 18, y1 = h - 22 - 18;
    for (const [a, b] of [[[x0, y0], [x1, y0]], [[x1, y0], [x1, y1]], [[x1, y1], [x0, y1]], [[x0, y1], [x0, y0]]]) pts.push([a[0], a[1], z], [b[0], b[1], z]);
    const hx = i % 2 === 0 ? x1 - 36 : x0 + 36; g.add(kit.cyl(hx, (y0 + y1) / 2 - 30, z - 4, 7, 60, { axis: 'z', seg: 10, ...lo }));
  }
  g.add(kit.lines(pts, 'lo'));
  return kit.merge(g);
}
export function bench(kit, { w = 1200, d = 380, h = 450 } = {}) {
  const { bx, rb } = boxes(kit), g = kit.group(), TT = 40;
  g.add(rb(0, h - TT, 0, w, TT, d, 8));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(bx(sx * (w / 2 - 70), 0, sz * (d / 2 - 50), 46, h - TT, 46));
  g.add(bx(0, 120, 0, w - 200, 30, 36, lo));
  return kit.merge(g);
}
export function stool(kit, { h = 650 } = {}) {   // a bar stool: round seat, four legs, a foot ring
  const g = kit.group();
  for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; g.add(kit.cyl(Math.cos(a) * 130, 0, Math.sin(a) * 130, 15, h - 40, { seg: 10, ...lo })); }
  g.add(kit.cyl(0, 250, 0, 172, 14, { seg: 32, ...lo }));
  g.add(kit.cyl(0, h - 40, 0, 190, 40, { seg: 32 }));
  return kit.merge(g);
}
export function curtain(kit, { w = 1500, h = 2300, panels = 2 } = {}) {
  const T = kit.THREE, g = kit.group(), pw = w * 0.22, N = 9, A = 34, TH = 14, ROD = h + 70;
  g.add(kit.cyl(-w / 2 - 70, ROD, 90, 12, w + 140, { axis: 'x', seg: 14, ...lo }));
  for (const sx of [-1, 1]) g.add(kit.cyl(sx * (w / 2 + 80), ROD, 90, 22, 30, { seg: 12, ...lo }));   // finials
  const sheet = (x0) => {   // a folded panel: a zigzag seen from above, extruded up from just above the floor to the rod
    const front = [], back = [];
    for (let i = 0; i <= N; i++) { const x = x0 + pw * i / N, z = 60 + (i % 2 ? A : 0); front.push([x, z]); back.push([x, z + TH]); }
    const pts = [...front, ...back.reverse()], sh = new T.Shape(pts.map(([x, z]) => new T.Vector2(x, -z)));
    const m = kit.solid(new T.ExtrudeGeometry(sh, { depth: ROD - 30, bevelEnabled: false }), 0, 40, 0, { tone: 'mid' });
    m.rotation.x = -Math.PI / 2; return m;
  };
  g.add(sheet(-w / 2 - 40));
  if (panels > 1) g.add(sheet(w / 2 + 40 - pw));
  return kit.merge(g);
}
