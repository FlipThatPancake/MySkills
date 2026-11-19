// @js:library-variants — more than one form for the things that repeat in every room (plants, vases, cushions, pictures), so two views never show the same one.
// Each asset takes `form` (0 to N-1; compose.mjs picks it from the seed) on top of its usual params; form 0 is the original drawing.
import { floorPlant as floorPlant0, vase as vase0 } from './decor.js';
import { picture as picture0 } from './living.js';
import { plant as plant0 } from '../kitchen/plant.js';
import { fridge as fridge0 } from '../kitchen/fridge.js';
import { stool as stool0 } from './living.js';
import { basket as basket0 } from './decor.js';
import { PAINTINGS } from './paintings.js';
import { potTop } from './pots.js';
import { fiddle, palm, monstera, snake, fern, pothos, basil, smallFern, vaseStems } from './plants.js';
const rimTop = (kit, g, r, y) => { const t = potTop(kit, r); t.position.y = y; g.add(t); };
const rnd = (seed) => { let r = (seed || 1) * 9301 + 49297; return () => { r = (r * 9301 + 49297) % 233280; return r / 233280; }; };
const lo = { tone: 'lo' };
const leafAt = (kit, x, y, z, sx, sy, rx, rz) => { const T = kit.THREE, ge = new T.SphereGeometry(1, 14, 8); ge.scale(sx, sy, 12); const l = kit.solid(ge, x, y, z, { smooth: true, leaf: true }); l.rotation.set(rx, 0, rz); return l; };

export const FORMS = { floorPlant: 5, plant: 6, vase: 4, picture: 4, fridge: 3, stool: 3, basket: 3 };

export function floorPlant(kit, { form = 0, h = 950, seed = 6 } = {}) {   // form 0 fiddle-leaf fig | 1 palm | 2 monstera | 3 snake plant | 4 fern (plants.js); the old ellipse drawings are gone
  return [fiddle, palm, monstera, snake, fern][form % 5](kit, { h, seed });
  if (!form) return floorPlant0(kit, { h, seed });
  const g = kit.group(), R = rnd(seed + form * 7), pts = [];
  if (form === 1) {   // a palm: a slim trunk and a fan of long leaves, in a tall round pot
    g.add(kit.cyl(0, 0, 0, 150, 420, { rTop: 190, seg: 32, ...lo }));rimTop(kit, g, 190, 420);
    const top = h - 40; g.add(kit.cyl(0, 440, 0, 22, top - 440, { rTop: 16, seg: 12 }));
    for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2 + R(), len = 190 + R() * 90; let px = 0, py = top, pz = 0; for (let i = 1; i <= 6; i++) { const t = i / 6, nx = Math.sin(a) * len * t, nz = Math.cos(a) * len * t, ny = top + 120 * Math.sin(t * 2.4) - 190 * t * t; pts.push([px, py, pz], [nx, ny, nz]); px = nx; py = ny; pz = nz; } g.add(leafAt(kit, px * 0.6, py + 30, pz * 0.6, 26, 120, Math.cos(a) * 0.9, -Math.sin(a) * 0.9)); }
  } else if (form === 2) {   // a rounded bush on a low wide pot: many small leaves on short stems
    g.add(kit.cyl(0, 0, 0, 200, 300, { rTop: 235, seg: 32, ...lo }));rimTop(kit, g, 235, 300);
    for (let k = 0; k < 22; k++) { const a = R() * 6.28, r = 40 + R() * 150, y = 340 + R() * (h - 520), x = Math.sin(a) * r, z = Math.cos(a) * r; pts.push([0, 330, 0], [x, y, z]); g.add(leafAt(kit, x, y + 30, z, 52, 62, R() - 0.5, R() - 0.5)); }
  } else {   // a snake plant: stiff upright blades in a square planter
    g.add(kit.box(-170, 0, 170, 340, 360, 340, lo)); g.add(kit.box(-185, 360, 185, 370, 24, 370));
    for (let k = 0; k < 11; k++) { const a = R() * 6.28, r = R() * 110, x = Math.sin(a) * r, z = Math.cos(a) * r, len = 360 + R() * (h - 700), tilt = (R() - 0.5) * 0.35; const ge = new kit.THREE.SphereGeometry(1, 12, 8); ge.scale(34, len / 2, 9); const b = kit.solid(ge, x, 400 + len / 2, z, { smooth: true, leaf: true }); b.rotation.z = tilt; b.rotation.x = (R() - 0.5) * 0.3; g.add(b); }
  }
  if (pts.length) g.add(kit.lines(pts, 'green'));
  return kit.merge(g);
}

export function plant(kit, { form = 0, seed = 6 } = {}) {   // the small pot on a worktop or shelf: 0 the original blades | 1 round bush | 2 cactus | 3 trailing pothos | 4 basil | 5 small fern
  if (form === 3) return pothos(kit, { seed }); if (form === 4) return basil(kit, { seed }); if (form === 5) return smallFern(kit, { seed });
  if (!form) return plant0(kit);
  const g = kit.group(), R = rnd(form * 11), pts = [];
  if (form === 1) {   // a small round bush
    g.add(kit.cyl(0, 0, 0, 46, 70, { rTop: 56, seg: 20, ...lo }));rimTop(kit, g, 56, 70);
    for (let k = 0; k < 12; k++) { const a = R() * 6.28, r = R() * 40; pts.push([0, 70, 0], [Math.sin(a) * r, 110 + R() * 70, Math.cos(a) * r]); g.add(leafAt(kit, Math.sin(a) * r, 130 + R() * 60, Math.cos(a) * r, 24, 28, R() - 0.5, R() - 0.5)); }
  } else if (form === 2) {   // a cactus: a ribbed green column with two arms and a few spines
    g.add(kit.cyl(0, 0, 0, 44, 60, { rTop: 52, seg: 20, ...lo }));rimTop(kit, g, 52, 60);
    const arm = (x, y, hh, r) => { g.add(kit.cyl(x, y, 0, r, hh, { rTop: r * 0.92, seg: 20, leaf: true })); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.2832; pts.push([x + Math.cos(a) * r, y + 4, Math.sin(a) * r], [x + Math.cos(a) * r * 0.95, y + hh - 4, Math.sin(a) * r * 0.95]); } };   // the ribs: lines along the column
    arm(0, 60, 170, 28); g.add(kit.cyl(0, 230, 0, 24, 6, { rTop: 14, seg: 20, leaf: true })); arm(30, 118, 66, 12); g.add(kit.cyl(30 - 18, 126, 0, 8, 22, { axis: 'x', seg: 12, leaf: true })); arm(-30, 100, 50, 11);
    for (let k = 0; k < 14; k++) { const a = k * 2.4, y = 80 + (k * 37) % 140; pts.push([Math.cos(a) * 28, y, Math.sin(a) * 28], [Math.cos(a) * 36, y + 4, Math.sin(a) * 36]); }   // a few spines
  } else {   // trailing leaves hanging over the rim
    g.add(kit.cyl(0, 0, 0, 50, 80, { rTop: 58, seg: 20, ...lo }));rimTop(kit, g, 58, 80);
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28, x = Math.sin(a) * 58, z = Math.cos(a) * 58; pts.push([0, 90, 0], [x * 0.6, 150, z * 0.6], [x * 0.6, 150, z * 0.6], [x * 1.2, 40 + R() * 40, z * 1.2]); g.add(leafAt(kit, x * 1.2, 50, z * 1.2, 20, 26, 0.4, 0.4)); }
  }
  if (pts.length) g.add(kit.lines(pts, 'green'));
  return kit.merge(g);
}

export function vase(kit, { form = 0, h = 280, stems = 5, seed = 3 } = {}) {   // 0 the bottle vase with bare twigs and buds (decor.js) | 1 eucalyptus | 2 leafy branches | 3 olive twigs (plants.js)
  if (!form) return vase0(kit, { h, stems, seed });
  return vaseStems(kit, { form, h, stems, seed });
}

// Forms 4+: a classic public-domain painting (paintings.js) on a paper mat inside the frame. colour keep (a little muted, to sit with the scene) | soft (mostly faded to the paper tone) | ink (greyscale, near the line style); the seed picks one when unset.
const PAPER = [244, 243, 238], LOADED = new Map();
function adapt(q, x, y, w, h, mode) {
  const d = q.getImageData(x, y, w, h), a = d.data, k = { keep: 0.18, soft: 0.6, ink: 0.28 }[mode] ?? 0.18;
  for (let i = 0; i < a.length; i += 4) {
    let r = a[i], g = a[i + 1], b = a[i + 2]; const l = 0.3 * r + 0.59 * g + 0.11 * b;
    if (mode === 'ink') r = g = b = l; else { const m = mode === 'soft' ? 0.45 : 0.82; r = l + (r - l) * m; g = l + (g - l) * m; b = l + (b - l) * m; }   // desaturate: soft by more
    a[i] = r + (PAPER[0] - r) * k; a[i + 1] = g + (PAPER[1] - g) * k; a[i + 2] = b + (PAPER[2] - b) * k;
  }
  q.putImageData(d, x, y);
}
function paintedPicture(kit, { form, w, h, seed, colour }) {
  const T = kit.THREE, F = 28, D = 24, P = PAINTINGS[(form - 4) % PAINTINGS.length], mode = colour || ['keep', 'soft', 'ink'][seed % 3], iw = w - 2 * F, ih = h - 2 * F;
  const g = kit.group(); g.add(kit.rbox(-w / 2, 0, D, w, h, D, 4)); g.add(kit.box(-w / 2 + F, F, D + 4, iw, ih, 4, { tone: 'lo' }));
  const out = kit.merge(g);
  const cw = 480, ch = Math.max(120, Math.min(720, Math.round(cw * ih / iw))), c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const q = c.getContext('2d'); q.fillStyle = `rgb(${PAPER})`; q.fillRect(0, 0, cw, ch);
  const mat = kit.paint(c), m = new T.Mesh(new T.PlaneGeometry(iw, ih), mat); m.position.set(0, F + ih / 2, D + 8); out.add(m);   // 4 mm in front of the mat face (D + 4), the mat 4 mm in front of the frame: closer and the two planes fight in the depth buffer at a distance, which showed as flicker
  const mm = 0.09, bw = cw * (1 - 2 * mm), bh = ch * (1 - 2 * mm), s = Math.min(bw / P.w, bh / P.h), dw = Math.round(P.w * s), dh = Math.round(P.h * s), dx = Math.round((cw - dw) / 2), dy = Math.round((ch - dh) / 2);   // the painting fitted inside a paper mat, keeping its own proportions
  if (typeof Image !== 'undefined') {   // the page decodes the JPEG, then draws it (the node checks have no image decoder and keep the blank mat)
    const draw = (img) => { q.drawImage(img, dx, dy, dw, dh); adapt(q, dx, dy, dw, dh, mode); mat.uniforms.uMap.value.needsUpdate = true; };
    let img = LOADED.get(P.src); if (!img) { img = new Image(); img.src = P.src; LOADED.set(P.src, img); }
    if (img.complete && img.naturalWidth) draw(img); else img.addEventListener('load', () => draw(img));
  }
  out.userData.painting = P.name;
  return out;
}
export function picture(kit, { form = 0, w = 600, h = 800, seed = 2, colour } = {}) {
  if (!form) return picture0(kit, { w, h, seed });
  if (form >= 4) return paintedPicture(kit, { form, w, h, seed, colour });
  const F = 28, D = 24, R = rnd(seed + form * 3), pts = [], g = kit.group();
  g.add(kit.rbox(-w / 2, 0, D, w, h, D, 4)); g.add(kit.box(-w / 2 + F, F, D + 4, w - 2 * F, h - 2 * F, 4, lo));
  const x0 = -w / 2 + F + 36, x1 = w / 2 - F - 36, y0 = F + 36, y1 = h - F - 36, z = D + 7, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const ring = (x, y, r, n = 26) => { for (let i = 0; i < n; i++) { const a = i / n * 6.2832, b = (i + 1) / n * 6.2832; pts.push([x + r * Math.cos(a), y + r * Math.sin(a), z], [x + r * Math.cos(b), y + r * Math.sin(b), z]); } };
  if (form === 1) { const r = Math.min((x1 - x0) * 0.3, (y1 - y0) * 0.42); ring(cx - r * 0.5, cy + r * 0.1, r); ring(cx + r * 0.7, cy - r * 0.1, r * 0.7); pts.push([x0, y0 + (y1 - y0) * 0.12, z], [x1, y0 + (y1 - y0) * 0.12, z]); }   // two overlapping circles
  else if (form === 2) {   // a botanical branch: a ground line, a curving stem and pairs of leaf outlines, so it reads as a plant, not a crack
    const leaf = (x, y, a, len, wd) => { const n = 10, side = (sg) => Array.from({ length: n + 1 }, (_, k) => { const t = k / n, u = Math.sin(Math.PI * Math.pow(t, 0.8)) * wd * sg; return [x + Math.cos(a) * len * t - Math.sin(a) * u, y + Math.sin(a) * len * t + Math.cos(a) * u, z]; }); for (const sg of [-1, 1]) { const q = side(sg); for (let k = 0; k < n; k++) pts.push(q[k], q[k + 1]); } };
    pts.push([x0, y0, z], [x1, y0, z]);
    let px = cx, py = y0; const wx = (x1 - x0), hy = (y1 - y0), L = Math.min(wx * 0.3, hy * 0.2);
    for (let i = 1; i <= 8; i++) {
      const nx = cx + Math.sin(i * 0.6 + R()) * wx * 0.08, ny = y0 + hy * i / 8; pts.push([px, py, z], [nx, ny, z]);
      if (i > 1 && ny < y1 - L * 0.7) for (const sd of [-1, 1]) leaf(nx, ny, sd > 0 ? 0.55 + R() * 0.2 : Math.PI - 0.55 - R() * 0.2, L * (0.85 + 0.2 * R()), L * 0.14);
      px = nx; py = ny;
    }
    leaf(px, py, Math.PI / 2, Math.min(L * 0.7, y1 - py), L * 0.1);
  }
  else if (form === 3) { for (let i = 0; i <= 3; i++) for (let k = 0; k <= 3; k++) if ((i + k) % 2 === 0) { const sx = (x1 - x0) / 4, sy = (y1 - y0) / 4; pts.push([x0 + i * sx, y0 + k * sy, z], [x0 + (i + 1) * sx * 0.9, y0 + k * sy, z], [x0 + (i + 1) * sx * 0.9, y0 + k * sy, z], [x0 + (i + 1) * sx * 0.9, y0 + (k + 1) * sy * 0.9, z], [x0 + (i + 1) * sx * 0.9, y0 + (k + 1) * sy * 0.9, z], [x0 + i * sx, y0 + (k + 1) * sy * 0.9, z], [x0 + i * sx, y0 + (k + 1) * sy * 0.9, z], [x0 + i * sx, y0 + k * sy, z]); } }   // a grid of squares
  g.add(kit.lines(pts, 'mid'));
  return kit.merge(g);
}

// a fridge: form 0 side-by-side (910 x 2250, magnets and notes), 1 a tall column with a freezer drawer below (600 x 1850), 2 an under-counter fridge (600 x 850). Doors stand at z = 0.
export function fridge(kit, { form = 0 } = {}) {
  if (!form) return fridge0(kit);
  const g = kit.group(), W = 600, D = 640, H = form === 1 ? 1850 : 850, pts = [];
  g.add(kit.box(25, 0, -25, W - 50, 40, D - 45)); g.add(kit.rbox(0, 40, -2, W, H - 40, D - 2, 22));
  const door = (y0, y1) => g.add(kit.rbox(0, y0, 0, W, y1 - y0, 22, 8, lo));
  if (form === 1) { door(42, 560); door(566, H - 4); for (const [x, y, h] of [[W - 60, 380, 160], [W - 60, 700, 700]]) { g.add(kit.cyl(x, y, 28, 9, h)); for (const yy of [y + 30, y + h - 30]) g.add(kit.cyl(x, yy, 12, 6, 18, { axis: 'z' })); } pts.push([0, 563, 12], [W, 563, 12]); }
  else { door(42, H - 4); g.add(kit.cyl(W - 60, H - 330, 28, 9, 240)); for (const yy of [H - 300, H - 120]) g.add(kit.cyl(W - 60, yy, 12, 6, 18, { axis: 'z' })); g.add(kit.box(0, H - 4, -2, W, 4, D - 2, lo)); }
  if (pts.length) g.add(kit.lines(pts, 'mid'));
  return kit.merge(g);
}
// a stool: form 0 the bar stool; 1 a low round wooden stool on three splayed legs; 2 a wooden chair-height stool with a low back
export function stool(kit, { form = 0, h = 650 } = {}) {
  if (!form) return stool0(kit, { h });
  const T = kit.THREE, g = kit.group(), leg = (a, b, r) => { const A = new T.Vector3(...a), B = new T.Vector3(...b), d = B.clone().sub(A), m = kit.solid(new T.CylinderGeometry(r * 0.8, r, d.length(), 10), 0, 0, 0, { smooth: true, ...lo }); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); return m; };
  if (form === 1) { const top = Math.min(h, 460) - 38; g.add(kit.cyl(0, top, 0, 170, 38, { rTop: 165, seg: 32 })); for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.5; g.add(leg([Math.cos(a) * 110, top, Math.sin(a) * 110], [Math.cos(a) * 165, 0, Math.sin(a) * 165], 15)); } }
  else { const top = 460 - 34, S = 190; g.add(kit.rbox(-S, top, S, 2 * S, 34, 2 * S, 10)); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(leg([sx * 140, top, sz * 140], [sx * 168, 0, sz * 168], 14)); for (const sx of [-1, 1]) g.add(leg([sx * 150, top + 30, -S + 20], [sx * 150, top + 270, -S + 20], 11)); g.add(kit.rbox(-165, top + 190, -S + 14, 330, 90, 24, 10)); }
  return kit.merge(g);
}
// a basket: form 0 the blanket basket; 1 a low round tray basket with two rope handles; 2 a tall lidded wicker hamper
export function basket(kit, { form = 0, r = 230, h = 320, fill = 'empty' } = {}) {
  if (!form) return basket0(kit, { r, h });
  const T = kit.THREE, g = kit.group(), pts = [];
  const ring = (y, rr) => { for (let i = 0; i < 36; i++) { const a = i / 36 * 6.2832, b = (i + 1) / 36 * 6.2832; pts.push([Math.cos(a) * rr, y, Math.sin(a) * rr], [Math.cos(b) * rr, y, Math.sin(b) * rr]); } };
  if (form === 1) {   // an open wicker tub: a hollow wall with a rolled, woven rim, two loop handles, and (fill: 'produce') fruit and a loaf standing in it
    const hh = 230, rf = r * 0.78, rt = r * 1.08, wall = 16, P = [[0.01, 0], [rf, 0], [rf * 1.03, 8]];
    for (let k = 1; k <= 6; k++) { const t = k / 6; P.push([rf + (rt - rf) * t + 2 * Math.sin(t * 3), 8 + (hh - 8) * t]); }
    P.push([rt + 5, hh + 4], [rt + 2, hh + 11], [rt - wall * 0.45, hh + 12], [rt - wall, hh + 4], [rt - wall - 3, hh - 20], [rf * 0.9, 34], [0.01, 28]);
    g.add(kit.solid(new T.LatheGeometry(P.map(([x, y]) => new T.Vector2(x, y)), 40), 0, 0, 0, { smooth: true, tone: 'lo' }));
    for (const f of [0.18, 0.36, 0.54, 0.72, 0.9]) ring(hh * f + 8, rf + (rt - rf) * f + 3);
    for (let i = 0; i < 44; i++) { const a = i / 44 * 6.2832, rr = rf + (rt - rf) * 0.5 + 3, y0 = 8 + hh * (0.18 + 0.18 * (i % 2)), y1 = y0 + hh * 0.18; pts.push([Math.cos(a) * (rr * (y0 / hh * 0.4 + 0.85)), y0, Math.sin(a) * (rr * (y0 / hh * 0.4 + 0.85))], [Math.cos(a) * rr * 1.0 * (y1 / hh * 0.4 + 0.85), y1, Math.sin(a) * rr * 1.0 * (y1 / hh * 0.4 + 0.85)]); }   // the weave: short uprights between the rings
    for (let i = 0; i < 48; i++) { const a = i / 48 * 6.2832; pts.push([Math.cos(a) * (rt + 3), hh + 7, Math.sin(a) * (rt + 3)], [Math.cos(a + 0.09) * (rt + 3), hh + 1, Math.sin(a + 0.09) * (rt + 3)]); }   // the rolled rim: slanted ties
    for (const s of [-1, 1]) { const hd = kit.solid(new T.TorusGeometry(44, 7, 8, 20, Math.PI), s * (rt - 4), hh - 26, 0, { smooth: true, tone: 'lo' }); hd.rotation.z = s > 0 ? -Math.PI / 2 : Math.PI / 2; g.add(hd); }
    if (fill === 'produce') for (const [x, z, k, sz] of [[-0.35, 0.1, 0, 52], [0.1, -0.28, 1, 48], [0.38, 0.12, 0, 50], [-0.05, 0.3, 2, 46], [0.12, 0.05, 1, 54]]) {
      const ge = new T.SphereGeometry(1, 18, 12); ge.scale(sz * (k === 2 ? 1.5 : 1), sz * (k === 2 ? 0.8 : 0.95), sz); const fx = x * rt, fz = z * rt, y = hh - 26 + (x * x + z * z < 0.05 ? 14 : 0) + sz * 0.5;
      g.add(kit.solid(ge, fx, y, fz, { smooth: true, tone: k === 1 ? 'mid' : 'lo' })); if (k !== 2) pts.push([fx, y + sz * 0.9, fz], [fx + 5, y + sz * 0.9 + 14, fz + 3]);
    }
  }
  else { const hh = 560, rr = r * 0.78; g.add(kit.cyl(0, 0, 0, rr, hh, { rTop: rr * 1.04, seg: 36, ...lo })); g.add(kit.cyl(0, hh, 0, rr * 1.08, 50, { rTop: rr * 1.04, seg: 36 })); g.add(kit.cyl(0, hh + 50, 0, 36, 26, { seg: 16, ...lo })); for (let k = 1; k < 7; k++) ring(hh * k / 7, rr * 1.01 + 1); for (let i = 0; i < 20; i++) { const a = i / 20 * 6.2832; pts.push([Math.cos(a) * (rr + 1), 8, Math.sin(a) * (rr + 1)], [Math.cos(a) * (rr * 1.04 + 1), hh - 8, Math.sin(a) * (rr * 1.04 + 1)]); } }
  g.add(kit.lines(pts, 'mid'));
  return kit.merge(g);
}
