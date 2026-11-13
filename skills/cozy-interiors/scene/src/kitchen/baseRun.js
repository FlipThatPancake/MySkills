// @js:kitchen-baseRun — L-shaped base run: main run (corner, sink, drawers, hob units) plus a return toward the camera, under one L countertop.
// Origin: left-front-floor corner of the main run; x 0..3300, front at z = 0, wall at z = -600; the return reaches to z = +1500. Hob and oven are other elements.
export function baseRun(kit) {
  const T = kit.THREE;
  const g = kit.group();
  const add = (m, p = g) => (p.add(m), m);

  const D = 600, PL = 100, TOP = 860, CT = 900, FD = 18, RX = 600, RZ = 1500, MX = 3300;
  // Sink basin 500 x 400, 180 deep, in the main counter.
  const BX0 = 1150, BX1 = 1650, BZ0 = -50, BZ1 = -450, BY = CT - 180;

  // Extruded flat polygon of (x, z) points, with optional hole; bottom at y.
  const slab = (pts, hole, y, h) => {
    const s = new T.Shape();
    pts.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
    s.closePath();
    if (hole) {
      const ph = new T.Path();
      hole.forEach(([x, z], i) => (i ? ph.lineTo(x, -z) : ph.moveTo(x, -z)));
      ph.closePath();
      s.holes.push(ph);
    }
    const m = kit.solid(new T.ExtrudeGeometry(s, { depth: h, bevelEnabled: false }), 0, y, 0);
    m.rotation.x = -Math.PI / 2;
    return add(m);
  };
  const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];

  // Plinth (recessed 50), carcass (one L with the basin space punched through), countertop (one L with the basin cut).
  slab([[50, -D], [MX - 50, -D], [MX - 50, -50], [RX - 50, -50], [RX - 50, RZ - 50], [50, RZ - 50]], null, 0, PL);
  // The holes in the carcass and the countertop are a few mm wider than the basin, so the basin's own walls are the only surface in the opening (no two faces in one plane).
  const GAP = 4;
  const CR = 15;   // the carcass front sits 15 mm behind the door backs, so its lines are never within a pixel of a door face at a distance
  slab([[0, -D], [MX, -D], [MX, -CR], [RX - CR, -CR], [RX - CR, RZ], [0, RZ]], rect(BX0 - GAP, BZ0 + GAP, BX1 + GAP, BZ1 - GAP), PL, TOP - PL);
  slab([[-10, -D], [MX + 10, -D], [MX + 10, 20], [RX + 20, 20], [RX + 20, RZ + 20], [-10, RZ + 20]],
    rect(BX0 - GAP, BZ0 + GAP, BX1 + GAP, BZ1 - GAP), TOP, CT - TOP);

  // Basin: four walls, floor, drain.
  const t = 3, cx = (BX0 + BX1) / 2, cz = (BZ0 + BZ1) / 2;
  add(kit.box(BX0, BY, BZ0, BX1 - BX0, CT - BY, t));
  add(kit.box(BX0, BY, BZ1 + t, BX1 - BX0, CT - BY, t));
  add(kit.box(BX0, BY, BZ0 - t, t, CT - BY, BZ0 - BZ1 - 2 * t));
  add(kit.box(BX1 - t, BY, BZ0 - t, t, CT - BY, BZ0 - BZ1 - 2 * t));
  add(kit.box(BX0 + t, BY, BZ0 - t, BX1 - BX0 - 2 * t, t, BZ0 - BZ1 - 2 * t));
  add(kit.cyl(cx, BY + t, cz, 32, 2, { seg: 24 }));
  add(kit.cyl(cx, BY + t + 2, cz, 24, 1, { seg: 24 }));
  const gl = BY + t + 3.2;
  add(kit.lines([[cx - 24, gl, cz, cx + 24, gl, cz], [cx, gl, cz - 24, cx, gl, cz + 24]]));

  // Fronts and handles in a local frame (u right, front face at z = +2), so the return can reuse them.
  const hbar = (p, cx, y, len) => {
    add(kit.cyl(cx - len / 2, y, 30, 6, len, { axis: 'x', seg: 16 }), p);
    [-1, 1].forEach(k => add(kit.cyl(cx + k * (len / 2 - 20), y, 30, 4, 28, { axis: 'z', seg: 12 }), p));
  };
  const vbar = (p, x, cy, len) => {
    add(kit.cyl(x, cy - len / 2, 30, 6, len, { seg: 16 }), p);
    [-1, 1].forEach(k => add(kit.cyl(x, cy + k * (len / 2 - 20), 30, 4, 28, { axis: 'z', seg: 12 }), p));
  };
  const front = (p, x, y, w, hh) => add(kit.box(x, y, 2, w, hh, FD), p);
  const y0 = PL + 1.5, y1 = TOP - 1.5, H = y1 - y0;
  // Two doors across a unit [x, x + w]; handles at the centre side, a leaf each.
  const twoDoors = (p, x, w, yy0, hh) => {
    const dw = (w - 9) / 2;
    front(p, x + 1.5, yy0, dw, hh); front(p, x + 1.5 + dw + 3, yy0, dw, hh);
    vbar(p, x + 1.5 + dw - 30, yy0 + hh - 100, 160); vbar(p, x + 1.5 + dw + 3 + 30, yy0 + hh - 100, 160);
  };

  // Corner unit: the return covers its left 600 mm, so one blind-side door shows at x 600..1000.
  front(g, 605, y0, 1000 - 1.5 - 605, H);
  vbar(g, 605 + 30, y1 - 100, 160);
  // Sink unit: two doors.
  twoDoors(g, 1000, 800, y0, H);
  // Drawer unit: three equal drawers.
  const dh = (H - 6) / 3;
  for (let i = 0; i < 3; i++) {
    const y = y0 + i * (dh + 3);
    front(g, 1801.5, y, 597, dh);
    hbar(g, 2100, y + dh - 45, 220);
  }
  // Hob unit: shallow drawer over two doors.
  const sh = 140, ty = y1 - sh;
  hbar(g, 2850, ty + sh - 40, 320);
  front(g, 2401.5, ty, 897, sh);
  twoDoors(g, 2400, 900, y0, ty - 3 - y0);

  // Return: a local frame whose +z points out of the x = 600 face, local u runs from z = +1500 (0) to z = 0 (1500).
  const rg = kit.group();
  rg.rotation.y = Math.PI / 2;
  rg.position.set(RX, 0, RZ);
  g.add(rg);
  const u0 = 1.5, uw = 750 - 3;
  front(rg, u0, y0, uw, H);                         // far door
  vbar(rg, 750 - 1.5 - 30, y1 - 100, 160);
  const rt = y1 - sh;
  front(rg, 750 + 1.5, rt, uw, sh);                 // near drawer over a door
  hbar(rg, 1125, rt + sh - 40, 320);
  front(rg, 750 + 1.5, y0, uw, rt - 3 - y0);
  vbar(rg, 750 + 1.5 + 30, rt - 3 - 100, 160);

  // Tap: base, post, arched spout, lever. Segments are cylinders between two points.
  const TX = 1400, TZ = -550;
  const seg = (a, b, r) => {
    const A = new T.Vector3(...a), B = new T.Vector3(...b), d = B.clone().sub(A);
    const m = kit.solid(new T.CylinderGeometry(r, r, d.length(), 14), 0, 0, 0, { smooth: true });
    m.position.copy(A).add(B).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
    add(m);
  };
  add(kit.cyl(TX, CT, TZ, 34, 14, { seg: 24 }));
  add(kit.cyl(TX, CT + 14, TZ, 24, 16, { seg: 24 }));
  const PY = CT + 30, PT = 1230;
  add(kit.cyl(TX, PY, TZ, 15, PT - PY, { seg: 20 }));
  const R = 140, N = 18, pts = [];
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 0.9;
    pts.push([TX, PT + R * Math.sin(a), TZ + R * (1 - Math.cos(a))]);
  }
  for (let i = 0; i < N; i++) seg(pts[i], pts[i + 1], 13);
  const e = pts[N];
  seg(e, [TX, e[1] - 50, e[2] + 14], 13);
  add(kit.cyl(TX, e[1] - 62, e[2] + 17, 15, 14, { seg: 20 }));
  // Lever on the right of the post.
  seg([TX + 12, 1090, TZ], [TX + 90, 1130, TZ], 7);
  add(kit.cyl(TX, 1078, TZ, 20, 22, { seg: 20 }));

  return kit.merge(g);
}
