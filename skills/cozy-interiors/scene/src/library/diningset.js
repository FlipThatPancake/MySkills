// @js:library-diningset — the Dining batch: things on and around the table. Table pieces: origin the middle of the foot, front +z. Wall pieces: origin bottom middle on the wall face, standing out toward +z.
// candlesticks, jug, breadBasket, placeSetting (a plate, cutlery and a glass), glazedCabinet, benchCushion, wallPlates, pendantForm.
import { rod } from './parts.js';
import { softBox, vessel } from './soft.js';
import { mug } from './pieces.js';
const lo = { tone: 'lo' }, DEG = Math.PI / 180;
const rnd = (seed) => { let r = (seed || 1) * 9301 + 49297; return () => { r = (r * 9301 + 49297) % 233280; return r / 233280; }; };
const ringXY = (cx, cy, r, z, n = 28) => { const p = []; for (let i = 0; i < n; i++) { const a = i / n * 6.2832, b = (i + 1) / n * 6.2832; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, z], [cx + Math.cos(b) * r, cy + Math.sin(b) * r, z]); } return p; };
const ringXZ = (cx, y, cz, r, n = 28) => { const p = []; for (let i = 0; i < n; i++) { const a = i / n * 6.2832, b = (i + 1) / n * 6.2832; p.push([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r], [cx + Math.cos(b) * r, y, cz + Math.sin(b) * r]); } return p; };

export function candlesticks(kit, { n = 2, h = 260, form = 'turned', seed = 1 } = {}) {   // n candlesticks of varied height, each with a candle and a flame
  const g = kit.group(), R = rnd(seed), T = kit.THREE, pts = [];
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 120, br = 40; let hh = h * (0.7 + 0.5 * ((i * 37 + seed) % 5) / 4); const cr = form === 'column' ? 22 : 11;   // column: a short fat pillar holder; chamber: a dish with a ring handle
    if (form === 'turned') g.add(kit.solid(new T.LatheGeometry([[br, 0], [br, 8], [14, 24], [12, hh * 0.35], [26, hh * 0.45], [11, hh * 0.55], [10, hh * 0.85], [22, hh * 0.9], [22, hh]].map(([a, b]) => new T.Vector2(a, b)), 20), x, 0, 0, { smooth: true, tone: 'lo' }));
    else if (form === 'column') { hh *= 0.45; g.add(kit.cyl(x, 0, 0, 36, hh, { rTop: 34, seg: 22, tone: 'lo' })); }
    else if (form === 'chamber') { hh = 26 + hh * 0.18; g.add(kit.cyl(x, 0, 0, 58, 12, { seg: 26, tone: 'lo' })); g.add(kit.cyl(x, 12, 0, 20, hh - 12, { rTop: 15, seg: 16, tone: 'lo' })); g.add(kit.lines(ringXY(x + 70, 26, 20, 0, 18), 'lo')); }
    else if (form === 'tapered') g.add(kit.cyl(x, 0, 0, br, hh, { rTop: 14, seg: 16, tone: 'lo' }));
    else { g.add(kit.cyl(x, 0, 0, 38, 14, { seg: 20, tone: 'lo' })); g.add(rod(kit, [x, 10, 0], [x, hh, 0], 8, 8, 'lo')); g.add(kit.cyl(x, hh - 6, 0, 22, 10, { seg: 16, tone: 'lo' })); }   // a slim brass-style stem
    const ch = (form === 'column' ? 90 : 140) + R() * 80; g.add(kit.cyl(x, hh, 0, cr, ch, { seg: 12 }));
    pts.push([x, hh + ch, 0], [x + 2, hh + ch + 24, 0], [x + 2, hh + ch + 24, 0], [x - 6, hh + ch + 42, 0], [x - 6, hh + ch + 42, 0], [x, hh + ch + 58, 0], [x, hh + ch + 58, 0], [x + 7, hh + ch + 40, 0], [x + 7, hh + ch + 40, 0], [x + 2, hh + ch + 24, 0]);   // the flame
  }
  g.add(kit.lines(pts, 'mid'));
  return kit.merge(g);
}

export function jug(kit, { r = 70, h = 220, form = 'belly', water = true, band = 'plain', handle = 'loop' } = {}) {   // a pitcher: a body from a lathe profile, a spout, a looped handle
  const T = kit.THREE, g = kit.group(), P = { belly: [[r * 0.6, 0], [r * 0.8, 10], [r * 1.15, h * 0.4], [r * 1.0, h * 0.8], [r * 0.82, h]], straight: [[r * 0.8, 0], [r, 8], [r, h * 0.92], [r * 0.9, h]], tapered: [[r * 0.55, 0], [r * 0.7, 8], [r * 1.0, h * 0.8], [r * 1.04, h]] }[form];
  g.add(vessel(kit, P, { contents: water ? 'tea' : 'none', seg: 28, rim: true }));
  const rt = P[P.length - 1][0], ht = h;
  if (band === 'banded') g.add(kit.lines([...ringXZ(0, h * 0.5, 0, P[2][0] * 1.01, 30), ...ringXZ(0, h * 0.58, 0, P[2][0] * 1.0, 30)], 'mid'));
  if (handle === 'loop') { g.add(rod(kit, [rt * 0.9, ht - 14, 0], [rt * 1.6, ht - 30, 0], 9, 9, 'lo')); g.add(rod(kit, [rt * 1.6, ht - 30, 0], [rt * 1.55, h * 0.3, 0], 9, 9, 'lo')); g.add(rod(kit, [rt * 1.55, h * 0.3, 0], [P[2][0] * 0.95, h * 0.26, 0], 9, 9, 'lo')); } else { g.add(kit.cyl(rt * 1.1, h * 0.55, 0, 12, 40, { axis: 'x', seg: 10, tone: 'lo' })); }
  { const shp = new T.Shape([new T.Vector2(-rt * 0.62, ht - 40), new T.Vector2(-rt * 1.42, ht + 16), new T.Vector2(-rt * 0.62, ht + 4)]); const lip = kit.solid(new T.ExtrudeGeometry(shp, { depth: 54, bevelEnabled: false }), 0, 0, -27, { smooth: false }); g.add(lip); }   // a pinched pouring lip
  return kit.merge(g);
}

export function breadBasket(kit, { r = 150, h = 95, bread = 'loaf', seed = 3, cloth = 'yes', rim = 'rolled' } = {}) {   // a shallow basket with a cloth and bread: a loaf, rolls or a baguette
  const g = kit.group(), R = rnd(seed), T = kit.THREE, pts = [];
  g.add(kit.solid(new T.LatheGeometry([[r * 0.6, 0], [r * 0.7, 6], [r * 0.95, h * 0.7], [r, h], [r - 12, h], [r * 0.85, h * 0.7], [r * 0.5, 14], [0.01, 14]].map(([a, b]) => new T.Vector2(a, b)), 32), 0, 0, 0, { smooth: true, tone: 'lo' }));
  for (const f of [0.3, 0.6, 0.85]) pts.push(...ringXZ(0, h * f, 0, r * (0.7 + 0.3 * f) + 1.5, 32));
  g.add(kit.lines(pts, 'mid'));
  if (cloth === 'yes') g.add(kit.rbox(-r * 0.8, 20, r * 0.75, r * 1.6, 8, r * 1.5, 4, { linen: true }));   // a cloth lining
  if (rim === 'rolled') g.add(kit.cyl(0, h - 6, 0, r + 4, 14, { seg: 32, tone: 'lo' }));
  if (bread === 'rolls') for (let i = 0; i < 4; i++) { const a = i * 1.57 + R(); g.add(kit.solid(new T.SphereGeometry(48, 14, 10), Math.cos(a) * 62, 70, Math.sin(a) * 62, { smooth: true, tone: 'lo', linen: false })); }
  else if (bread === 'baguette') for (const o of [-34, 20]) { const m = kit.cyl(0, 0, 0, 30, r * 2.1, { axis: 'x', seg: 14, tone: 'lo' }); m.position.set(-r * 1.05, h * 0.65, o); m.rotation.y = (o > 0 ? 1 : -1) * 0.12; g.add(m); }
  else { const lf = kit.solid(new T.SphereGeometry(r * 0.78, 20, 14), 0, h * 0.55, 0, { smooth: true, tone: 'lo' }); lf.scale.set(1.15, 0.6, 0.68); g.add(lf); const sl = []; for (let i = -1; i <= 1; i++) { const x = i * r * 0.3; sl.push([x - 22, h * 0.55 + r * 0.46 - Math.abs(i) * 8, r * 0.2], [x + 22, h * 0.55 + r * 0.5 - Math.abs(i) * 8, r * 0.05]); } g.add(kit.lines(sl, 'mid')); }   // a loaf with three scoring slashes
  return kit.merge(g);
}

export function placeSetting(kit, { r = 140, glass: gl = true, napkin: nk = true, seed = 1 } = {}) {
  const glass = gl !== false && gl !== 'no', napkin = nk !== false && nk !== 'no';   // a plate with a bowl on it, a fork and a knife, a glass, a folded napkin: origin the middle of the plate on the table, front +z
  const g = kit.group(), pts = [], T = kit.THREE;
  g.add(kit.cyl(0, 0, 0, r, 12, { seg: 36 })); g.add(kit.cyl(0, 12, 0, r * 0.55, 8, { seg: 28, tone: 'lo' }));
  pts.push(...ringXZ(0, 12.5, 0, r * 0.78, 32));
  const kx = r + 50;   // knife on the right, fork on the left
  g.add(kit.box(kx, 0, 160, 20, 5, 330, lo)); g.add(kit.box(-kx - 20, 0, 150, 22, 5, 300, lo));
  for (const i of [-1, 0, 1]) pts.push([-kx - 9 + i * 7, 5.6, -150], [-kx - 9 + i * 7, 5.6, -80]);
  pts.push([kx + 10, 5.6, -150], [kx + 10, 5.6, 150]);
  if (glass) g.add(kit.solid(new T.LatheGeometry([[0.01, 0], [34, 0], [34, 3], [6, 8], [5, 70], [48, 100], [50, 160], [44, 164], [43, 102], [4, 74], [0.01, 10]].map(([a, b]) => new T.Vector2(a, b)), 22), kx + 90, 0, -r * 0.8, { smooth: true, tone: 'lo' }));
  if (napkin) { const sh = new T.Shape([new T.Vector2(0, 0), new T.Vector2(150, 0), new T.Vector2(0, 150)]), ng = new T.ExtrudeGeometry(sh, { depth: 10, bevelEnabled: true, bevelThickness: 3, bevelSize: 3, bevelSegments: 2 }); ng.rotateX(-Math.PI / 2); const nb = kit.solid(ng, -kx - 190, 5, 40, { linen: true, smooth: false }); nb.rotation.y = 0.3; g.add(nb); pts.push([-kx - 190, 16, 50], [-kx - 60, 16, 50]); }   // a folded triangle
  g.add(kit.lines(pts, 'lo'));
  return kit.merge(g);
}

export function glazedCabinet(kit, { w = 1000, h = 1800, d = 420, shelves = 3, doors = 2, base = 'feet', crown = 'flat', low = 0.32, seed = 2 } = {}) {   // a tall cabinet on short feet, glass doors on the upper part, dishes visible inside, drawers or cupboards below
  const g = kit.group(), R = rnd(seed), pts = [], legH = base === 'plinth' ? 70 : 90, z = d / 2 + 0.8, lowH = h * low, T = kit.THREE;   // base feet | plinth; crown flat | cornice (a stepped moulding); low = the cupboard's share of the height
  if (base === 'plinth') g.add(kit.box(-w / 2 + 24, 0, d / 2 - 14, w - 48, legH + 4, d - 28, { tone: 'lo' })); else for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(kit.cyl(sx * (w / 2 - 50), 0, sz * (d / 2 - 50), 24, legH + 6, { rTop: 18, seg: 10, tone: 'lo' }));
  g.add(kit.rbox(-w / 2, legH, d / 2, w, lowH, d, 8));   // the lower cupboard
  const uh = h - legH - lowH - 40, uy = legH + lowH;
  for (const sx of [-1, 1]) g.add(kit.box(sx * (w / 2 - 14) - 14, uy - 4, 0 + (d - 30) / 2, 28, uh + 8, d - 30));
  g.add(kit.box(-w / 2 + 22, uy - 4, -d / 2 + 30, w - 44, uh + 8, 14, lo)); g.add(kit.rbox(-w / 2 - 12, h - 40, d / 2 + 12, w + 24, 40, d + 12, 6)); if (crown === 'cornice') g.add(kit.rbox(-w / 2 - 26, h - 8, d / 2 + 26, w + 52, 26, d + 26, 5));
  for (let s = 0; s < shelves; s++) {   // shelves with plates standing and a stack of bowls
    const y = uy + (s + 0.5) * uh / shelves - uh / (shelves * 2) + 6; g.add(kit.box(-w / 2 + 22, y, d / 2 - 20, w - 44, 16, d - 60, lo));
    let x = -w / 2 + 90; while (x < w / 2 - 150) { const rr = 90 + R() * 22; if (R() < 0.7) { const p = kit.group(); p.add(kit.cyl(0, rr, 0, rr, 8, { axis: 'z', seg: 28 })); p.position.set(x, y + 16, 0); p.rotation.x = -0.14; g.add(p); x += 60; } else { g.add(kit.cyl(x, y + 16, 0, 70, 90, { rTop: 90, seg: 24 })); x += 190; } }
  }
  const cw = (w - 56) / doors;
  for (let i = 0; i < doors; i++) { const x0 = -w / 2 + 28 + i * cw + 3, x1 = x0 + cw - 6, y0 = uy + 6, y1 = uy + uh - 6, mid = (x0 + x1) / 2; for (const sx of [x0, x1 - 22]) g.add(kit.box(sx, y0, z + 3, 22, y1 - y0, 18, lo)); for (const sy of [y0, y1 - 22]) g.add(kit.box(x0, sy, z + 3, x1 - x0, 22, 18, lo)); pts.push([x0, y0, z], [x1, y0, z], [x1, y0, z], [x1, y1, z], [x1, y1, z], [x0, y1, z], [x0, y1, z], [x0, y0, z], [x0 + 22, y0 + 22, z], [x1 - 22, y0 + 22, z], [x1 - 22, y0 + 22, z], [x1 - 22, y1 - 22, z], [x1 - 22, y1 - 22, z], [x0 + 22, y1 - 22, z], [x0 + 22, y1 - 22, z], [x0 + 22, y0 + 22, z], [mid, y0 + 22, z], [mid, y1 - 22, z]); g.add(kit.cyl(i % 2 ? x0 + 26 : x1 - 26, (y0 + y1) / 2, z + 4, 7, 14, { axis: 'z', seg: 10, tone: 'lo' })); }
  const ly0 = legH + 24, ly1 = legH + lowH - 24; for (let i = 0; i < 2; i++) { const x0 = -w / 2 + 24 + i * (w - 48) / 2 + 3, x1 = -w / 2 + 24 + (i + 1) * (w - 48) / 2 - 3; pts.push([x0, ly0, z], [x1, ly0, z], [x1, ly0, z], [x1, ly1, z], [x1, ly1, z], [x0, ly1, z], [x0, ly1, z], [x0, ly0, z]); g.add(kit.cyl(i ? x0 + 30 : x1 - 30, (ly0 + ly1) / 2, z + 4, 7, 14, { axis: 'z', seg: 10, tone: 'lo' })); }
  g.add(kit.lines(pts, 'lo'));
  return kit.merge(g);
}

export function benchCushion(kit, { w = 1100, d = 360, thick = 60, tone = 'mid', stripes = 'none', seed = 1 } = {}) {   // a flat seat pad with piping and two ties, for a bench; origin the middle of its foot on the seat
  const g = kit.group(), pts = [], s = softBox(kit, w, d, thick, { r: 24, bulge: 8, piping: 'edge', tone, dent: 3 }); s.rotation.x = -Math.PI / 2; s.position.y = thick / 2; g.add(s);
  if (stripes === 'stripes') for (let i = 1; i < 6; i++) pts.push([-w / 2 + w * i / 6, thick + 0.8, -d / 2 + 20], [-w / 2 + w * i / 6, thick + 0.8, d / 2 - 20]);
  else if (stripes === 'check') { for (let i = 1; i < 6; i++) pts.push([-w / 2 + w * i / 6, thick + 0.8, -d / 2 + 20], [-w / 2 + w * i / 6, thick + 0.8, d / 2 - 20]); for (let i = 1; i < 3; i++) pts.push([-w / 2 + 20, thick + 0.8, -d / 2 + d * i / 3], [w / 2 - 20, thick + 0.8, -d / 2 + d * i / 3]); }
  for (const sx of [-1, 1]) { pts.push([sx * w * 0.38, thick * 0.6, -d / 2 - 2], [sx * w * 0.38 + sx * 20, 6, -d / 2 - 30], [sx * w * 0.38, thick * 0.6, -d / 2 - 2], [sx * w * 0.38 - sx * 24, 10, -d / 2 - 36]); }
  g.add(kit.lines(pts, 'lo'));
  return kit.merge(g);
}

export function wallPlates(kit, { n = 5, r = 110, seed = 4, layout = 'cluster' } = {}) {   // decorative plates on the wall, hung flat: a cluster, a row or a ring; origin bottom middle
  const g = kit.group(), R = rnd(seed), T = kit.THREE, pts = [];
  const spots = [];
  if (layout === 'column') for (let i = 0; i < Math.min(n, 4); i++) spots.push([(R() - 0.5) * r * 0.3, r + i * r * 2.25, r * (0.85 + 0.3 * R())]);   // a vertical stack
  else if (layout === 'grid') for (let i = 0; i < n; i++) spots.push([((i % 3) - 1) * r * 2.3, r + Math.floor(i / 3) * r * 2.3, r * (0.85 + 0.3 * R())]);   // rows of three
  else if (layout === 'row') for (let i = 0; i < n; i++) spots.push([(i - (n - 1) / 2) * (r * 2.3), r, r * (0.8 + 0.5 * R())]);
  else if (layout === 'ring') { spots.push([0, r * 2.4, r * 1.1]); for (let i = 0; i < n - 1; i++) { const a = i / (n - 1) * 6.2832; spots.push([Math.cos(a) * r * 2.3, r * 2.4 + Math.sin(a) * r * 2.3, r * 0.6]); } }
  else for (let i = 0; i < n; i++) { const a = i * 2.4 + R(), d = Math.sqrt(i + 0.5) * r * 1.1; spots.push([Math.cos(a) * d, r * 2.5 + Math.sin(a) * d * 0.8, r * (0.6 + 0.6 * R())]); }
  spots.forEach(([x, y, rr], i) => { g.add(kit.cyl(x, y, 20, rr, 14, { axis: 'z', seg: 32 })); g.add(kit.cyl(x, y, 25, rr * 0.7, 8, { axis: 'z', seg: 28, tone: 'lo' })); pts.push(...ringXY(x, y, rr * 0.82, 26.5, 28)); if (i % 3 === 0) for (let k = 0; k < 8; k++) { const a = k / 8 * 6.2832; pts.push([x + Math.cos(a) * rr * 0.12, y + Math.sin(a) * rr * 0.12, 26.5], [x + Math.cos(a) * rr * 0.5, y + Math.sin(a) * rr * 0.5, 26.5]); } else if (i % 3 === 1) pts.push(...ringXY(x, y, rr * 0.5, 26.5, 20)); });
  g.add(kit.lines(pts, 'lo'));
  return kit.merge(g);
}

// a pendant lamp for over a table: the shade's lower rim at `rim` above the floor, a cord up to 2700. form: dome | globe | cone | cluster | rattan | linear
export function pendantForm(kit, { form = 'dome', rim = 1950, r = 220, seed = 1, canopy = 'disc' } = {}) {
  const g = kit.group(), T = kit.THREE, R = rnd(seed), top = 2700;
  const cord = (x, y0, z) => g.add(rod(kit, [x, y0, z], [x, top, z], 4, 4, 'lo'));
  if (form === 'globe') { g.add(kit.solid(new T.SphereGeometry(r * 0.8, 28, 20), 0, rim + r * 0.8, 0, { smooth: true })); cord(0, rim + r * 1.6, 0); }
  else if (form === 'cone') { g.add(kit.cyl(0, rim, 0, r, r * 0.9, { rTop: r * 0.18, seg: 36 })); g.add(kit.cyl(0, rim + r * 0.9, 0, r * 0.2, r * 0.12, { seg: 16, tone: 'lo' })); cord(0, rim + r * 1.02, 0); }
  else if (form === 'cluster') for (let i = 0; i < 3; i++) { const x = (i - 1) * r * 0.85, rr = r * (0.38 + 0.12 * ((i * 5) % 3)), y = rim + (i === 1 ? r * 0.5 : 0); g.add(kit.solid(new T.SphereGeometry(rr, 20, 14), x, y + rr, 0, { smooth: true })); cord(x, y + rr * 2, 0); }
  else if (form === 'rattan') { g.add(kit.solid(new T.SphereGeometry(r, 28, 18, 0, 6.2832, 0, 2.1), 0, rim + r * 0.9, 0, { smooth: true, tone: 'lo' })); const wp = []; for (let k = 1; k < 6; k++) { const a = k / 6 * 2.1, rr = Math.sin(a) * r * 1.01; wp.push(...ringXZ(0, rim + r * 0.9 + Math.cos(a) * r, 0, rr, 32)); } g.add(kit.lines(wp, 'mid')); cord(0, rim + r * 1.9, 0); }
  else if (form === 'linear') { const L = r * 4; g.add(kit.cyl(-L / 2, rim + 30, 0, 30, L, { axis: 'x', seg: 20 })); for (const s of [-1, 1]) { cord(s * L * 0.35, rim + 60, 0); } g.add(kit.lines([[-L / 2 + 20, rim + 5, 31], [L / 2 - 20, rim + 5, 31]], 'lo')); }
  else { g.add(kit.solid(new T.SphereGeometry(r, 32, 14, 0, 6.2832, 0, 1.45), 0, rim + r * 0.18, 0, { smooth: true })); g.add(kit.cyl(0, rim + r * 0.18 + r * 0.98, 0, r * 0.12, r * 0.14, { seg: 16, tone: 'lo' })); cord(0, rim + r * 1.3, 0); }
  if (canopy === 'bar') g.add(kit.cyl(-r * 0.5, top - 20, 0, 18, r, { axis: 'x', seg: 12, tone: 'lo' })); else g.add(kit.cyl(0, top - 24, 0, 60, 24, { seg: 20, tone: 'lo' }));
  return kit.merge(g);
}
