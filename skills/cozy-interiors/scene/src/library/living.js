// @js:library-living — furniture for a living corner and a dining room, drawn like the kitchen: plain solids with soft outlines, real millimetres, resting on real feet.
// Floor pieces have their origin in the middle of the footprint on the floor and their front toward +z (turn them to face a wall or each other);
// wall pieces (picture, curtain) have it at the bottom middle, on the wall face, standing out toward +z.
// sofa({ seats = 3, w, d = 900 }), armchair({ w = 880, d = 860 }), coffeeTable({ w = 1000, d = 600, h = 380 }), rug({ w = 2400, d = 1700, border = 70 }), shelf({ w = 800, h = 1800, d = 320, shelves = 5, seed }),
// floorLamp({ h = 1650 }), picture({ w = 600, h = 800, seed }), sideboard({ w = 1600, h = 800, d = 420, doors = 3 }), stool({ h = 650 }), bench({ w = 1200, d = 380, h = 450 }), curtain({ w = 1500, h = 2300, panels = 2 }).
const rnd = (seed) => { let r = (seed || 1) * 9301 + 49297; return () => { r = (r * 9301 + 49297) % 233280; return r / 233280; }; };
const lo = { tone: 'lo' };
import { rod } from './parts.js';
import { bookRow } from './books.js';

function boxes(kit) {   // boxes by their middle (x, z) and bottom (y), not by a corner
  return {
    bx: (cx, y, cz, w, h, d, o) => kit.box(cx - w / 2, y, cz + d / 2, w, h, d, o),
    rb: (cx, y, cz, w, h, d, r, o) => kit.rbox(cx - w / 2, y, cz + d / 2, w, h, d, r, o),
  };
}
import { sofa, armchair } from './seating.js';
import { legs as legParts, handle } from './parts.js';
import { vessel, PROFILES } from './soft.js';
export { sofa, armchair };

export function coffeeTable(kit, { w = 1000, d = 600, h = 380 } = {}) {
  const { bx, rb } = boxes(kit), g = kit.group(), TT = 30;
  g.add(rb(0, h - TT, 0, w, TT, d, 10));
  g.add(rb(0, 120, 0, w - 160, 22, d - 140, 6, lo));   // a low shelf
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(bx(sx * (w / 2 - 70), 0, sz * (d / 2 - 60), 44, h - TT, 44));
  return kit.merge(g);
}
export function rug(kit, { w = 2400, d = 1700, border = 70, form = 'plain', fringe = 'none' } = {}) {   // form plain (a border of two lines) | striped (bands along the length) | borderless (a plain mat with a faint weave) | round (a disc, diameter the smaller of w and d) | runner (use a long narrow w x d; stripes and fringe at both ends)
  const { rb } = boxes(kit), g = kit.group(), T = 7, y = T + 0.4, pts = [];
  const rect = (i) => { const x = w / 2 - i, z = d / 2 - i, c = [[-x, y, z], [x, y, z], [x, y, -z], [-x, y, -z]]; for (let k = 0; k < 4; k++) pts.push(c[k], c[(k + 1) % 4]); };
  if (form === 'round') {
    const r = Math.min(w, d) / 2; g.add(kit.cyl(0, 0, 0, r, T, { seg: 56, tone: 'lo' }));
    for (const f of [0.9, 0.82, 0.45]) { const rr = r * f, n = 56; for (let k = 0; k < n; k++) { const a = k / n * 6.2832, b = (k + 1) / n * 6.2832; pts.push([Math.cos(a) * rr, y, Math.sin(a) * rr], [Math.cos(b) * rr, y, Math.sin(b) * rr]); } }
  } else {
    g.add(rb(0, 0, 0, w, T, d, form === 'runner' ? 8 : 24, lo));
    if (form === 'plain') { rect(border); rect(border + 28); }
    else if (form === 'striped') { rect(border * 0.6); for (let k = -3; k <= 3; k++) { if (k % 2 === 0) continue; const z = k * d / 8; pts.push([-w / 2 + border * 0.6, y, z], [w / 2 - border * 0.6, y, z], [-w / 2 + border * 0.6, y, z + 36], [w / 2 - border * 0.6, y, z + 36]); } }
    else if (form === 'runner') { rect(border * 0.5); rect(border * 0.5 + 22); for (const e of [-1, 1]) for (let k = 0; k < 14; k++) { const z = -d / 2 + 30 + k * (d - 60) / 13; pts.push([e * w / 2, y - 3, z], [e * (w / 2 + 55), 0.5, z + (k % 2 ? 6 : -6)]); } }
    else { for (let k = 0; k < 9; k++) { const x = -w / 2 + (k + 0.5) * w / 9; pts.push([x, y, -d / 2 + 60], [x, y, d / 2 - 60]); } }   // borderless: a faint weave
  }
  if (fringe === 'ends' && form !== 'runner' && form !== 'round') for (const e of [-1, 1]) for (let k = 0; k < 16; k++) { const z = -d / 2 + 40 + k * (d - 80) / 15; pts.push([e * w / 2, y - 3, z], [e * (w / 2 + 50), 0.5, z + (k % 2 ? 6 : -6)]); }   // fringe: short tassels at the two short ends
  g.add(kit.lines(pts, form === 'borderless' ? 'lo' : 'mid'));
  return kit.merge(g);
}
export function shelf(kit, { w = 800, h = 1800, d = 320, shelves = 5, seed = 3, form: form0 = 0, fill, base = 'plinth', back = 'closed' } = {}) {   // space: meta.js SPACE.shelf; fill books|boxes|mixed (form 0|1|2 still works)
  const form = fill ? ['books', 'boxes', 'mixed'].indexOf(fill) : form0;   // form 0 book rows, 1 lidded boxes and flat stacks, 2 gapped book groups with a pot and a basket
  const { bx } = boxes(kit), g = kit.group(), R = rnd(seed), T = 22, P = base === 'plinth' ? 90 : base === 'legs' ? 150 : 60;
  g.add(bx(-w / 2 + T / 2, 0, 0, T, h, d)); g.add(bx(w / 2 - T / 2, 0, 0, T, h, d));                // the sides
  if (back === 'open') { for (const y of [h * 0.3, h - 140]) g.add(bx(0, y, -d / 2 + 6, w - 2 * T, 40, 12, lo)); } else g.add(bx(0, 0, -d / 2 + 6, w - 2 * T, h, 12, lo));   // the back: closed, or two rails
  const ys = []; for (let i = 0; i <= shelves; i++) ys.push(P + (h - P - T) * i / shelves);
  ys.forEach((y) => g.add(bx(0, y, 0, w - 2 * T, T, d - 4)));
  if (base === 'plinth') g.add(bx(0, 0, 8, w - 2 * T, P, d - 30, lo));   // the plinth, set back
  else { const pts = []; for (const sx of [-1, 1]) for (const sz of [-1, 1]) pts.push([sx * (w / 2 - 50), sz * (d / 2 - 40)]); g.add(legParts(kit, base === 'legs' ? 'tapered' : 'block', pts, P + 2, { r: base === 'legs' ? 24 : 30, out: [0, 0] })); }
  const T3 = kit.THREE, inner = w - 2 * T, x0s = -inner / 2 + 12, dep = d - 90;
  const run = (x, y, gap, len) => {   // a row of separate books: mixed heights, widths, depths and tones, spine bands, sometimes one leaning at the end
    const { group, end } = bookRow(kit, { x, y, z: 0, len, dep, hmax: Math.min(gap - 30, 300), R, lean: R() < 0.5 }); g.add(group);
    return end + 20;
  };
  const stack = (x, y, gap) => { let yy = y; const n = 2 + (R() * 2 | 0); for (let k = 0; k < n; k++) { const bh = 24 + R() * 14, bw = 200 - k * 14 + R() * 20; const b = bx(x + bw / 2, yy, 0, bw, bh, dep * 0.8, k % 2 ? lo : {}); b.rotation.y = (R() - 0.5) * 0.2; g.add(b); yy += bh; } return x + 230; };
  const bowl = (x, y, gap) => { const r = 60 + R() * 30, hh = Math.min(gap - 40, 70 + R() * 90), v = vessel(kit, PROFILES[R() < 0.5 ? 'tulip' : 'belly'](r, hh), { contents: 'none', seg: 24 }); v.position.set(x + r, y, 0); g.add(v); return x + 2 * r + 30; };
  const box = (x, y, gap) => { const bw = 150 + R() * 90, bh = Math.min(gap - 40, 120 + R() * 120); g.add(bx(x + bw / 2, y, 0, bw, bh, dep, {})); g.add(bx(x + bw / 2, y + bh, 0, bw + 6, 8, dep + 6, lo)); g.add(handle(kit, 'cutout', x + bw / 2, y + bh * 0.62, dep / 2, { w: 70 })); return x + bw + 14; };
  const kinds = { books: ['run', 'bowl', 'stack'], boxes: ['box', 'box', 'stack'], mixed: ['run', 'box', 'bowl', 'stack'] }[['books', 'boxes', 'mixed'][form]] || ['run'];
  for (let s = 1; s < shelves; s++) {
    const y = ys[s] + T, gap = ys[s + 1] - y - T; let x = x0s + R() * 60; const order = kinds.slice().sort(() => R() - 0.5);
    if (s % 2 === 0 && form !== 1) order.length = Math.max(1, order.length - 1);   // every other shelf holds less
    for (const k of order) { if (x > x0s + inner - 260) break; const len = Math.min(inner - (x - x0s) - 80, 200 + R() * inner * 0.35); x = k === 'run' ? run(x, y, gap, len) : k === 'bowl' ? bowl(x, y, gap) : k === 'box' ? box(x, y, gap) : stack(x, y, gap); x += 10 + R() * 40; }
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
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, b = (i + 1) / 24 * Math.PI * 2, cx = x1 - (x1 - x0) * 0.22, cy = y1 - (y1 - y0) * 0.16, r = Math.min((x1 - x0) * 0.09, (y1 - y0) * 0.11); pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a), z], [cx + r * Math.cos(b), cy + r * Math.sin(b), z]); }
  g.add(kit.lines(pts, 'mid'));
  return kit.merge(g);
}
export function sideboard(kit, { w = 1600, h = 800, d = 420, doors = 3, form = 'doors', legs = 'tapered' } = {}) {   // form doors | drawers (two rows of drawer fronts) | mixed (doors at the ends, a drawer stack between) | open (open shelves); legs tapered | plinth | hairpin
  const { bx, rb } = boxes(kit), g = kit.group(), L = legs === 'plinth' ? 90 : 150, pts = [], z = d / 2 + 0.6, bw = w - 40;
  if (legs === 'plinth') g.add(bx(0, 0, 0, bw - 60, L, d - 70, lo));
  else for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(legs === 'hairpin' ? kit.cyl(sx * (w / 2 - 80), 0, sz * (d / 2 - 60), 7, L, { seg: 8, ...lo }) : kit.cyl(sx * (w / 2 - 80), 0, sz * (d / 2 - 60), 22, L, { rTop: 16, seg: 12, ...lo }));
  if (form === 'open') { const t = 22, ht = h - L - 22; for (const sx of [-1, 1]) g.add(bx(sx * (bw / 2 - t / 2), L, 0, t, ht, d - 20)); g.add(bx(0, L, 0, bw, t, d - 20)); g.add(bx(0, L + ht / 2, 0, bw, t, d - 20)); g.add(bx(0, L, -d / 2 + 16, bw, ht, 12, lo)); }
  else g.add(rb(0, L, 0, bw, h - L - 22, d - 20, 6));                                                         // the carcass
  g.add(rb(0, h - 22, 0, w, 22, d, 6));                                                                  // the top, overhanging
  const y0 = L + 18, y1 = h - 22 - 18, frame = (x0, x1, a, b) => { for (const [p, q] of [[[x0, a], [x1, a]], [[x1, a], [x1, b]], [[x1, b], [x0, b]], [[x0, b], [x0, a]]]) pts.push([p[0], p[1], z], [q[0], q[1], z]); };
  const knob = (x, y) => g.add(kit.cyl(x, y, z - 4, 7, 12, { axis: 'z', seg: 10, ...lo }));
  if (form === 'open') {   // open shelves with a few things on them: a book stack, a box, a bowl
    const mid = L + (h - L - 22) / 2, hs = [[-bw * 0.32, 0.3, 0], [-bw * 0.12, 0.2, 1], [bw * 0.3, 0.18, 2], [-bw * 0.28, 0.25, 3], [bw * 0.05, 0.3, 4]];
    for (const [x, , k] of hs) { const up = k > 2, y = up ? mid + 22 : L + 22; if (k === 0 || k === 3) for (let i = 0; i < 4; i++) g.add(bx(x, y + i * 34, 0, 260 - i * 12, 32, 200)); else if (k === 1 || k === 4) g.add(rb(x, y, 0, 220, 150, 200, 10)); else g.add(kit.cyl(x, y, 0, 120, 70, { rTop: 150, seg: 16 })); }
    pts.push([-bw / 2 + 22, mid, z], [bw / 2 - 22, mid, z]);
  } else if (form === 'drawers') {
    const cols = Math.max(2, doors), cw = bw / cols, rh = (y1 - y0) / 2; for (let c = 0; c < cols; c++) for (let r = 0; r < 2; r++) { const x0 = -bw / 2 + c * cw + 12, x1 = -bw / 2 + (c + 1) * cw - 12, a = y0 + r * rh + 4, b = y0 + (r + 1) * rh - 4; frame(x0, x1, a, b); knob((x0 + x1) / 2, (a + b) / 2); }
  } else if (form === 'mixed') {
    const dw = bw * 0.26, sw = (bw - 2 * dw) / 1; for (const [x0, x1, i] of [[-bw / 2 + 12, -bw / 2 + dw - 12, 0], [bw / 2 - dw + 12, bw / 2 - 12, 1]]) { frame(x0, x1, y0, y1); g.add(kit.cyl(i ? x0 + 36 : x1 - 36, (y0 + y1) / 2 - 30, z - 4, 7, 60, { axis: 'z', seg: 10, ...lo })); }
    const rh = (y1 - y0) / 3; for (let r = 0; r < 3; r++) { const a = y0 + r * rh + 4, b = y0 + (r + 1) * rh - 4; frame(-bw / 2 + dw + 12, bw / 2 - dw - 12, a, b); knob(0, (a + b) / 2); }
  } else {
    const cw = bw / doors;
    for (let i = 0; i < doors; i++) { const x0 = -bw / 2 + i * cw + 12, x1 = -bw / 2 + (i + 1) * cw - 12; frame(x0, x1, y0, y1); const hx = i % 2 === 0 ? x1 - 36 : x0 + 36; g.add(kit.cyl(hx, (y0 + y1) / 2 - 30, z - 4, 7, 60, { axis: 'z', seg: 10, ...lo })); }
  }
  g.add(kit.lines(pts, 'lo'));
  return kit.merge(g);
}
export function bench(kit, { w = 1200, d = 380, h = 450, form = 'plank' } = {}) {   // form plank (a thick top on four legs and stretchers) | slatted (a top of slats with gaps) | upholstered (a padded seat on short legs) | trestle (a top on two slab ends)
  const { bx, rb } = boxes(kit), g = kit.group(), TT = 40;
  if (form === 'slatted') { const n = 5, sw = (d - 4 * 14) / n; for (let k = 0; k < n; k++) g.add(rb(0, h - TT, -d / 2 + sw / 2 + k * (sw + 14), w, TT, sw, 4)); for (const sx of [-1, 1]) g.add(bx(sx * (w / 2 - 90), 0, 0, 40, h - TT, d - 40)); g.add(bx(0, 130, 0, w - 180, 28, 36, lo)); return kit.merge(g); }
  if (form === 'trestle') { g.add(rb(0, h - TT, 0, w, TT, d, 8)); for (const sx of [-1, 1]) g.add(rb(sx * (w / 2 - 110), 0, 0, 50, h - TT, d - 40, 4)); g.add(bx(0, h - TT - 90, 0, w - 220, 60, 30, lo)); return kit.merge(g); }
  if (form === 'upholstered') { for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(kit.cyl(sx * (w / 2 - 70), 0, sz * (d / 2 - 50), 16, h - 110, { rTop: 24, seg: 12, ...lo })); g.add(rb(0, h - 110, 0, w, 110, d, 30)); g.add(kit.lines([[-w / 2 + 50, h - 40, d / 2 + 1], [w / 2 - 50, h - 40, d / 2 + 1]], 'lo')); return kit.merge(g); }
  g.add(rb(0, h - TT, 0, w, TT, d, 8));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(bx(sx * (w / 2 - 70), 0, sz * (d / 2 - 50), 46, h - TT, 46));
  for (const sz of [-1, 1]) g.add(bx(0, 120, sz * (d / 2 - 50), w - 140, 30, 36, lo));   // a stretcher between each pair of legs
  return kit.merge(g);
}
export function stool(kit, { h = 650 } = {}) {   // a bar stool: round seat, four splayed legs, one footrest ring low down
  const T = kit.THREE, g = kit.group(), RS = 185, top = h - 40, foot = 235, R = 12;
  const leg = (a, b) => { const A = new T.Vector3(...a), B = new T.Vector3(...b), d = B.clone().sub(A), m = kit.solid(new T.CylinderGeometry(R * 0.8, R, d.length(), 10), 0, 0, 0, { smooth: true, ...lo }); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); return m; };
  const lerp = (t) => 0.62 * RS + (0.62 * RS + 70 - 0.62 * RS) * 0 + (1 - t) * 70;   // legs spread 70 mm more at the floor than at the seat
  for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2, c = Math.cos(a), s = Math.sin(a); g.add(leg([c * 0.62 * RS, top, s * 0.62 * RS], [c * (0.62 * RS + 75), 0, s * (0.62 * RS + 75)])); }
  const rr = 0.62 * RS + 75 * (1 - foot / top);   // the ring touches the legs at its height
  const ring = kit.solid(new T.TorusGeometry(rr, 9, 8, 32), 0, foot, 0, { smooth: true, ...lo }); ring.rotation.x = Math.PI / 2; g.add(ring);
  g.add(kit.cyl(0, top, 0, RS, 40, { seg: 36 }));
  return kit.merge(g);
}
// a window blind, drawn part way: origin the middle of the window's full width at the bottom of its full height, standing out from the wall (+z). form roller (a flat fabric on a tube, a hem bar, a pull cord)
// or roman (a flat fabric with soft horizontal folds, a headrail); w, h: the window the blind covers; drawn: how much of h is lowered from the top (0.2 to 0.9).
export function blind(kit, { w = 1200, h = 1500, form = 'roller', drawn = 0.5, tone = 'mid' } = {}) {
  const T = kit.THREE, g = kit.group(), L = Math.round(h * drawn), top = h + 50, bw = w - 20, S = 200;   // S: the blind stands S mm off the wall on two end brackets, clearing the sill's lip and open sashes
  const bracket = (x, zRail, yRail) => { g.add(kit.box(x - 12, yRail - 30, 6, 24, 60, 6, lo)); g.add(rod(kit, [x, yRail, 6], [x, yRail, zRail], 7, 7, 'lo')); };   // a wall plate and an arm that reaches the rail
  if (form === 'roman') {
    g.add(kit.box(-w / 2, top - 6, S + 50, w, 56, 50, lo));   // the headrail, its back face at S
    for (const sx of [-1, 1]) bracket(sx * (w / 2 - 50), S, top + 14);
    const fold = Math.min(Math.round(L * 0.5), 280), N = Math.max(2, Math.round(fold / 90)), A = 26, TH = 10, y0 = top - L + fold, pts = [[S + 6, top - 6], [S + 6, y0]];   // a side view: hangs flat, then the folds stack at the bottom only
    for (let k = 1; k <= N * 2; k++) pts.push([S + 6 + (k % 2 ? A : 0), y0 - fold * k / (N * 2)]);
    const sh = new T.Shape([...pts, ...pts.map(([z, y]) => [z + TH, y]).reverse()].map(([z, y]) => new T.Vector2(z, y))), geo = new T.ExtrudeGeometry(sh, { depth: bw, bevelEnabled: false }); geo.rotateY(-Math.PI / 2); geo.translate(bw / 2, 0, 0);   // the shape's first coordinate becomes the depth from the wall
    g.add(kit.solid(geo, 0, 0, 0, { tone }));
  } else {
    g.add(kit.cyl(-w / 2, top - 22, S + 24, 24, w, { axis: 'x', seg: 20, ...lo }));   // the roller tube, its back at S
    for (const sx of [-1, 1]) bracket(sx * (w / 2 + 14), S + 24, top - 22);
    g.add(kit.box(-bw / 2, top - 44 - L, S + 40 + 10, bw, L, 5, { tone }));   // the fabric, hanging flat just in front of the tube
    g.add(kit.rbox(-bw / 2, top - 44 - L - 14, S + 40 + 14, bw, 20, 16, 6, { tone: 'lo' }));   // the hem bar
    g.add(kit.lines([[bw / 2 - 40, top - 44 - L - 4, S + 64], [bw / 2 - 40, top - 44 - L - 4 - 140, S + 64]], 'lo'));   // the pull cord
  }
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
