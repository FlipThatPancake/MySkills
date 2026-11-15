// @js:library-pieces — base assets built on a parameter space (meta.js SPACE): side table, cushion, pot. Each takes its space's parameters; unset ones fall back to the plain look, compose.mjs deals the rest from the seed.
// sideTable({ r, h, top 'round'|'square'|'rounded', legs, shelf 'low'|'none', drawer 'none'|handle style, tone }) — floor piece, origin the middle of the foot.
// cushion({ w, h, thick, piping, pattern, tone, lean }) — stands on a seat on its edge; origin the middle of its foot, front toward +z; lean tilts it back (15 to 25 against a seat back).
// pot({ r, tall, profile, saucer, plant, tone, seed }) — origin the middle of its foot (on a surface: y 'top').
import { legs as legParts, handle } from './parts.js';
import { softBox, vessel, PROFILES, onFace } from './soft.js';
const rnd = (seed) => { let r = (seed || 1) * 9301 + 49297; return () => { r = (r * 9301 + 49297) % 233280; return r / 233280; }; };

export function sideTable(kit, { r = 230, h = 520, top = 'round', legs = 'splay', shelf = 'low', drawer = 'none', tone } = {}) {
  const g = kit.group(), T = 30, round = top === 'round', lr = r * 0.62, pts = [];
  const props = { tone };
  if (round) g.add(kit.cyl(0, h - T, 0, r, T, { rTop: r - 5, seg: 40, ...props }));
  else g.add(kit.rbox(-r, h - T, r, 2 * r, T, 2 * r, top === 'rounded' ? r * 0.45 : 8, props));
  if (round) for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3 + 0.5; pts.push([Math.cos(a) * lr, Math.sin(a) * lr]); }
  else for (const sx of [-1, 1]) for (const sz of [-1, 1]) pts.push([sx * (r - 38), sz * (r - 38)]);
  g.add(legParts(kit, legs, pts, h - T + 4, { r: 20, out: [0, 0] }));
  const ls = Math.min(170, h * 0.32);
  if (shelf === 'low' && legs !== 'sled') { if (round) g.add(kit.cyl(0, ls, 0, lr + 40, 18, { seg: 36, tone: 'lo' })); else g.add(kit.rbox(-r + 22, ls, r - 22, 2 * r - 44, 18, 2 * r - 44, 6, { tone: 'lo' })); }
  if (drawer !== 'none' && !round) {
    const a = r - 26, dh = Math.min(110, h * 0.2);
    g.add(kit.rbox(-a, h - T - dh, a, 2 * a, dh, 2 * a, 6, { tone: 'lo' }));
    g.add(kit.lines([[-a + 8, h - T - dh + 8, a + 1], [a - 8, h - T - dh + 8, a + 1], [a - 8, h - T - 8, a + 1], [-a + 8, h - T - 8, a + 1], [-a + 8, h - T - 8, a + 1], [-a + 8, h - T - dh + 8, a + 1], [a - 8, h - T - 8, a + 1], [a - 8, h - T - dh + 8, a + 1]], 'lo'));
    g.add(handle(kit, drawer, 0, h - T - dh / 2, a, { w: Math.min(90, a) }));
  }
  return kit.merge(g);
}

export function cushion(kit, { w = 440, h = 420, thick = 120, tone = 'mid', piping = 'none', pattern = 'plain', lean = 0 } = {}) {
  const g = kit.group(), bulge = thick * 0.32, b = softBox(kit, w, h, thick, { r: Math.min(70, thick * 0.5), bulge, piping, tone, dent: pattern === 'tufted' ? 0 : thick * 0.09, dentAt: [w * 0.03, h * 0.05] });
  b.position.y = h / 2; g.add(b);
  const shape = { bulge, dent: pattern === 'tufted' ? 0 : thick * 0.09, dentAt: [w * 0.03, h * 0.05] }, pr = [], m = Math.min(56, w * 0.12), y0 = -h / 2, face = (a) => onFace(w, h, thick, shape, a);
  if (pattern === 'stripes') for (let i = 1; i < 6; i++) pr.push([-w / 2 + m, y0 + h * i / 6], [w / 2 - m, y0 + h * i / 6]);
  else if (pattern === 'inset') pr.push([-w / 2 + m, y0 + m], [w / 2 - m, y0 + m], [w / 2 - m, y0 + m], [w / 2 - m, y0 + h - m], [w / 2 - m, y0 + h - m], [-w / 2 + m, y0 + h - m], [-w / 2 + m, y0 + h - m], [-w / 2 + m, y0 + m]);
  else if (pattern === 'diamond') pr.push([-w / 2 + m, 0], [0, h / 2 - m], [0, h / 2 - m], [w / 2 - m, 0], [w / 2 - m, 0], [0, -h / 2 + m], [0, -h / 2 + m], [-w / 2 + m, 0]);
  else if (pattern === 'tufted') for (const fx of [-0.22, 0.22]) for (const fy of [-0.2, 0.2]) { const x = fx * w, y = fy * h; pr.push([x - 9, y], [x + 9, y], [x, y - 9], [x, y + 9], [x, y], [x * 0.35, y * 0.35]); }
  else pr.push([-w * 0.2, -h * 0.22], [-w * 0.02, -h * 0.1], [w * 0.1, h * 0.1], [w * 0.2, h * 0.2]);   // a plain pillow carries a soft crease
  const pts = face(pr).map(([x, y, z]) => [x, y + h / 2, z]);
  if (pts.length) g.add(kit.lines(pts, 'lo'));
  const out = kit.merge(g); out.rotation.x = -lean * Math.PI / 180; return out;
}

const leafAt = (kit, x, y, z, sx, sy, rx, rz) => { const T = kit.THREE, ge = new T.SphereGeometry(1, 12, 8); ge.scale(sx, sy, 10); const l = kit.solid(ge, x, y, z, { smooth: true, leaf: true }); l.rotation.set(rx, 0, rz); return l; };
export function pot(kit, { r = 110, tall = 1.2, profile = 'straight', saucer = 'yes', plant = 'sprig', tone, seed = 4 } = {}) {
  const g = kit.group(), h = r * tall, foot = saucer === 'yes' ? 14 : 0, R = rnd(seed), pts = [];
  if (foot) g.add(kit.cyl(0, 0, 0, r * 0.78, foot, { rTop: r * 0.86, seg: 36, tone: 'lo' }));
  const v = vessel(kit, (PROFILES[profile] || PROFILES.straight)(r, h), { seg: 36, tone, contents: 'soil' }); v.position.y = foot; g.add(v);
  const top = foot + h, rim = r * (profile === 'belly' ? 0.9 : profile === 'urn' ? 0.95 : 1);
  if (plant === 'sprig') for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28 + R(), len = 50 + R() * 40, x = Math.sin(a) * rim * 0.3, z = Math.cos(a) * rim * 0.3, tx = x + Math.sin(a) * len * 0.5, tz = z + Math.cos(a) * len * 0.5, ty = top + len; pts.push([x, top - 6, z], [tx, ty, tz]); g.add(leafAt(kit, tx, ty, tz, 20 + r * 0.08, 30 + r * 0.12, Math.cos(a) * 0.5, -Math.sin(a) * 0.5)); }
  else if (plant === 'bush') for (let k = 0; k < 14; k++) { const a = R() * 6.28, d = R() * rim * 0.65, x = Math.sin(a) * d, z = Math.cos(a) * d, y = top + 30 + R() * r * 1.1; pts.push([x * 0.3, top - 6, z * 0.3], [x, y, z]); g.add(leafAt(kit, x, y + 10, z, 22 + r * 0.1, 30 + r * 0.14, R() - 0.5, R() - 0.5)); }
  if (pts.length) g.add(kit.lines(pts, 'green'));
  return kit.merge(g);
}
