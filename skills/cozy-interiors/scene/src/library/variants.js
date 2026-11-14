// @js:library-variants — more than one form for the things that repeat in every room (plants, vases, cushions, pictures), so two views never show the same one.
// Each asset takes `form` (0 to N-1; compose.mjs picks it from the seed) on top of its usual params; form 0 is the original drawing.
import { floorPlant as floorPlant0, vase as vase0, cushion as cushion0 } from './decor.js';
import { picture as picture0 } from './living.js';
import { plant as plant0 } from '../kitchen/plant.js';
const rnd = (seed) => { let r = (seed || 1) * 9301 + 49297; return () => { r = (r * 9301 + 49297) % 233280; return r / 233280; }; };
const lo = { tone: 'lo' };
const leafAt = (kit, x, y, z, sx, sy, rx, rz) => { const T = kit.THREE, ge = new T.SphereGeometry(1, 14, 8); ge.scale(sx, sy, 12); const l = kit.solid(ge, x, y, z, { smooth: true }); l.rotation.set(rx, 0, rz); return l; };

export const FORMS = { floorPlant: 4, plant: 4, vase: 4, cushion: 4, picture: 4 };

export function floorPlant(kit, { form = 0, h = 950, seed = 6 } = {}) {
  if (!form) return floorPlant0(kit, { h, seed });
  const g = kit.group(), R = rnd(seed + form * 7), pts = [];
  if (form === 1) {   // a palm: a slim trunk and a fan of long leaves, in a tall round pot
    g.add(kit.cyl(0, 0, 0, 150, 420, { rTop: 190, seg: 32, ...lo })); g.add(kit.cyl(0, 420, 0, 190, 22, { seg: 32 }));
    const top = h - 40; g.add(kit.cyl(0, 440, 0, 22, top - 440, { rTop: 16, seg: 12 }));
    for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2 + R(), len = 190 + R() * 90; let px = 0, py = top, pz = 0; for (let i = 1; i <= 6; i++) { const t = i / 6, nx = Math.sin(a) * len * t, nz = Math.cos(a) * len * t, ny = top + 120 * Math.sin(t * 2.4) - 190 * t * t; pts.push([px, py, pz], [nx, ny, nz]); px = nx; py = ny; pz = nz; } g.add(leafAt(kit, px * 0.6, py + 30, pz * 0.6, 26, 120, Math.cos(a) * 0.9, -Math.sin(a) * 0.9)); }
  } else if (form === 2) {   // a rounded bush on a low wide pot: many small leaves on short stems
    g.add(kit.cyl(0, 0, 0, 200, 300, { rTop: 235, seg: 32, ...lo })); g.add(kit.cyl(0, 300, 0, 235, 22, { seg: 32 }));
    for (let k = 0; k < 22; k++) { const a = R() * 6.28, r = 40 + R() * 150, y = 340 + R() * (h - 520), x = Math.sin(a) * r, z = Math.cos(a) * r; pts.push([0, 330, 0], [x, y, z]); g.add(leafAt(kit, x, y + 30, z, 52, 62, R() - 0.5, R() - 0.5)); }
  } else {   // a snake plant: stiff upright blades in a square planter
    g.add(kit.box(-170, 0, 170, 340, 360, 340, lo)); g.add(kit.box(-185, 360, 185, 370, 24, 370));
    for (let k = 0; k < 11; k++) { const a = R() * 6.28, r = R() * 110, x = Math.sin(a) * r, z = Math.cos(a) * r, len = 360 + R() * (h - 700), tilt = (R() - 0.5) * 0.35; const ge = new kit.THREE.SphereGeometry(1, 12, 8); ge.scale(34, len / 2, 9); const b = kit.solid(ge, x, 400 + len / 2, z, { smooth: true }); b.rotation.z = tilt; b.rotation.x = (R() - 0.5) * 0.3; g.add(b); }
  }
  if (pts.length) g.add(kit.lines(pts, 'mid'));
  return kit.merge(g);
}

export function plant(kit, { form = 0 } = {}) {   // the small pot on a worktop or shelf
  if (!form) return plant0(kit);
  const g = kit.group(), R = rnd(form * 11), pts = [];
  if (form === 1) {   // a small round bush
    g.add(kit.cyl(0, 0, 0, 46, 70, { rTop: 56, seg: 20, ...lo }));
    for (let k = 0; k < 12; k++) { const a = R() * 6.28, r = R() * 40; pts.push([0, 70, 0], [Math.sin(a) * r, 110 + R() * 70, Math.cos(a) * r]); g.add(leafAt(kit, Math.sin(a) * r, 130 + R() * 60, Math.cos(a) * r, 24, 28, R() - 0.5, R() - 0.5)); }
  } else if (form === 2) {   // a cactus
    g.add(kit.cyl(0, 0, 0, 44, 60, { rTop: 52, seg: 20, ...lo })); g.add(kit.cyl(0, 60, 0, 28, 160, { rTop: 24, seg: 20 })); g.add(kit.cyl(32, 118, 0, 12, 60, { rTop: 11, seg: 12 })); g.add(kit.cyl(-30, 100, 0, 12, 46, { rTop: 11, seg: 12 }));
  } else {   // trailing leaves hanging over the rim
    g.add(kit.cyl(0, 0, 0, 50, 80, { rTop: 58, seg: 20, ...lo }));
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28, x = Math.sin(a) * 58, z = Math.cos(a) * 58; pts.push([0, 90, 0], [x * 0.6, 150, z * 0.6], [x * 0.6, 150, z * 0.6], [x * 1.2, 40 + R() * 40, z * 1.2]); g.add(leafAt(kit, x * 1.2, 50, z * 1.2, 20, 26, 0.4, 0.4)); }
  }
  if (pts.length) g.add(kit.lines(pts, 'mid'));
  return kit.merge(g);
}

export function vase(kit, { form = 0, h = 280, stems = 5, seed = 3 } = {}) {
  if (!form) return vase0(kit, { h, stems, seed });
  const g = kit.group(), R = rnd(seed + form * 5), pts = [];
  if (form === 1) {   // a round jug with tall straight dried grasses
    g.add(kit.cyl(0, 0, 0, 80, h * 0.45, { rTop: 85, seg: 24 })); g.add(kit.cyl(0, h * 0.45, 0, 85, h * 0.3, { rTop: 42, seg: 24 }));
    for (let s = 0; s < 9; s++) { const a = (s - 4) * 0.12 + R() * 0.05, len = 520 + R() * 260; pts.push([0, h * 0.75, 0], [Math.sin(a) * len, h * 0.75 + Math.cos(a) * len, 0]); g.add(leafAt(kit, Math.sin(a) * len, h * 0.75 + Math.cos(a) * len, 0, 9, 38, 0, -a)); }
  } else if (form === 2) {   // a low cylinder with three big leaves
    g.add(kit.cyl(0, 0, 0, 70, h * 0.7, { rTop: 70, seg: 24 }));
    for (let s = 0; s < 3; s++) { const a = (s - 1) * 0.35, len = 360 + R() * 160; pts.push([0, h * 0.7, 0], [Math.sin(a) * len * 0.7, h * 0.7 + len * 0.9, 0]); g.add(leafAt(kit, Math.sin(a) * len * 0.7, h * 0.7 + len * 0.95, 0, 70, 130, 0, -a)); }
  } else {   // a bowl-shaped vase with a few round blossoms
    g.add(kit.cyl(0, 0, 0, 40, h * 0.3, { rTop: 80, seg: 24 })); g.add(kit.cyl(0, h * 0.3, 0, 80, h * 0.25, { rTop: 60, seg: 24 }));
    for (let s = 0; s < 5; s++) { const a = (s - 2) * 0.3, len = 260 + R() * 150, x = Math.sin(a) * len, y = h * 0.55 + Math.cos(a) * len; pts.push([0, h * 0.55, 0], [x, y, 0]); g.add(leafAt(kit, x, y, 0, 38, 38, 0, 0)); }
  }
  g.add(kit.lines(pts, 'mid'));
  return kit.merge(g);
}

export function cushion(kit, { form = 0, w = 440, h = 420, tone = 'mid' } = {}) {
  if (!form) return cushion0(kit, { w, h, tone });
  const g = kit.group(), D = 120, z = D / 2 + 1, pts = [];
  g.add(kit.rbox(-w / 2, 0, D / 2, w, h, D, 70, { tone }));
  if (form === 1) for (let i = 1; i < 6; i++) pts.push([-w / 2 + 40, h * i / 6, z], [w / 2 - 40, h * i / 6, z]);   // stripes
  else if (form === 2) for (let i = 0; i < 28; i++) { const a = i / 28 * 6.2832, b = (i + 1) / 28 * 6.2832, r = Math.min(w, h) * 0.26; pts.push([r * Math.cos(a), h / 2 + r * Math.sin(a), z], [r * Math.cos(b), h / 2 + r * Math.sin(b), z]); }   // a ring
  else pts.push([-w / 2 + 50, h / 2, z], [0, h - 50, z], [0, h - 50, z], [w / 2 - 50, h / 2, z], [w / 2 - 50, h / 2, z], [0, 50, z], [0, 50, z], [-w / 2 + 50, h / 2, z]);   // a diamond
  g.add(kit.lines(pts, 'lo'));
  return kit.merge(g);
}

export function picture(kit, { form = 0, w = 600, h = 800, seed = 2 } = {}) {
  if (!form) return picture0(kit, { w, h, seed });
  const F = 28, D = 24, R = rnd(seed + form * 3), pts = [], g = kit.group();
  g.add(kit.rbox(-w / 2, 0, D, w, h, D, 4)); g.add(kit.box(-w / 2 + F, F, D + 2, w - 2 * F, h - 2 * F, 2, lo));
  const x0 = -w / 2 + F + 36, x1 = w / 2 - F - 36, y0 = F + 36, y1 = h - F - 36, z = D + 4.5, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const ring = (x, y, r, n = 26) => { for (let i = 0; i < n; i++) { const a = i / n * 6.2832, b = (i + 1) / n * 6.2832; pts.push([x + r * Math.cos(a), y + r * Math.sin(a), z], [x + r * Math.cos(b), y + r * Math.sin(b), z]); } };
  if (form === 1) { const r = (x1 - x0) * 0.3; ring(cx - r * 0.5, cy + r * 0.3, r); ring(cx + r * 0.7, cy - r * 0.3, r * 0.7); pts.push([x0, y0 + (y1 - y0) * 0.12, z], [x1, y0 + (y1 - y0) * 0.12, z]); }   // two overlapping circles
  else if (form === 2) { let px = cx, py = y0; for (let i = 1; i <= 10; i++) { const nx = cx + Math.sin(i * 0.7 + R()) * (x1 - x0) * 0.12, ny = y0 + (y1 - y0) * i / 10; pts.push([px, py, z], [nx, ny, z]); if (i > 2) { const sd = i % 2 ? 1 : -1; pts.push([nx, ny, z], [nx + sd * (x1 - x0) * 0.22, ny + (y1 - y0) * 0.06, z]); } px = nx; py = ny; } }   // a botanical stem
  else { for (let i = 0; i <= 3; i++) for (let k = 0; k <= 3; k++) if ((i + k) % 2 === 0) { const sx = (x1 - x0) / 4, sy = (y1 - y0) / 4; pts.push([x0 + i * sx, y0 + k * sy, z], [x0 + (i + 1) * sx * 0.9, y0 + k * sy, z], [x0 + (i + 1) * sx * 0.9, y0 + k * sy, z], [x0 + (i + 1) * sx * 0.9, y0 + (k + 1) * sy * 0.9, z], [x0 + (i + 1) * sx * 0.9, y0 + (k + 1) * sy * 0.9, z], [x0 + i * sx, y0 + (k + 1) * sy * 0.9, z], [x0 + i * sx, y0 + (k + 1) * sy * 0.9, z], [x0 + i * sx, y0 + k * sy, z]); } }   // a grid of squares
  g.add(kit.lines(pts, 'mid'));
  return kit.merge(g);
}
