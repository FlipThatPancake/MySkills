// @js:library-decor — small things that make a corner worth looking at: soft pieces, things that live, things on walls, drawn like the rest (plain solids, soft outlines, real millimetres).
// Origins: floor pieces (sideTable, roundTable, cat, basket, pouf) have it in the middle of the footprint on the floor, front toward +z; pieces that stand on something (cushion, vase, bookStack) at the middle of their foot;
// wall pieces (mirror, wallShelf) at the bottom middle on the wall face, standing out toward +z.
// floorPlant({ h = 950 }), cushion({ w = 440, h = 420, tone }), vase({ h = 280, stems = 5, seed }), bookStack({ n = 4, seed }), mirror({ w = 700, h = 1000, shape: 'arch' | 'round' | 'pill' }), wallShelf({ w = 900, seed }),
// sideTable({ r = 230, h = 520 }), roundTable({ r = 650, h = 750 }), cat({ scale = 1 }), basket({ r = 230, h = 320 }), pouf({ r = 280, h = 380 }).
const rnd = (seed) => { let r = (seed || 1) * 9301 + 49297; return () => { r = (r * 9301 + 49297) % 233280; return r / 233280; }; };
import { potTop } from './pots.js';
import { bookRow } from './books.js';
import { sleeper } from '../motion/catmodel.js';
const lo = { tone: 'lo' };

export function vase(kit, { h = 280, stems = 5, seed = 3 } = {}) {   // a bottle vase with branches: thin curved lines with a few leaves
  const g = kit.group(), R = rnd(seed), pts = [];
  g.add(kit.cyl(0, 0, 0, 70, h * 0.62, { rTop: 80, seg: 24 })); g.add(kit.cyl(0, h * 0.62, 0, 80, h * 0.38, { rTop: 30, seg: 24 }));
  const T = kit.THREE, bud = (x, y, a, L) => { const ge = new T.SphereGeometry(1, 10, 7); ge.scale(5.5, L, 5.5); const m = kit.solid(ge, x, y, 0, { smooth: true, leaf: true }); m.rotation.z = -a; m.position.set(x + Math.sin(a) * L * 0.8, y + Math.cos(a) * L * 0.8, 0); g.add(m); };   // a bud: a small pointed ellipsoid along the twig's direction
  const twig = (x, y, a, len, bow, n, depth) => {   // a gently curved twig: its direction turns a little at every step; it ends in a bud
    for (let i = 1; i <= n; i++) { const nx = x + Math.sin(a) * len / n, ny = y + Math.cos(a) * len / n; pts.push([x, y, 0], [nx, ny, 0]); x = nx; y = ny; a += bow / n; if (depth && i > 1 && i < n - 1 && i % 3 === 1) twig(x, y, a + (i % 2 ? 0.62 : -0.62) + (R() - 0.5) * 0.2, len * 0.3, (i % 2 ? -0.25 : 0.25), 4, 0); }
    bud(x, y, a, 15 + R() * 8);
  };
  for (let s = 0; s < stems; s++) {
    const lean = (s - (stems - 1) / 2) * 0.24 + (R() - 0.5) * 0.14, len = 420 + R() * 380, bow = (R() - 0.5) * 0.9;
    twig(0, h, lean, len, bow, 16, 1);
  }
  g.add(kit.lines(pts, 'mid'));
  return kit.merge(g);
}
export function bookStack(kit, { n = 4, seed = 5 } = {}) {   // books lying on each other, each turned a little; the top one a thin paperback
  const g = kit.group(), R = rnd(seed); let y = 0;
  for (let i = 0; i < n; i++) {
    const w = 210 + R() * 50 - i * 8, d = 155 + R() * 30 - i * 4, th = i === n - 1 && R() < 0.6 ? 18 : 22 + R() * 34, m = kit.box(-w / 2, y, d / 2, w, th, d, i % 2 ? lo : {});
    m.rotation.y = (R() - 0.5) * 0.3; g.add(m); y += th;
  }
  return kit.merge(g);
}
export function mirror(kit, { w = 700, h = 1000, shape = 'arch', frame = 'thin' } = {}) {   // shape arch | pill | round | rect; frame thin | thick
  const g = kit.group(), F = frame === 'thick' ? 56 : 30, D = 26, pts = [];
  if (shape === 'round') { const r = w / 2; g.add(kit.cyl(0, r, D, r, D, { axis: 'z', seg: 48 })); g.add(kit.cyl(0, r, D + 4, r - F, 4, { axis: 'z', seg: 48, ...lo })); h = w; }
  else { const r = shape === 'pill' ? w / 2 : shape === 'rect' ? 16 : 90; g.add(kit.rbox(-w / 2, 0, D, w, h, D, shape === 'arch' ? w / 2 : r)); g.add(kit.rbox(-w / 2 + F, F, D + 3, w - 2 * F, h - 2 * F, 3, shape === 'arch' ? w / 2 - F : r - F, lo)); }
  const cy = h * 0.5, z = D + 5;   // two short glints on the glass
  pts.push([-w * 0.16, cy + h * 0.2, z], [w * 0.06, cy + h * 0.32, z], [-w * 0.2, cy + h * 0.1, z], [-w * 0.04, cy + h * 0.2, z]);
  g.add(kit.lines(pts, 'mid'));
  return kit.merge(g);
}
export function wallShelf(kit, { w = 900, seed = 4 } = {}) {   // a floating board with a row of books, a pot and a bowl
  const g = kit.group(), R = rnd(seed), T = 30, D = 230;
  g.add(kit.rbox(-w / 2, 0, D, w, T, D, 6));
  { const { group } = bookRow(kit, { x: -w / 2 + 40, y: T, z: D / 2, len: w * 0.5 - 40, dep: D - 80, hmax: 250, hmin: 150, R, lean: R() < 0.6 }); g.add(group); }
  g.add(kit.cyl(w * 0.2, T, D / 2, 52, 110, { rTop: 66, seg: 20, ...lo })); g.add(kit.cyl(w * 0.38, T, D / 2, 70, 56, { rTop: 84, seg: 24 }));
  return kit.merge(g);
}
export function roundTable(kit, { r = 650, h = 750 } = {}) {
  const g = kit.group();
  g.add(kit.cyl(0, h - 36, 0, r, 36, { seg: 48 }));
  g.add(kit.cyl(0, 30, 0, 70, h - 66, { rTop: 56, seg: 24, ...lo })); g.add(kit.cyl(0, 0, 0, 280, 30, { rTop: 250, seg: 32 }));
  return kit.merge(g);
}
export function cat(kit, { scale = 1 } = {}) {   // a cat asleep in a ring with its head on its paws: the same model as the living sleeping cat (motion/catmodel.js), held still
  const T = kit.THREE, c = kit.merge(kit.group().add(sleeper(kit, { seed: 1 }).group)), FLAT = 24, V = new T.Vector3();
  // bake every part's placement into its vertices, then flatten everything below FLAT mm up to FLAT and lower the cat by FLAT: it rests on a flat patch (the tilted head's chin would otherwise
  // sink 40 mm into the floor, and a rounded belly gives nothing to stand on); the cat's middle sits on the origin
  c.updateMatrixWorld(true); const inv = c.matrixWorld.clone().invert(), jobs = [], seen = new Set();
  c.traverse((o) => { if (o.geometry && !seen.has(o.geometry)) { seen.add(o.geometry); jobs.push([o.geometry, inv.clone().multiply(o.matrixWorld)]); } });
  for (const [geo, M] of jobs) {
    const at = geo.attributes;
    if (at.instanceStart) { const done = new Map(); for (const n of ['instanceStart', 'instanceEnd']) { const a = at[n], arr = a.data.array, st = a.data.stride, off = a.offset; if (!done.has(arr)) done.set(arr, new Set()); if (done.get(arr).has(off)) continue; done.get(arr).add(off); for (let i = off; i + 2 < arr.length; i += st) { V.set(arr[i], arr[i + 1], arr[i + 2]).applyMatrix4(M); arr[i] = V.x; arr[i + 1] = Math.max(FLAT, V.y); arr[i + 2] = V.z; } a.data.needsUpdate = true; } }
    else { geo.applyMatrix4(M); const a = at.position; for (let i = 0; i < a.count; i++) if (a.getY(i) < FLAT) a.setY(i, FLAT); a.needsUpdate = true; }
    geo.boundingBox = null; geo.boundingSphere = null;
  }
  c.traverse((o) => { if (o !== c) { o.position.set(0, 0, 0); o.quaternion.identity(); o.scale.set(1, 1, 1); } });
  c.position.set(-25, -FLAT, -33); kit.through(c);   // a soft body: its head, paws and tail lie into one another by design
  const m = kit.group(); m.add(c); if (scale !== 1) m.scale.setScalar(scale); return m;
}
// A leaf with a midrib: an ellipsoid of length len and width wid, folded along its midrib (a shallow V) and bowed along its length, with the midrib drawn. Origin at its base, pointing along +y.
export function foldedLeaf(kit, len, wid, { fold = 0.22, bow = 0.18 } = {}) {
  const T = kit.THREE, ge = new T.SphereGeometry(1, 14, 12), pos = ge.attributes.position, g = kit.group();
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i) * wid, y = (pos.getY(i) + 1) / 2 * len, z = pos.getZ(i) * wid * 0.09; pos.setXYZ(i, x, y, z + Math.abs(x) * fold + bow * len * Math.pow(y / len, 2)); }
  ge.computeVertexNormals(); g.add(kit.solid(ge, 0, 0, 0, { smooth: true, leaf: true }));
  const rib = []; for (let k = 0; k < 8; k++) { const y0 = k / 8 * len, y1 = (k + 1) / 8 * len; rib.push([0, y0, bow * len * Math.pow(y0 / len, 2) + wid * 0.09 + 1], [0, y1, bow * len * Math.pow(y1 / len, 2) + wid * 0.09 + 1]); }
  g.add(kit.lines(rib, 'green')); return g;
}
export function floorPlant(kit, { h = 950, seed = 6 } = {}) {   // a large pot with tall stems (visible, each with its own leaf, folded along its midrib), about 950 mm high
  const T = kit.THREE, g = kit.group(), R = rnd(seed);
  g.add(kit.cyl(0, 0, 0, 170, 380, { rTop: 215, seg: 32, ...lo })); { const t = potTop(kit, 215); t.position.y = 380; g.add(t); }
  const stem = (a, b) => { const d = new T.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length(), cg = new T.CylinderGeometry(4, 5, L, 6), m = kit.solid(cg, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, { smooth: true, leaf: true }); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); g.add(m); };
  for (let k = 0; k < 9; k++) {
    const a = k / 9 * Math.PI * 2 + R(), lean = 0.25 + R() * 0.45, len = h - 380 - 80 - R() * 300, sx = Math.sin(a) * Math.sin(lean), sz = Math.cos(a) * Math.sin(lean), cy = Math.cos(lean);
    let px = 0, py = 400, pz = 0; const n = 5;
    for (let i = 1; i <= n; i++) { const t = i / n, nx = sx * len * t * t * 0.9, nz = sz * len * t * t * 0.9, ny = 400 + cy * len * t; stem([px, py, pz], [nx, ny, nz]); px = nx; py = ny; pz = nz; }
    const lf = foldedLeaf(kit, 190 + R() * 70, 70 + R() * 26, { fold: 0.16 + R() * 0.16, bow: 0.14 + R() * 0.12 }), up = new T.Vector3(sx * 0.9, 1.2, sz * 0.9).normalize();
    lf.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), up); lf.rotateY(R() * 6.28 * 0.2); lf.position.set(px, py, pz); g.add(lf);
  }
  return kit.merge(g);
}
export function basket(kit, { r = 230, h = 320 } = {}) {   // a woven basket with a blanket folded over the rim
  const g = kit.group(), pts = [];
  g.add(kit.cyl(0, 0, 0, r * 0.88, h, { rTop: r, seg: 36, ...lo }));
  for (const f of [0.3, 0.55, 0.8]) { const rr = r * (0.88 + 0.12 * f) + 1, n = 36; for (let i = 0; i < n; i++) { const a = i / n * 6.2832, b = (i + 1) / n * 6.2832; pts.push([Math.cos(a) * rr, h * f, Math.sin(a) * rr], [Math.cos(b) * rr, h * f, Math.sin(b) * rr]); } }
  g.add(kit.lines(pts, 'mid'));
  const b1 = kit.rbox(-r * 0.75, h - 30, r * 0.5, r * 1.1, 130, r * 1.0, 55), b2 = kit.rbox(-r * 0.15, h - 10, r * 0.55, r * 0.95, 110, r * 0.9, 50);   // a blanket, two soft folds
  b1.rotation.y = 0.25; b2.rotation.y = -0.3; g.add(b1, b2);
  return kit.merge(g);
}
import { poufBody } from './softpieces.js';
export function pouf(kit, { r = 280, h = 380 } = {}) {
  const g = kit.group(); g.add(poufBody(kit, r, h)); return kit.merge(g);
}

// A photo standing on a shelf, chest or desk: a thin frame leaning back about 10-15 degrees on a stand-leg hinged to its back, so it stands by itself (a wall `picture` has no stand and never stands on a surface). Origin: the middle of its footprint on the surface, the photo facing +z.
// form 0 the great wave in ink | 1 the starry night in sepia | 2 the sunrise harbour in a soft tone (crops of the paintings in paintings.js, toned like old photographs). w 130-260, h 160-300; tilt in degrees.
import { rod } from './parts.js';
import { PAINTINGS } from './paintings.js';
import { artPlane } from './artPlane.js';
const PHOTO = [{ p: 0, crop: { x: 0.04, y: 0.1, w: 0.55 }, mode: 'ink' }, { p: 1, crop: { x: 0.0, y: 0.12, w: 0.5 }, mode: 'sepia' }, { p: 2, crop: { x: 0.45, y: 0.3, w: 0.5 }, mode: 'soft' }];   // a crop of each painting and the tone that makes it an old photograph
const tag = (o, name) => { o.userData.part = name; return o; };   // names a part so selftest can check the asset has the parts that make it recognisable
export function photoFrame(kit, { form = 0, w = 180, h = 230, tilt = 12, seed = 1 } = {}) {
  const T = kit.THREE, R = rnd(seed), F = 14, D = 16, t = tilt * Math.PI / 180, g = kit.group(), fr = kit.group();
  fr.add(tag(kit.rbox(-w / 2, 0, 0, w, h, D, 3), 'frame'));   // the frame: front face at z 0, reaching back
  fr.add(kit.box(-w / 2 + F, F, 4, w - 2 * F, h - 2 * F, 4, lo));   // the mat, 4 mm proud of the frame's face
  fr.add(tag(kit.box(-w / 2 + F + 12, F + 12, 7, w - 2 * F - 24, h - 2 * F - 24, 3, lo), 'print'));   // the print, 3 mm proud of the mat
  const pw = w - 2 * F - 24, ph = h - 2 * F - 24, ph0 = PHOTO[form % PHOTO.length], art = artPlane(kit, PAINTINGS[ph0.p % PAINTINGS.length], { w: pw, h: ph, fit: 'cover', crop: ph0.crop, mode: ph0.mode, px: 256 });   // a photograph: a crop of a classic painting in a sepia, ink or soft tone
  art.position.set(0, F + 12 + ph / 2, 10.5); art.userData.part = 'photo';   // 3.5 mm in front of the print's face; added after the merge (a painted plane keeps its own material)
  tag(fr, 'tilted');   // selftest reads this group's lean
  fr.rotation.x = -t; fr.position.set(0, D * Math.sin(t), 0);   // leaning back about its lowest edge (the back-bottom edge); that edge is lifted to rest on the surface
  g.add(fr);
  // the leg: its top on the frame's back face 62 % up (2 mm inside it), its foot on the surface 0.32 h behind
  const up = [Math.cos(t), -Math.sin(t)], nrm = [Math.sin(t), Math.cos(t)], s = h * 0.62, lift = D * Math.sin(t);   // (y, z) vectors: up = along the frame, nrm = out of its front face
  const top = [lift + s * up[0] - (D - 2) * nrm[0], s * up[1] - (D - 2) * nrm[1]], r = 3, foot = [r, top[1] - h * 0.32];
  g.add(tag(rod(kit, [0, top[0], top[1]], [0, foot[0], foot[1]], r, r, 'lo'), 'leg'));
  const zmin = Math.min(foot[1] - r, -h * Math.sin(t) - D * Math.cos(t)), root = kit.group(); g.position.z = -zmin / 2; root.add(g);   // the footprint's middle is the origin
  const out = kit.merge(root), hold = kit.group(); hold.position.set(0, lift, g.position.z); hold.rotation.x = -t; hold.add(art); out.add(hold); return out;
}
