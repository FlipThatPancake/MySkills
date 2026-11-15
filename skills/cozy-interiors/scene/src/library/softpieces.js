// @js:library-softpieces — soft household things built on the soft toolkit (soft.js): a coat hung on a hook, a tote bag, a shoe, a pouf. Each returns parts to add to a group; units mm.
import { softBox, drape, pillowGeometry } from './soft.js';
const lo = { tone: 'lo' };
// A coat on a hanger at (x, y, z): y is the hook, the coat hangs below. Shoulders are a soft yoke, the body and the two sleeves are cloth with folds, the collar a small roll.
export function coat(kit, x, y, z, { w = 400, len = 900, tone = 'lo' } = {}) {
  const g = kit.group(), T = kit.THREE;
  const body = drape(kit, w - 60, len - 70, { folds: 3, depth: 34, thick: 34, flare: 0.2, phase: 0.8, slope: 70, tone }); body.position.set(x, y - 60, z); g.add(body);
  for (const s of [-1, 1]) { const sl = drape(kit, 120, len * 0.72, { folds: 2, depth: 22, thick: 30, flare: 0.05, phase: s, slope: 20, tone }); sl.position.set(x + s * (w / 2 - 6), y - 100, z + 34); sl.rotation.z = s * 0.1; sl.rotation.x = -0.05; g.add(sl); }
  const col = softBox(kit, 190, 60, 70, { r: 24, bulge: 8, tone }); col.position.set(x, y - 34, z + 6); g.add(col);
  const hook = kit.solid(new T.TorusGeometry(26, 4, 8, 20, Math.PI * 1.5), x, y + 18, z, { smooth: true, tone: 'lo' }); g.add(hook);
  const fl = [[x, y - 90, z + 40], [x, y - len + 80, z + 40]]; for (const k of [0.3, 0.5, 0.7]) fl.push([x - 8, y - len * k, z + 41], [x + 8, y - len * k, z + 41]);   // the front opening and its buttons
  g.add(kit.lines(fl, 'mid'));
  return g;
}
// A tote bag whose top edge sits at y: a soft body with two handle loops, one seam.
export function tote(kit, x, y, z, { w = 300, h = 330, d = 120, tone = 'mid' } = {}) {
  const g = kit.group(), T = kit.THREE, body = softBox(kit, w, h, d, { r: 34, bulge: 26, piping: 'edge', tone }); body.position.set(x, y - h / 2, z); g.add(body);
  for (const s of [-1, 1]) { const hd = kit.solid(new T.TorusGeometry(w * 0.26, 6, 8, 24, Math.PI), x, y - 4, z + s * d * 0.28, { smooth: true }); g.add(hd); }
  return g;
}
// A shoe standing at (x, 0, z), toe toward +z, length L: its side silhouette extruded across the width and bevelled soft, a sole with a heel, an opening with a tongue.
export function shoe(kit, x, z, L = 280, o = {}) {
  const g = kit.group(), T = kit.THREE, tone = o.tone, W = L * 0.34, k = L / 280, P = [[-0.5, 20], [0.47, 20], [0.5, 34], [0.43, 58], [0.24, 78], [0.03, 112], [-0.08, 108], [-0.13, 82], [-0.34, 76], [-0.46, 96], [-0.5, 70]];
  const sh = new T.Shape(P.map(([u, v]) => new T.Vector2(u * L, v * k + 2))), bev = 14 * k;
  const geo = new T.ExtrudeGeometry(sh, { depth: W - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev * 0.9, bevelSegments: 4, curveSegments: 8 }); geo.translate(0, 0, -(W - 2 * bev) / 2); geo.rotateY(-Math.PI / 2);
  g.add(kit.solid(geo, x, 0, z, { smooth: true, tone }));
  g.add(kit.rbox(x - W / 2 - 3, 0, z + L / 2 + 4, W + 6, 20, L + 8, 9, { tone: 'lo' }));
  g.add(kit.box(x - W / 2, 0, z - L / 2 + 62, W, 30, 62, { tone: 'lo' }));   // the heel
  const pts = [], cx = x, cz = z - L * 0.24, a = W * 0.34, b = L * 0.11, yy = 76 * k + 6; for (let i = 0; i < 18; i++) { const p = i / 18 * 6.2832, q = (i + 1) / 18 * 6.2832; pts.push([cx + Math.cos(p) * a, yy, cz + Math.sin(p) * b], [cx + Math.cos(q) * a, yy, cz + Math.sin(q) * b]); }
  pts.push([cx - a * 0.6, yy + 28 * k, z - L * 0.1], [cx + a * 0.6, yy + 28 * k, z - L * 0.1]);   // the tongue's top edge
  g.add(kit.lines(pts, 'mid'));
  return g;
}
// A pouf: a soft drum, fuller at the shoulder, with a seam round the middle and one button in the top.
export function poufBody(kit, r, h, tone) {
  const g = kit.group(), T = kit.THREE, pr = [[0.01, 0], [r * 0.82, 0], [r * 0.96, h * 0.1], [r * 1.02, h * 0.45], [r * 0.99, h * 0.8], [r * 0.82, h * 0.95], [r * 0.45, h * 0.99], [0.01, h * 0.93]].map(([a, b]) => new T.Vector2(a, b));
  g.add(kit.solid(new T.LatheGeometry(pr, 40), 0, 0, 0, { smooth: true, tone }));
  const seam = [], n = 40; for (let i = 0; i < n; i++) { const a = i / n * 6.2832, b = (i + 1) / n * 6.2832, rr = r * 1.02 + 1; seam.push([Math.cos(a) * rr, h * 0.45, Math.sin(a) * rr], [Math.cos(b) * rr, h * 0.45, Math.sin(b) * rr]); }
  seam.push([-9, h * 0.93 + 1, 0], [9, h * 0.93 + 1, 0], [0, h * 0.93 + 1, -9], [0, h * 0.93 + 1, 9]);
  g.add(kit.lines(seam, 'lo'));
  return g;
}
