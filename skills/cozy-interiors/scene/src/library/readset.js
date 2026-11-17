// @js:library-readset — the Reading corner batch. Floor pieces: origin the middle of the footprint, front +z (a window seat has its back at -z against the wall). Table pieces: origin the middle of the foot. Wall pieces: origin bottom middle on the wall face, standing out +z.
// windowSeat, readingLamp, floorBooks, teaSet, readShelf.
import { rod, legs as legParts } from './parts.js';
import { softBox, vessel } from './soft.js';
import { foldedThrow } from './softpieces.js';
import { inner } from './hallset.js';
const lo = { tone: 'lo' }, DEG = Math.PI / 180;
const rnd = (seed) => { let r = (seed || 1) * 9301 + 49297; return () => { r = (r * 9301 + 49297) % 233280; return r / 233280; }; };
const bx = (kit) => (cx, y, cz, w, h, d, o) => kit.box(cx - w / 2, y, cz + d / 2, w, h, d, o), rb = (kit) => (cx, y, cz, w, h, d, r, o) => kit.rbox(cx - w / 2, y, cz + d / 2, w, h, d, r, o);
const ringXZ = (cx, y, cz, r, n = 24) => { const p = []; for (let i = 0; i < n; i++) { const a = i / n * 6.2832, b = (i + 1) / n * 6.2832; p.push([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r], [cx + Math.cos(b) * r, y, cz + Math.sin(b) * r]); } return p; };

// one book lying flat, centred on x/z at y: a rounded cover block, the page edges drawn on the front and right sides
function book(kit, x, y, z, w, h, d, ang, tone) {
  const g = kit.group(); g.add(kit.rbox(-w / 2, 0, d / 2, w, h, d, 3, { tone }));
  g.add(kit.lines([[-w / 2 + 6, h * 0.35, d / 2 + 0.6], [w / 2 - 3, h * 0.35, d / 2 + 0.6], [-w / 2 + 6, h * 0.65, d / 2 + 0.6], [w / 2 - 3, h * 0.65, d / 2 + 0.6]], 'faint'));
  g.position.set(x, y, z); g.rotation.y = ang; return g;
}

export function windowSeat(kit, { w = 1500, d = 520, h = 440, form = 'storage', cushion = 'plain', pillows = 2, throwOn = 'yes', seed = 1 } = {}) {   // a built-in seat under a window: a box with drawers, a frame with open cubbies, or a slatted bench on legs; a long cushion, pillows leaning on the wall, a folded throw. Back at -z.
  const g = kit.group(), R = rnd(seed), B = bx(kit), Rb = rb(kit), pts = [], z = d / 2 + 0.6, cuH = 70;
  if (form === 'storage') {
    g.add(Rb(0, 70, 0, w, h - 70 - 20, d, 5)); g.add(B(0, 0, 14, w - 40, 70, d - 40, lo)); g.add(Rb(0, h - 20, 10, w + 20, 20, d + 20, 4));
    const n = Math.max(2, Math.round(w / 550)), cw = (w - 40) / n; for (let i = 0; i < n; i++) { const x0 = -w / 2 + 20 + i * cw + 8, x1 = x0 + cw - 16; pts.push([x0, 86, z], [x1, 86, z], [x1, 86, z], [x1, h - 40, z], [x1, h - 40, z], [x0, h - 40, z], [x0, h - 40, z], [x0, 86, z]); g.add(kit.cyl((x0 + x1) / 2, h - 70, z + 6, 11, 14, { axis: 'z', seg: 10, ...lo })); }
  } else if (form === 'open') {
    for (const s of [-1, 1]) g.add(Rb(s * (w / 2 - 20), 0, 0, 40, h - 20, d, 4)); g.add(B(0, 0, 0, w - 80, 36, d - 20, lo)); g.add(Rb(0, h - 20, 10, w + 20, 20, d + 20, 4));
    const n = Math.max(2, Math.round(w / 600)), cw = (w - 80) / n; for (let i = 1; i < n; i++) g.add(B(-w / 2 + 40 + i * cw, 36, 0, 24, h - 56, d - 20));
    for (let i = 0; i < n; i++) { const cx = -w / 2 + 40 + (i + 0.5) * cw; if (i % 2 === 0) { const bk = kit.cyl(cx, 36, 10, Math.min(cw * 0.32, 130), 150, { rTop: Math.min(cw * 0.34, 140), seg: 24, ...lo }); g.add(bk); pts.push(...ringXZ(cx, 120, 10, Math.min(cw * 0.33, 135), 24)); } else { let y = 36; for (let k = 0; k < 4; k++) { const bh = 26 + R() * 18; g.add(book(kit, cx + (R() - 0.5) * 20, y, 0, cw * 0.55 + R() * 40, bh, d * 0.6, (R() - 0.5) * 0.2, k % 2 ? 'lo' : 'mid')); y += bh; } } }
  } else {   // legs: a slim apron under a seat board, four tapered legs
    g.add(Rb(0, h - 70, 0, w, 70, d, 5, lo)); g.add(Rb(0, h - 20, 10, w + 20, 20, d + 20, 4)); const lp = []; for (const sx of [-1, 1]) for (const sz of [-1, 1]) lp.push([sx * (w / 2 - 70), sz * (d / 2 - 60)]); g.add(legParts(kit, 'tapered', lp, h - 68, { r: 30 }));
    for (let k = 1; k < 4; k++) pts.push([-w / 2 + 20, h - 70, z + k * 0], [w / 2 - 20, h - 70, z]); pts.length = 0; for (let x = -w / 2 + 60; x < w / 2 - 40; x += 120) pts.push([x, h - 62, z], [x, h - 28, z]);
  }
  if (pts.length) g.add(kit.lines(pts, 'lo'));
  const cw2 = w - 50, cd = d - 60, cy = h, cs = softBox(kit, cw2, cuH, cd, { r: 24, bulge: 8, piping: cushion === 'tufted' ? 'none' : 'edge', tone: 'mid', tufts: cushion === 'tufted' ? Array.from({ length: Math.max(2, Math.round(cw2 / 260)) }, (_, i) => [-cw2 / 2 + (i + 0.5) * cw2 / Math.max(2, Math.round(cw2 / 260)), 0]) : undefined }); cs.position.set(0, cy + cuH / 2, 14); g.add(cs);
  if (cushion === 'striped') { const ln = []; for (let x = -cw2 / 2 + 60; x < cw2 / 2 - 40; x += 90) ln.push([x, cy + cuH * 0.6, 14 + cd / 2 + 8], [x, cy + cuH * 0.1, 14 + cd / 2 + 8]); g.add(kit.lines(ln, 'mid')); }
  const pw = [-1, 1, 0].slice(0, Math.max(0, Math.min(3, pillows)));
  pw.forEach((s, i) => { const p = softBox(kit, 340 - i * 20, 330 - i * 20, 110, { r: 50, bulge: 22, dent: 12, piping: 'edge', tone: i % 2 ? 'lo' : 'mid' }); p.position.set(s * (cw2 / 2 - 260) + (R() - 0.5) * 60, cy + cuH + 130, -d / 2 + 90 + 70); p.rotation.x = -(0.30 + R() * 0.16); p.rotation.z = (R() - 0.5) * 0.35; g.add(p); });
  if (throwOn === 'yes') { const t = foldedThrow(kit, { w: 700, d: 360, layers: 3, tone: 'lo' }); t.position.set(cw2 / 2 - 480, cy + cuH, 50); t.rotation.y = 0.08; g.add(t); }
  return kit.merge(g);
}

export function readingLamp(kit, { form = 'arc', h = 1700, shade = 'drum', seed = 1 } = {}) {   // a floor lamp for the reading chair: a long arc from a stone base, a tripod under a drum, or a pharmacy lamp with a swing arm
  const T = kit.THREE, g = kit.group(), R = rnd(seed), Rb = rb(kit);
  const sh = (r, hh) => { const s = kit.group(); if (shade === 'cone') s.add(kit.cyl(0, -hh, 0, r, hh, { rTop: r * 0.45, seg: 30 })); else if (shade === 'dome') s.add(kit.solid(new T.LatheGeometry([[r * 0.96, -hh + 3], [r, -hh], [r * 0.9, -hh * 0.55], [r * 0.6, -hh * 0.2], [r * 0.3, 0]].map(([a, b]) => new T.Vector2(a, b)), 30), 0, 0, 0, { smooth: true })); else s.add(kit.cyl(0, -hh, 0, r, hh, { seg: 30 })); s.add(kit.cyl(0, -hh - 2, 0, r * 0.35, 4, { seg: 12, ...lo })); return s; };
  if (form === 'arc') {
    g.add(Rb(0, 0, 0, 300, 60, 220, 14, lo)); g.add(kit.cyl(-60, 60, 0, 16, h * 0.6, { seg: 12, ...lo }));
    const n = 16, p0 = [-60, 60 + h * 0.6]; let prev = [p0[0], p0[1], 0]; for (let i = 1; i <= n; i++) { const t = i / n, a = t * Math.PI * 0.55, cx2 = -60 + Math.sin(a) * 620, cy2 = p0[1] + (1 - Math.cos(a)) * 260 + t * 90; const cur = [cx2, cy2 - (t > 0.8 ? (t - 0.8) * 120 : 0), 0]; g.add(rod(kit, prev, cur, 9, 9, 'lo')); prev = cur; }
    const s = sh(180, 190); s.position.set(prev[0], prev[1] - 30, 0); g.add(kit.through(s)); g.add(rod(kit, prev, [prev[0], prev[1] - 28, 0], 4, 4, 'lo'));
  } else if (form === 'tripod') {
    for (let i = 0; i < 3; i++) { const a = i / 3 * 6.2832 + 0.5; g.add(rod(kit, [Math.cos(a) * 30, h * 0.55, Math.sin(a) * 30], [Math.cos(a) * 250, 0, Math.sin(a) * 250], 14, 10, 'lo')); }
    g.add(kit.cyl(0, h * 0.5, 0, 12, h * 0.25, { seg: 10, ...lo })); const s = sh(190, 240); s.position.set(0, h * 0.75 + 240, 0); g.add(kit.through(s)); g.add(kit.cyl(0, h * 0.75, 0, 8, 230, { seg: 8, ...lo }));
  } else {   // pharmacy
    g.add(kit.cyl(0, 0, 0, 140, 22, { rTop: 130, seg: 32, ...lo })); g.add(kit.cyl(0, 22, 0, 13, h - 400, { seg: 12 })); const top = [0, h - 380, 0];
    g.add(rod(kit, top, [260, h - 250, 0], 8, 8, 'lo')); g.add(rod(kit, [260, h - 250, 0], [380, h - 330, 0], 8, 8, 'lo')); g.add(kit.solid(new T.SphereGeometry(14, 10, 8), 260, h - 250, 0, { smooth: true, ...lo }));
    const s = sh(105, 140); s.position.set(380, h - 330 + 10, 0); s.rotation.z = 0.3; g.add(kit.through(s));
  }
  return kit.merge(g);
}

export function floorBooks(kit, { n = 6, form = 'stack', topper = 'none', seed = 1 } = {}) {   // books piled on the floor beside the chair: a straight stack, a leaning tower, or two low piles; optionally a cup or glasses on top
  const g = kit.group(), R = rnd(seed); const tones = ['mid', 'lo'];
  const pile = (cx, cz, k, wob) => { let y = 0; for (let i = 0; i < k; i++) { const w = 190 + R() * 110, d = 130 + R() * 90, hh = 24 + R() * 30; g.add(book(kit, cx + (R() - 0.5) * wob, y, cz + (R() - 0.5) * wob * 0.5, w, hh, d, (R() - 0.5) * 0.4, tones[i % 2])); y += hh; } return y; };
  let top;
  if (form === 'pair') { top = Math.max(pile(-130, 0, Math.ceil(n / 2), 24), 0); pile(150, 20, Math.floor(n / 2), 28); }
  else if (form === 'tower') { top = pile(0, 0, n, 50); const lb = book(kit, 150, 0, 0, 230, 34, 160, 0, 'mid'); lb.rotation.z = 0.5; lb.position.set(190, 40, 0); kit.through(lb); g.add(lb); }
  else top = pile(0, 0, n, 26);
  if (topper === 'cup') { const T = kit.THREE; g.add(kit.cyl(10, top, 0, 38, 82, { rTop: 42, seg: 20, ...lo })); g.add(kit.cyl(10, top + 80, 0, 32, 3, { seg: 18, linen: true })); g.add(rod(kit, [48, top + 62, 0], [72, top + 40, 0], 5, 5, 'lo')); }
  else if (topper === 'glasses') { const T = kit.THREE, gl = kit.group(); for (const s of [-1, 1]) { const rg = kit.solid(new T.TorusGeometry(24, 2.2, 6, 20), s * 32, 0, 0, { smooth: true }); rg.rotation.x = Math.PI / 2; gl.add(rg); } gl.add(rod(kit, [-8, 0, 0], [8, 0, 0], 2, 2, 'lo')); gl.position.set(0, top + 3, 10); gl.rotation.y = 0.5; g.add(gl); }
  return kit.merge(g);
}

export function teaSet(kit, { form = 'cup', saucer = 'yes', biscuit = 'yes', steam = 'yes', seed = 1 } = {}) {   // a cup on a saucer with a spoon, or a small teapot beside a cup; a biscuit on the saucer; a few steam lines
  const T = kit.THREE, g = kit.group(), R = rnd(seed);
  const cup = (x, r = 46, hh = 62) => { const P = [[r * 0.45, 0], [r * 0.6, 6], [r * 0.98, hh * 0.55], [r * 1.05, hh]]; g.add(kit.solid(new T.LatheGeometry(P.map(([a, b]) => new T.Vector2(a, b + 8)), 28), x, 0, 0, { smooth: true })); g.add(kit.cyl(x, 0, 0, r * 0.5, 8, { seg: 20, ...lo })); const li = inner(kit, P.map(([a, b]) => [a, b + 8])); li.position.set(x, 0, 0); g.add(li); g.add(kit.cyl(x, hh + 2, 0, r * 0.88, 3, { seg: 20, linen: true })); const hp = [[r * 1.0, hh * 0.85], [r * 1.5, hh * 0.8], [r * 1.55, hh * 0.45], [r * 1.0, hh * 0.3]]; for (let i = 0; i < hp.length - 1; i++) g.add(rod(kit, [x + hp[i][0], hp[i][1] + 8, 0], [x + hp[i + 1][0], hp[i + 1][1] + 8, 0], 4.5, 4.5, 'lo')); return hh + 8; };
  if (form === 'pot') {
    const r = 80, P = [[r * 0.6, 0], [r * 1.05, 24], [r * 1.12, 70], [r * 0.9, 118], [r * 0.5, 130]]; g.add(kit.solid(new T.LatheGeometry(P.map(([a, b]) => new T.Vector2(a, b)), 30), -120, 0, 0, { smooth: true }));
    g.add(kit.cyl(-120, 130, 0, r * 0.52, 12, { rTop: r * 0.4, seg: 24, ...lo })); g.add(kit.solid(new T.SphereGeometry(10, 8, 6), -120, 152, 0, { smooth: true, ...lo }));
    g.add(rod(kit, [-120 + r * 1.0, 40, 0], [-120 + r * 1.75, 120, 0], 9, 6, 'lo'));   // the spout
    const hd = kit.solid(new T.TorusGeometry(48, 6, 8, 20, Math.PI * 1.2), -120 - r * 1.1, 76, 0, { smooth: true, ...lo }); hd.rotation.z = Math.PI * 0.4; g.add(hd);
    g.add(kit.rbox(-225, 0, 105, 450, 10, 210, 5, lo)); cup(120); if (saucer === 'yes') g.add(kit.cyl(120, 0, 0, 86, 6, { rTop: 80, seg: 28, ...lo }));
  } else {
    const hh = cup(0); if (saucer === 'yes') { g.add(kit.cyl(0, 0, 0, 92, 7, { rTop: 88, seg: 30, ...lo })); const li = kit.cyl(0, 7, 0, 60, 2, { seg: 24, linen: true }); g.add(li); }
    g.add(rod(kit, [-30, 12, 70], [30, 18, 82], 3, 3, 'lo'));
    if (biscuit === 'yes') g.add(kit.cyl(78, 7, 20, 26, 8, { rTop: 24, seg: 16, ...lo }));
  }
  if (steam === 'yes') { const ln = []; for (let k = 0; k < 3; k++) { const x = (form === 'pot' ? 120 : 0) + (k - 1) * 20, y0 = 90; for (let i = 0; i < 6; i++) ln.push([x + Math.sin(i * 0.9 + k) * 6, y0 + i * 14, 0], [x + Math.sin((i + 1) * 0.9 + k) * 6, y0 + (i + 1) * 14, 0]); } g.add(kit.lines(ln, 'faint')); }
  return kit.merge(g);
}

export function readShelf(kit, { form = 'ledge', w = 800, seed = 1 } = {}) {   // a small wall shelf: a picture ledge with leaning books and a small frame, a thick floating board with a book pile and a candle, or a board on two brackets with a book row and a jar
  const g = kit.group(), R = rnd(seed), B = bx(kit), Rb = rb(kit), T = kit.THREE, dz = form === 'ledge' ? 46 : form === 'floating' ? 130 : 110;   // the parts are built about the board's middle; the whole is shifted so its back lies on the wall (z 0)
  if (form === 'ledge') {
    g.add(B(0, 0, 0, w, 24, 90)); g.add(B(0, 24, -45 + 8, w, 40, 16, lo)); let x = -w / 2 + 50;
    for (let i = 0; i < 3; i++) { const bw = 140 + R() * 40, bh = 190 + R() * 60; if (x + bw > w / 2 - 270) break; const b = kit.rbox(-bw / 2, 0, 10, bw, bh, 22, 3, { tone: i % 2 ? 'lo' : 'mid' }); b.position.set(x + bw / 2, 24, 26); b.rotation.x = -0.16; g.add(kit.content(b)); x += bw + 30; }
    const fw = 200, fh = 260, fr = kit.rbox(0, 0, 10, fw, fh, 18, 3); fr.position.set(w / 2 - 150, 24, 28); fr.rotation.x = -0.14; g.add(kit.content(fr)); g.add(kit.lines([[w / 2 - 150 - fw / 2 + 20, 24 + 20, 50], [w / 2 - 150 + fw / 2 - 20, 24 + 20, 50], [w / 2 - 150 + fw / 2 - 20, 24 + 20, 50], [w / 2 - 150 + fw / 2 - 20, 24 + fh - 24, 50], [w / 2 - 150 + fw / 2 - 20, 24 + fh - 24, 50], [w / 2 - 150 - fw / 2 + 20, 24 + fh - 24, 50], [w / 2 - 150 - fw / 2 + 20, 24 + fh - 24, 50], [w / 2 - 150 - fw / 2 + 20, 24 + 20, 50]], 'mid'));
  } else if (form === 'floating') {
    g.add(Rb(0, 0, 0, w, 48, 260, 6)); let y = 48; for (let i = 0; i < 5; i++) { const hh = 24 + R() * 20; g.add(kit.content(book(kit, -w / 2 + 200 + (R() - 0.5) * 24, y, 120, 210 + R() * 40, hh, 150 + R() * 30, (R() - 0.5) * 0.3, i % 2 ? 'lo' : 'mid'))); y += hh; }
    g.add(kit.cyl(w / 2 - 160, 48, 130, 46, 100, { rTop: 46, seg: 22, ...lo })); g.add(kit.lines([[w / 2 - 160 + 4, 150, 130], [w / 2 - 160 + 8, 172, 130], [w / 2 - 160 + 8, 172, 130], [w / 2 - 160, 190, 130]], 'mid')); g.add(kit.cyl(w / 2 - 160, 148, 130, 3, 40, { seg: 8, ...lo })); g.add(kit.solid(new T.SphereGeometry(7, 8, 6), w / 2 - 160, 190, 130, { smooth: true, ...lo }));
  } else if (form === 'double') {   // two boards on side uprights: books on the lower, mugs and a jar on the upper
    for (const y of [0, 380]) g.add(Rb(0, y, 0, w, 24, 200, 3));
    for (const s of [-1, 1]) g.add(Rb(s * (w / 2 - 12), 24, 0, 24, 356, 200, 3, lo));
    let x = -w / 2 + 60; for (let i = 0; i < 6 && x < w / 2 - 200; i++) { const bw = 30 + R() * 20, bh = 200 + R() * 70; g.add(kit.content(kit.rbox(x, 24, 150, bw, bh, 150, 2, { tone: i % 2 ? 'lo' : 'mid' }))); x += bw + 2; }
    for (let i = 0; i < 2; i++) g.add(kit.cyl(-w / 2 + 120 + i * 130, 404, 100, 40, 84, { rTop: 44, seg: 22 })); g.add(kit.cyl(w / 2 - 130, 404, 100, 54, 130, { rTop: 40, seg: 22, ...lo }));
  } else if (form === 'pegs') {   // a peg rail with a hung cloth and a hung bag
    g.add(Rb(0, 0, 0, w, 90, 24, 4)); const k = Math.max(3, Math.round(w / 220));
    for (let i = 0; i < k; i++) { const x = -w / 2 + 80 + i * (w - 160) / (k - 1); g.add(rod(kit, [x, 45, 12], [x, 45, 100], 10, 10, 'lo')); g.add(kit.cyl(x, 45, 104, 15, 12, { axis: 'z', seg: 12 })); if (i === 1) g.add(kit.rbox(x - 70, -260, 118, 140, 312, 14, 6, lo));   // a folded throw over a peg
      if (i === k - 1) { g.add(kit.rbox(x - 75, -280, 162, 150, 250, 46, 18)); g.add(kit.lines([[x - 8, 45, 108], [x - 62, -30, 140], [x + 8, 45, 108], [x + 62, -30, 140]], 'lo')); g.add(kit.rbox(x - 56, -40, 152, 34, 130, 26, 2, lo)); g.add(kit.rbox(x - 8, -40, 152, 30, 105, 26, 2)); g.add(kit.rbox(x + 26, -40, 152, 26, 118, 26, 2, lo)); } }   // a tote with books standing in it
  } else {
    g.add(Rb(0, 0, 0, w, 28, 220, 4)); for (const s of [-1, 1]) { const x = s * (w / 2 - 110); g.add(B(x, -150, -103, 22, 170, 14, lo)); g.add(rod(kit, [x, -140, -96], [x, -10, 80], 8, 8, 'lo')); g.add(B(x, -22, -10, 22, 22, 200, lo)); }
    let x = -w / 2 + 60; for (let i = 0; i < 7 && x < w / 2 - 330; i++) { const bw = 30 + R() * 22, bh = 170 + R() * 80; g.add(kit.content(kit.rbox(x, 28, 130, bw, bh, 150, 2, { tone: i % 2 ? 'lo' : 'mid' }))); x += bw + 2; }
    g.add(kit.cyl(w / 2 - 170, 28, 110, 48, 120, { rTop: 56, seg: 22 })); g.add(kit.lines(ringXZ(w / 2 - 170, 34, 110, 48.5, 22), 'mid'));
  }
  const root = kit.group(); g.position.z = dz; root.add(g); return kit.merge(root);
}
