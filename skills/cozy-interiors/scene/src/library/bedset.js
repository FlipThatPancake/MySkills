// @js:library-bedset — the Bedroom batch: pieces for beside, around and on a bed. Floor pieces: origin the middle of the footprint on the floor, front +z; small pieces stand on a surface (y 'top'); wall pieces: origin bottom middle on the wall face.
// bedFrame(kit, frame, o) (the bed's base and headboard, in rooms.js bed), bedsideLamp, alarmClock, glassesBook, chestOfDrawers, clothesRail, clothesChair, hamper, leaningMirror, wallSconce.
import { softBox, drape, vessel } from './soft.js';
import { rod, legs as legParts, handle } from './parts.js';
import { cloth, hangGrid, coat as coatGen } from './softpieces.js';
import { chair as diningChair } from './dining.js';
import { mirror } from './decor.js';
const lo = { tone: 'lo' }, DEG = Math.PI / 180;
const rnd = (seed) => { let r = (seed || 1) * 9301 + 49297; return () => { r = (r * 9301 + 49297) % 233280; return r / 233280; }; };
const ring = (r, n = 28, f = (x, y) => [x, y]) => { const p = []; for (let i = 0; i < n; i++) { const a = i / n * 6.2832, b = (i + 1) / n * 6.2832; p.push(f(Math.cos(a) * r, Math.sin(a) * r), f(Math.cos(b) * r, Math.sin(b) * r)); } return p; };

// The bed's base and headboard for a frame style, with the mattress seat at y 300 (rooms.js adds the mattress, duvet and pillows). w, l: the mattress size; head: the headboard height above the base.
export function bedFrame(kit, frame, { w, l, head, tone = 'mid' }) {
  const g = kit.group(), R = (cx, y, cz, ww, h, d, r, o) => kit.rbox(cx - ww / 2, y, cz + d / 2, ww, h, d, r, o), B = (cx, y, cz, ww, h, d, o) => kit.box(cx - ww / 2, y, cz + d / 2, ww, h, d, o);
  if (frame === 'legs') {   // slim rails on four tapered legs, a slatted timber headboard
    const pts = [[-w / 2 - 20, -l / 2 + 40], [w / 2 + 20, -l / 2 + 40], [-w / 2 - 20, l / 2 - 40], [w / 2 + 20, l / 2 - 40]];
    g.add(legParts(kit, 'tapered', pts, 176, { r: 32 }));
    for (const s of [-1, 1]) g.add(B(s * (w / 2 + 20), 170, 0, 40, 130, l - 60));
    g.add(B(0, 170, l / 2 - 50, w + 40, 130, 40)); g.add(B(0, 170, -l / 2 + 40, w + 40, 130, 40));
    g.add(R(0, 300, -l / 2 + 25, w + 60, head, 40, 6));
    const sl = []; for (let i = 1; i < 9; i++) { const x = -w / 2 - 30 + (w + 60) * i / 9; sl.push([x, 320, -l / 2 + 46], [x, 300 + head - 20, -l / 2 + 46]); } g.add(kit.lines(sl, 'lo'));
  } else if (frame === 'upholstered') {   // a padded base and a tall channelled headboard
    g.add(R(0, 40, 0, w + 60, 260, l, 46, { tone })); g.add(B(0, 0, 0, w - 100, 50, l - 120, lo));
    const hb = softBox(kit, w + 60, head + 160, 130, { r: 46, bulge: 16, piping: 'edge', tone }); hb.position.set(0, 300 + head / 2 - 40, -l / 2 + 65); g.add(hb);
    const ch = []; for (let i = 1; i < 5; i++) { const x = -w / 2 - 30 + (w + 60) * i / 5; ch.push([x, 330, -l / 2 + 132], [x, 300 + head, -l / 2 + 132]); } g.add(kit.lines(ch, 'lo'));
  } else if (frame === 'platform') {   // a low wide platform with a ledge round it and a low padded head
    g.add(R(0, 0, 0, w + 260, 230, l + 100, 24)); g.add(B(0, 230, 0, w + 20, 70, l - 20, lo));
    g.add(kit.lines([[-w / 2 - 130, 60, l / 2 + 51], [w / 2 + 130, 60, l / 2 + 51]], 'lo'));
    g.add(R(0, 300, -l / 2 - 10, w + 60, Math.min(head, 400), 130, 40));
  } else {   // the original: a box base and a plain panel headboard
    g.add(R(0, 0, 0, w + 60, 300, l, 14)); g.add(B(0, 300, -l / 2 + 25, w + 60, head, 50));
  }
  return g;
}

// ---- small things on the bedside ------------------------------------------------------------------------------------------------------------------
export function bedsideLamp(kit, { h = 430, shade = 'drum', base = 'gourd', seed = 1 } = {}) {
  const g = kit.group(), br = h * 0.075, T = kit.THREE; let baseH = h * 0.5;
  if (base === 'cylinder') { baseH = h * 0.46; g.add(vessel(kit, [[br * 1.1, 0], [br * 1.2, baseH * 0.05], [br * 1.2, baseH * 0.95], [br * 0.9, baseH]], { contents: 'none', rim: false, tone: 'lo' })); }
  else if (base === 'stack') { baseH = h * 0.52; g.add(kit.solid(new T.SphereGeometry(br * 1.5, 20, 14), 0, br * 1.5, 0, { smooth: true, tone: 'lo' })); g.add(kit.solid(new T.SphereGeometry(br * 1.05, 18, 12), 0, br * 3.4, 0, { smooth: true, tone: 'lo' })); g.add(kit.cyl(0, br * 4.3, 0, br * 0.5, baseH - br * 4.3, { seg: 12, tone: 'lo' })); }
  else if (base === 'tripod') { baseH = h * 0.5; for (let k = 0; k < 3; k++) { const a = k * 2.0944 + 0.4; g.add(rod(kit, [Math.cos(a) * br * 2.2, 0, Math.sin(a) * br * 2.2], [0, baseH, 0], 7, 5, 'mid')); } g.add(kit.cyl(0, baseH * 0.4, 0, br * 0.7, 12, { seg: 10, tone: 'lo' })); }
  else g.add(vessel(kit, [[br * 0.6, 0], [br, baseH * 0.12], [br * 1.5, baseH * 0.55], [br * 1.1, baseH * 0.9], [br * 0.5, baseH]], { contents: 'none', rim: false, tone: 'lo' }));
  g.add(kit.cyl(0, baseH, 0, 9, h * 0.12, { seg: 10, tone: 'lo' }));
  const sy = baseH + h * 0.1;
  if (shade === 'cone') g.add(kit.cyl(0, sy, 0, h * 0.2, h * 0.34, { rTop: h * 0.11, seg: 36 }));
  else if (shade === 'globe') g.add(kit.solid(new T.SphereGeometry(h * 0.19, 24, 16), 0, sy + h * 0.18, 0, { smooth: true }));
  else g.add(kit.cyl(0, sy, 0, h * 0.18, h * 0.3, { rTop: h * 0.17, seg: 36 }));
  if (base !== 'tripod') g.add(kit.lines([[0, baseH + 8, 0], [br * 1.8, baseH * 0.4, 0]], 'lo'));
  return kit.merge(g);
}
export function alarmClock(kit, { r = 55, kind = 'analog' } = {}) {
  const g = kit.group(), pts = [];
  if (kind === 'digital') {
    g.add(kit.rbox(-70, 0, 36, 140, 70, 60, 10)); const z = 37, ys = 34; pts.push(...[[-48, 22], [-18, 22], [4, 22], [34, 22]].flatMap(([x, y]) => [[x, ys + 8, z + 0.1], [x + 24, ys + 8, z + 0.1]]));
  } else {
    const cy = r + 6, z = 46; g.add(kit.cyl(0, cy, 44, r, 44, { axis: 'z', seg: 32 }));
    pts.push(...ring(r * 0.78, 28, (x, y) => [x, cy + y, z]), [0, cy, z], [0, cy + r * 0.5, z], [0, cy, z], [r * 0.34, cy - r * 0.1, z]);
    for (const s of [-1, 1]) g.add(kit.solid(new kit.THREE.SphereGeometry(r * 0.28, 12, 8), s * r * 0.7, cy + r * 0.82, 22, { smooth: true, tone: 'lo' }));
    for (const s of [-1, 1]) g.add(rod(kit, [s * r * 0.6, 8, 22], [s * r * 0.7, 0, 22], 4, 4, 'lo'));
  }
  g.add(kit.lines(pts, 'lo'));
  return kit.merge(g);
}
export function glassesBook(kit, { w = 150, d = 215, seed = 2 } = {}) {   // a paperback and a pair of round glasses lying on it
  const g = kit.group(), pts = [], t = 26;
  g.add(kit.rbox(-w / 2, 0, d / 2, w, t, d, 4));
  pts.push([-w / 2 + 6, t * 0.5, d / 2 + 0.5], [w / 2 - 6, t * 0.5, d / 2 + 0.5]);
  const y = t + 2, gx = 12; for (const s of [-1, 1]) pts.push(...ring(24, 16, (x, z) => [s * 33 + x + gx, y, z + 20]));
  pts.push([gx - 9, y, 20], [gx + 9, y, 20], [gx + 57, y, 20], [gx + 66, y, -40], [gx - 57, y, 20], [gx - 66, y, -50]);
  g.add(kit.lines(pts, 'mid'));
  return kit.merge(g);
}

// ---- storage and clothes ---------------------------------------------------------------------------------------------------------------------------
export function chestOfDrawers(kit, { w = 900, h = 1000, d = 480, rows = 4, pull = 'knob', legs = 'tapered' } = {}) {
  const g = kit.group(), legH = 130, bodyH = h - legH, pts = [], z = d / 2 + 0.8, rh = (bodyH - 60) / rows;
  g.add(legParts(kit, legs, [[-w / 2 + 50, -d / 2 + 50], [w / 2 - 50, -d / 2 + 50], [-w / 2 + 50, d / 2 - 50], [w / 2 - 50, d / 2 - 50]], legH + 6, { r: 28 }));
  g.add(kit.rbox(-w / 2, legH, d / 2, w, bodyH, d, 10)); g.add(kit.rbox(-w / 2 - 12, h - 34, d / 2 + 14, w + 24, 34, d + 14, 8));
  for (let i = 0; i < rows; i++) {
    const y0 = legH + 20 + i * rh, y1 = y0 + rh - 14;
    pts.push([-w / 2 + 24, y0, z], [w / 2 - 24, y0, z], [w / 2 - 24, y0, z], [w / 2 - 24, y1, z], [w / 2 - 24, y1, z], [-w / 2 + 24, y1, z], [-w / 2 + 24, y1, z], [-w / 2 + 24, y0, z]);
    if (pull === 'knob') for (const s of [-1, 1]) g.add(handle(kit, 'knob', s * w * 0.28, (y0 + y1) / 2, d / 2, { tone: 'lo' })); else g.add(handle(kit, pull, 0, (y0 + y1) / 2, d / 2, { w: 120, tone: 'lo' }));
  }
  g.add(kit.lines(pts, 'lo'));
  return kit.merge(g);
}
// one garment on a hanger, hook at the origin (hung from a rail): kind shirt | jumper | coat | dress. front: facing the viewer, built by the hallway coat generator; otherwise edge-on, a soft slab 60 mm thick with rounded shoulders and a fold line
function garment(kit, kind, { tone = 'mid', R, front = false, grey = false }) {   // grey: the soft-grey fill, put on one front-facing coat
  const g = kit.group(), [w, len] = { shirt: [380, 700], jumper: [420, 560], coat: [470, 1100], dress: [340, 1050] }[kind];
  if (front) { g.add(coatGen(kit, 0, 0, 0, { w, len, tone, grey })); return g; }
  g.add(rod(kit, [0, 0, 0], [0, 48, 0], 3.5, 3.5, 'lo')); g.add(rod(kit, [0, 48, 0], [26, 68, 0], 3.5, 3.5, 'lo'));
  for (const s of [-1, 1]) g.add(rod(kit, [0, -14, 0], [s * 70, -40, 0], 4.5, 4.5, 'lo'));
  const T = kit.THREE, th = 50 + R() * 16, hw = w * 0.5, sh = new T.Shape([new T.Vector2(-w * 0.1, 0), new T.Vector2(-hw, -70), new T.Vector2(-hw, -len), new T.Vector2(hw, -len), new T.Vector2(hw, -70), new T.Vector2(w * 0.1, 0)]);   // a flat-sided slab with sloped shoulders, edges rounded
  g.add(kit.solid(new T.ExtrudeGeometry(sh, { depth: th - 12, bevelEnabled: true, bevelThickness: 6, bevelSize: 6, bevelSegments: 2 }), 0, -36, -(th - 12) / 2, { tone }));
  g.add(kit.lines([[-w * 0.1, -50, th / 2 + 1], [-w * 0.1 + 10, -len * 0.5, th / 2 + 2], [-w * 0.1 + 10, -len * 0.5, th / 2 + 2], [-w * 0.1 + 4, -len + 30, th / 2 + 1]], 'mid'));
  return g;
}
export function clothesRail(kit, { w = 1100, h = 1650, items = 4, mix = 'mixed', feet = 'bars', seed = 3 } = {}) {   // a free-standing rail on two A-frames, garments on hangers spaced along it
  const g = kit.group(), R = rnd(seed), d = 420, KINDS = { shirts: ['shirt', 'jumper'], coats: ['coat', 'coat', 'jumper'], dresses: ['dress', 'shirt', 'dress'], mixed: ['shirt', 'coat', 'jumper', 'dress'] }[mix] || ['shirt', 'coat'];
  for (const s of [-1, 1]) {
    const x = s * (w / 2 - 20); g.add(rod(kit, [x, h, 0], [x, 30, d / 2 - 20], 13, 11, 'mid')); g.add(rod(kit, [x, h, 0], [x, 30, -d / 2 + 20], 13, 11, 'mid'));
    if (feet === 'wheels') { g.add(rod(kit, [x, 30, d / 2 - 20], [x, 30, -d / 2 + 20], 12, 12, 'mid')); for (const z of [-1, 1]) g.add(kit.cyl(x, 24, z * (d / 2 - 20), 24, 20, { axis: 'x', seg: 14, tone: 'lo' })); }
    else { g.add(rod(kit, [x, 20, d / 2 + 30], [x, 20, -d / 2 - 30], 16, 16, 'mid')); for (const z of [-1, 1]) g.add(kit.solid(new kit.THREE.SphereGeometry(16, 12, 8), x, 20, z * (d / 2 + 30), { smooth: true, tone: 'mid' })); }
  }
  g.add(rod(kit, [-w / 2 - 20, h, 0], [w / 2 + 20, h, 0], 14, 14, 'mid'));
  let gotGrey = false, x = -w / 2 + 80; for (let i = 0; i < items && x < w / 2 - 70; i++) {
    const k = KINDS[(i + Math.floor(R() * 4)) % KINDS.length], ry = i === 0 || R() < 0.25 ? (R() - 0.5) * 1.1 : (R() < 0.5 ? 1 : -1) * (1.15 + R() * 0.3), q = garment(kit, k, { tone: 'mid', R, front: Math.abs(ry) < 0.7, grey: Math.abs(ry) < 0.7 && !gotGrey && (gotGrey = true) });
    q.position.set(x, h - 8, 0); q.rotation.y = ry; g.add(kit.through(q));   // most hang edge-on to the rail, a few turned to show their front
    x += 70 + R() * 55 + (Math.abs(q.rotation.y) < 0.7 ? 150 : 0);
  }
  return kit.merge(g);
}
export function clothesChair(kit, { seed = 2 } = {}) {   // a dining-style chair with a folded jumper on the seat; throw a jacket over its back with a.drapeOver
  const g = kit.group(), R = rnd(seed); g.add(diningChair(kit));
  const S = 430;   // the jacket is a cloth dropped over the back at spec time: a.drapeOver('jacket', id, { w: 700, d: 900, dz: -150, spin: -20 })
  const j1 = softBox(kit, 360, 270, 70, { r: 34, bulge: 12, tone: 'mid' }); j1.rotation.x = -Math.PI / 2; j1.position.set(0, 415 + 36 + 37, 70); j1.rotation.y = (R() - 0.5) * 0.3; g.add(j1);   // a folded jumper: two layers
  const j2 = softBox(kit, 330, 240, 56, { r: 28, bulge: 10, tone: 'lo' }); j2.rotation.x = -Math.PI / 2; j2.position.set(10, 415 + 36 + 74 + 26, 66); j2.rotation.y = (R() - 0.5) * 0.4 + 0.1; g.add(j2);
  g.add(kit.lines([[-120, 415 + 36 + 76, 150], [80, 415 + 36 + 80, 150]], 'faint'));
  return kit.merge(g);
}
export function hamper(kit, { r = 215, h = 640, form = 'round', lid = 'ajar', seed = 1 } = {}) {
  const g = kit.group(), pts = [], R = rnd(seed);
  if (form === 'square') { g.add(kit.rbox(-r, 0, r, 2 * r, h, 2 * r, 40, lo)); for (const f of [0.15, 0.33, 0.5, 0.67, 0.84]) pts.push([-r, h * f, r + 1], [r, h * f, r + 1]); }
  else { g.add(kit.cyl(0, 0, 0, r * 0.92, h, { rTop: r, seg: 36, ...lo })); for (const f of [0.15, 0.33, 0.5, 0.67, 0.84]) pts.push(...ring(r * (0.92 + 0.08 * f) + 1, 36, (x, z) => [x, h * f, z])); }
  g.add(kit.lines(pts, 'mid'));
  { const sc = drape(kit, 190, 300, { folds: 2, depth: 18, thick: 14, ny: 12, flare: 0.04, tone: 'lo' }); sc.position.set(r * 0.1, h + 8, r * (form === 'square' ? 1 : 0.93) + 12); g.add(sc); }   // a towel hung over the front rim
  if (lid !== 'none') {   // the lid rests on the rim at the left and tilts up from there
    const pv = kit.group(), lidG = form === 'square' ? kit.rbox(0, 0, r + 8, 2 * r + 16, 36, 2 * r + 16, 14) : kit.cyl(r + 8, 0, 0, r + 8, 36, { seg: 36 });
    pv.add(lidG); pv.position.set(-r - 8, h + 2, 0); pv.rotation.z = 0.32; g.add(pv);
  }
  return kit.merge(g);
}
// a tall mirror leaning on the wall: origin the middle of its footprint on the floor, the top meeting the wall at z -depth/2 (back the footprint onto the wall)
export function leaningMirror(kit, { w = 520, h = 1650, shape = 'arch', lean = 8, foot = 'none', frame = 'thin' } = {}) {
  const g = kit.group(), ang = lean * DEG, dep = Math.sin(ang) * h + 40, m = mirror(kit, { w, h, shape, frame }); m.rotation.x = -ang; m.position.set(0, foot === 'block' ? 40 : 0, dep / 2 - 30); g.add(m);
  if (foot === 'block') g.add(kit.box(-w * 0.42, 0, dep / 2 + 70, w * 0.84, 40, 150, lo));   // a wooden foot block it stands on
  else if (foot === 'plinth') { g.add(kit.rbox(-w * 0.6, 0, dep / 2 + 90, w * 1.2, 50, 190, 10, lo)); m.position.y = 50; }   // a low wide plinth
  else if (foot === 'rail') { g.add(kit.cyl(-w * 0.5, 14, dep / 2 + 34, 14, w, { axis: 'x', seg: 12, tone: 'lo' })); }
  else g.add(kit.lines([[-w * 0.35, 4, dep / 2 + 10], [w * 0.35, 4, dep / 2 + 10]], 'lo'));
  return g;
}
export function wallSconce(kit, { arm = 'swing', shade = 'cone', h = 260 } = {}) {   // origin bottom middle on the wall face; y is the height of its backplate's foot
  const g = kit.group(); g.add(kit.cyl(0, 150, 16, 46, 16, { axis: 'z', seg: 24 }));   // the backplate, centred where the arm leaves it
  const top = 150;
  if (arm === 'swing') { g.add(rod(kit, [0, top, 18], [0, top, 120], 8, 8, 'mid')); g.add(rod(kit, [0, top, 120], [0, top + 14, 190], 8, 8, 'mid')); } else g.add(rod(kit, [0, top, 18], [0, top, 70], 9, 9, 'mid'));
  const z = arm === 'swing' ? 190 : 70;
  if (shade === 'globe') g.add(kit.solid(new kit.THREE.SphereGeometry(70, 20, 14), 0, top + 70, z, { smooth: true }));
  else g.add(kit.cyl(0, top + 14, z, 64, 120, { rTop: 36, seg: 28 }));
  return kit.merge(g);
}
