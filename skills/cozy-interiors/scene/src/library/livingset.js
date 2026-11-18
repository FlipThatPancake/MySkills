// @js:library-livingset — the Living batch: more forms for the living room's repeating pieces, each a generator with a parameter space (meta.js SPACE).
// Floor pieces: origin the middle of the footprint on the floor, front toward +z. galleryWall and scratches: origin bottom middle on the wall face (or any vertical face), standing out toward +z.
// chair(kit, { shape: 'wing' | 'lounge' | 'rocking' | 'beanbag' | 'sling', w, d, tone }), chaise (a sofa's extra unit), coffeeShape(kit, shape, w, d, h), floorCushion, logBasket, woodStove, recordPlayer, magazineBox, plantStand, galleryWall, scratches.
import { softBox, pillowGeometry } from './soft.js';
import { rod, legs as legParts } from './parts.js';
import { pot } from './pieces.js';
import { picture } from './living.js';
const lo = { tone: 'lo' }, DEG = Math.PI / 180;
const rnd = (seed) => { let r = (seed || 1) * 9301 + 49297; return () => { r = (r * 9301 + 49297) % 233280; return r / 233280; }; };
const bx = (kit) => (cx, y, cz, w, h, d, o) => kit.box(cx - w / 2, y, cz + d / 2, w, h, d, o), rb = (kit) => (cx, y, cz, w, h, d, r, o) => kit.rbox(cx - w / 2, y, cz + d / 2, w, h, d, r, o);
const ring = (r, y, n = 28, cx = 0, cz = 0) => { const p = []; for (let i = 0; i < n; i++) { const a = i / n * 6.2832, b = (i + 1) / n * 6.2832; p.push([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r], [cx + Math.cos(b) * r, y, cz + Math.sin(b) * r]); } return p; };

// ---- armchair shapes -------------------------------------------------------------------------------------------------------------------------------
export function chair(kit, { shape = 'wing', legs: legsOpt, w = 840, d = 860, tone = 'mid', seed = 1, backH = 840, arms = 'track', back = 'tight', weave = 'cane' } = {}) {
  const g = kit.group(), B = bx(kit), R = rb(kit);
  if (shape === 'wing') {   // a deep upholstered chair: tall back, two wings, rolled arms, turned legs
    const legH = 150, y0 = legH + 130;
    g.add(legParts(kit, 'turned', [[-w / 2 + 70, -d / 2 + 70], [w / 2 - 70, -d / 2 + 70], [-w / 2 + 70, d / 2 - 70], [w / 2 - 70, d / 2 - 70]], legH + 6, { r: 30, tone }));
    g.add(kit.rbox(-w / 2, legH, d / 2, w, 130, d, 30, { tone }));
    const back = softBox(kit, w - 130, 780, 190, { r: 80, bulge: 26, tone, piping: 'edge' }); back.position.set(0, y0 + 360, -d / 2 + 150); back.rotation.x = -8 * DEG; g.add(back);
    for (const s of [-1, 1]) {
      g.add(kit.rbox(s * (w / 2 - 55) - 55, y0 - 20, d / 2 - 30, 110, 400, d - 70, 32, { tone }));   // the arm
      g.add(kit.cyl(s * (w / 2 - 55), y0 + 360, d / 2 - 30, 58, d - 90, { axis: 'z', seg: 20, tone, through: true }));   // its roll
      const wing = softBox(kit, 120, 520, 210, { r: 50, bulge: 16, tone }); wing.position.set(s * (w / 2 - 62), y0 + 520, -d / 2 + 190); wing.rotation.y = -s * 14 * DEG; g.add(wing);
    }
    const pad = softBox(kit, w - 250, d - 330, 140, { r: 52, bulge: 18, tone, dent: 8 }); pad.rotation.x = -Math.PI / 2; pad.position.set(0, y0 + 70, 20); g.add(pad);
  } else if (shape === 'lounge') {   // a wooden-frame lounge chair (w 650-750 overall): two timber side frames with a flat arm board, a slatted or woven back, a loose seat cushion and back cushion
    const sh = 400, rr = 22, X = w / 2 - 28, Z = d / 2 - 50, R = rnd(seed), bT = 820;
    for (const sx of [-1, 1]) {
      g.add(rod(kit, [sx * X, 0, Z], [sx * X, 560, Z - 10], rr * 1.1, rr, 'mid'));   // the front leg runs up into the arm
      g.add(rod(kit, [sx * X, 0, -Z + 70], [sx * X, bT, -Z - 40], rr * 1.1, rr, 'mid'));   // the rear leg rakes up into the back post
      g.add(kit.box(sx * X - 28, 560, Z + 30, 56, 24, 2 * Z + 10, { tone: 'mid' }));   // the flat arm board
      g.add(rod(kit, [sx * X, sh - 40, Z - 6], [sx * X, sh - 40, -Z + 50], 18, 18, 'mid'));   // the side seat rail
      g.add(rod(kit, [sx * X, 170, Z - 4], [sx * X, 170, -Z + 70], 16, 16, 'mid'));   // the low side stretcher
    }
    g.add(rod(kit, [-X, sh - 40, Z - 6], [X, sh - 40, Z - 6], 18, 18, 'mid')); g.add(rod(kit, [-X, sh - 40, -Z + 50], [X, sh - 40, -Z + 50], 18, 18, 'mid'));
    g.add(rod(kit, [-X, bT, -Z - 40], [X, bT, -Z - 40], 20, 20, 'mid'));   // the top rail
    const cx0 = -X + 30, cx1 = X - 30;
    if (weave === 'slats') { for (let i = 0; i < 4; i++) { const y = 540 + i * 80; g.add(kit.box(cx0, y, -Z - 8 - (y - 540) * 0.1 + 10, cx1 - cx0, 54, 14, { tone: 'mid' })); } }
    else { g.add(kit.box(cx0, 520, -Z - 8, cx1 - cx0, 270, 6)); const pts = []; for (let k = 1; k < 6; k++) pts.push([cx0 + 6, 520 + 270 * k / 6, -Z - 1.5], [cx1 - 6, 520 + 270 * k / 6, -Z - 1.5]); for (let k = 1; k < 5; k++) pts.push([cx0 + (cx1 - cx0) * k / 5, 526, -Z - 1.5], [cx0 + (cx1 - cx0) * k / 5, 784, -Z - 1.5]); g.add(kit.lines(pts, 'faint')); }
    const pad = softBox(kit, w - 150, d - 250, 110, { r: 42, bulge: 14, tone, dent: 6 }); pad.rotation.x = -Math.PI / 2; pad.position.set(0, sh + 55 - 10, 30); g.add(pad);
    const bk = softBox(kit, w - 190, 380, 100, { r: 44, bulge: 18, tone, piping: 'edge' }); bk.position.set(0, sh + 270, -Z + 90); bk.rotation.x = -16 * DEG; g.add(kit.through ? kit.through(bk) : bk);
  } else if (shape === 'rocking') {   // a wooden rocking chair (w 520-600): two curved runners, spindle back, low rounded arms
    const sh = 440, X = w / 2 - 24, Rr = 1150, half = Math.min(400, d / 2 - 20), n = 12, run = (z) => 15 + (Rr - Math.sqrt(Rr * Rr - z * z));
    for (const sx of [-1, 1]) {
      for (let i = 0; i < n; i++) { const z0 = -half + 2 * half * i / n, z1 = -half + 2 * half * (i + 1) / n; g.add(rod(kit, [sx * X, run(z0), z0], [sx * X, run(z1), z1], 15, 15, 'mid')); }
      g.add(rod(kit, [sx * X, run(190), 190], [sx * X, sh + 230, 190 - 20], 18, 15, 'mid'));   // the front leg stands on the runner and carries the arm
      g.add(rod(kit, [sx * X, run(-190), -190], [sx * X, 980, -190 - 90], 19, 15, 'mid'));   // the rear leg runs up into the back post
      g.add(rod(kit, [sx * X, sh + 230, 170], [sx * X, sh + 240, -190 - 40], 16, 16, 'mid'));   // the arm
      g.add(rod(kit, [sx * X, sh - 20, 190], [sx * X, sh - 20, -190 - 10], 14, 14, 'mid'));   // the seat rail
    }
    g.add(rod(kit, [-X, sh - 20, 190], [X, sh - 20, 190], 14, 14, 'mid')); g.add(rod(kit, [-X, sh - 20, -200], [X, sh - 20, -200], 14, 14, 'mid'));
    g.add(kit.rbox(-X + 8, sh - 10, 215, 2 * X - 16, 32, 430, 8, { tone: 'mid' }));   // the seat
    g.add(rod(kit, [-X, 980, -280], [X, 980, -280], 18, 18, 'mid')); g.add(rod(kit, [-X, 760, -255], [X, 760, -255], 14, 14, 'mid'));
    for (let i = 1; i < 6; i++) { const x = -X + 2 * X * i / 6; g.add(rod(kit, [x, sh + 30, -215], [x, 760, -255], 8, 8, 'mid')); g.add(rod(kit, [x, 760, -255], [x, 975, -280], 8, 8, 'mid')); }
  } else if (shape === 'beanbag') {   // a bean bag: no frame, no legs; a slouchy sack, raised at the back, a dent where you sit, soft creases running into it
    const T = kit.THREE, Rx = w / 2, Rz = d / 2, sm = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
    const H = (z) => 230 + 410 * sm(-0.35, 0.75, -z), dent = (x, z) => 200 * Math.exp(-((x / 0.55) ** 2 + ((z - 0.2) / 0.5) ** 2));   // the height of the back (z < 0) and the seat's dent, as functions of the unit footprint
    const geo = new T.SphereGeometry(1, 56, 36), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const yy = y > 0 ? y * H(z) - dent(x, z) * Math.min(1, y * 2) : Math.max(y * 80, -40);   // the lower half is squashed flat, then lifted to the floor
      p.setXYZ(i, x * Rx * (1 + 0.1 * Math.max(0, y)), Math.max(yy, y > 0 ? 6 : -40) + 40, z * Rz * (1 + 0.06 * Math.max(0, y)));
    }
    geo.computeVertexNormals();
    g.add(kit.solid(geo, 0, 0, 0, { smooth: true, tone }));
    const surf = (x, z) => { const q = 1 - x * x - z * z; return q <= 0 ? -1 : Math.max(6, Math.sqrt(q) * H(z) - dent(x, z)) + 40 + 1.5; }, cr = [];   // soft creases: curves from the rim of the dent out over the sides, a few short ones at the back
    for (let k = 0; k < 7; k++) { const a = (k / 7) * 6.2832 + 0.4, o = []; for (let t = 0.38; t <= 0.92; t += 0.06) { const x = 0.12 * Math.cos(a) + t * Math.cos(a + t * 0.5), z = 0.12 + t * Math.sin(a + t * 0.5) * 0.9, y = surf(x, z); if (y > 0) o.push([x * Rx * (1 + 0.1 * 0.8), y, z * Rz * (1 + 0.06 * 0.8)]); } for (let i = 0; i < o.length - 1; i++) cr.push(o[i], o[i + 1]); }
    g.add(kit.lines(cr, 'faint'));
  } else {   // a sling: a leather seat-and-back hung from a bent frame
    const sh = 360, X = w / 2 - 40, Z = d / 2 - 30;
    for (const sx of [-1, 1]) { const pts = [[sx * X, 8, Z], [sx * X, sh * 0.8, Z - 30], [sx * X, sh, -Z + 160], [sx * X, 700, -Z - 60]]; for (let i = 0; i < 3; i++) g.add(rod(kit, pts[i], pts[i + 1], 15, 15, 'mid')); g.add(rod(kit, [sx * X, 8, -Z + 120], [sx * X, 8, Z], 14, 14, 'mid')); }
    const seat = softBox(kit, w - 110, 520, 70, { r: 30, bulge: 14, tone, dent: 16, sag: 6 }); seat.rotation.x = -(Math.PI / 2 - 8 * DEG); seat.position.set(0, sh + 6, 40); g.add(seat);
    const back = softBox(kit, w - 110, 520, 70, { r: 30, bulge: 14, tone }); back.rotation.x = -28 * DEG; back.position.set(0, sh + 260, -Z + 90); g.add(back);
    g.add(kit.lines([[-w / 2 + 70, sh + 30, 300], [w / 2 - 70, sh + 30, 300]], 'lo'));
  }
  if (shape === 'lounge' || shape === 'rocking' || shape === 'beanbag') { const q = kit.group(); g.position.y = -6; q.add(g); return kit.merge(q); }   // feet 6 mm below the origin, like the wing chair's legs: it stands on a rug placed at y 6
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
    g.add(R(0, h * 0.3, 0, w, h * 0.7, d, 46)); g.add(R(0, 0, 0, w - 160, h * 0.3 + 6, d - 140, 16, lo));   // a soft-cornered slab on a recessed, rounded plinth
    g.add(kit.lines([[-w / 2 + 60, h * 0.3 - 1, d / 2 - 12], [w / 2 - 60, h * 0.3 - 1, d / 2 - 12]], 'faint'));
  }
  return kit.merge(g);
}

// ---- small living-room pieces ----------------------------------------------------------------------------------------------------------------------
export function floorCushion(kit, { w = 680, thick = 150, tone = 'mid', piping = 'edge' } = {}) {
  const g = kit.group(), s = softBox(kit, w, w, thick, { r: 60, bulge: 28, piping, tone, dent: 12 }); s.rotation.x = -Math.PI / 2; s.position.y = thick / 2 + 6; g.add(s);
  return kit.merge(g);
}
export function logBasket(kit, { r = 270, h = 400, logs = 7, seed = 3, weave = 'grid', lean: leanP = 0.18 } = {}) {
  const g = kit.group(), R = rnd(seed), pts = [], T = kit.THREE, wall = 26;
  // an open basket: one turned profile up the outside, over a rolled rim and down the inside to a woven floor
  const prof = [[r * 0.7, 0], [r * 0.84, 6], [r * 0.9, h * 0.35], [r, h - 14], [r + 5, h - 4], [r + 2, h + 8], [r - wall + 4, h + 8], [r - wall, h - 6], [r * 0.9 - wall, h * 0.35], [r * 0.7, 40], [0, 40]].map(([a, y]) => new T.Vector2(a, y));
  g.add(kit.solid(new T.LatheGeometry(prof, 40), 0, 0, 0, { smooth: true, ...lo }));
  if (weave !== 'stave') for (const f of [0.2, 0.4, 0.6, 0.8]) pts.push(...ring(r * (0.86 + 0.14 * f) + 1.5, h * f, 40));
  if (weave !== 'plain') for (let i = 0; i < 20; i++) { const a = i / 20 * 6.2832, c = Math.cos(a), sn = Math.sin(a); pts.push([c * r * 0.88, h * 0.12, sn * r * 0.88], [c * r * 1.0, h - 22, sn * r * 1.0]); }   // the staves
  g.add(kit.lines(pts, 'mid'));
  const logRod = (A, B, lr) => {
    const lg = kit.group();
    lg.add(rod(kit, A, B, lr, lr, 'lo'));
    let u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]]; const um = Math.hypot(...u); u = u.map((q) => q / um);
    const e1 = Math.abs(u[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]; let v = [u[1] * e1[2] - u[2] * e1[1], u[2] * e1[0] - u[0] * e1[2], u[0] * e1[1] - u[1] * e1[0]]; const vm = Math.hypot(...v); v = v.map((q) => q / vm);
    const wv = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const disc = (rf, n = 18) => { const q = []; for (let i = 0; i < n; i++) { const a0 = i / n * 6.2832, a1 = (i + 1) / n * 6.2832; for (const a of [a0, a1]) q.push([B[0] + (v[0] * Math.cos(a) + wv[0] * Math.sin(a)) * lr * rf + u[0] * 2, B[1] + (v[1] * Math.cos(a) + wv[1] * Math.sin(a)) * lr * rf + u[1] * 2, B[2] + (v[2] * Math.cos(a) + wv[2] * Math.sin(a)) * lr * rf + u[2] * 2]); } return q; };
    lg.add(kit.lines([...disc(0.96), ...disc(0.62), ...disc(0.3), [B[0] + v[0] * lr * 0.2 + u[0] * 2, B[1] + v[1] * lr * 0.2 + u[1] * 2, B[2] + v[2] * lr * 0.2 + u[2] * 2], [B[0] + v[0] * lr * 0.9 + u[0] * 2, B[1] + v[1] * lr * 0.9 + u[1] * 2, B[2] + v[2] * lr * 0.9 + u[2] * 2]], 'mid'));   // the end: rings and a split
    g.add(kit.content(lg));
  };
  const placed = [], sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]], dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
  const segDist = (A, B, C, D) => {   // the shortest distance between two segments (sampled finely: logs are fat, so a 20 mm step is exact enough)
    let m = 1e9; const nA = 24, nC = 24; for (let i = 0; i <= nA; i++) { const p = [A[0] + (B[0] - A[0]) * i / nA, A[1] + (B[1] - A[1]) * i / nA, A[2] + (B[2] - A[2]) * i / nA]; for (let j = 0; j <= nC; j++) { const q = [C[0] + (D[0] - C[0]) * j / nC, C[1] + (D[1] - C[1]) * j / nC, C[2] + (D[2] - C[2]) * j / nC], d = Math.hypot(...sub(p, q)); if (d < m) m = d; } } return m;
  };
  const innerR = (y) => y < 40 ? r * 0.7 - wall : y < h * 0.35 ? (r * 0.7 + (r * 0.9 - wall - r * 0.7) * (y - 40) / (h * 0.35 - 40)) : (r * 0.9 - wall) + (r - wall - r * 0.9 + wall) * Math.min(1, (y - h * 0.35) / (h * 0.65 - 6));   // the inside wall radius at height y
  const fits = (A, B, lr) => { for (let i = 0; i <= 20; i++) { const t = i / 20, y = A[1] + (B[1] - A[1]) * t; if (y > h + 8) break; if (Math.hypot(A[0] + (B[0] - A[0]) * t, A[2] + (B[2] - A[2]) * t) > innerR(y) - lr * 1.04 - 4) return false; } return placed.every((q) => segDist(A, B, q.A, q.B) > lr + q.lr + 6); };
  for (let k = 0; k < Math.max(5, Math.min(8, logs)); k++) {
    for (let tries = 0; tries < 80; tries++) {
      const a = R() * 6.2832, rd = Math.sqrt(R()) * (r - wall - 70), x = Math.cos(a) * rd, z = Math.sin(a) * rd, lr = 40 + R() * 22, len = h * 0.9 + 80 + R() * 160;
      const la = R() * 6.2832, lean = leanP * (0.3 + R() * 1.4) * (k % 3 === 0 ? 2.3 : 1); let u = [Math.cos(la) * lean, 1, Math.sin(la) * lean]; const m = Math.hypot(...u); u = u.map((q) => q / m);
      const y0 = 44 + lr * Math.hypot(u[0], u[2]) + 1, A = [x, y0, z], B = [x + u[0] * len, y0 + u[1] * len, z + u[2] * len];   // a leaning log's end disc dips lr * sin(tilt) below its axis: lift it onto the basket floor
      if (!fits(A, B, lr)) continue;
      placed.push({ A, B, lr }); logRod(A, B, lr); break;
    }
  }
  for (let tries = 0; tries < 60; tries++) {   // one log laid across the rim, resting on it
    const la = R() * 3.1416, lr = 46 + R() * 14, cx = Math.cos(la), cz = Math.sin(la), L = r * 1.5, y = h + 8 + lr, A = [-cx * L / 2, y, -cz * L / 2], B = [cx * L / 2, y + 20, cz * L / 2];
    if (!placed.every((q) => segDist(A, B, q.A, q.B) > lr + q.lr + 6)) continue;
    logRod(A, B, lr); break;
  }
  return kit.merge(g);
}
export function woodStove(kit, { w = 520, d = 430, h = 600, flueH = 1700, ceil, seed = 2, door = 'glass', legs: lg = 'feet', flue = 'up' } = {}) {   // flue up (the pipe rises and its top edges fade out toward the ceiling) | wall (the pipe turns through an elbow into the wall behind: back the stove onto a wall); ceil (the home's ceiling height, set by the home) overrides flueH
  const g = kit.group(), B = bx(kit), R = rb(kit), legH = 110; if (ceil) flueH = ceil;
  const hw = w + 220, hd = d + 220, hz = 0;   // a thin stone hearth plate under the stove and out in front of it
  g.add(R(0, 0, hz, hw, 14, hd, 4, { tone: 'lo' }));
  { const hp = [], y = 14.6, z0 = hz - hd / 2, z1 = hz + hd / 2; for (const t of [-0.33, 0.33]) hp.push([hw * t, y, z0 + 8], [hw * t, y, z1 - 8]); hp.push([-hw / 2 + 8, y, hz], [hw / 2 - 8, y, hz]); g.add(kit.lines(hp, 'faint')); }
  if (lg === 'pedestal') g.add(R(0, 14, 0, w - 90, legH, d - 90, 6, lo)); else for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(kit.cyl(sx * (w / 2 - 36), 0, sz * (d / 2 - 36), 18, legH, { seg: 10, tone: 'lo' }));
  g.add(R(0, legH, 0, w, h - legH - 40, d, 22));
  g.add(R(0, h - 44, 0, w + 36, 44, d + 36, 12));   // the top plate overhangs
  const dw = w * 0.62, dh = (h - legH - 40) * 0.55, dy = legH + 70, z = d / 2 + 1;   // the door and its glass
  const dl = [], sg = (a, b2) => dl.push([a[0], a[1], z], [b2[0], b2[1], z]), rc = (x0, y0, x1, y1) => { sg([x0, y0], [x1, y0]); sg([x1, y0], [x1, y1]); sg([x1, y1], [x0, y1]); sg([x0, y1], [x0, y0]); };
  if (door === 'round') { const cr = Math.min(dw, dh) * 0.46, cx0 = 0, cy0 = dy + dh / 2; for (let i = 0; i < 28; i++) { const a = i / 28 * 6.2832, b2 = (i + 1) / 28 * 6.2832; for (const q of [cr, cr - 30]) sg([cx0 + Math.cos(a) * q, cy0 + Math.sin(a) * q], [cx0 + Math.cos(b2) * q, cy0 + Math.sin(b2) * q]); } }
  else { rc(-dw / 2, dy, dw / 2, dy + dh); if (door === 'glass') rc(-dw / 2 + 34, dy + 34, dw / 2 - 34, dy + dh - 34); else for (let k = 0; k < 4; k++) sg([-dw / 2 + 40, dy + dh - 40 - k * 16], [dw / 2 - 40, dy + dh - 40 - k * 16]); }
  g.add(kit.lines(dl, 'mid'));
  g.add(kit.cyl(dw / 2 + 24, dy + dh * 0.5 - 40, z + 22, 6, 80, { axis: 'z', seg: 8, tone: 'lo' }));   // the handle's stand-off... a short post
  const fz = -d * 0.12;
  if (flue === 'wall') {   // an elbow into the wall behind the stove (the wall is d / 2 + 40 mm behind its middle): the pipe rises to about 1.35 m, bends, and runs into a round plate on the wall
    const y1 = Math.max(h + 500, Math.min(flueH - 500, 1350)), wz = -(d / 2 + 40);
    g.add(kit.cyl(0, h, fz, 80, y1 - h, { seg: 24 }));
    g.add(kit.solid(new kit.THREE.SphereGeometry(80, 24, 16), 0, y1, fz, { smooth: true }));   // the elbow
    g.add(kit.cyl(0, y1, fz, 80, fz - wz, { seg: 24, axis: 'z' }));   // the run into the wall
    g.add(kit.cyl(0, y1, wz + 20, 130, 20, { seg: 28, axis: 'z', tone: 'lo' }));   // a round wall plate
    for (const y of [h + 120]) g.add(kit.cyl(0, y, fz, 90, 30, { seg: 24, tone: 'lo', through: true }));
    return kit.merge(g);
  }
  const FADE = Math.min(450, (flueH - h) * 0.4);   // the pipe is solid up to flueH - 450 mm, then its two edges melt out toward the ceiling (like the pendant's cord)
  g.add(kit.cyl(0, h, fz, 80, flueH - h - FADE, { seg: 24, open: true }));
  for (const sx of [-80, 80]) g.add(kit.meltingLine([sx, flueH - FADE, fz], [sx, flueH, fz], (p) => Math.min(1, (p[1] - (flueH - FADE)) / FADE), 24));
  for (const y of [h + 120, flueH - FADE - 140]) g.add(kit.cyl(0, y, fz, 90, 30, { seg: 24, tone: 'lo', through: true }));   // two collars
  return kit.merge(g);
}
export function recordPlayer(kit, { w = 760, d = 400, h = 520, seed = 4, records = 9, lid: lidP = 'open', legs: lg = 'splay' } = {}) {
  const g = kit.group(), R = rnd(seed), B = bx(kit), Rb = rb(kit), pts = [], th = 22, cy0 = h - 380, cy1 = h - 40;   // cabinet from cy0 to cy1
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(lg === 'block' ? B(sx * (w / 2 - 50), 0, sz * (d / 2 - 50), 36, cy0 + 4, 36) : rod(kit, [sx * (w / 2 - 60), cy0 + 10, sz * (d / 2 - 50)], [sx * (w / 2 - 40), 6, sz * (d / 2 - 36)], 18, 12, 'mid'));
  g.add(B(0, cy0, 0, w, th, d));   // the base
  for (const sx of [-1, 1]) g.add(B(sx * (w / 2 - th / 2), cy0, 0, th, cy1 - cy0, d));   // the ends
  g.add(B(0, cy0, -d / 2 + th / 2, w, cy1 - cy0, th, lo));   // the back
  const dv = w * 0.14, ix0 = -w / 2 + th, ix1 = dv - th / 2;   // an open bay on the left, a closed door on the right
  g.add(B(dv, cy0, 0, th, cy1 - cy0, d));   // the divider
  g.add(Rb(0, h - 40, 0, w + 24, 40, d + 20, 6));   // the top
  // records: sleeves standing in the bay, the last few leaning
  const iy0 = cy0 + th, inner = cy1 - iy0 - 26; let x = ix0 + 8, k = 0; const bayW = ix1 - ix0;
  while (k < records && x < ix1 - 40) {
    const t = 20 + R() * 14, hh = Math.min(inner, 270 + R() * 20), lean = x > ix1 - 120 ? 0.3 : 0;   // the last ones lean together at one angle, and stop where the divider is
    if (lean && x + hh * Math.sin(lean) + t / 2 + 4 > ix1) break;
    const m = kit.group(); m.add(kit.box(-t / 2, 0, 160, t, hh, 310, R() < 0.5 ? lo : {})); m.position.set(x, iy0, 0); if (lean) m.rotation.z = -lean; g.add(m);
    pts.push([x - t / 2 + 1, iy0 + hh * 0.7, d / 2 - 10], [x + t / 2 - 1, iy0 + hh * 0.7, d / 2 - 10]);
    x += t + 3 + R() * 5; k++;
  }
  const dx0 = dv + th, dx1 = w / 2 - th;   // the door on the right bay
  g.add(Rb((dx0 + dx1) / 2, cy0 + 10, d / 2 - 14, dx1 - dx0 - 10, cy1 - cy0 - 20, 18, 4));
  g.add(kit.lines([[dx0 + 20, cy0 + 28, d / 2 + 5], [dx1 - 20, cy0 + 28, d / 2 + 5], [dx1 - 20, cy0 + 28, d / 2 + 5], [dx1 - 20, cy1 - 28, d / 2 + 5], [dx1 - 20, cy1 - 28, d / 2 + 5], [dx0 + 20, cy1 - 28, d / 2 + 5], [dx0 + 20, cy1 - 28, d / 2 + 5], [dx0 + 20, cy0 + 28, d / 2 + 5]], 'lo'));
  g.add(kit.cyl(dx0 + 40, (cy0 + cy1) / 2, d / 2 + 6, 8, 18, { axis: 'z', seg: 10, tone: 'lo' }));
  g.add(kit.lines(pts, 'lo'));
  const tx = w * 0.12, ty = h;   // the turntable: a plinth, a platter with a record, a tonearm, and the lid hinged open behind
  g.add(Rb(tx, ty, 0, 460, 70, 350, 10));
  g.add(kit.cyl(tx - 40, ty + 70, 0, 150, 12, { seg: 36, tone: 'lo' })); g.add(kit.cyl(tx - 40, ty + 82, 0, 145, 4, { seg: 36 })); g.add(kit.cyl(tx - 40, ty + 86, 0, 38, 2, { seg: 20, tone: 'lo' }));
  g.add(kit.lines([...ring(95, 0, 30).map(([px, , pz]) => [tx - 40 + px, ty + 87, pz]), [tx + 150, ty + 92, -110], [tx + 60, ty + 100, -10], [tx + 60, ty + 100, -10], [tx + 25, ty + 90, 40]], 'lo'));
  const lid = kit.group(); lid.add(kit.rbox(-225, 0, 330, 450, 8, 330, 3)); lid.add(kit.lines([[-205, 9, 20], [205, 9, 20], [205, 9, 20], [205, 9, 310], [205, 9, 310], [-205, 9, 310], [-205, 9, 310], [-205, 9, 20]], 'lo'));
  lid.position.set(tx, ty + 74, -168); lid.rotation.x = -(lidP === 'closed' ? 0.6 : lidP === 'half' ? 48 + R() * 10 : 104 + R() * 8) * DEG; g.add(lid);
  if (lidP !== 'closed') g.add(rod(kit, [tx - 150, ty + 70, -168], [tx + 150, ty + 70, -168], 6, 6, 'lo'));   // the hinge
  return kit.merge(g);
}
export function magazineBox(kit, { w = 300, h = 300, seed = 6, form = 'box' } = {}) {   // rigid: a wooden magazine file box with magazines standing in it, or a low stack of magazines on the floor; origin the middle of the footprint
  const g = kit.group(), R = rnd(seed), pts = [], T = kit.THREE;
  if (form === 'stack') {   // 5 to 8 magazines lying one on another, each a little turned
    const n = 5 + Math.floor(R() * 4); let y = 0;
    for (let i = 0; i < n; i++) { const t = 5 + R() * 5, mw = 215 + R() * 15, md = 290 + R() * 10, m = kit.group(); m.add(kit.box(-mw / 2, 0, md / 2, mw, t, md, lo)); m.add(kit.lines([[-mw / 2 + 4, t + 0.5, md / 2 - 6], [-mw / 2 + 4, t + 0.5, -md / 2 + 6]], 'lo')); m.position.set((R() - 0.5) * 18, y, (R() - 0.5) * 14); m.rotation.y = (R() - 0.5) * 0.2; g.add(m); y += t; }
    return kit.merge(g);
  }
  const bw = Math.min(w, 340), bd = 270, th = 14, hb = 300, hf = 190;   // box: a slanted wooden file, tall at the back and low at the front
  g.add(kit.box(-bw / 2, 0, bd / 2, bw, th, bd, { tone: 'mid' }));
  for (const sx of [-1, 1]) { const sh = new T.Shape([new T.Vector2(-bd / 2, 0), new T.Vector2(bd / 2, 0), new T.Vector2(bd / 2, hf), new T.Vector2(-bd / 2, hb)]), geo = new T.ExtrudeGeometry(sh, { depth: th, bevelEnabled: false }); geo.rotateY(-Math.PI / 2); geo.translate(sx > 0 ? bw / 2 : -bw / 2 + th, 0, 0); g.add(kit.solid(geo, 0, 0, 0, { tone: 'mid' })); }
  g.add(kit.box(-bw / 2 + th, th, -bd / 2 + th, bw - 2 * th, hb - th, th, { tone: 'mid' }));   // the back
  g.add(kit.box(-bw / 2 + th, th, bd / 2, bw - 2 * th, 60, th, { tone: 'mid' }));   // a low front lip
  let x = -bw / 2 + th + 8; for (let i = 0; i < 5 && x < bw / 2 - th - 30; i++) { const t = 12 + R() * 12, hh = 230 + R() * 50, m = kit.box(x, th, -bd / 2 + th + 150, t, hh, 150, lo); kit.content(m); g.add(m); pts.push([x + t / 2, th + 40, -bd / 2 + th + 152], [x + t / 2, th + 40 + hh * 0.5, -bd / 2 + th + 152]); x += t + 6 + R() * 8; }
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
// one framed piece: origin bottom middle, standing out toward +z. kind: 'mat' | 'vase' | 'shapes' | 'text' | 'blank' | 'hills'; F is the frame's width
function frameArt(kit, { w, h, kind = 'mat', F = 28, D = 24, seed = 1 }) {
  if (kind === 'hills') return picture(kit, { w, h, seed });
  const g = kit.group(), R = rnd(seed), pts = [], mp = kind === 'mat' ? 70 : kind === 'blank' ? 6 : 30;
  g.add(kit.rbox(-w / 2, 0, D, w, h, D, 4));   // the frame
  g.add(kit.box(-w / 2 + F, F, D + 2, w - 2 * F, h - 2 * F, 2, lo));   // the mat
  const x0 = -w / 2 + F + mp, x1 = w / 2 - F - mp, y0 = F + mp, y1 = h - F - mp, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, z = D + 4.5, iw = x1 - x0, ih = y1 - y0;
  const seg = (a, b) => pts.push([a[0], a[1], z], [b[0], b[1], z]), rect = (a, b, c, d2) => { seg([a, b], [c, b]); seg([c, b], [c, d2]); seg([c, d2], [a, d2]); seg([a, d2], [a, b]); };
  if (kind === 'mat') { rect(x0, y0, x1, y1); }   // a plain mat with its bevel edge, a window left empty but for a thin line
  else if (kind === 'blank') { g.add(kit.box(x0, y0, D + 4, iw, ih, 1.5)); }   // a sheet of paper
  else if (kind === 'vase') {   // a vase and two stems as lines
    const vh = ih * 0.46, vw = Math.min(iw * 0.4, vh * 0.7), base = cy - ih * 0.36, sh = []; for (let i = 0; i <= 14; i++) { const t = i / 14, wd = vw / 2 * (0.5 + 0.5 * Math.sin(t * 3.14159 * 0.9 + 0.3)) * (t > 0.82 ? 0.55 : 1); sh.push([cx - wd, base + t * vh]); }
    for (let i = 0; i < 14; i++) { seg(sh[i], sh[i + 1]); seg([2 * cx - sh[i][0], sh[i][1]], [2 * cx - sh[i + 1][0], sh[i + 1][1]]); }
    seg(sh[0], [2 * cx - sh[0][0], base]);
    for (const k of [-1, 1]) { const n = 8; let px = cx, py = base + vh; for (let i = 1; i <= n; i++) { const t = i / n, nx = cx + k * iw * (0.12 + 0.1 * R()) * t * 2.2, ny = base + vh + t * ih * 0.38; seg([px, py], [nx, ny]); px = nx; py = ny; } }
  } else if (kind === 'shapes') {   // an arch, a circle and a bar: three flat shapes
    const m = Math.min(iw, ih); for (let i = 0; i < 20; i++) { const a = i / 20 * 6.2832, b2 = (i + 1) / 20 * 6.2832, r = m * 0.2, ccx = cx + iw * 0.12, ccy = cy + ih * 0.18; seg([ccx + Math.cos(a) * r, ccy + Math.sin(a) * r], [ccx + Math.cos(b2) * r, ccy + Math.sin(b2) * r]); }
    const aw = m * 0.3, ax = cx - iw * 0.18, ay = y0 + ih * 0.06; seg([ax - aw, ay], [ax - aw, ay + ih * 0.28]); seg([ax + aw, ay], [ax + aw, ay + ih * 0.28]); for (let i = 0; i < 12; i++) { const a = i / 12 * 3.14159, b2 = (i + 1) / 12 * 3.14159; seg([ax + Math.cos(a) * aw, ay + ih * 0.28 + Math.sin(a) * aw], [ax + Math.cos(b2) * aw, ay + ih * 0.28 + Math.sin(b2) * aw]); } seg([ax - aw, ay], [ax + aw, ay]);
    seg([cx - iw * 0.4, y1 - ih * 0.06], [cx + iw * 0.1, y1 - ih * 0.06]);
  } else {   // a small text print: a title and short lines
    seg([cx - iw * 0.3, y1 - ih * 0.14], [cx + iw * 0.3, y1 - ih * 0.14]); const n = Math.max(3, Math.floor(ih / 40)); for (let i = 0; i < n; i++) { const yy = y1 - ih * 0.32 - i * ih * 0.5 / n, l = iw * (0.35 + R() * 0.55); seg([cx - iw * 0.45, yy], [cx - iw * 0.45 + l, yy]); }
  }
  if (pts.length) g.add(kit.lines(pts, 'mid'));
  return kit.merge(g);
}
export function galleryWall(kit, { w = 1500, h = 1100, n = 6, seed = 1, align: alignP, frame = 'thin' } = {}) {
  const g = kit.group(), R = rnd(seed * 17 + 3), sizes = [[300, 400], [400, 300], [240, 300], [500, 650], [350, 350], [200, 260], [600, 450], [260, 260]], KINDS = ['mat', 'vase', 'shapes', 'text', 'blank', 'hills'], cols = 3;
  const align = alignP || (R() < 0.5 ? 'edge' : 'centre'), FS = frame === 'thick' ? 1.6 : 1, gap = 50, cell = w / cols; let placed = 0, kk = Math.floor(R() * KINDS.length);
  for (let c = 0; c < cols && placed < n; c++) {
    const items = []; let tot = 0;
    for (let k = 0; k < (placed + 3 <= n ? 3 : n - placed) && placed + items.length < n; k++) { const [pw, ph] = sizes[Math.floor(R() * sizes.length)]; const sc = Math.min(1, (cell - 70) / pw, (h * 0.36) / ph); items.push([Math.round(pw * sc), Math.round(ph * sc)]); tot += Math.round(ph * sc) + (k ? gap : 0); if (tot > h * 0.9) break; }
    let y = align === 'centre' ? Math.max(20, (h - tot) / 2) : 40;   // 'centre': every stack on one horizontal centre line; 'edge': all hang from one top line and share a left edge per column
    const xl = -w / 2 + c * cell + 40;
    for (const [pw, ph] of items) { const kind = KINDS[kk++ % KINDS.length], F = Math.round((18 + Math.floor(R() * 4) * 7) * FS), p = frameArt(kit, { w: pw, h: ph, kind, F, D: 20 + Math.floor(R() * 3) * 4, seed: Math.floor(R() * 90) + 1 }); p.position.set(align === 'centre' ? -w / 2 + c * cell + cell / 2 : xl + pw / 2, align === 'edge' ? h - 40 - y - ph : y, 0); g.add(p); y += ph + gap; placed++; }
  }
  return g;
}
// cat scratches on a vertical face (a sofa's arm, a door): origin where the middle of the marks go, drawn at z 2 facing +z; turn the asset to face the right way
export function scratches(kit, { n = 6, len = 150, seed = 1 } = {}) {
  const R = rnd(seed * 31 + 5), pts = [], a0 = 62 * DEG + (R() - 0.5) * 0.3;
  for (let k = 0; k < n; k++) { const x = (k - (n - 1) / 2) * 20 + (R() - 0.5) * 8, y = (R() - 0.5) * 30, l = len * (0.6 + 0.5 * R()), a = a0 + (R() - 0.5) * 0.12; pts.push([x - Math.cos(a) * l / 2, y - Math.sin(a) * l / 2, 2], [x + Math.cos(a) * l / 2, y + Math.sin(a) * l / 2, 2]); }
  return kit.lines(pts, 'lo');
}
