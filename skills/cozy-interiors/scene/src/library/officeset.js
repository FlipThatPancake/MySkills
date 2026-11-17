// @js:library-officeset — the Home office batch. Table pieces: origin the middle of the foot, front +z (a desk user sits at +z, so screens face +z). Wall pieces: origin bottom middle on the wall face, standing out +z.
// deskFrame (the desk forms, used by rooms.js desk), taskLamp, monitor, notebook, pinboard, binders, deskOrganiser, printer, globe, wallCalendar.
import { rod, legs as legParts } from './parts.js';
import { softBox } from './soft.js';
const lo = { tone: 'lo' }, DEG = Math.PI / 180;
const rnd = (seed) => { let r = (seed || 1) * 9301 + 49297; return () => { r = (r * 9301 + 49297) % 233280; return r / 233280; }; };
const rx = (m, a) => { m.rotation.x = a; return m; };
const bx = (kit) => (cx, y, cz, w, h, d, o) => kit.box(cx - w / 2, y, cz + d / 2, w, h, d, o), rb = (kit) => (cx, y, cz, w, h, d, r, o) => kit.rbox(cx - w / 2, y, cz + d / 2, w, h, d, r, o);
const rect = (x0, y0, x1, y1, z) => [[x0, y0, z], [x1, y0, z], [x1, y0, z], [x1, y1, z], [x1, y1, z], [x0, y1, z], [x0, y1, z], [x0, y0, z]];
const ringXZ = (cx, y, cz, r, n = 24) => { const p = []; for (let i = 0; i < n; i++) { const a = i / n * 6.2832, b = (i + 1) / n * 6.2832; p.push([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r], [cx + Math.cos(b) * r, y, cz + Math.sin(b) * r]); } return p; };

// the desk forms: pedestal (a side panel and a drawer unit), trestle (two splayed trestles under a thick top), writing (slim top on an apron with a centre drawer and four legs)
export function deskFrame(kit, { w = 1400, d = 700, h = 740, form = 'pedestal', legs = 'tapered', drawer = 'shut', seed = 1 } = {}) {
  const g = kit.group(), B = bx(kit), R = rb(kit), pts = [], ajar = drawer === 'ajar';
  const tray = (cx, y, zf, wd, ht, pull) => { g.add(B(cx, y, zf, wd, ht, 18, { through: true })); for (const sx of [-1, 1]) g.add(B(cx + sx * (wd / 2 - 8), y + 4, zf - pull / 2 - 9, 12, ht - 22, pull + 60, { ...lo, through: true })); g.add(B(cx, y + 4, zf - pull / 2 - 9, wd - 20, 8, pull + 60, { ...lo, through: true })); };   // a drawer pulled out: its front, two sides and a floor reaching back into the desk (a through part)
  if (form === 'trestle') {
    const TT = 44; g.add(R(0, h - TT, 0, w, TT, d, 8));
    for (const s of [-1, 1]) { const x = s * (w / 2 - 170); for (const f of [-1, 1]) g.add(rod(kit, [x, h - TT, f * (d / 2 - 90)], [x + s * 30, 0, f * (d / 2 - 40)], 24, 20, 'lo')); g.add(rod(kit, [x + s * 12, 300, -(d / 2 - 60)], [x + s * 12, 300, d / 2 - 60], 14, 14, 'lo')); }
    g.add(rod(kit, [-(w / 2 - 170), 260, 0], [w / 2 - 170, 260, 0], 12, 12, 'lo'));
  } else if (form === 'writing') {
    const TT = 26, ap = 80; g.add(R(0, h - TT, 0, w, TT, d, 5));
    g.add(B(0, h - TT - ap, d / 2 - 50, w - 120, ap, 20, lo)); g.add(B(0, h - TT - ap, -d / 2 + 50, w - 120, ap, 20, lo)); for (const s of [-1, 1]) g.add(B(s * (w / 2 - 60), h - TT - ap, 0, 20, ap, d - 100, lo));
    const dw = Math.min(520, w * 0.4), pull = ajar ? 90 : 0; if (ajar) tray(0, h - TT - ap + 6, d / 2 - 38 + pull, dw, ap - 12, 160); else g.add(B(0, h - TT - ap + 6, d / 2 - 38, dw, ap - 12, 14, {})); pts.push(...rect(-dw / 2, h - TT - ap + 6, dw / 2, h - TT - 6, d / 2 - 30 + pull)); g.add(kit.cyl(0, h - TT - ap / 2, d / 2 - 28 + pull, 14, 20, { axis: 'z', seg: 12, ...lo }));
    const lp = []; for (const sx of [-1, 1]) for (const sz of [-1, 1]) lp.push([sx * (w / 2 - 70), sz * (d / 2 - 60)]); g.add(legParts(kit, legs, lp, h - TT - ap + 2, { r: 24 }));
  } else {   // pedestal
    const TT = 30, z = d / 2 + 0.6; g.add(R(0, h - TT, 0, w, TT, d, 6)); g.add(B(-w / 2 + 25, 0, 0, 30, h - TT, d - 60)); g.add(R(w / 2 - 230, 0, 0, 440, h - TT, d - 40, 4)); g.add(B(0, 450, -d / 2 + 80, w - 80, 20, 20, { ...lo, through: true }));
    const rows = Math.max(2, Math.round((h - TT) / 250)), rh = (h - TT - 60) / rows;
    for (let i = 0; i < rows; i++) { const y = 30 + i * rh, pull = ajar && i === rows - 1 ? 110 : 0; if (pull) tray(w / 2 - 235, y + 6, z - 12 + pull, 396, rh - 12, 170); pts.push(...rect(w / 2 - 440, y + 6, w / 2 - 30, y + rh - 6, z - 20 + pull)); g.add(kit.cyl(w / 2 - 230, y + rh / 2, z - 12 + pull, 12, 20, { axis: 'z', seg: 10, ...lo })); }
  }
  if (pts.length) g.add(kit.lines(pts, 'lo'));
  return kit.merge(g);
}

export function taskLamp(kit, { form = 'arm', shade = 'cone', a1 = 62, a2 = -28, seed = 1 } = {}) {   // an adjustable desk lamp: a round foot, two arms with a joint, a shade tilted down over the desk (the shade points toward +z)
  const T = kit.THREE, g = kit.group(), R = rnd(seed); g.add(kit.cyl(0, 0, 0, 80, 18, { rTop: 74, seg: 28, ...lo }));
  let tip;
  if (form === 'gooseneck') {   // a thin curved tube rising and bending forward
    const n = 14, pts = []; for (let i = 0; i <= n; i++) { const t = i / n; pts.push([0, 18 + 380 * Math.sin(t * 1.25), 40 * (1 - Math.cos(t * 1.7)) * 3.2 * t]); }
    for (let i = 0; i < n; i++) g.add(rod(kit, pts[i], pts[i + 1], 6, 6, 'lo')); tip = pts[n];
  } else {
    const L1 = 300, L2 = 270, A = a1 * DEG, B = a2 * DEG, j = [0, 18 + Math.sin(A) * L1, -Math.cos(A) * L1 * 0.15 + 0];   // lower arm leans back a little, upper arm reaches forward
    const p1 = [0, 18, 0], p2 = [0, 18 + Math.sin(A) * L1, -Math.cos(A) * L1 * 0.5], p3 = [0, p2[1] + Math.sin(B + 0.6) * L2 * 0.5, p2[2] + Math.cos(B) * L2];
    g.add(rod(kit, p1, p2, 9, 8, 'lo')); g.add(rod(kit, p2, p3, 8, 7, 'lo')); g.add(kit.solid(new T.SphereGeometry(14, 12, 10), p2[0], p2[1], p2[2], { smooth: true, ...lo })); tip = p3;
  }
  const sh = kit.group(), sr = shade === 'dome' ? 85 : 70;
  if (shade === 'dome') sh.add(kit.solid(new T.LatheGeometry([[0.01, 70], [sr * 0.5, 66], [sr * 0.9, 40], [sr, 0], [sr * 0.9, 2], [sr * 0.5, 40], [0.01, 50]].map(([a, b]) => new T.Vector2(a, b)).reverse(), 28), 0, 0, 0, { smooth: true }));
  else sh.add(kit.cyl(0, 0, 0, sr, 110, { rTop: 24, seg: 28 }));
  sh.rotation.x = 1.9; sh.position.set(tip[0], tip[1] + 6, tip[2] + 24); g.add(sh);   // axis tilted down toward +z
  return kit.merge(g);
}

export function monitor(kit, { w = 560, stand = 'foot', kb = 'yes', seed = 1 } = {}) {   // a flat screen on a stand, dark glass, with an optional keyboard and mouse in front
  const T = kit.THREE, g = kit.group(), R = rb(kit), h = w * 0.56, y0 = stand === 'arm' ? 160 : 100, z = -60;
  g.add(R(0, y0, z, w, h, 20, 8, { tone: 'lo' })); g.add(R(0, y0 + 14, z + 11, w - 28, h - 28, 4, 3, lo)); { const zz = z + 14, cx = 0, cy = y0 + h * 0.5, sw = w - 28, sh = h - 28, ln = [[cx - sw * 0.3, cy + sh * 0.3, zz], [cx - sw * 0.08, cy + sh * 0.42, zz], [cx - sw * 0.34, cy + sh * 0.18, zz], [cx - sw * 0.18, cy + sh * 0.3, zz]];   // the window glint, and two faint window frames
    const rc = (x0, y0b, x1, y1) => [[x0, y0b, zz], [x1, y0b, zz], [x1, y0b, zz], [x1, y1, zz], [x1, y1, zz], [x0, y1, zz], [x0, y1, zz], [x0, y0b, zz]]; g.add(kit.lines(ln, 'mid')); g.add(kit.lines([...rc(cx - sw * 0.1, cy - sh * 0.3, cx + sw * 0.4, cy + sh * 0.3), [cx - sw * 0.1, cy + sh * 0.2, zz], [cx + sw * 0.4, cy + sh * 0.2, zz]], 'faint')); }
  if (stand === 'bar') { g.add(R(0, 0, z - 10, w * 0.42, 14, 220, 6, lo)); g.add(kit.cyl(0, 14, z - 6, 20, y0 - 8, { seg: 14, ...lo })); }
  else if (stand === 'arm') { g.add(kit.cyl(0, 0, -95, 60, 10, { seg: 24, ...lo })); g.add(rod(kit, [0, 10, -95], [0, y0 + h * 0.5, -95], 12, 12, 'lo')); g.add(rod(kit, [0, y0 + h * 0.5, -95], [0, y0 + h * 0.5, z - 6], 10, 10, 'lo')); }
  else { g.add(R(0, 0, 40, 260, 14, 220, 8, lo)); g.add(kit.cyl(0, 14, z - 4, 22, y0 - 12, { rTop: 16, seg: 14, ...lo })); }
  if (kb === 'yes') { g.add(R(0, 0, 300, 400, 16, 130, 6)); const ln = []; for (let k = 1; k < 4; k++) ln.push([-180, 17, 300 - 65 + k * 26], [180, 17, 300 - 65 + k * 26]); g.add(kit.lines(ln, 'lo')); const m = softBox(kit, 60, 22, 100, { r: 22, bulge: 6 }); m.position.set(300, 11, 320); g.add(m); }
  return kit.merge(g);
}

export function notebook(kit, { form = 'closed', w = 150, pens = 1, seed = 1 } = {}) {   // a notebook: closed with an elastic band, open with ruled lines and handwriting scribbles, or spiral-bound; pens lie beside it
  const g = kit.group(), R = rnd(seed), B = bx(kit), Rb = rb(kit), h = w * 1.4, th = 18; let ex = 0;
  if (form === 'open') {
    for (const s of [-1, 1]) { g.add(Rb(s * (w / 2 + 2), 0, 0, w, 6, h, 3, lo)); g.add(Rb(s * (w / 2 + 2), 6, 0, w - 8, 6 + R() * 3, h - 8, 3)); }
    const ln = []; for (const s of [-1, 1]) for (let k = 0; k < 9; k++) { const z = -h / 2 + 24 + k * (h - 48) / 8, x0 = s * 12, x1 = s * (w - 14); ln.push([Math.min(x0, x1), 13, z], [Math.max(x0, x1) - (s < 0 && k === 4 ? 40 : 0), 13, z]); }
    g.add(kit.lines(ln, 'faint')); ex = w * 2;
  } else if (form === 'ledger') {   // a thick hardback: dark covers, a page block, a ribbon bookmark hanging out of the foot
    g.add(Rb(0, 0, 0, w, 8, h, 3, lo)); g.add(Rb(2, 8, 0, w - 10, 26, h - 8, 2)); g.add(Rb(0, 34, 0, w, 8, h, 3, lo)); g.add(kit.lines([[-w / 2 + 14, 42.5, -h / 2 + 8], [-w / 2 + 14, 42.5, h / 2 - 8], [w / 2 - 26, 8, h / 2 - 3], [w / 2 - 26, 34, h / 2 - 3]], 'mid')); g.add(kit.lines([[w / 2 - 40, 42.5, h / 2 - 8], [w / 2 - 40, 42.5, h / 2 + 50]], 'lo')); ex = w;
  } else if (form === 'pad') {   // a ruled pad: card back, a paper block, a binding strip along the top edge
    g.add(Rb(0, 0, 0, w, 6, h, 2, lo)); g.add(Rb(0, 6, 0, w - 6, 12, h - 6, 1)); g.add(Rb(0, 18, -h / 2 + 18, w, 5, 36, 2, lo)); const ln = []; for (let k = 0; k < 8; k++) ln.push([-w / 2 + 14, 18.5, -h / 2 + 56 + k * (h - 80) / 7], [w / 2 - 14, 18.5, -h / 2 + 56 + k * (h - 80) / 7]); g.add(kit.lines(ln, 'faint')); ex = w;
  } else {
    g.add(Rb(0, 0, 0, w, th, h, 5, lo)); g.add(Rb(0, th - 4, 0, w - 6, 4, h - 6, 3)); if (form === 'spiral') { const sp = []; for (let k = 0; k < 14; k++) { const z = -h / 2 + 18 + k * (h - 36) / 13; g.add(kit.solid(new kit.THREE.TorusGeometry(7, 1.8, 6, 12), -w / 2 + 6, th / 2, z, { smooth: true })); } } else { g.add(kit.lines([[w / 2 - 28, 0, h / 2 + 0.5], [w / 2 - 28, th, h / 2 + 0.5], [w / 2 - 28, th + 0.4, h / 2], [w / 2 - 28, th + 0.4, -h / 2]], 'mid')); g.add(kit.lines([[w / 2 - 28, th + 0.4, -h / 2], [w / 2 - 28, th + 0.4, h / 2]], 'mid')); }
    { const y = th + 0.5, a = -w / 2 + 28, b = w / 2 - 50, c = -h / 2 + 28, d2 = -h / 2 + 62; g.add(kit.lines([[a, y, c], [b, y, c], [b, y, c], [b, y, d2], [b, y, d2], [a, y, d2], [a, y, d2], [a, y, c]], 'mid')); } ex = w;
  }
  const top = form === 'open' ? 13 : th + 0.2;
  for (let i = 0; i < pens; i++) { const L = 140 + R() * 15, a = (R() - 0.5) * 1.2, x = ex / 2 + 30 + i * 22, p = kit.group(); p.add(rod(kit, [0, 0, -L / 2], [0, 0, L / 2], 4.5, 4.5, 'lo')); p.add(kit.cyl(0, 0, L / 2, 4.5, 1, { axis: 'z', seg: 8, ...lo })); p.position.set(x, 5, (R() - 0.5) * 40); p.rotation.y = a; g.add(p); }
  return kit.merge(g);
}

export function pinboard(kit, { w = 900, h = 600, notes = 6, frame = 'wood', seed = 1 } = {}) {   // a cork board in a frame with paper notes held by pins, some overlapping, one with a string of lines
  const g = kit.group(), R = rnd(seed), T = kit.THREE, fw = frame === 'none' ? 0 : 26;
  g.add(kit.rbox(-w / 2, 0, 28, w, h, 28, 5, { tone: 'lo' })); g.add(kit.rbox(-w / 2 + fw, fw, 30, w - 2 * fw, h - 2 * fw, 8, 3, { linen: true }));
  const z = 30 + 1;
  for (let i = 0; i < notes; i++) {
    const nw = 90 + R() * 80, nh = 80 + R() * 90, cx = -w / 2 + fw + nw / 2 + 20 + R() * (w - 2 * fw - nw - 40), cy = fw + nh / 2 + 20 + R() * (h - 2 * fw - nh - 40), a = (R() - 0.5) * 0.3, n = kit.group();
    n.add(kit.box(-nw / 2, -nh / 2, 1.5, nw, nh, 1.5, { tone: 'lo' })); const ln = []; for (let k = 0; k < 2 + Math.floor(R() * 4); k++) { const y = nh / 2 - 22 - k * 16; if (y > -nh / 2 + 8) ln.push([-nw / 2 + 10, y, 1.6], [nw / 2 - 10 - R() * 30, y, 1.6]); } if (ln.length) n.add(kit.lines(ln, 'faint'));
    n.add(kit.solid(new T.SphereGeometry(6, 8, 6), 0, nh / 2 - 10, 5, { smooth: true, tone: 'mid' }));
    n.position.set(cx, cy, z + 8 + (i % 3) * 1.5); n.rotation.z = a; g.add(n);
  }
  return kit.merge(g);
}

export function binders(kit, { n = 5, h = 300, form = 'row', tone = 'mid', seed = 1 } = {}) {   // lever-arch files standing in a row (spines to +z with a label and a finger hole), slim ring binders in a row, lying in a stack, or one binder lying open with its rings and ruled pages
  const g = kit.group(), R = rnd(seed), B = bx(kit), Rb = rb(kit), pts = [], ac = tone === 'accent' ? { tone: 'accent' } : {}; let x = 0;   // tone accent: every other file takes the home's accent
  if (form === 'open') {
    const s = h / 300, L = 250 * s, H = 300 * s;
    const cv = tone === 'accent' ? ac : lo; g.add(Rb(-L / 2 - 14, 0, 0, L, 7, H, 3, cv)); g.add(Rb(L / 2 + 14, 0, 0, L, 7, H, 3, cv)); g.add(Rb(0, 0, 0, 32, 9, H, 3, cv));
    g.add(Rb(-L / 2 - 12, 7, 0, L - 14, 10 + R() * 4, H - 14, 2)); g.add(Rb(L / 2 + 14, 7, 0, L - 14, 28, H - 14, 2));
    for (const z of [-H * 0.32, 0, H * 0.32]) g.add(kit.solid(new kit.THREE.TorusGeometry(15, 2.6, 6, 14), 0, 40, z, { smooth: true, tone: 'lo' }));
    const ln = []; for (let k = 0; k < 14; k++) { const z = -H / 2 + 30 + k * (H - 60) / 13; ln.push([44, 35.6, z], [L - 8, 35.6, z]); } g.add(kit.lines(ln, 'faint'));
    return kit.merge(g);
  }
  if (form === 'stack') { let y = 0; for (let i = 0; i < n; i++) { const hh = 44 + R() * 18, dw = 300 + R() * 20; g.add(Rb((R() - 0.5) * 14, y, 0, 230 + R() * 16, hh, dw, 4, i % 2 ? lo : ac)); pts.push([-70, y + hh / 2, dw / 2 + 0.6], [70, y + hh / 2, dw / 2 + 0.6]); y += hh; } g.add(kit.lines(pts, 'lo')); return kit.merge(g); }
  const ws = Array.from({ length: n }, () => form === 'slim' ? 34 + R() * 14 : 56 + R() * 26), tot = ws.reduce((a, b) => a + b, 0); x = -tot / 2;
  for (let i = 0; i < n; i++) { const w = ws[i], hh = h * (0.92 + R() * 0.12), cx = x + w / 2; g.add(Rb(cx, 0, 0, w, hh, 290, 6, i % 2 ? lo : ac)); const zf = 290 / 2 + 0.6; pts.push(...rect(cx - w * 0.3, hh * 0.55, cx + w * 0.3, hh * 0.9, zf)); for (let k = 0; k < 14; k++) { const a = k / 14 * 6.2832, b = (k + 1) / 14 * 6.2832; pts.push([cx + Math.cos(a) * w * 0.22, hh * 0.18 + Math.sin(a) * w * 0.1, zf], [cx + Math.cos(b) * w * 0.22, hh * 0.18 + Math.sin(b) * w * 0.1, zf]); } x += w; }
  g.add(kit.lines(pts, 'lo')); return kit.merge(g);
}

export function deskOrganiser(kit, { form = 'cups', n = 3, tall = 1, pens = 3, tone = 'mid', seed = 1 } = {}) {   // pen pots (round cups or square boxes) with pens and a ruler sticking out, or a stack of paper trays
  const g = kit.group(), R = rnd(seed), Rb = rb(kit), lt = { tone };
  if (form === 'tiered') { for (let i = 0; i < Math.max(2, Math.min(4, n)); i++) { const y = i * 70; g.add(Rb(0, y, 0, 330, 14, 250, 5, lo)); for (const s of [-1, 1]) g.add(Rb(s * 158, y, 0, 14, 80, 250, 4)); g.add(Rb(0, y + 14, -115, 330, 60, 14, 4)); if (i < 2) for (let k = 0; k < 1 + (i + Math.floor(R() * 2)); k++) g.add(Rb((R() - 0.5) * 20, y + 14 + k * 4, 6, 270, 4, 210, 1, { linen: true })); } return kit.merge(g); }
  const cnt = Math.max(2, Math.min(4, n)), base = [[44, 110], [38, 140], [50, 90], [40, 120]].slice(0, cnt);
  base.forEach(([r, h0], i) => { const h = h0 * tall, x = (i - (cnt - 1) / 2) * 112, tn = i % 2 ? lt : {};
    if (form === 'pots') { g.add(Rb(x, 0, 0, r * 1.9, h, r * 1.9, 6, tn)); g.add(Rb(x, h - 3, 0, r * 1.5, 3, r * 1.5, 2, { linen: true })); } else { g.add(kit.cyl(x, 0, 0, r, h, { rTop: r * 1.05, seg: 24, ...(i % 2 ? lt : {}) })); g.add(kit.cyl(x, h - 3, 0, r * 0.82, 3, { seg: 20, linen: true })); }
    for (let k = 0; k < Math.max(1, Math.round(pens * (0.6 + 0.3 * (i % 2)))); k++) { const a = R() * 6.28, tl = 0.08 + R() * 0.2, L = 150 + R() * 40; const out = 50 + R() * 40, lat = (r - 10) * 0.3 + out * tl; g.add(rod(kit, [x + Math.cos(a) * 6, h - 110, Math.sin(a) * 6], [x + Math.cos(a) * lat, h + out, Math.sin(a) * lat], 4.5, 4.5, 'lo', true)); } });
  g.add(Rb(0, 0, 90, cnt * 112 - 12, 10, 70, 3, lo));   // a little tray in front
  return kit.merge(g);
}

export function printer(kit, { w = 430, form = 'inkjet', h: hIn, lid: lidForm = 'flat', paper = 'stack', seed = 1 } = {}) {   // a desktop printer: a boxy body, a sloped lid, a paper tray with a sheet in it, an output slot and a button
  const g = kit.group(), Rb = rb(kit), R = rnd(seed), d = w * 0.8, h = hIn || (form === 'inkjet' ? 170 : 210), z = 0;
  g.add(Rb(0, 0, z, w, h * 0.66, d, 14)); g.add(Rb(0, h * 0.66 - 2, -8, w - 16, lidForm === 'raised' ? h * 0.62 : h * 0.4, d - 40, 10, lo));
  g.add(Rb(0, h * 0.18, d / 2 - 2, w - 80, 8, 120, 2, { tone: 'lo', through: true })); g.add(Rb(0, h * 0.18 + 8, d / 2 + 40, w - 120, 3, 160, 1, { linen: true, through: true }));   // the output tray and a sheet
  if (paper === 'stack') g.add(Rb(0, h * 0.66 + 14, -d / 2 + 70, w - 90, 5, 150, 1, { linen: true, through: true }));   // paper standing up at the back
  g.add(kit.lines([[-w / 2 + 70, h * 0.4, d / 2 + 0.5], [w / 2 - 70, h * 0.4, d / 2 + 0.5]], 'mid')); g.add(kit.cyl(w / 2 - 40, h * 0.5, d / 2 - 8, 9, 6, { axis: 'z', seg: 14, ...lo }));
  return kit.merge(g);
}

export function globe(kit, { r = 130, stand = 'arc', tilt = 23.5, tone = 'lo', seed = 1 } = {}) {   // a desk globe tilted on its axis: a sphere with a few continent outlines, in a half-ring on a round foot, a ring cradle on a stem, or a ring on three legs
  const g = kit.group(), R = rnd(seed), T = kit.THREE, cy = (stand === 'tripod' ? 190 : 72) + r + 20, pv = kit.group(), tn = { tone };
  if (stand === 'tripod') { for (let i = 0; i < 3; i++) { const a = i / 3 * 6.2832 + 0.4; g.add(rod(kit, [Math.cos(a) * 30, cy - r * 0.5, Math.sin(a) * 30], [Math.cos(a) * 150, 0, Math.sin(a) * 150], 11, 8, 'lo')); } const ring = kit.solid(new T.TorusGeometry(r * 0.78, 7, 8, 32), 0, cy - r * 0.62, 0, { smooth: true, ...tn }); ring.rotation.x = Math.PI / 2; g.add(ring); }
  else { g.add(kit.cyl(0, 0, 0, 95, 14, { rTop: 88, seg: 30, ...lo })); g.add(kit.cyl(0, 14, 0, 14, stand === 'cradle' ? cy - r * 0.5 - 14 : 58, { seg: 12, ...lo })); }
  if (stand === 'cradle') { const c = kit.solid(new T.TorusGeometry(r + 10, 6, 8, 36, Math.PI), 0, cy, 0, { smooth: true, ...tn }); c.rotation.set(Math.PI, 0, 0); c.rotation.z = 0; g.add(c); const c2 = kit.solid(new T.TorusGeometry(r + 10, 6, 8, 36, Math.PI), 0, cy, 0, { smooth: true, ...tn }); c2.rotation.set(0, Math.PI / 2, Math.PI); g.add(c2); }
  else if (stand === 'arc') g.add(kit.solid(new T.TorusGeometry(r + 16, 5, 8, 36, Math.PI), 0, cy, 0, { smooth: true, ...tn }));
  pv.position.set(0, cy, 0); pv.rotation.z = tilt * DEG; pv.add(kit.solid(new T.SphereGeometry(r, 36, 24), 0, 0, 0, { smooth: true }));
  const ln = []; for (let c = 0; c < 5; c++) { const lat = (R() - 0.5) * 2.2, lon = R() * 6.28, rad = 0.35 + R() * 0.4, pts = [];
    for (let k = 0; k < 12; k++) { const a = k / 12 * 6.2832, rr = rad * (0.6 + 0.4 * R()), la = lat + Math.sin(a) * rr * 0.8, lo2 = lon + Math.cos(a) * rr; pts.push([Math.cos(la) * Math.sin(lo2) * (r + 1), Math.sin(la) * (r + 1), Math.cos(la) * Math.cos(lo2) * (r + 1)]); }
    for (let k = 0; k < pts.length; k++) ln.push(pts[k], pts[(k + 1) % pts.length]); }
  pv.add(kit.lines(ln, 'mid')); pv.add(kit.lines(ringXZ(0, 0, 0, r + 0.6, 40), 'faint')); g.add(pv);
  return kit.merge(g);
}

export function wallCalendar(kit, { form = 'grid', w = 300, tone = 'lo', hook = 'nail', seed = 1 } = {}) {   // a paper wall calendar hung from a nail: a picture block over a month grid, a plain year planner of big cells, a tall photo sheet with a small date strip
  const g = kit.group(), R = rnd(seed), h = w * (form === 'photo' ? 1.7 : 1.4), pts = [], z = 8;
  g.add(kit.box(-w / 2, 0, z, w, h, 3, { tone })); if (hook === 'nail') g.add(kit.solid(new kit.THREE.SphereGeometry(7, 8, 6), 0, h + 22, 8, { smooth: true, ...lo })); else { g.add(kit.cyl(0, h + 8, 12, 3, 28, { seg: 6, ...lo })); g.add(kit.lines([[-w * 0.18, h - 2, z + 1], [-w * 0.18, h + 30, z + 1], [-w * 0.18, h + 30, z + 1], [w * 0.18, h + 30, z + 1], [w * 0.18, h + 30, z + 1], [w * 0.18, h - 2, z + 1]], 'mid')); } g.add(kit.lines([[-w * 0.3, h - 2, z + 0.5], [0, h + 22, z], [0, h + 22, z], [w * 0.3, h - 2, z + 0.5]], 'faint'));
  const zf = z + 0.6;
  if (form === 'grid') { pts.push(...rect(-w / 2 + 14, h * 0.5, w / 2 - 14, h - 14, zf)); pts.push([-w / 2 + 14, h * 0.5 + 40, zf], [w / 2 - 14, h * 0.5 + 40, zf]);
    const gx0 = -w / 2 + 14, gx1 = w / 2 - 14, gy0 = 16, gy1 = h * 0.5 - 18; for (let i = 0; i <= 7; i++) pts.push([gx0 + (gx1 - gx0) * i / 7, gy0, zf], [gx0 + (gx1 - gx0) * i / 7, gy1, zf]); for (let k = 0; k <= 5; k++) pts.push([gx0, gy0 + (gy1 - gy0) * k / 5, zf], [gx1, gy0 + (gy1 - gy0) * k / 5, zf]);
    pts.push(...rect(-w / 2 + 14 + 40 * 0, h * 0.5 + 50, -w / 2 + 60, h * 0.5 + 70, zf)); }
  else if (form === 'photo') { pts.push(...rect(-w / 2 + 14, h * 0.28, w / 2 - 14, h - 16, zf)); for (let k = 0; k < 14; k++) pts.push([-w / 2 + 14 + (w - 28) * k / 14, h * 0.28 + 30 + 60 * Math.sin(k * 0.7 + seed), zf], [-w / 2 + 14 + (w - 28) * (k + 1) / 14, h * 0.28 + 30 + 60 * Math.sin((k + 1) * 0.7 + seed), zf]); pts.push(...rect(-w / 2 + 14, 16, w / 2 - 14, h * 0.28 - 14, zf)); for (let i = 1; i < 7; i++) pts.push([-w / 2 + 14 + (w - 28) * i / 7, 16, zf], [-w / 2 + 14 + (w - 28) * i / 7, h * 0.28 - 14, zf]); }
  else { const cols = 3, rows = 4, gx0 = -w / 2 + 16, gx1 = w / 2 - 16, gy0 = 16, gy1 = h - 40; for (let i = 0; i <= cols; i++) pts.push([gx0 + (gx1 - gx0) * i / cols, gy0, zf], [gx0 + (gx1 - gx0) * i / cols, gy1, zf]); for (let k = 0; k <= rows; k++) pts.push([gx0, gy0 + (gy1 - gy0) * k / rows, zf], [gx1, gy0 + (gy1 - gy0) * k / rows, zf]); pts.push([-w / 2 + 40, h - 22, zf], [w / 2 - 40, h - 22, zf]); }
  const cx = -w / 2 + 14 + (w - 28) * (1 + Math.floor(R() * 5)) / 7, cy = 16 + (h * 0.5 - 34) * (1 + Math.floor(R() * 3)) / 5; if (form === 'grid') for (let k = 0; k < 16; k++) { const a = k / 16 * 6.2832, b = (k + 1) / 16 * 6.2832; pts.push([cx + Math.cos(a) * 14, cy + Math.sin(a) * 12, zf + 0.2], [cx + Math.cos(b) * 14, cy + Math.sin(b) * 12, zf + 0.2]); }
  g.add(kit.lines(pts, 'mid')); return kit.merge(g);
}
