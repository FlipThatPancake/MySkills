// @js:library-hallset — the Hallway batch. Floor pieces: origin the middle of the footprint, front +z. Wall pieces: origin the peg on the wall face, items hang below it and stand out +z. Table pieces: origin the middle of the foot.
// shoeRack, keyBowl, coatStand, hungHat, hungBag, boots, runner, letterTray.
import { rod } from './parts.js';
import { softBox, vessel, drape } from './soft.js';
import { shoe, coat as coatGen, tote } from './softpieces.js';
const lo = { tone: 'lo' }, DEG = Math.PI / 180;
const rnd = (seed) => { let r = (seed || 1) * 9301 + 49297; return () => { r = (r * 9301 + 49297) % 233280; return r / 233280; }; };
const rx = (m, a) => { m.rotation.x = a; return m; };
const bx = (kit) => (cx, y, cz, w, h, d, o) => kit.box(cx - w / 2, y, cz + d / 2, w, h, d, o), rb = (kit) => (cx, y, cz, w, h, d, r, o) => kit.rbox(cx - w / 2, y, cz + d / 2, w, h, d, r, o);
const ringXZ = (cx, y, cz, r, n = 28) => { const p = []; for (let i = 0; i < n; i++) { const a = i / n * 6.2832, b = (i + 1) / n * 6.2832; p.push([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r], [cx + Math.cos(b) * r, y, cz + Math.sin(b) * r]); } return p; };

// shoes standing on a shelf top at y: a mix of sneakers, ankle boots and a slipper pair; one pair heel-out, one askew, gaps left; light shells
function shoesOn(kit, g, R, x0, x1, y, z, { fill = 0.8, L = 265, xs } = {}) {
  for (const x of xs || Array.from({ length: Math.max(0, Math.floor((x1 - x0 - 215) / 215) + 1) }, (_, i) => x0 + 108 + i * 215)) {
    if (R() > fill) continue;
    const q = R(), kind = q < 0.55 ? 'sneaker' : q < 0.8 ? 'boot' : 'slipper', turn = R() < 0.12 ? Math.PI : 0, ro = turn + (R() < 0.25 ? (R() - 0.5) * 0.5 : (R() - 0.5) * 0.22), dx = (R() - 0.5) * 24, LL = (kind === 'slipper' ? 235 : L) * (0.9 + R() * 0.15);
    for (const s of [-1, 1]) { const sh = shoe(kit, 0, 0, LL, { kind: kind === 'boot' ? 'boot' : 'sneaker', tone: kind === 'sneaker' ? (R() < 0.5 ? 'lo' : undefined) : 'lo', light: true }); if (kind === 'slipper') sh.scale.y = 0.62; const c = new kit.THREE.Group(); c.add(sh); c.position.set(x + dx + s * 52 * (turn ? -1 : 1), y, z); c.rotation.y = ro + s * 0.04; g.add(kit.content(c)); }
  }
}

export function shoeRack(kit, { w = 760, tiers = 3, form = 'slat', fill = 'most', seed = 1 } = {}) {   // open tiers for shoes: slatted boards on side panels, a cubby, or thin rod shelves on tapering frames
  const g = kit.group(), B = bx(kit), R = rb(kit), rn = rnd(seed), d = 290, gap = form === 'cubby' ? 190 : 175, fl = fill === 'few' ? 0.45 : fill === 'full' ? 1 : 0.8, H = 70 + tiers * gap + 20;
  const shelfY = (t) => 70 + t * gap;
  if (form === 'slat') {
    for (const s of [-1, 1]) g.add(R(s * (w / 2 - 12), 0, 0, 24, H, d, 5));
    for (let t = 0; t < tiers; t++) { const y = shelfY(t); for (let k = 0; k < 4; k++) g.add(B(0, y, -d / 2 + 38 + k * ((d - 76) / 3), w - 24, 16, 46, t % 2 ? lo : undefined)); }
    g.add(B(0, 0, -d / 2 + 14, w - 24, 50, 18, lo));
  } else if (form === 'cubby') {
    const n = Math.max(2, Math.round(w / 330)), cw = (w - 24) / n;
    for (const s of [-1, 1]) g.add(R(s * (w / 2 - 12), 0, 0, 24, H, d, 4));
    for (let t = 0; t <= tiers; t++) g.add(B(0, t === 0 ? 70 - 20 : shelfY(t) - 20, 0, w - 24, 20, d - 4));
    for (let i = 1; i < n; i++) g.add(B(-w / 2 + 12 + i * cw, 70, 0, 18, H - 70 - 20 + 20 - 10, d - 10, { ...lo, through: true }));   // dividers run through the shelf boards
    g.add(B(0, 0, 8, w - 24, 50, d - 30, lo)); g.add(B(0, 70, -d / 2 + 6, w - 24, H - 70, 10, lo));
  } else {   // rods: two round rods per tier between two slim frames, the frames a little wider at the bottom
    const pts = [];
    for (const s of [-1, 1]) for (const f of [-1, 1]) { const zf = f * (d / 2 - 14); g.add(rod(kit, [s * (w / 2 - 6), 0, zf], [s * (w / 2 - 22), H, zf], 8, 7, 'lo')); }
    for (let t = 0; t < tiers; t++) for (const f of [-1, 1]) g.add(rod(kit, [-w / 2 + 14, shelfY(t) + 6, f * (d / 2 - 60)], [w / 2 - 14, shelfY(t) + 6, f * (d / 2 - 60)], 7, 7, 'mid'));
    for (const s of [-1, 1]) g.add(rod(kit, [s * (w / 2 - 12), 400, -d / 2 + 14], [s * (w / 2 - 12), 400, d / 2 - 14], 6, 6, 'lo'));
  }
  const nC = Math.max(2, Math.round(w / 330)), cwC = (w - 24) / nC;
  for (let t = 0; t < tiers; t++) shoesOn(kit, g, rn, -w / 2 + 24, w / 2 - 24, shelfY(t) + (form === 'slat' ? 16 : form === 'cubby' ? 0 : 12), 0, { fill: fl, L: form === 'cubby' ? 250 : 262, xs: form === 'cubby' ? Array.from({ length: nC }, (_, i) => -w / 2 + 12 + (i + 0.5) * cwC) : undefined });
  return kit.merge(g);
}

// the pale lining of a bowl: the profile pulled in 3 mm and turned so its faces look inward
export const inner = (kit, P) => kit.solid(new kit.THREE.LatheGeometry(P.map(([a, b]) => new kit.THREE.Vector2(Math.max(0.01, a - 3), b + 3)).reverse(), 36), 0, 0, 0, { smooth: true, linen: true });
function key(kit, x, y, z, ang, R) {   // a flat key: a round bow with a hole, a shaft with two teeth
  const g = kit.group(), L = 52 + R() * 12; g.scale.setScalar(1.15);
  g.add(kit.cyl(0, 0, 0, 11, 3, { seg: 16, tone: 'lo' })); g.add(rx(kit.solid(new kit.THREE.TorusGeometry(11, 1.6, 6, 18), 0, 3.4, 0, { smooth: true }), Math.PI / 2));
  g.add(kit.box(11 - 2, 0, 3 / 2 + 4, L, 3, 7, { tone: 'lo' }));
  for (const [t, s] of [[0.55, 6], [0.85, 5]]) g.add(kit.box(11 + L * t, 0, -3.5 + 4 - 1, 5, 3, s, { tone: 'lo' }));
  g.position.set(x, y, z); g.rotation.y = ang; return g;
}
export function keyBowl(kit, { r = 95, form = 'bowl', keys = 3, fob = 'tag', seed = 1 } = {}) {   // a small dish by the door with keys lying in it
  const g = kit.group(), R = rnd(seed), T = kit.THREE; let floor = 10;
  if (form === 'bowl') { { const P = [[r * 0.38, 0], [r * 0.6, 6], [r * 0.95, r * 0.34], [r, r * 0.5]]; g.add(vessel(kit, P, { contents: 'none', seg: 36 })); g.add(inner(kit, P)); } g.add(kit.cyl(0, 10, 0, r * 0.55, 4, { seg: 30, linen: true })); floor = 16; }
  else if (form === 'dish') { { const P = [[r * 0.7, 0], [r * 0.85, 4], [r, 22], [r * 1.02, 30]]; g.add(vessel(kit, P, { contents: 'none', seg: 36 })); g.add(inner(kit, P)); } g.add(kit.cyl(0, 4, 0, r * 0.75, 4, { seg: 30, linen: true })); floor = 10; }
  else { g.add(kit.rbox(-r * 1.1, 0, r * 0.75, r * 2.2, 26, r * 1.5, 12)); g.add(kit.rbox(-r * 1.1 + 12, 20, r * 0.75 - 12, r * 2.2 - 24, 9, r * 1.5 - 24, 8, { linen: true })); floor = 29; }
  const n = Math.max(1, Math.min(5, keys));
  for (let i = 0; i < n; i++) { const a = R() * 6.28, d = form === 'tray' ? 0 : r * (0.12 + 0.2 * R()); g.add(key(kit, Math.cos(a) * d - 8, floor + i * 3.4, Math.sin(a) * d * 0.6, a + i * 1.7, R)); }
  if (fob === 'tag') { const t = kit.rbox(-20 + R() * 30, floor + n * 3.4, 12 + R() * 14, 38, 3.4, 22, 6, lo); t.rotation.y = R() * 3; g.add(t); }
  else if (fob === 'ring') g.add(rx(kit.solid(new T.TorusGeometry(16, 2, 6, 20), 20, floor + n * 3.4 + 2, -8, { smooth: true }), Math.PI / 2));
  return kit.merge(g);
}

function brimHat(kit, { br = 150, cr = 82, ch = 105, tone = 'lo', seed = 1 } = {}) {   // a felt hat from a lathe: crown, pinched top, brim; axis y, brim at y 0
  const T = kit.THREE, g = kit.group(), R = rnd(seed);
  const pr = [[0.01, ch + 2], [cr * 0.55, ch + 4], [cr * 0.9, ch - 4], [cr, ch - 26], [cr * 1.02, 22], [cr * 1.3, 10], [br * 0.8, 7], [br, 11], [br * 0.97, 6], [br * 0.85, 2], [cr * 0.95, 3], [0.01, 3]].reverse().map(([a, b]) => new T.Vector2(a, b));
  g.add(kit.solid(new T.LatheGeometry(pr, 40), 0, 0, 0, { smooth: true, tone }));
  const bandY = 30 + R() * 6; g.add(kit.lines([...ringXZ(0, bandY, 0, cr * 1.03, 36), ...ringXZ(0, bandY + 22, 0, cr * 1.025, 36)], 'mid'));
  return g;
}
function peg(kit, len = 62) { const g = kit.group(); g.add(kit.cyl(0, 0, len / 2, 9, len / 2, { axis: 'z', seg: 10 })); g.add(kit.cyl(0, 0, len, 13, 22, { axis: 'z', seg: 10, ...lo })); return g; }
// a peg centred on the wall face at y 0; axis z: cyl(x,y,z,...,{axis:'z'}) takes the centre z; keep pegs simple: a short post and a round cap
function pegAt(kit, x, y, len) { const g = kit.group(); g.add(kit.cyl(x, y, len, 9, len, { axis: 'z', seg: 10 })); g.add(kit.cyl(x, y, len, 14, 18, { axis: 'z', seg: 12, ...lo })); return g; }   // cyl on the z axis: z is its front face, it reaches back by its height, so the post spans 0 to len

export function hungHat(kit, { form = 'brim', tone = 'lo', seed = 1 } = {}) {   // E7: the beanie is retired (it read as a sack); every form draws the brimmed hat
  form = 'brim';
  void 0;   // a hat hung on a peg: a brimmed hat with its crown out, or a knitted beanie with a bobble
  const g = kit.group(), R = rnd(seed), T = kit.THREE;
  g.add(pegAt(kit, 0, 0, 96));
  if (form === 'brim') {
    const br = 150 + R() * 35, h = brimHat(kit, { br, cr: 72, ch: 100, tone, seed }), pv = kit.group(); pv.add(h); pv.rotation.x = Math.PI / 2 - 0.52; pv.position.set(0, -(br - 14), 100); g.add(pv);
  } else {
    const r = 88, pr = [[0.01, -250], [r * 0.9, -246], [r, -226], [r * 1.0, -190], [r * 1.04, -120], [r * 0.9, -60], [r * 0.5, -22], [0.01, -8]].map(([x, y]) => new T.Vector2(x, y)), sack = kit.solid(new T.LatheGeometry(pr, 30), 0, 0, 0, { smooth: true, tone }); sack.scale.z = 0.42; sack.position.set(0, 0, 70); g.add(sack);
    const rb2 = []; for (let k = 0; k < 5; k++) { const y = -232 + k * 8 + (k ? 0 : 0), rr = r * (0.9 + 0.1 * Math.min(1, k / 2)) + 1; for (let q = 0; q < 24; q++) { const a1 = q / 24 * 6.2832, a2 = (q + 1) / 24 * 6.2832; rb2.push([Math.cos(a1) * rr, y, 70 + Math.sin(a1) * rr * 0.42], [Math.cos(a2) * rr, y, 70 + Math.sin(a2) * rr * 0.42]); } } g.add(kit.lines(rb2, 'mid'));
    g.add(kit.solid(new T.SphereGeometry(24, 12, 10), 0, -10, 70, { smooth: true, tone: 'mid', through: true }));
  }
  return kit.merge(g);
}

export function hungBag(kit, { form = 'satchel', w = 300, h = 230, tone = 'mid', seed = 1 } = {}) {   // a bag hung on a peg by its strap: leather satchel with a flap, canvas tote, or a round basket on its handle
  const g = kit.group(), T = kit.THREE, R = rnd(seed);
  if (form === 'tote') { g.add(pegAt(kit, 0, 0, 74)); g.add(tote(kit, 0, 0, 74, { w, h: h * 1.35, d: 80, strap: 170, tone })); return kit.merge(g); }
  if (form === 'basket') {
    const rr = 120 + R() * 25, zc = rr + 18; g.add(pegAt(kit, 0, 0, zc + 4));
    const pr = [[rr * 0.7, 0], [rr * 0.95, 6], [rr * 1.1, 80], [rr * 1.08, 120]].map(([a, b]) => new T.Vector2(a, b)), body = kit.solid(new T.LatheGeometry(pr, 34), 0, -260, zc, { smooth: true, tone: 'lo' }); g.add(body);
    g.add(rx(kit.solid(new T.CircleGeometry(rr * 1.0, 30), 0, -260 + 108, zc, { soil: true }), -Math.PI / 2));
    const ln = []; for (const f of [0.15, 0.4, 0.65, 0.88]) ln.push(...ringXZ(0, -260 + 120 * f, zc, rr * (0.7 + 0.4 * f) + 1, 34)); g.add(kit.lines(ln, 'mid'));
    const hd = kit.solid(new T.TorusGeometry(rr * 1.05, 6, 8, 24, Math.PI), 0, -260 + 118, zc, { smooth: true, ...lo }); hd.rotation.z = 0; g.add(hd);
    g.add(rod(kit, [-rr * 1.05, -260 + 118, zc], [-rr * 0.18, -8, zc - 2], 5, 5, 'lo')); g.add(rod(kit, [rr * 1.05, -260 + 118, zc], [rr * 0.18, -8, zc - 2], 5, 5, 'lo'));
    return kit.merge(g);
  }
  g.add(pegAt(kit, 0, 0, 74));   // satchel: a body, a flap with a buckle, a strap looped over the peg
  const top = -170, zb = 74 + h * 0.18 + 22, body = softBox(kit, w, h, 90, { r: 30, bulge: 10, sag: 6, tone }); body.position.set(0, top - h / 2, zb); g.add(body);
  const flap = softBox(kit, w * 1.02, h * 0.5, 96, { r: 26, bulge: 6, tone: 'lo' }); flap.position.set(0, top - h * 0.25, zb + 3); g.add(flap);
  g.add(kit.lines([[-w * 0.5, top - h * 0.5, zb + 52], [w * 0.5, top - h * 0.5, zb + 52]], 'mid'));
  g.add(kit.rbox(-16, top - h * 0.5 - 22, zb + 58, 32, 44, 5, 4, lo)); g.add(kit.lines([[-10, top - h * 0.5 - 8, zb + 63], [10, top - h * 0.5 - 8, zb + 63]], 'mid'));
  for (const s of [-1, 1]) { g.add(rod(kit, [s * w * 0.38, top - 6, zb], [s * w * 0.12, top + 90, (zb + 74) / 2], 6, 6, 'lo')); g.add(rod(kit, [s * w * 0.12, top + 90, (zb + 74) / 2], [0, 4, 74], 6, 6, 'lo')); }
  return kit.merge(g);
}

export function coatStand(kit, { form = 'pole', h = 1750, items = 'both', seed = 1 } = {}) {   // a free-standing stand: a pole on a round foot or a tripod, with hooks; a hat on top and a coat on one hook
  const g = kit.group(), R = rnd(seed), T = kit.THREE, rp = 20;
  if (form === 'pole') {
    g.add(kit.cyl(0, 0, 0, 200, 24, { rTop: 190, seg: 40, ...lo })); g.add(kit.cyl(0, 24, 0, rp, h - 24, { seg: 20 })); g.add(kit.solid(new T.SphereGeometry(34, 16, 12), 0, h + 6, 0, { smooth: true, ...lo }));
    for (const [y, ang] of [[h - 120, 0], [h - 120, 90], [h - 120, 180], [h - 120, 270], [h - 300, 45], [h - 300, 135], [h - 300, 225], [h - 300, 315]]) { const a = ang * DEG; g.add(rod(kit, [Math.cos(a) * rp, y, Math.sin(a) * rp], [Math.cos(a) * 130, y + 80, Math.sin(a) * 130], 7, 7, 'lo')); }
  } else {   // tree: three splayed legs, a thick turned shaft, peg arms
    for (let i = 0; i < 3; i++) { const a = (i / 3 * 360 + 30) * DEG; g.add(rod(kit, [Math.cos(a) * 20, 70, Math.sin(a) * 20], [Math.cos(a) * 230, 0, Math.sin(a) * 230], 20, 14, 'lo')); }
    g.add(kit.cyl(0, 40, 0, 30, h - 40, { rTop: 22, seg: 20 })); g.add(kit.cyl(0, h - 6, 0, 28, 32, { rTop: 22, seg: 20, ...lo }));
    for (const [y, ang] of [[h - 140, 20], [h - 140, 140], [h - 140, 260], [h - 320, 80], [h - 320, 200], [h - 320, 320]]) { const a = ang * DEG; g.add(rod(kit, [Math.cos(a) * 20, y, Math.sin(a) * 20], [Math.cos(a) * 150, y + 60, Math.sin(a) * 150], 9, 9, 'lo')); g.add(kit.solid(new T.SphereGeometry(13, 10, 8), Math.cos(a) * 152, y + 62, Math.sin(a) * 152, { smooth: true, ...lo })); }
  }
  if (items === 'hat' || items === 'both') { const hat = brimHat(kit, { br: 140, cr: 78, ch: 100, tone: 'lo', seed }); hat.position.set(0, h + 6 + 34 - 92, 0); hat.rotation.z = 0.08; g.add(kit.through(hat)); }   // the hat hangs on the finial, so it joins the stand
  if (items === 'coat' || items === 'both') { const c = coatGen(kit, 0, h - 120 + 40, 138, { w: 400, len: 900, tone: 'mid' }); c.rotation.y = 0; g.add(kit.through(c)); }   // hung on its hook
  return kit.merge(g);
}

export function boots(kit, { kind = 'wellington', spread = 176, shaft = 250, tone = 'lo', seed = 1 } = {}) {   // a pair of boots, toes to +z: tall rubber wellingtons, leather ankle boots or lace-up hikers
  const g = kit.group(), R = rnd(seed), T = kit.THREE, L = kind === 'wellington' ? 300 : kind === 'hiker' ? 295 : 280;
  for (const s of [-1, 1]) {
    const b = kit.group(), f = shoe(kit, 0, 0, L, { kind: 'boot', tone: kind === 'ankle' ? undefined : tone }); b.add(f);
    const zA = (0.24 - 0.5) * L;
    if (kind === 'wellington') { b.add(kit.cyl(0, 120, zA - 2, 64, 250, { rTop: 74, seg: 28, tone: 'lo' })); b.add(rx(kit.solid(new T.TorusGeometry(74, 8, 8, 28), 0, 370, zA - 2, { smooth: true, tone: 'lo' }), Math.PI / 2)); b.add(kit.cyl(0, 116 + shaft, zA - 2, 66, 4, { through: true, seg: 24, soil: true })); b.add(kit.lines([[-72, 80 + shaft, zA + 2], [72, 80 + shaft, zA + 2], [0, 120, zA + 64], [0, 110 + shaft, zA + 71]], 'faint')); }
    else if (kind === 'hiker') { const ln = []; for (let k = 0; k < 6; k++) { const y = 70 + k * 18, zz = (0.52 - 0.5) * L + k * 14; ln.push([-22, y + 40, zz + 52], [0, y + 46, zz + 56], [0, y + 46, zz + 56], [22, y + 40, zz + 52]); } b.add(kit.lines(ln, 'mid')); b.add(rx(kit.solid(new T.TorusGeometry(52, 14, 8, 20), 0, 156, zA, { smooth: true, ...lo }), Math.PI / 2)); }
    else b.add(kit.rbox(-10, 150, zA - 40, 20, 40, 8, 3, lo));   // a pull tab at the back
    b.position.set(s * spread / 2, 12, 0); b.rotation.y = (R() - 0.5) * 0.3; g.add(b);
  }
  g.add(kit.rbox(-(spread + 190) / 2, 0, L / 2 + 24, spread + 190, 12, L + 48, 5, lo));   // a boot tray under the pair
  return kit.merge(g);
}

export function runner(kit, { w = 700, l = 2400, form = 'stripe', fringe = true, fold = true, tone = 'lo', seed = 1 } = {}) {   // a long hall runner: a flat soft mat with slightly wavy edges, bands or stripes, fringe at both ends, one corner folded over
  const T = kit.THREE, g = kit.group(), R = rnd(seed), th = 9, y = th + 0.5, pts = [], hw = w / 2, hl = l / 2, n = 28;
  const sh = new T.Shape(); const e = (k, a) => Math.sin(k * 0.5 + a) * 3.5 + Math.sin(k * 1.7 + a * 2) * 1.5;
  sh.moveTo(-hw, -hl); sh.lineTo(hw, -hl); for (let k = 1; k <= n; k++) sh.lineTo(hw + e(k, 0.4), -hl + l * k / n); sh.lineTo(-hw, hl); for (let k = n - 1; k >= 0; k--) sh.lineTo(-hw + e(k, 2.1), -hl + l * k / n);
  const geo = new T.ExtrudeGeometry(sh, { depth: th - 4, bevelEnabled: true, bevelThickness: 2, bevelSize: 2, bevelSegments: 2, curveSegments: 4 }); geo.rotateX(Math.PI / 2); geo.translate(0, th - 2, 0);
  const mat = kit.solid(geo, 0, 0, 0, { smooth: false, ...lo }); g.add(mat);
  const inset = (i) => [[-hw + i, y, -hl + 60], [hw - i, y, -hl + 60], [hw - i, y, -hl + 60], [hw - i, y, hl - 60], [hw - i, y, hl - 60], [-hw + i, y, hl - 60], [-hw + i, y, hl - 60], [-hw + i, y, -hl + 60]];
  if (form === 'stripe') { pts.push(...inset(46), ...inset(74)); pts.push([0, y, -hl + 60], [0, y, hl - 60]); }
  else if (form === 'bands') { const bands = Math.max(2, Math.min(4, Math.round(l / 800))); for (let i = 1; i < bands; i++) { const z = -hl + l * i / bands + (R() - 0.5) * 60; pts.push([-hw + 30, y, z], [hw - 30, y, z], [-hw + 30, y, z + 34], [hw - 30, y, z + 34]); } pts.push(...inset(40)); }
  else { const cw = w / 3, rows = 6; for (let i = 1; i < 3; i++) pts.push([-hw + i * cw, y, -hl + 60], [-hw + i * cw, y, hl - 60]); for (let k = 1; k < rows; k++) pts.push([-hw + 40, y, -hl + l * k / rows], [hw - 40, y, -hl + l * k / rows]); pts.push(...inset(40)); }
  g.add(kit.lines(pts, 'mid'));
  if (fringe && fringe !== 'no') { const fr = []; for (const s of [-1, 1]) for (let x = -hw + 14; x <= hw - 14; x += 18) { const dz = (R() - 0.5) * 8; fr.push([x, 4, s * (hl + 2)], [x + dz, 3, s * (hl + 34 + R() * 10)]); } g.add(kit.lines(fr, 'lo')); }
  if (fold && fold !== 'no') {   // the front-left corner turned back over the mat: a triangle lying on top of it
    const s = 190 + R() * 60, tri = new T.Shape(); tri.moveTo(0, 0); tri.lineTo(s, 0); tri.lineTo(0, s); tri.lineTo(0, 0);
    const fl = new T.ExtrudeGeometry(tri, { depth: 6, bevelEnabled: true, bevelThickness: 4, bevelSize: 4, bevelSegments: 4, curveSegments: 4 }); fl.rotateX(Math.PI / 2); fl.translate(0, th + 4, 0);
    const f = kit.solid(fl, -hw + 8, 0, hl - s - 8 + 0.01, { smooth: true, ...lo }); f.position.set(-hw + 8, 0, hl - s - 8 + s * 0 + 0); g.add(f);
  }
  return kit.merge(g);
}

function envelope(kit, x, y, z, ang, tilt = 0, { w = 220, h = 112, stamp = true } = {}) {   // a flat envelope: a thin slab, the flap's V on its back side, a stamp
  const g = kit.group(), yy = 3.5, L = (pts) => pts.flatMap((p, i) => (i && i < pts.length - 1 ? [p, p] : [p]));
  g.add(kit.rbox(-w / 2, 0, h / 2, w, 3, h, 2, { tone: 'lo' }));
  g.add(kit.lines([[-w / 2 + 2, yy, -h / 2 + 2], [0, yy, h * 0.08], [0, yy, h * 0.08], [w / 2 - 2, yy, -h / 2 + 2]], 'faint'));
  if (stamp) { const a = w / 2 - 46, b = w / 2 - 14, c = h / 2 - 34, d = h / 2 - 8; g.add(kit.lines([[a, yy, c], [b, yy, c], [b, yy, c], [b, yy, d], [b, yy, d], [a, yy, d], [a, yy, d], [a, yy, c]], 'mid')); }
  g.position.set(x, y, z); g.rotation.set(tilt, ang, 0); return g;
}
export function letterTray(kit, { form = 'tray', n = 5, w: wIn, seed = 1 } = {}) {   // by the door: letters waiting in a shallow wooden tray, or standing in a slotted caddy
  const g = kit.group(), R = rnd(seed), B = bx(kit), Rb = rb(kit);
  if (form === 'tray') {
    const w = wIn || 330, d = Math.round((wIn || 330) * 0.73), hh = 40;
    g.add(Rb(0, 0, 0, w, 14, d, 6)); g.add(B(0, 14, d / 2 - 7, w, hh - 14, 14)); g.add(B(0, 14, -d / 2 + 7, w, hh - 14, 14)); for (const s of [-1, 1]) g.add(B(s * (w / 2 - 7), 14, 0, 14, hh - 14, d - 28));
    const ew = Math.min(150, w - 90), eh = Math.min(220, d - 56);   // papers lie inside the walls (the tray's inner floor is w - 28 by d - 28): kept small and nearly straight, tagged as separate bodies so the parts check sees them
    for (let i = 0; i < n; i++) g.add(kit.content(envelope(kit, (R() - 0.5) * 24, 14 + i * 3.2, (R() - 0.5) * 16, (R() - 0.5) * 0.2, 0, { stamp: i % 2 === 0 })));
    g.add(kit.content(envelope(kit, 40, 14 + n * 3.2, 6, 0.2, 0, { w: ew, h: eh, stamp: false })));
  } else {   // caddy: a block with slots; letters stand in them, leaning back
    const w = wIn || 300, d = 150, hh = 190, slots = 3;
    g.add(Rb(0, 0, 0, w, 40, d, 8)); for (const s of [-1, 1]) g.add(Rb(s * (w / 2 - 10), 40, 0, 20, hh - 40, d, 5, lo));
    for (let i = 0; i < slots; i++) { const z = -d / 2 + 24 + i * (d - 48) / (slots - 1); g.add(B(0, 40, z, w - 20, 8, 12)); g.add(B(0, 40, z + 4, w - 20, hh * (i === 0 ? 0.9 : i === 1 ? 0.7 : 0.55) - 40, 8, lo)); }
    for (let i = 0; i < slots; i++) { const z = -d / 2 + 24 + i * (d - 48) / (slots - 1) + 22; for (let k = 0; k < (i === 0 ? 3 : 2); k++) { const e = envelope(kit, -60 + k * 55 + R() * 20, 52, z, 0, 0, { w: 100 + R() * 60, h: 112 }); e.rotation.x = -Math.PI / 2 + 0.2; e.position.y = 100 + R() * 14; g.add(e); } }
  }
  return kit.merge(g);
}
