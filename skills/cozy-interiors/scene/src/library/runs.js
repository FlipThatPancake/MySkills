// @js:library-runs — fitted kitchen runs, generated from a list of modules. Local frame: x along the run from 0, front at z = 0, wall at z = -depth, floor y = 0.
// baseRun(kit, { modules, depth = 600, top = 900, overhang = 20, trimStart = 0, trimEnd = 0, hob, sink })
//   modules: [{ w, kind }] left to right; kind: doors (two), door (one, hinge 'l' or 'r'), drawers (n, default 3), drawerDoors (a shallow drawer over two doors),
//   sink (two doors, a basin and a tap above), hob (a shallow drawer over two doors; the hob product sits on top), filler (a plain strip), open (a shelf, no front).
//   The worktop runs the whole length, cut for each sink; trimStart/trimEnd shorten it where it butts another run's worktop at a corner.
// wallRun(kit, { modules, y0 = 1450, h = 720, depth = 320 }): wall cabinets; kind door, doors, open, filler.
// fillWidths(length, fixed): fills a length with standard widths (300-900 by 50 mm) round fixed modules, leaving a filler under 100 mm.
// Every opening front is listed in group.userData.openables ({ kind: 'drawer' | 'door', v, target, max, dir }) for the scene to animate.
export const WIDTHS = [300, 400, 450, 500, 600, 800, 900];

export function fillWidths(length, fixed = []) {
  let left = length - fixed.reduce((s, m) => s + m.w, 0);
  const fill = [];
  while (left >= 300) {
    const w = WIDTHS.slice().reverse().find((x) => x <= left && (left - x === 0 || left - x >= 300 || left - x < 100)) || 300;
    fill.push({ w, kind: w >= 600 ? 'doors' : 'door' }); left -= w;
  }
  if (left > 0) fill.push({ w: left, kind: 'filler' });
  return { fill, filler: left };
}

const PL = 100, FD = 18, GAP = 3, SIDE = 18;

function parts(kit, g, leaves) {
  const T = kit.THREE, add = (m, p = g) => (p.add(m), m);
  const hbar = (p, cx, y, len) => { add(kit.cyl(cx - len / 2, y, 30, 6, len, { axis: 'x', seg: 16 }), p); [-1, 1].forEach((k) => add(kit.cyl(cx + k * (len / 2 - 20), y, 30, 4, 28, { axis: 'z', seg: 12 }), p)); };
  const vbar = (p, x, cy, len) => { add(kit.cyl(x, cy - len / 2, 30, 6, len, { seg: 16 }), p); [-1, 1].forEach((k) => add(kit.cyl(x, cy + k * (len / 2 - 20), 30, 4, 28, { axis: 'z', seg: 12 }), p)); };
  const front = (p, x, y, w, h) => add(kit.box(x, y, 2, w, h, FD), p);
  const leaf = (kind, px, pz, extra) => { const t = kit.group(); leaves.push({ t, kind, px, pz, extra }); return t; };
  return { T, add, hbar, vbar, front, leaf };
}

// A hollow carcass for one module: sides, back, floor; open at the front.
function carcass(kit, add, x, w, y0, y1, depth, back = 0) {
  const lo = { tone: 'lo' };
  add(kit.box(x, y0, -back, SIDE, y1 - y0, depth - back));
  add(kit.box(x + w - SIDE, y0, -back, SIDE, y1 - y0, depth - back));
  add(kit.box(x + SIDE, y0, -depth + SIDE, w - 2 * SIDE, y1 - y0, SIDE, lo));
  add(kit.box(x + SIDE, y0, -back, w - 2 * SIDE, SIDE, depth - SIDE - back, lo));
}

export function baseRun(kit, { modules, depth = 600, top = 900, overhang = 20, trimStart = 0, trimEnd = 0 }) {
  const g = kit.group(), leaves = [], P = parts(kit, g, leaves), { T, add, hbar, vbar, front, leaf } = P;
  const length = modules.reduce((s, m) => s + m.w, 0), CT = 38, TOP = top - CT, y0 = PL + 1.5, y1 = TOP - 1.5, H = y1 - y0;
  // plinth, recessed 50
  add(kit.box(0, 0, -50, length, PL, depth - 50, { tone: 'lo' }));
  const cuts = [];
  let x = 0;
  for (const m of modules) {
    const w = m.w;
    if (m.kind === 'filler') { add(kit.box(x, PL, 2, w, TOP - PL, depth + 2)); x += w; continue; }
    carcass(kit, add, x, w, PL, TOP, depth, 15);
    if (m.kind === 'open') add(kit.box(x + SIDE, PL + (TOP - PL) / 2, -15, w - 2 * SIDE, SIDE, depth - SIDE - 15, { tone: 'lo' }));
    const doorsIn = (yy0, hh, n) => {   // n doors across the module, swinging out from the outer hinges
      const dw = (w - GAP * (n + 1)) / n;
      for (let i = 0; i < n; i++) {
        const hingeLeft = n === 2 ? i === 0 : m.hinge !== 'r', fx = x + GAP + i * (dw + GAP), px = hingeLeft ? fx : fx + dw;
        const L = leaf('door', px, 2, { dir: hingeLeft ? -1 : 1, max: 90 });
        front(L, fx, yy0, dw, hh); vbar(L, hingeLeft ? fx + dw - 30 : fx + 30, yy0 + hh - 100, Math.min(160, hh - 60));
      }
    };
    const drawers = (yy0, hh, n) => {
      const dh = (hh - GAP * (n - 1)) / n;
      for (let i = 0; i < n; i++) {
        const y = yy0 + i * (dh + GAP), D = leaf('drawer', 0, 0, { max: Math.min(depth - 120, 480) });
        front(D, x + GAP / 2, y, w - GAP, dh); hbar(D, x + w / 2, y + dh - 45, Math.min(320, w - 160));
        const bx0 = x + SIDE + 4, bx1 = x + w - SIDE - 4, by = y + 20, bh = Math.max(60, dh - 50), BD = Math.min(depth - 120, 480), lo = { tone: 'lo' };
        add(kit.box(bx0, by, -16, 12, bh, BD, lo), D); add(kit.box(bx1 - 12, by, -16, 12, bh, BD, lo), D);
        add(kit.box(bx0 + 12, by, -16 - BD + 12, bx1 - bx0 - 24, bh, 12, lo), D); add(kit.box(bx0 + 12, by, -16, bx1 - bx0 - 24, 10, BD - 12, lo), D);
      }
    };
    const sh = 140;
    if (m.kind === 'doors' || m.kind === 'sink') doorsIn(y0, H, 2);
    if (m.kind === 'door') doorsIn(y0, H, 1);
    if (m.kind === 'drawers') drawers(y0, H, m.n || 3);
    if (m.kind === 'drawerDoors' || m.kind === 'hob') { front(g, x + GAP / 2, y1 - sh, w - GAP, sh); hbar(g, x + w / 2, y1 - 40, Math.min(320, w - 160)); doorsIn(y0, H - sh - GAP, w >= 600 ? 2 : 1); }
    if (m.kind === 'sink') cuts.push(sink(kit, add, x + w / 2, depth, top));
    x += w;
  }
  // worktop: one slab the length of the run (less any trims), overhanging the fronts, with a hole for each sink
  const s = new T.Shape([[trimStart, -depth], [length - trimEnd, -depth], [length - trimEnd, overhang], [trimStart, overhang]].map(([a, b]) => new T.Vector2(a, -b)));
  for (const c of cuts) s.holes.push(new T.Path(c.map(([a, b]) => new T.Vector2(a, -b))));
  const wt = kit.solid(new T.ExtrudeGeometry(s, { depth: CT, bevelEnabled: false }), 0, TOP, 0); wt.rotation.x = -Math.PI / 2; add(wt);
  return finish(kit, g, leaves, { length, depth, top });
}

// A basin set into the worktop, centred at cx, with a tap behind it. Returns the worktop's hole.
function sink(kit, add, cx, depth, top) {
  const T = kit.THREE, W = 500, D = 400, G = 4, t = 3, BY = top - 180, z0 = -50, z1 = z0 - D, bx0 = cx - W / 2, bx1 = cx + W / 2;
  add(kit.box(bx0, BY, z0, W, top - BY, t)); add(kit.box(bx0, BY, z1 + t, W, top - BY, t));
  add(kit.box(bx0, BY, z0 - t, t, top - BY, D - 2 * t)); add(kit.box(bx1 - t, BY, z0 - t, t, top - BY, D - 2 * t));
  add(kit.box(bx0 + t, BY, z0 - t, W - 2 * t, t, D - 2 * t));
  add(kit.cyl(cx, BY + t, (z0 + z1) / 2, 32, 2, { seg: 24 }));
  // tap: base, post, arched spout
  const TZ = -depth + 50, seg = (a, b, r) => { const A = new T.Vector3(...a), B = new T.Vector3(...b), d = B.clone().sub(A), m = kit.solid(new T.CylinderGeometry(r, r, d.length(), 14), 0, 0, 0, { smooth: true }); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); add(m); };
  add(kit.cyl(cx, top, TZ, 30, 14, { seg: 24 }));
  const PT = top + 330, R = 140, pts = [];
  add(kit.cyl(cx, top + 14, TZ, 15, PT - top - 14, { seg: 20 }));
  for (let i = 0; i <= 14; i++) { const a = (i / 14) * Math.PI * 0.9; pts.push([cx, PT + R * Math.sin(a), TZ + R * (1 - Math.cos(a))]); }
  for (let i = 0; i < 14; i++) seg(pts[i], pts[i + 1], 13);
  seg([cx + 12, top + 190, TZ], [cx + 90, top + 230, TZ], 7);
  return [[bx0 - G, z0 + G], [bx1 + G, z0 + G], [bx1 + G, z1 - G], [bx0 - G, z1 - G]];
}

export function wallRun(kit, { modules, y0 = 1450, h = 720, depth = 320 }) {
  const g = kit.group(), leaves = [], { add, vbar, front, leaf } = parts(kit, g, leaves), PLINTH = 20, TRIM = 20;
  const length = modules.reduce((s, m) => s + m.w, 0), cy0 = y0 + PLINTH, cy1 = y0 + h - TRIM;
  let x = 0;
  for (const m of modules) {
    const w = m.w;
    if (m.kind === 'filler') { add(kit.box(x, y0, 2, w, h, depth + 2)); x += w; continue; }
    carcass(kit, add, x, w, cy0, cy1, depth, 14);
    add(kit.box(x + 8, y0, -10, w - 16, PLINTH, depth - 20, { tone: 'lo' }));
    add(kit.box(x, cy1, 0, w, TRIM, depth));
    if (m.kind === 'open') add(kit.box(x + SIDE, (cy0 + cy1) / 2, -14, w - 2 * SIDE, SIDE, depth - SIDE - 14, { tone: 'lo' }));
    else {
      const n = m.kind === 'doors' ? 2 : 1, dw = (w - GAP * (n + 1)) / n, dy = cy0 + GAP, dh = cy1 - cy0 - 2 * GAP;
      for (let i = 0; i < n; i++) {
        const hingeLeft = n === 2 ? i === 0 : m.hinge !== 'r', fx = x + GAP + i * (dw + GAP), L = leaf('door', hingeLeft ? fx : fx + dw, 2, { dir: hingeLeft ? -1 : 1, max: 95 });
        front(L, fx, dy, dw, dh); vbar(L, hingeLeft ? fx + dw - 30 : fx + 30, dy + 90, 100);
      }
    }
    x += w;
  }
  return finish(kit, g, leaves, { length, depth, top: y0 + h });
}

function finish(kit, g, leaves, size) {
  const out = kit.merge(g);
  out.userData.openables = leaves.map(({ t, kind, px, pz, extra }) => {
    t.children.forEach((c) => { c.position.x -= px; c.position.z -= pz; });
    const m = kit.merge(t);
    m.position.set(px, 0, pz);
    m.userData.open = { kind, v: 0, target: 0, ...extra };
    out.add(m);
    return m;
  });
  out.userData.size = size;
  return out;
}
