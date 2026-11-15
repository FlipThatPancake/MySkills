// @js:library-kitchenset — the Kitchen batch: worktop things, wall things and a few small tools. Worktop pieces: origin the middle of the foot, front +z. Wall pieces: origin bottom middle on the wall face, standing out toward +z.
// dishRack, utensilCrock, breadBin, toaster, mokaPot, potRail, openShelf, spiceRack, ovenGlove, wallClock, cookbookStand.
import { rod } from './parts.js';
import { drape, softBox } from './soft.js';
import { mug } from './pieces.js';
const lo = { tone: 'lo' }, DEG = Math.PI / 180;
const rnd = (seed) => { let r = (seed || 1) * 9301 + 49297; return () => { r = (r * 9301 + 49297) % 233280; return r / 233280; }; };
const ringXY = (cx, cy, r, z, n = 28) => { const p = []; for (let i = 0; i < n; i++) { const a = i / n * 6.2832, b = (i + 1) / n * 6.2832; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, z], [cx + Math.cos(b) * r, cy + Math.sin(b) * r, z]); } return p; };
const ringXZ = (r, y, n = 28) => { const p = []; for (let i = 0; i < n; i++) { const a = i / n * 6.2832, b = (i + 1) / n * 6.2832; p.push([Math.cos(a) * r, y, Math.sin(a) * r], [Math.cos(b) * r, y, Math.sin(b) * r]); } return p; };
const tilt = (kit, m, x, y, z, rx = 0, rz = 0) => { const q = kit.group(); q.add(m); q.position.set(x, y, z); q.rotation.set(rx, 0, rz); return q; };   // a part swung about its own foot

export function dishRack(kit, { w = 480, d = 320, form = 'plates', seed = 1 } = {}) {   // a tray with a wire frame; plates or cups stand in it
  const g = kit.group(), R = rnd(seed), pts = [];
  g.add(kit.rbox(-w / 2, 0, d / 2, w, 22, d, 10));
  g.add(kit.lines([[-w / 2 + 24, 23, d / 2 - 24], [w / 2 - 24, 23, d / 2 - 24], [w / 2 - 24, 23, d / 2 - 24], [w / 2 - 24, 23, -d / 2 + 24], [w / 2 - 24, 23, -d / 2 + 24], [-w / 2 + 24, 23, -d / 2 + 24], [-w / 2 + 24, 23, -d / 2 + 24], [-w / 2 + 24, 23, d / 2 - 24]], 'lo'));
  for (const z of [-d * 0.22, d * 0.22]) g.add(rod(kit, [-w / 2 + 30, 40, z], [w / 2 - 30, 40, z], 4, 4, 'lo'));   // two rails the dishes lean on
  if (form === 'plates') {
    const n = 5, step = (w - 90) / n; for (let i = 0; i < n; i++) { const x = -w / 2 + 60 + i * step, p = kit.group(), r = 100 + R() * 14; p.add(kit.cyl(0, r, 0, r, 8, { axis: 'z', seg: 32 })); p.add(kit.lines(ringXY(0, r, r * 0.72, 4.5, 28), 'lo')); p.position.set(x, 24, -d * 0.04 + (R() - 0.5) * 20); p.rotation.y = 0.1 + R() * 0.1; p.rotation.x = -0.12; g.add(p); }
    for (let i = 0; i < n + 1; i++) { const x = -w / 2 + 44 + i * step; g.add(rod(kit, [x, 22, d * 0.22], [x, 70, d * 0.22], 3, 3, 'lo')); g.add(rod(kit, [x, 22, -d * 0.22], [x, 70, -d * 0.22], 3, 3, 'lo')); }
  } else {   // cups upside down on pegs
    const n = 4; for (let i = 0; i < n; i++) { const x = -w / 2 + 70 + i * (w - 140) / (n - 1), z = (i % 2 ? 1 : -1) * d * 0.1; g.add(rod(kit, [x, 22, z], [x, 130, z], 5, 5, 'lo')); const m = mug(kit, { r: 38, h: 88 }); const q = kit.group(); q.add(m); q.rotation.x = Math.PI; q.position.set(x, 24 + 88 + 6, z); g.add(q); }
  }
  return kit.merge(g);
}

export function utensilCrock(kit, { r = 70, h = 170, n = 5, seed = 2, style = 'plain', mix = 'mixed' } = {}) {   // a crock with wooden spoons, a spatula and a whisk standing in it
  const g = kit.group(), R = rnd(seed), T = kit.THREE, pts = [];
  g.add(kit.solid(new T.LatheGeometry([[r * 0.7, 0], [r, 8], [r * 1.02, h * 0.6], [r, h], [r - 6, h], [r - 6, 12], [0.01, 12]].map(([a, b]) => new T.Vector2(a, b)), 28), 0, 0, 0, { smooth: true }));
  if (style === 'ribbed') { const rl = []; for (let i = 0; i < 14; i++) { const a = i / 14 * 6.2832; rl.push([Math.cos(a) * r * 1.01, h * 0.12, Math.sin(a) * r * 1.01], [Math.cos(a) * r * 1.02, h * 0.92, Math.sin(a) * r * 1.02]); } g.add(kit.lines(rl, 'faint')); }
  else if (style === 'banded') { g.add(kit.lines([...ringXZ(r * 1.01, h * 0.3, 28), ...ringXZ(r * 1.01, h * 0.34, 28)], 'mid')); }
  else g.add(kit.lines([[-r * 0.99, h * 0.5, 0], [r * 0.99, h * 0.5, 0]], 'faint'));
  for (let i = 0; i < n; i++) {
    const a = i / n * 6.2832 + R(), lean = 0.12 + R() * 0.25, len = 240 + R() * 90, k = mix === 'wood' ? 0 : mix === 'whisks' ? 2 : i % 3, bx = Math.cos(a) * r * 0.35, bz = Math.sin(a) * r * 0.35, ux = Math.cos(a) * lean, uz = Math.sin(a) * lean, m = Math.hypot(ux, 1, uz), u = [ux / m, 1 / m, uz / m];
    const A = [bx, 20, bz], B = [bx + u[0] * (h + len - 20), 20 + u[1] * (h + len - 20), bz + u[2] * (h + len - 20)];
    g.add(rod(kit, A, B, 9, 9, 'lo'));
    const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(...u));
    if (k === 0) { const hd = kit.solid(new T.SphereGeometry(32, 14, 10), 0, 0, 0, { smooth: true, tone: 'lo' }); hd.scale.set(0.85, 1.25, 0.28); hd.quaternion.copy(q); hd.position.set(B[0] + u[0] * 38, B[1] + u[1] * 38, B[2] + u[2] * 38); g.add(hd); }   // a wooden spoon: an oval bowl on the handle
    else if (k === 1) { const bl = kit.solid(new T.BoxGeometry(62, 90, 6), 0, 0, 0, { tone: 'lo' }); bl.quaternion.copy(q); bl.position.set(B[0] + u[0] * 40, B[1] + u[1] * 40, B[2] + u[2] * 40); g.add(bl); }   // a spatula: a flat blade
    else { const ell = [], c = [B[0] + u[0] * 52, B[1] + u[1] * 52, B[2] + u[2] * 52], e1 = new T.Vector3(1, 0, 0).applyQuaternion(q), e2 = new T.Vector3(0, 0, 1).applyQuaternion(q); for (const e of [e1, e2]) for (let j = 0; j < 20; j++) { const a0 = j / 20 * 6.2832, a1 = (j + 1) / 20 * 6.2832; for (const an of [a0, a1]) ell.push([c[0] + (e.x * Math.cos(an) * 24) + u[0] * Math.sin(an) * 52, c[1] + (e.y * Math.cos(an) * 24) + u[1] * Math.sin(an) * 52, c[2] + (e.z * Math.cos(an) * 24) + u[2] * Math.sin(an) * 52]); } g.add(kit.lines(ell, 'mid')); }   // a whisk: two crossed loops
  }
  return kit.merge(g);
}

export function breadBin(kit, { w = 380, d = 250, h = 210, form = 'roll', seed = 3 } = {}) {   // a bread bin: a roll-top front, or a hinged lid ajar with a loaf showing
  const g = kit.group(), R = rnd(seed), pts = [];
  g.add(kit.rbox(-w / 2, 0, d / 2, w, h * 0.78, d, 16));
  if (form === 'roll') {
    g.add(kit.cyl(-w / 2 + 6, h * 0.78 - 4, 0, d * 0.5 - 2, w - 12, { axis: 'x', seg: 28, tone: 'mid' }));   // the tambour
    for (let i = 1; i < 6; i++) { const a = (i / 6) * 3.1416; pts.push([-w / 2 + 12, h * 0.78 - 4 + Math.sin(a) * (d * 0.5), Math.cos(a) * (d * 0.5) + 0.6], [w / 2 - 12, h * 0.78 - 4 + Math.sin(a) * (d * 0.5), Math.cos(a) * (d * 0.5) + 0.6]); }
    g.add(kit.cyl(0, h * 0.45, d / 2 + 6, 9, 14, { axis: 'z', seg: 10, tone: 'lo' }));
  } else {
    const lid = kit.group(); lid.add(kit.rbox(-w / 2, 0, d, w, 26, d, 10)); lid.position.set(0, h * 0.78, -d / 2); lid.rotation.x = -(9 + R() * 5) * DEG; g.add(lid); g.add(kit.cyl(-w / 2 + 20, h * 0.78 + 4, -d / 2 + 4, 8, w - 40, { axis: 'x', seg: 10, tone: 'lo' }));   // hinged at the back, resting on the rim, a hinge bar along it
    const loaf = kit.cyl(-w * 0.3, h * 0.62, 0, 52, w * 0.6, { axis: 'x', seg: 18, tone: 'lo' }); g.add(loaf);
    pts.push([-w * 0.25, h * 0.62 + 52, 30], [-w * 0.18, h * 0.62 + 40, 40]);
  }
  g.add(kit.lines(pts, 'lo'));
  return kit.merge(g);
}

export function toaster(kit, { w = 300, d = 170, h = 190, form = 'square', slots = 2 } = {}) {   // a two-slot toaster with a lever and a slice sticking out
  const g = kit.group(), pts = [], T = kit.THREE;
  g.add(kit.rbox(-w / 2, 20, d / 2, w, h - 20, d, form === 'retro' ? 60 : 22));
  g.add(kit.box(-w / 2 + 20, 0, d / 2 - 14, 30, 22, 30, lo)); g.add(kit.box(w / 2 - 50, 0, d / 2 - 14, 30, 22, 30, lo)); g.add(kit.box(-w / 2 + 20, 0, -d / 2 + 44, 30, 22, 30, lo)); g.add(kit.box(w / 2 - 50, 0, -d / 2 + 44, 30, 22, 30, lo));
  for (const x of slots === 4 ? [-w * 0.27, -w * 0.09, w * 0.09, w * 0.27] : [-w * 0.2, w * 0.2]) pts.push([x - 36, h + 0.6, -d * 0.3], [x - 36, h + 0.6, d * 0.3], [x + 36, h + 0.6, -d * 0.3], [x + 36, h + 0.6, d * 0.3], [x - 36, h + 0.6, -d * 0.3], [x + 36, h + 0.6, -d * 0.3], [x - 36, h + 0.6, d * 0.3], [x + 36, h + 0.6, d * 0.3]);
  g.add(kit.rbox(-w * 0.2 - 50, h - 40, 14, 100, 80, 20, 14, lo));   // a slice sticking out
  g.add(kit.box(w / 2 + 2, h * 0.55, 12, 10, 18, 24, lo)); g.add(kit.box(w / 2 + 2, h * 0.55 - 6, 12, 28, 10, 24, lo));   // the lever
  pts.push([-w * 0.2, h - 22, 16], [-w * 0.2 + 40, h - 30, 16]);
  g.add(kit.lines(pts, 'lo'));
  return kit.merge(g);
}

export function mokaPot(kit, { r = 62, h = 210, sides = 8, handle = 'black' } = {}) {   // an eight-sided stovetop coffee pot: waisted, a spout, a black handle, a knob
  const g = kit.group();
  g.add(kit.cyl(0, 0, 0, r, h * 0.42, { rTop: r * 0.72, seg: sides })); g.add(kit.cyl(0, h * 0.42, 0, r * 0.62, 10, { seg: 8, tone: 'lo' }));
  g.add(kit.cyl(0, h * 0.42 + 10, 0, r * 0.7, h * 0.48, { rTop: r * 0.86, seg: sides }));
  g.add(kit.cyl(0, h * 0.9, 0, r * 0.9, 16, { seg: 8, tone: 'lo' })); g.add(kit.solid(new kit.THREE.SphereGeometry(r * 0.2, 12, 8), 0, h * 0.9 + 28, 0, { smooth: true, tone: 'lo' }));
  { const hr = handle === 'wood' ? 11 : 8, ht = handle === 'wood' ? 'mid' : 'lo'; g.add(rod(kit, [r * 0.8, h * 0.84, 0], [r * 1.5, h * 0.7, 0], hr, hr, ht)); g.add(rod(kit, [r * 1.5, h * 0.7, 0], [r * 1.45, h * 0.36, 0], hr, hr, ht)); g.add(rod(kit, [r * 1.45, h * 0.36, 0], [r * 0.82, h * 0.34, 0], hr, hr, ht)); }
  g.add(kit.lines([[0, 10, r * 0.98], [0, h * 0.42, r * 0.7], [0, h * 0.52, r * 0.74], [0, h * 0.9, r * 0.9]], 'faint'));
  return kit.merge(g);
}

// ---- on the wall ---------------------------------------------------------------------------------------------------------------------------------
export function potRail(kit, { w = 900, n = 4, seed = 4, mix = 'mixed' } = {}) {   // a rail with S-hooks: ladle, skillet, saucepan, sieve
  const g = kit.group(), R = rnd(seed), T = kit.THREE, yR = 520, z = 60;
  for (const s of [-1, 1]) g.add(rod(kit, [s * (w / 2 - 20), yR, 0], [s * (w / 2 - 20), yR, z], 8, 8, 'lo'));
  g.add(kit.cyl(-w / 2, yR, z, 8, w, { axis: 'x', seg: 12, tone: 'lo' }));
  const kinds = mix === 'pans' ? ['skillet', 'saucepan', 'skillet', 'saucepan'] : mix === 'tools' ? ['ladle', 'sieve', 'ladle', 'sieve'] : ['skillet', 'ladle', 'saucepan', 'sieve']; let x = -w / 2 + 120;
  for (let i = 0; i < n && x < w / 2 - 80; i++) {
    const k = kinds[(i + Math.floor(R() * 4)) % 4], hook = (xx) => g.add(rod(kit, [xx, yR + 6, z], [xx, yR - 40, z], 3.5, 3.5, 'lo'));
    hook(x);
    if (k === 'ladle') { g.add(rod(kit, [x, yR - 40, z], [x, yR - 290, z + 6], 6, 6, 'lo')); g.add(kit.cyl(x, yR - 330, z + 18, 46, 20, { axis: 'z', seg: 24, tone: 'lo' })); g.add(kit.cyl(x, yR - 330, z + 20, 34, 6, { axis: 'z', seg: 22 })); g.add(kit.lines(ringXY(x, yR - 330, 30, z + 21, 20), 'lo')); x += 150; }   // a ladle: a round bowl facing out
    else if (k === 'skillet') { const r = 105 + R() * 25; g.add(rod(kit, [x, yR - 40, z], [x, yR - 160, z], 7, 7, 'lo')); g.add(kit.cyl(x, yR - 160 - r, z + 8, r, 22, { axis: 'z', seg: 30, tone: 'lo' })); g.add(kit.lines(ringXY(x, yR - 160 - r, r * 0.78, z + 9, 26), 'mid')); x += r * 2 + 40; }
    else if (k === 'saucepan') { const r = 80; g.add(rod(kit, [x, yR - 40, z], [x, yR - 130, z], 7, 7, 'lo')); g.add(kit.cyl(x, yR - 130 - r * 1.5, z + 6, r, 70, { axis: 'z', seg: 28 })); g.add(kit.lines(ringXY(x, yR - 130 - r * 1.5, r * 0.8, z + 7, 24), 'mid')); x += r * 2 + 50; }
    else { const r = 70; g.add(rod(kit, [x, yR - 40, z], [x, yR - 110, z], 5, 5, 'lo')); g.add(kit.cyl(x, yR - 110 - r, z + 6, r, 26, { axis: 'z', seg: 26, tone: 'lo' })); const m = []; for (let j = -3; j <= 3; j++) m.push([x + j * 18, yR - 110 - r - 55, z + 7], [x + j * 18, yR - 110 - r + 55, z + 7]); g.add(kit.lines(m, 'faint')); x += r * 2 + 40; }
  }
  return kit.merge(g);
}

export function openShelf(kit, { w = 1000, plates = 6, mugs = 3, seed = 5, rack = 'plates' } = {}) {   // a board on brackets with a plate rack of standing plates and mugs on hooks beneath
  const g = kit.group(), R = rnd(seed), d = 230, yb = 120;
  g.add(kit.rbox(-w / 2, yb, d, w, 30, d, 6));
  for (const s of [-1, 1]) { g.add(rod(kit, [s * (w / 2 - 80), yb, 20], [s * (w / 2 - 80), yb - 90, 20], 9, 9, 'lo')); g.add(rod(kit, [s * (w / 2 - 80), yb - 90, 20], [s * (w / 2 - 80), yb, d - 20], 7, 7, 'lo')); }
  const n = Math.min(plates, 8), step = Math.min(70, (w * 0.62) / n), x0 = -w / 2 + 90; g.add(rod(kit, [x0 - 20, yb + 36, d - 60], [x0 + step * n + 20, yb + 36, d - 60], 4, 4, 'lo'));
  if (rack === 'bowls') for (let i = 0; i < Math.ceil(n / 2); i++) { const bx0 = x0 + 70 + i * 170; g.add(kit.cyl(bx0, yb + 30, d * 0.5, 60, 40 + (i % 2) * 20, { rTop: 80, seg: 28 })); g.add(kit.cyl(bx0, yb + 70 + (i % 2) * 20, d * 0.5, 76, 8, { seg: 28, tone: 'lo' })); }
  else if (rack === 'jars') for (let i = 0; i < Math.ceil(n / 2); i++) { const bx0 = x0 + 50 + i * 120, hh = 140 + (i % 3) * 30; g.add(kit.cyl(bx0, yb + 30, d * 0.5, 44, hh, { seg: 20 })); g.add(kit.cyl(bx0, yb + 30 + hh, d * 0.5, 48, 14, { seg: 20, tone: 'lo' })); }
  else for (let i = 0; i < n; i++) { const p = kit.group(), r = 100; p.add(kit.cyl(0, r, 0, r, 8, { axis: 'z', seg: 32 })); p.add(kit.lines(ringXY(0, r, r * 0.72, 4.5), 'lo')); p.position.set(x0 + i * step, yb + 30, d * 0.5); p.rotation.x = -0.1; g.add(p); }
  const mx0 = x0 + step * n + 120; for (let i = 0; i < mugs && mx0 + i * 120 < w / 2 - 40; i++) { const x = mx0 + i * 120; g.add(rod(kit, [x, yb, d - 30], [x, yb - 36, d - 30], 3, 3, 'lo')); const m = mug(kit, { r: 40, h: 88 }); const q = kit.group(); q.add(m); q.position.set(x, yb - 100 + R() * 6, d - 30 + 0); q.rotation.y = (R() - 0.5) * 0.6; g.add(q); }
  return kit.merge(g);
}

export function spiceRack(kit, { w = 480, rows = 2, seed = 6, style = 'jars' } = {}) {   // two narrow shelves with a lip, small jars with lids in a row
  const g = kit.group(), R = rnd(seed), pts = [], rh = 150, d = 90;
  for (let r = 0; r < rows; r++) {
    const y = 30 + r * rh; g.add(kit.box(-w / 2, y, d, w, 14, d, lo)); g.add(kit.box(-w / 2, y + 14, d, w, 16, 8, lo));
    let x = -w / 2 + 40; while (x < w / 2 - 40) { const hh = style === 'tins' ? 40 + R() * 14 : 70 + R() * 30, rr = style === 'tins' ? 38 + R() * 6 : 26 + R() * 6; g.add(kit.cyl(x + rr, y + 30, d / 2 + 6, rr, hh, { seg: 16 })); g.add(kit.cyl(x + rr, y + 30 + hh, d / 2 + 6, rr + 2, 12, { seg: 16, tone: 'lo' })); pts.push([x + rr - rr * 0.6, y + 30 + hh * 0.3, d / 2 + 6 + rr + 0.6], [x + rr + rr * 0.6, y + 30 + hh * 0.3, d / 2 + 6 + rr + 0.6]); x += rr * 2 + 14 + R() * 10; }
  }
  for (const s of [-1, 1]) g.add(kit.box(s * (w / 2) - 7, 20, d, 14, (rows - 1) * rh + 130, d, lo));
  g.add(kit.lines(pts, 'faint'));
  return kit.merge(g);
}

export function ovenGlove(kit, { hand = 'left' } = {}) {   // a quilted mitt hanging from a hook: origin at the hook on the wall face
  const g = kit.group(), sg = hand === 'left' ? 1 : -1, w0 = 0.4; g.add(kit.cyl(0, 0, 14, 9, 22, { axis: 'z', seg: 10, tone: 'lo' })); g.add(kit.solid(new kit.THREE.SphereGeometry(13, 12, 8), 0, 0, 28, { smooth: true, tone: 'lo' }));
  g.add(kit.rbox(-85, -300, 58, 170, 270, 28, 60, { tone: 'mid' }));   // the mitt
  g.add(kit.rbox(-80, -334, 60, 160, 50, 34, 18, { tone: 'lo' }));   // the cuff
  const th = kit.group(); th.add(kit.rbox(-30, -130, 55, 60, 130, 24, 28, { tone: 'mid' })); th.position.set(sg * 98, -190, 0); th.rotation.z = -sg * 0.55; g.add(th);   // the thumb
  const q = [[-60, -110, 62], [60, -110, 62], [-60, -170, 62], [60, -170, 62], [-60, -230, 62], [60, -230, 62]];   // three quilt lines
  g.add(kit.lines(q, 'faint')); g.add(kit.lines([[0, -6, 30], [-30, -64, 50], [0, -6, 30], [30, -64, 50]], 'mid'));
  return kit.merge(g);
}

export function wallClock(kit, { r = 170, form = 'round', seed = 7, face = 'ticks', rim = 'thin' } = {}) {   // origin bottom middle on the wall: a disc with a rim, ticks and two hands
  const g = kit.group(), R = rnd(seed), cy = r + 10, pts = [], z = 30;
  if (form === 'square') g.add(kit.rbox(-r, 10, 28, 2 * r, 2 * r, 28, 14)); else g.add(kit.cyl(0, cy, 28, r, 28, { axis: 'z', seg: 40 }));
  g.add(kit.cyl(0, cy, 31, r * (rim === 'thick' ? 0.74 : 0.84), 3, { axis: 'z', seg: 40, ...lo }));
  if (face !== 'plain') for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832, c = Math.cos(a), s = Math.sin(a), l = i % 3 === 0 ? 0.2 : 0.1; if (face === 'dots') pts.push(...ringXY(c * r * 0.68, cy + s * r * 0.68, 7, z + 3, 8)); else pts.push([c * r * 0.68, cy + s * r * 0.68, z + 3], [c * r * (0.68 - l), cy + s * r * (0.68 - l), z + 3]); }
  const ha = R() * 6.2832, ma = ha * 12 % 6.2832; pts.push([0, cy, z + 3], [Math.cos(ha) * r * 0.42, cy + Math.sin(ha) * r * 0.42, z + 3], [0, cy, z + 3], [Math.cos(ma) * r * 0.62, cy + Math.sin(ma) * r * 0.62, z + 3]);
  g.add(kit.lines(pts, 'mid'));
  return kit.merge(g);
}

export function cookbookStand(kit, { w = 300, seed = 8, tilt: tl = 18, ledge = 'plain' } = {}) {   // a wooden stand: a tilted board, a front ledge, an open book held on it
  const g = kit.group(), R = rnd(seed), pts = [], h = 300, bd = 24;
  const board = kit.group(); board.add(kit.rbox(-w / 2, 0, bd, w, h, bd, 6)); board.position.set(0, 14, -40); board.rotation.x = -tl * DEG; g.add(board);
  if (ledge === 'rail') { g.add(rod(kit, [-w / 2, 40, 100], [w / 2, 40, 100], 9, 9, 'lo')); for (const sx of [-1, 1]) g.add(rod(kit, [sx * w / 2, 0, 100], [sx * w / 2, 40, 100], 8, 8, 'lo')); } else g.add(kit.box(-w / 2, 0, 90, w, 30, 40, lo));
  for (const s of [-1, 1]) g.add(rod(kit, [s * (w / 2 - 20), 20, -60], [s * (w / 2 - 20), 20, 80], 8, 8, 'lo'));
  const book = kit.group(); for (const s of [-1, 1]) { const pg = kit.box(s > 0 ? 3 : -w * 0.44 - 3, 0, 22, w * 0.44, h * 0.8, 14, {}); book.add(pg); }
  for (let i = 0; i < 7; i++) { const y = h * 0.1 + i * 28, l = w * (0.25 + R() * 0.15); pts.push([-w * 0.4, y, 24], [-w * 0.4 + l, y, 24], [w * 0.05, y, 24], [w * 0.05 + l, y, 24]); }
  const bl = kit.group(); bl.add(book); bl.add(kit.lines(pts, 'lo')); bl.position.set(0, 44, -34); bl.rotation.x = -tl * DEG; g.add(bl);
  return kit.merge(g);
}
