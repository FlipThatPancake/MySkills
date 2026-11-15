// @js:library-livingset — the Living batch: more forms for the living room's repeating pieces, each a generator with a parameter space (meta.js SPACE).
// Floor pieces: origin the middle of the footprint on the floor, front toward +z. galleryWall and scratches: origin bottom middle on the wall face (or any vertical face), standing out toward +z.
// chair(kit, { shape: 'wing' | 'cane' | 'sling', w, d, tone }), chaise (a sofa's extra unit), coffeeShape(kit, shape, w, d, h), floorCushion, logBasket, woodStove, recordPlayer, magazineRack, plantStand, galleryWall, scratches.
import { softBox, pillowGeometry } from './soft.js';
import { rod, legs as legParts } from './parts.js';
import { pot } from './pieces.js';
import { picture } from './living.js';
const lo = { tone: 'lo' }, DEG = Math.PI / 180;
const rnd = (seed) => { let r = (seed || 1) * 9301 + 49297; return () => { r = (r * 9301 + 49297) % 233280; return r / 233280; }; };
const bx = (kit) => (cx, y, cz, w, h, d, o) => kit.box(cx - w / 2, y, cz + d / 2, w, h, d, o), rb = (kit) => (cx, y, cz, w, h, d, r, o) => kit.rbox(cx - w / 2, y, cz + d / 2, w, h, d, r, o);
const ring = (r, y, n = 28, cx = 0, cz = 0) => { const p = []; for (let i = 0; i < n; i++) { const a = i / n * 6.2832, b = (i + 1) / n * 6.2832; p.push([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r], [cx + Math.cos(b) * r, y, cz + Math.sin(b) * r]); } return p; };

// ---- armchair shapes -------------------------------------------------------------------------------------------------------------------------------
export function chair(kit, { shape = 'wing', w = 840, d = 860, tone = 'mid', seed = 1 } = {}) {
  const g = kit.group(), B = bx(kit), R = rb(kit);
  if (shape === 'wing') {   // a deep upholstered chair: tall back, two wings, rolled arms, turned legs
    const legH = 150, y0 = legH + 130;
    g.add(legParts(kit, 'turned', [[-w / 2 + 70, -d / 2 + 70], [w / 2 - 70, -d / 2 + 70], [-w / 2 + 70, d / 2 - 70], [w / 2 - 70, d / 2 - 70]], legH + 6, { r: 30, tone }));
    g.add(kit.rbox(-w / 2, legH, d / 2, w, 130, d, 30, { tone }));
    const back = softBox(kit, w - 150, 780, 190, { r: 80, bulge: 26, tone, piping: 'edge' }); back.position.set(0, y0 + 360, -d / 2 + 150); back.rotation.x = -8 * DEG; g.add(back);
    for (const s of [-1, 1]) {
      g.add(kit.rbox(s * (w / 2 - 75) - 75, y0 - 20, d / 2 - 30, 150, 400, d - 70, 36, { tone }));   // the arm
      g.add(kit.cyl(s * (w / 2 - 75), y0 + 360, d / 2 - 30, 78, d - 90, { axis: 'z', seg: 20, tone }));   // its roll
      const wing = softBox(kit, 150, 520, 230, { r: 60, bulge: 16, tone }); wing.position.set(s * (w / 2 - 80), y0 + 520, -d / 2 + 190); wing.rotation.y = -s * 14 * DEG; g.add(wing);
    }
    const pad = softBox(kit, w - 330, d - 330, 140, { r: 52, bulge: 18, tone, dent: 8 }); pad.rotation.x = -Math.PI / 2; pad.position.set(0, y0 + 70, 20); g.add(pad);
  } else if (shape === 'cane') {   // an open timber frame with a cane back, thin arm rails, a loose seat cushion
    const lh = 260, sh = 410, rr = 23, X = w / 2 - 30, Z = d / 2 - 40, pts = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(rod(kit, [sx * X, 0, sz * Z], [sx * X, sh, sz * Z], rr * 1.2, rr, 'mid'));
    for (const sx of [-1, 1]) { g.add(rod(kit, [sx * X, sh, -Z], [sx * X, 640, -Z + 10], rr, rr, 'mid')); g.add(rod(kit, [sx * X, sh, Z], [sx * X, 610, Z - 40], rr, rr, 'mid')); g.add(rod(kit, [sx * X, 640, -Z + 10], [sx * X, 610, Z - 40], 22, 22, 'mid')); }   // posts and the arm rail
    g.add(rod(kit, [-X, sh, Z], [X, sh, Z], rr, rr, 'mid')); g.add(rod(kit, [-X, sh - 40, -Z], [X, sh - 40, -Z], rr, rr, 'mid'));
    for (const sx of [-1, 1]) g.add(rod(kit, [sx * X, sh, -Z], [sx * X, sh + 460, -Z - 40], rr, rr, 'mid'));   // the back posts lean out
    g.add(rod(kit, [-X, sh + 460, -Z - 40], [X, sh + 460, -Z - 40], 22, 22, 'mid')); g.add(rod(kit, [-X, sh + 150, -Z - 12], [X, sh + 150, -Z - 12], 16, 16, 'mid'));
    const cx0 = -X + 20, cx1 = X - 20, cy0 = sh + 170, cy1 = sh + 440, zc = -Z - 20;   // the cane panel: a woven diamond in lines
    for (let i = 0; i <= 14; i++) { const x = cx0 + (cx1 - cx0) * i / 14; pts.push([x, cy0, zc], [Math.min(cx1, x + 90), cy0 + 90, zc], [x, cy1, zc], [Math.max(cx0, x - 90), cy1 - 90, zc]); }
    for (let k = 1; k < 4; k++) pts.push([cx0, cy0 + k * 65, zc], [cx1, cy0 + k * 65, zc]);
    g.add(kit.lines(pts, 'lo'));
    const pad = softBox(kit, w - 130, d - 130, 110, { r: 42, bulge: 14, tone, dent: 6 }); pad.rotation.x = -Math.PI / 2; pad.position.set(0, sh + 62, 0); g.add(pad);
  } else {   // a sling: a leather seat-and-back hung from a bent frame
    const sh = 360, X = w / 2 - 40, Z = d / 2 - 30;
    for (const sx of [-1, 1]) { const pts = [[sx * X, 0, Z], [sx * X, sh * 0.8, Z - 30], [sx * X, sh, -Z + 160], [sx * X, 700, -Z - 60]]; for (let i = 0; i < 3; i++) g.add(rod(kit, pts[i], pts[i + 1], 15, 15, 'mid')); g.add(rod(kit, [sx * X, 0, -Z + 120], [sx * X, 0, Z], 14, 14, 'mid')); }
    const seat = softBox(kit, w - 110, 520, 70, { r: 30, bulge: 14, tone, dent: 16, sag: 6 }); seat.rotation.x = -(Math.PI / 2 - 8 * DEG); seat.position.set(0, sh + 6, 40); g.add(seat);
    const back = softBox(kit, w - 110, 520, 70, { r: 30, bulge: 14, tone }); back.rotation.x = -28 * DEG; back.position.set(0, sh + 260, -Z + 90); g.add(back);
    g.add(kit.lines([[-w / 2 + 70, sh + 30, 300], [w / 2 - 70, sh + 30, 300]], 'lo'));
  }
  return kit.merge(g);
}

// a sofa's extra unit: the chaise at one end. origin the middle of the unit's footprint on the floor, front +z (the sofa places it at the front of an end seat)
export function chaise(kit, { w = 760, len = 800, legH = 110, tone = 'mid' } = {}) {
  const g = kit.group(); g.add(legParts(kit, 'tapered', [[-w / 2 + 70, -len / 2 + 60], [w / 2 - 70, -len / 2 + 60], [-w / 2 + 70, len / 2 - 60], [w / 2 - 70, len / 2 - 60]], legH + 6, { r: 28 }));
  g.add(kit.rbox(-w / 2, legH, len / 2, w, 140, len, 14));
  const pad = softBox(kit, w - 6, len - 12, 150, { r: 52, bulge: 16, tone, dent: 6 }); pad.rotation.x = -Math.PI / 2; pad.position.set(0, legH + 140 + 75, 0); g.add(pad);
  return kit.merge(g);
}

// ---- coffee table shapes ---------------------------------------------------------------------------------------------------------------------------
export function coffeeShape(kit, shape, w, d, h) {
  const g = kit.group(), B = bx(kit), R = rb(kit), TT = 30;
  if (shape === 'round') {   // a round top on three slanting legs
    const r = Math.min(w, d) * 0.62;
    g.add(kit.cyl(0, h - TT, 0, r, TT, { seg: 44 }));
    for (let k = 0; k < 3; k++) { const a = k * 2.0944 + 0.5; g.add(rod(kit, [Math.cos(a) * r * 0.55, h - TT, Math.sin(a) * r * 0.55], [Math.cos(a) * r * 0.78, 0, Math.sin(a) * r * 0.78], 20, 15, 'mid')); }
    g.add(kit.lines(ring(r * 0.86, h + 0.5, 40), 'lo'));
  } else if (shape === 'tray') {   // a slim frame table with a lipped tray lying on it
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(rod(kit, [sx * (w / 2 - 60), h - 40, sz * (d / 2 - 50)], [sx * (w / 2 - 40), 0, sz * (d / 2 - 30)], 16, 11, 'mid'));
    g.add(R(0, h - 70, 0, w, 40, d, 8));
    const tw = w * 0.66, td = d * 0.66; g.add(R(0, h - 30, 0, tw, 22, td, 10));
    const y = h - 7; g.add(kit.lines([[-tw / 2 + 24, y, td / 2 - 24], [tw / 2 - 24, y, td / 2 - 24], [tw / 2 - 24, y, td / 2 - 24], [tw / 2 - 24, y, -td / 2 + 24], [tw / 2 - 24, y, -td / 2 + 24], [-tw / 2 + 24, y, -td / 2 + 24], [-tw / 2 + 24, y, -td / 2 + 24], [-tw / 2 + 24, y, td / 2 - 24]], 'lo'));
  } else {   // a block: a chunky slab on a recessed plinth, a deep step line
    g.add(R(0, h * 0.34, 0, w, h * 0.66, d, 16)); g.add(B(0, 0, 0, w - 120, h * 0.34 - 4, d - 100, lo));
    g.add(kit.lines([[-w / 2 + 14, h * 0.5, d / 2 + 0.6], [w / 2 - 14, h * 0.5, d / 2 + 0.6]], 'lo'));
  }
  return kit.merge(g);
}

// ---- small living-room pieces ----------------------------------------------------------------------------------------------------------------------
export function floorCushion(kit, { w = 680, thick = 150, tone = 'mid', piping = 'edge' } = {}) {
  const g = kit.group(), s = softBox(kit, w, w, thick, { r: 60, bulge: 28, piping, tone, dent: 12 }); s.rotation.x = -Math.PI / 2; s.position.y = thick / 2 + 6; g.add(s);
  return kit.merge(g);
}
export function logBasket(kit, { r = 270, h = 400, logs = 7, seed = 3 } = {}) {
  const g = kit.group(), R = rnd(seed), pts = [];
  g.add(kit.cyl(0, 0, 0, r * 0.84, h, { rTop: r, seg: 36, ...lo }));
  for (const f of [0.18, 0.4, 0.62, 0.84]) pts.push(...ring(r * (0.84 + 0.16 * f) + 1, h * f, 36));
  g.add(kit.lines(pts, 'mid'));
  g.add(kit.cyl(0, h - 4, 0, r + 6, 18, { seg: 36, tone: 'lo' }));   // the rim, a rolled edge
  for (let k = 0; k < logs; k++) {
    const a = R() * 6.28, rr = R() * r * 0.36, x = Math.cos(a) * rr, z = Math.sin(a) * rr, lr = 48 + R() * 28, len = 300 + R() * 60, y = h * 0.6 + R() * h * 0.4;
    g.add(kit.cyl(x, y, z + len / 2, lr, len, { axis: 'z', seg: 14, tone: 'lo' }));
    g.add(kit.lines([...ring(lr * 0.55, 0, 14, 0, 0).map(([px, , pz]) => [x + px, y + pz, z + len / 2 + 1]), [x - lr * 0.3, y, z + len / 2 + 1], [x + lr * 0.3, y + lr * 0.1, z + len / 2 + 1]], 'lo'));
  }
  return kit.merge(g);
}
export function woodStove(kit, { w = 520, d = 430, h = 600, flueH = 1700, seed = 2 } = {}) {
  const g = kit.group(), B = bx(kit), R = rb(kit), legH = 110;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(kit.cyl(sx * (w / 2 - 36), 0, sz * (d / 2 - 36), 18, legH, { seg: 10, tone: 'lo' }));
  g.add(R(0, legH, 0, w, h - legH - 40, d, 22));
  g.add(R(0, h - 44, 0, w + 36, 44, d + 36, 12));   // the top plate overhangs
  const dw = w * 0.62, dh = (h - legH - 40) * 0.55, dy = legH + 70, z = d / 2 + 1;   // the door and its glass
  g.add(kit.lines([[-dw / 2, dy, z], [dw / 2, dy, z], [dw / 2, dy, z], [dw / 2, dy + dh, z], [dw / 2, dy + dh, z], [-dw / 2, dy + dh, z], [-dw / 2, dy + dh, z], [-dw / 2, dy, z], [-dw / 2 + 34, dy + 34, z], [dw / 2 - 34, dy + 34, z], [dw / 2 - 34, dy + 34, z], [dw / 2 - 34, dy + dh - 34, z], [dw / 2 - 34, dy + dh - 34, z], [-dw / 2 + 34, dy + dh - 34, z], [-dw / 2 + 34, dy + dh - 34, z], [-dw / 2 + 34, dy + 34, z]], 'mid'));
  g.add(kit.cyl(dw / 2 + 24, dy + dh * 0.5 - 40, z + 22, 6, 80, { axis: 'z', seg: 8, tone: 'lo' }));   // the handle's stand-off... a short post
  g.add(kit.cyl(0, h, -d * 0.12, 80, flueH - h, { seg: 24 }));   // the flue pipe up
  for (const y of [h + 120, flueH - 260]) g.add(kit.cyl(0, y, -d * 0.12, 90, 30, { seg: 24, tone: 'lo' }));   // two collars
  return kit.merge(g);
}
export function recordPlayer(kit, { w = 760, d = 400, h = 520, seed = 4, records = 9 } = {}) {
  const g = kit.group(), R = rnd(seed), B = bx(kit), Rb = rb(kit), pts = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(rod(kit, [sx * (w / 2 - 60), h - 40, sz * (d / 2 - 50)], [sx * (w / 2 - 40), 0, sz * (d / 2 - 36)], 18, 12, 'mid'));
  g.add(Rb(0, h - 380 + 0, 0, w, 380 - 40, d, 8));   // the cabinet
  g.add(Rb(0, h - 40, 0, w + 24, 40, d + 20, 6));
  const ix0 = -w / 2 + 40, ix1 = w / 2 - 40, iy0 = h - 380 + 40, iy1 = h - 90, z = d / 2 + 1;   // the open front: records standing in a row
  pts.push([ix0, iy0, z], [ix1, iy0, z], [ix1, iy0, z], [ix1, iy1, z], [ix1, iy1, z], [ix0, iy1, z], [ix0, iy1, z], [ix0, iy0, z]);
  let x = ix0 + 24; for (let i = 0; i < records; i++) { const t = 14 + R() * 10; g.add(kit.box(x, iy0 + 4, z - 20, t, iy1 - iy0 - 30 - R() * 20, 320, lo)); x += t + 6 + R() * 8; if (x > ix1 - 60) break; }
  g.add(kit.lines(pts, 'lo'));
  const tx = -w * 0.1, ty = h;   // the turntable: a plinth, a platter with a record, a tonearm
  g.add(Rb(tx, ty, 0, 440, 70, 350, 10));
  g.add(kit.cyl(tx - 40, ty + 70, 0, 150, 12, { seg: 36, tone: 'lo' })); g.add(kit.cyl(tx - 40, ty + 82, 0, 145, 4, { seg: 36 })); g.add(kit.cyl(tx - 40, ty + 86, 0, 38, 2, { seg: 20, tone: 'lo' }));
  g.add(kit.lines([...ring(95, 0, 30).map(([px, , pz]) => [tx - 40 + px, ty + 87, pz]), [tx + 150, ty + 92, -110], [tx + 60, ty + 100, -10], [tx + 60, ty + 100, -10], [tx + 25, ty + 90, 40]], 'lo'));
  return kit.merge(g);
}
export function magazineRack(kit, { w = 400, h = 460, seed = 6 } = {}) {
  const g = kit.group(), R = rnd(seed), pts = [], d = 250;
  for (const sx of [-1, 1]) { g.add(rod(kit, [sx * w / 2, 0, d / 2 - 10], [sx * w / 2, h * 0.55, d / 2 - 40], 12, 12, 'mid')); g.add(rod(kit, [sx * w / 2, 0, -d / 2 + 10], [sx * w / 2, h, -d / 2 + 40], 12, 12, 'mid')); g.add(rod(kit, [sx * w / 2, h * 0.55, d / 2 - 40], [sx * w / 2, h, -d / 2 + 40], 11, 11, 'mid')); }
  g.add(rod(kit, [-w / 2, h, -d / 2 + 40], [w / 2, h, -d / 2 + 40], 11, 11, 'mid')); g.add(rod(kit, [-w / 2, h * 0.55, d / 2 - 40], [w / 2, h * 0.55, d / 2 - 40], 11, 11, 'mid')); g.add(rod(kit, [-w / 2, 8, d / 2 - 10], [w / 2, 8, d / 2 - 10], 10, 10, 'mid')); g.add(rod(kit, [-w / 2, 8, -d / 2 + 10], [w / 2, 8, -d / 2 + 10], 10, 10, 'mid'));
  g.add(kit.box(-w / 2 + 14, 4, d / 2 - 20, w - 28, 8, d - 30, lo));   // the base
  let x = -w / 2 + 40; for (let i = 0; i < 5 && x < w / 2 - 70; i++) { const t = 18 + R() * 18, hh = 300 + R() * 60, m = kit.box(x, 14, 40, t, hh, 210, lo); m.rotation.x = -(10 + R() * 8) * DEG; g.add(m); pts.push([x + t / 2, 70, 44], [x + t / 2, 70 + hh * 0.5, 48]); x += t + 8 + R() * 14; }
  g.add(kit.lines(pts, 'lo'));
  return kit.merge(g);
}
export function plantStand(kit, { h = 560, r = 190, tiers = 1, seed = 5, plant = 'bush' } = {}) {
  const g = kit.group();
  for (let k = 0; k < 3; k++) { const a = k * 2.0944 + 0.3; g.add(rod(kit, [Math.cos(a) * r * 0.7, h - 20, Math.sin(a) * r * 0.7], [Math.cos(a) * r * 0.95, 0, Math.sin(a) * r * 0.95], 14, 11, 'mid')); }
  g.add(kit.cyl(0, h - 20, 0, r, 26, { seg: 40 }));
  g.add(kit.lines(ring(r - 24, h + 6.5, 36), 'lo'));
  if (tiers > 1) { g.add(kit.cyl(0, h * 0.42, 0, r * 0.9, 20, { seg: 36, tone: 'lo' })); }
  const p = pot(kit, { r: r * 0.58, tall: 1.1, profile: 'tapered', plant, seed }); p.position.y = h + 6; g.add(p);
  return kit.merge(g);
}
export function galleryWall(kit, { w = 1500, h = 1100, n = 6, seed = 1 } = {}) {
  const g = kit.group(), R = rnd(seed * 17 + 3), sizes = [[300, 400], [400, 300], [240, 300], [500, 650], [350, 350], [200, 260], [600, 450]], cols = 3;
  const cell = w / cols; let placed = 0;
  for (let c = 0; c < cols && placed < n; c++) {
    let y = 40 + R() * 80; const x0 = -w / 2 + c * cell + cell / 2;
    for (let k = 0; k < 3 && placed < n; k++) {
      const [pw, ph] = sizes[Math.floor(R() * sizes.length)], sc = Math.min(1, (cell - 70) / pw, (h - y) / ph); if ((h - y) < 200) break;
      const p = picture(kit, { w: Math.round(pw * sc), h: Math.round(ph * sc), seed: Math.floor(R() * 90) + 1 }); p.position.set(x0 + (R() - 0.5) * 36, y, 0); g.add(p); y += ph * sc + 50 + R() * 40; placed++;
    }
  }
  return g;
}
// cat scratches on a vertical face (a sofa's arm, a door): origin where the middle of the marks go, drawn at z 2 facing +z; turn the asset to face the right way
export function scratches(kit, { n = 6, len = 150, seed = 1 } = {}) {
  const R = rnd(seed * 31 + 5), pts = [], a0 = 62 * DEG + (R() - 0.5) * 0.3;
  for (let k = 0; k < n; k++) { const x = (k - (n - 1) / 2) * 20 + (R() - 0.5) * 8, y = (R() - 0.5) * 30, l = len * (0.6 + 0.5 * R()), a = a0 + (R() - 0.5) * 0.12; pts.push([x - Math.cos(a) * l / 2, y - Math.sin(a) * l / 2, 2], [x + Math.cos(a) * l / 2, y + Math.sin(a) * l / 2, 2]); }
  return kit.lines(pts, 'lo');
}
