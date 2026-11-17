// compose.mjs — helpers for laying a home out in each area's own frame, then writing scene.json. A spec is a small script: scenes/seed-<n>.spec.mjs writes scenes/seed-<n>.json (the helpers are below).
// Everything is millimetres. An area has a local frame: x to the right, z toward the viewer, its backing wall along z = 0 (see the walls below). Areas are placed side by side with a 3000 mm gap, so no neighbour shows in an area's own view.
//   const H = new Home({ seed, floor: 'auto' (boards, sometimes tiles) | 'tiles' | 'boards' | 'plain' (rare), accent: '#c9775a' (the rolled accent hex; textiles with tone: 'accent' take it) });
//   const a = H.area('kitchen', 'Kitchen', { rect: [0, 0, 6600, 4200] });      // rect: [x0, z0, x1, z1] of the floor the area owns (its bounds); psi turns the whole area 90, 180 or -90 degrees; O sets its place by hand
//   Walls (the room is in front of each one). Openings are { kind: 'window' | 'door' | 'arch', x, width, height, sill, sash: 'fixed', hinge: 'l' | 'r', to: <area id>, ... }; x is the opening's middle, measured from the wall's LEFT end as you see it from the room:
//   const back = a.back(6600, [openings]);            // along the back, z = 0, from x = 0 to the right
//   const left = a.left(4200, [openings], angle);     // meeting the back's left end; angle 90 (default) or 120 between the two walls; its left end is the front one
//   const right = a.right(4200, [openings], angle);   // meeting the back's right end; its left end is the back one
//   Placing on a wall (xc is where the middle of the thing is along the wall, measured like an opening's x; the distance out from the wall comes from the asset, see assets.mjs):
//   back.place('fridge', 'fridge', 5100);   back.place('sofa', 'sofa', 3200, { y: 7, lift: 7, params: { seats: 2 } });   back.place('pic', 'picture', 2000, { y: 1400 });   onSill: back.onSill('herbs', 'plant', 2400, { params })  a pot or small thing on a window's sill (xc inside a window of that wall; it stands at the sill + 30 mm);   options: y, turn (added to facing out from the wall), params, off (override), group, hero, shadow
//   A cabinet run with slots:  const R = a.run(back, 'run', 1650, [modules], { group: 'run' });  R.on('hob', 'hob');  R.on('hob', 'hood');  R.on('hob', 'pan');  R.on('sink', 'kettle');  (the thing goes on the middle of that module)
//   A table set:  const T = a.table('dining', { at: [2800, 2800], r: 650 | w: 1700, d: 900, chairs: 4, chairForm: 'ladder'|'spindle'|'bentwood'|'upholstered' (dealt per table if left out), rug: true, cloth: false | true | 'accent' });  T.over('pendantLamp');  T.on('vase')
//   What roll.mjs deals, and how a spec uses it:  plantAt (distinct places: sill (wall.onSill), shelf, worktop, hanging, floor; one floor plant at most) -> place each plant there;  foreground (the near-camera piece, from the area's own use) -> put it by the shot's near edge;
//     accent {name, hex} for the home -> new Home({ accent: hex });  accentOn (the textile that carries it) -> give that piece params: { tone: 'accent' } (cushion, foldedThrow, cloth, tablecloth, teaTowel, benchCushion, floorCushion, runner, tableRunner, duvetCloth).
//   Soft things:  a.seatSoft('sofa', { tone: 'accent' | 'lo' | 'mid', throw: 'drape' | 'band' | false, group })  one leaning cushion per seat end and a throw dropped on the arm or folded across the seat (armchairs get one cushion);  a.table(id, { cloth: true | 'accent' }) puts a cloth shaped to the table.
//   a.topOf(id): the height of the top of something placed (its dealt h included), for y of a thing that stands on it.
//   Things on one top:  a.onTop('desk', [{ id, asset, params }, ...], { at: 'back' | 'centre' | 'front', margin: 50 })  spaces them along the top, every footprint inside its edge (refuses when they do not fit); use it instead of placing by fractions.
//   Living things:  a.alive(roll.areas[id].motion)  (after the walls: the roll's 2 or 3 kinds; refuses one whose needs the walls do not meet, e.g. a flier with no open window).  See src/motion/index.js.
//   Anywhere:  a.put(id, asset, [x, z], turn, { y, mount, group, hero, params, ... })  (the object's own origin at [x, z]; see assets.mjs).  a.view({ target, az, el }), a.shot(name, from, look, fov, group)
// Every object has a `group` (its run, table set, seating group or wall arrangement) and hero: true marks the area's main piece.
import { ASSETS, SPACE } from './src/library/meta.js';
import { dealParams } from './src/library/space.js';
import { dropCloth, heightField } from './src/cloth.js';
import { createKit } from './src/kitchen3d.js';
import { REGISTRY } from './src/library/index.js';
import { joinAreas, seamLine } from './openplan.mjs';
import { checkAlive, pickVia, MOTION } from './motion-roll.mjs';
const rad = (d) => d * Math.PI / 180, deg = (r) => r * 180 / Math.PI, r0 = (v) => Math.round(v * 10) / 10;
export const GAP = 3000;
export class Home {
  constructor({ seed, floor = 'auto', height = 2700, accent }) { if (floor === 'auto') floor = seed % 5 === 3 ? 'tiles' : 'boards'; this.S = { units: 'mm', seed, home: { height, ...(accent ? { accent } : {}), floor: { style: floor, seed }, tiles: { origin: [0, 0] }, walls: [], objects: [] }, areas: [] }; this.list = []; }
  area(id, name, { O, psi = 0, rect }) {
    const a = new Area(this, id, name, O || [0, 0], psi, rect);
    if (!O) { const prev = this.list[this.list.length - 1], b = a.worldBounds(), x0 = prev ? prev.worldBounds().x1 + GAP : 0; a.O = [r0(x0 - b.x0), r0(-b.z0)]; }
    this.list.push(a); return a;
  }
  join(a, b, o) { return joinAreas(this, a, b, o); }   // open plan: b joins a on one floor (openplan.mjs): H.join(a, b, { layout: 'row' | 'corner', share: 0 to 1000 mm })
  sign(areaId, kind) { (this.signs ||= {})[areaId] = [...(this.signs[areaId] || []), kind]; }
  write(file, fs) { this.S.areas = this.list.map((a) => a.out()); if (this.groups) this.S.groups = this.groups.map((g) => ({ id: g.id, areas: g.areas, seams: g.seams.map((q) => seamLine(this, q)) })); if (this.signs) for (const [a, k] of Object.entries(this.signs)) console.log(`signs ${a}: ${k.join(', ')}`); fs.writeFileSync(file, JSON.stringify(this.S, null, 1)); return this.S; }
}
const pickForm = (h, asset, params) => {   // the next form of an asset that has several (started from the seed); an explicit params.form stays
  if (!ASSETS[asset].variants || params?.form !== undefined) return params;
  const c = (h.counts ||= {}); return { ...(params || {}), form: (c[asset] = (c[asset] ?? h.S.seed % ASSETS[asset].variants) + 1) % ASSETS[asset].variants };
};
const vary = (h, asset, params, areaId = '') => {
  let p = pickForm(h, asset, params);
  const named = ['rug', 'table', 'sideboard', 'bench'].includes(asset) ? [...new Set(SPACE[asset]?.form)] : null;   // named forms (rug, table, sideboard, bench): the next one in turn, so two of them in a home differ
  if (named && asset !== 'chair' && p?.form === undefined) { const c = (h.counts ||= {}); p = { ...(p || {}), form: named[(c['f-' + asset] = (c['f-' + asset] ?? h.S.seed) + 1) % named.length] }; }
  if (asset === 'basket' && p?.form === 2 && !/bed|bath/.test(areaId)) p = { ...p, form: h.S.seed % 2 };   // the tall lidded hamper is laundry: a bedroom or bathroom thing
  return dealParams(h, asset, p);
};   // a form for assets with forms, then every unset parameter of the asset's space, from the home's seed
const sizeOf = (asset, params = {}) => {
  const m = ASSETS[asset]; if (!m) throw new Error(`unknown asset "${asset}"; node assets.mjs lists them`);
  let [w, d, h] = m.size;
  if (params.r) w = d = 2 * params.r; else { w = params.w ?? w; d = params.d ?? params.depth ?? d; }
  if (asset === 'baseRun' || asset === 'wallRun') w = params.length ?? (params.modules || []).reduce((s, x) => s + x.w, 0);
  if (m.formSizes && params.form !== undefined) [w, d, h] = m.formSizes[params.form];
  if (asset === 'bed') { w = (params.w ?? 1600) + (params.frame === 'platform' ? 260 : 60); d = (params.l ?? 2100) + (params.frame === 'platform' ? 100 : 0); }
  return { w, d, h, m };
};
class Area {
  constructor(h, id, name, O, psi, rect) { Object.assign(this, { h, id, name, O, psi, rect, cam: {}, shots: [], backLen: 0, top: 2500 }); }
  get c() { return Math.cos(rad(this.psi)); } get s() { return Math.sin(rad(this.psi)); }
  P([x, z]) { return [r0(this.O[0] + x * this.c - z * this.s), r0(this.O[1] + x * this.s + z * this.c)]; }
  P3([x, y, z]) { const p = this.P([x, z]); return [p[0], y, p[1]]; }
  worldBounds() {   // the floor the area owns, grown to hold its own walls (an angled wall reaches past the rect)
    const [x0, z0, x1, z1] = this.rect, q = [[x0, z0], [x1, z1], [x0, z1], [x1, z0]].map((p) => this.P(p));
    for (const W of this.h.S.home.walls) if (W.id.startsWith(this.id + '-')) q.push(W.from, W.to);
    return { x0: Math.min(...q.map((p) => p[0])), x1: Math.max(...q.map((p) => p[0])), z0: Math.min(...q.map((p) => p[1])), z1: Math.max(...q.map((p) => p[1])) };
  }
  // ---- walls
  back(len, openings = [], at = [0, 0]) { this.backLen = len; this.backAt = at; return this.wall('back', at, 0, len, openings); }
  left(len, openings = [], angle = 90) { const k = 180 - angle, to = this.backAt || [0, 0]; return this.wall('left', [to[0] - Math.cos(rad(-k)) * len, to[1] - Math.sin(rad(-k)) * len], -k, len, openings); }
  right(len, openings = [], angle = 90) { const k = 180 - angle, b = this.backAt || [0, 0]; return this.wall('right', [b[0] + this.backLen, b[1]], k, len, openings); }
  wall(id, [x, z], phi, len, openings = []) {
    const p = this, to = p.P([x, z]), ph = rad(phi + p.psi), r = [Math.cos(ph), Math.sin(ph)];
    const from = [r0(to[0] + r[0] * len), r0(to[1] + r[1] * len)];
    p.h.S.home.walls.push({ id: `${p.id}-${id}`, from, to, openings: openings.map(({ x: ox, ...o }) => ({ ...o, at: len - ox })) });
    const F = {
      id, len, phi,
      at: (ox, off = 0) => [x + Math.cos(rad(phi)) * ox - Math.sin(rad(phi)) * off, z + Math.sin(rad(phi)) * ox + Math.cos(rad(phi)) * off],   // the local point
      put(oid, asset, ox, off, { turn = 0, ...o } = {}) { return p.put(oid, asset, F.at(ox, off), -phi + turn, o); },   // turn is added to the facing out from the wall (it never reaches the object as its own `turn`)   // low level: the object's origin at ox along, off out
      onSill(oid, asset, xc, o = {}) {   // a pot or small thing on a window's sill: xc is its middle along the wall (it must lie within a window of this wall); stands at the sill's height + 30 mm
        const W = openings.find((q) => q.kind === 'window' && Math.abs(q.x - xc) <= q.width / 2 - 40); if (!W) throw new Error(`onSill('${oid}'): xc ${xc} is not over a window of this wall`);
        return F.place(oid, asset, xc, { ...o, y: (W.sill ?? 1000) + 30, mount: 'on', onSill: true, off: o.off ?? 40 });
      },
      place(oid, asset, xc, o = {}) {   // by the asset's own origin and size: xc is its middle along the wall
        o = { ...o, params: vary(p.h, asset, o.params, p.id) }; const { w, d, m } = sizeOf(asset, o.params), mount = o.mount || m.mount; if (o.y === undefined && m.y === 'top') throw new Error(`place('${oid}', '${asset}'): give y, the height of the surface it stands on in mm (for example y: 520 on a bedside table, 740 on a desk)`); const y = o.y ?? (typeof m.y === 'number' ? m.y : 0);
        const off = o.off ?? (m.origin === 'centre' ? d / 2 : m.origin === 'front-left' ? (o.depth ?? d) : m.origin === 'front-centre' ? (o.depth ?? 600) : 0);
        const ox = m.origin === 'front-left' ? xc - w / 2 : xc;
        return F.put(oid, asset, ox, off, { ...o, y, mount });
      },
    };
    return F;
  }
  put(id, asset, [x, z], turn = 0, { y = 0, mount, group, hero, params, ...rest } = {}) {
    if (!ASSETS[asset]) throw new Error(`unknown asset "${asset}"; node assets.mjs lists them`);
    if (!group) throw new Error(`object "${id}" needs a group (its run, table set, seating group ...)`);
    params = vary(this.h, asset, params, this.id);
    const SIGN = { mug: 'mug', openBook: 'book face down', scuff: 'scuffed floor', leaf: 'fallen leaf', heightChart: 'height chart', foldedThrow: 'folded throw', cloth: 'cloth dropped', shoes: 'shoes askew', tablecloth: 'tablecloth', tableRunner: 'table runner', scratches: 'sofa scratches', glassesBook: 'glasses on book', clothesChair: 'clothes on chair' };
    if (SIGN[asset]) this.h.sign(this.id, SIGN[asset]); if (params?.ajar) this.h.sign(this.id, 'drawer ajar'); if (asset === 'bed' && params?.duvet === 'unmade') this.h.sign(this.id, 'unmade bed'); if (asset === 'cushion' && params?.crease === 'soft') this.h.sign(this.id, 'pillow creased');
    const [wx, wz] = this.P([x, z]);
    this.h.S.home.objects.push({ id: `${this.id}-${id}`, asset, at: [wx, y, wz], ...(turn - this.psi ? { turn: r0(turn - this.psi) } : {}), mount: mount || ASSETS[asset].mount, ...(params ? { params } : {}), group: `${this.id}:${group}`, ...(hero ? { hero: true } : {}), area: this.id, ...rest });
  }
  targetTris(label, targetId) {   // the triangles of a placed thing in this area's frame, for resting things on it
    const T = (this.h.kit ||= createKit()).THREE, tgt = this.h.S.home.objects.find((q) => q.id === `${this.id}-${targetId}`);
    if (!tgt) throw new Error(`${label}('${targetId}'): place the target first`);
    const mk = (o, rot) => { const g = REGISTRY[o.asset](this.h.kit, { ...(o.params || {}) }); g.rotation.y = rot * Math.PI / 180; g.position.set(...o.at); g.updateMatrixWorld(true); return g; };
    const tg = mk(tgt, tgt.turn || 0), cm = new T.Matrix4().compose(new T.Vector3(...this.P([0, 0]).flatMap((v, i) => i ? [0, v] : [v])), new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), -rad(this.psi)), new T.Vector3(1, 1, 1)), inv = cm.clone().invert(), boxes = [], bb = new T.Box3();
    const tris = [], va = new T.Vector3(), vb = new T.Vector3(), vc = new T.Vector3(), all = new T.Box3();
    tg.traverse((o) => { if (!o.isMesh || o.isLineSegments2 || o.userData.lines || o.material.isMeshBasicMaterial || this.h.kit.hulls.includes(o.material) || o.material === this.h.kit.depth) return; const m = new T.Matrix4().multiplyMatrices(inv, o.matrixWorld), g = o.geometry, p = g.attributes.position, ix = g.index;
      for (let t = 0, n = ix ? ix.count : p.count; t < n; t += 3) { const [a, b, cc] = ix ? [ix.getX(t), ix.getX(t + 1), ix.getX(t + 2)] : [t, t + 1, t + 2]; va.fromBufferAttribute(p, a).applyMatrix4(m); vb.fromBufferAttribute(p, b).applyMatrix4(m); vc.fromBufferAttribute(p, cc).applyMatrix4(m); tris.push([va.x, va.y, va.z, vb.x, vb.y, vb.z, vc.x, vc.y, vc.z]); all.expandByPoint(va).expandByPoint(vb).expandByPoint(vc); } });
    return { T, tris, all };
  }
  // a cloth dropped onto a placed thing and frozen (verlet, at spec time): a.drapeOver('throw', 'sofa', { w: 1300, d: 900, at: [x, z] (area frame) or dx/dz from the target's middle, spin (deg), tone, group, rear (mm hung behind the ridge of the thing: a coat over a chair back; use d about twice that, wave 0, bridge 440), wave (mm of start ripple; 0 keeps the cloth its full size, the default 40 lets it bunch), bridge (mm: the cloth spans gaps this narrow, e.g. 440 for a slatted chair back) })
  drapeOver(id, targetId, { w = 1200, d = 900, at, dx = 0, dz = 0, spin = 0, tone = 'lo', group, thick = 6, seed, nx = 26, ny = 26, mount = 'on', y = 0, bridge = 0, wave, rear } = {}) {
    const { T, tris, all } = this.targetTris('drapeOver', targetId), hf0 = heightField(tris, 20, bridge);
    const c = all.getCenter(new T.Vector3());
    let hang = {};   // rear: the cloth is hung over the highest ridge of the thing (a chair back): `rear` mm hang behind it, the rest falls toward the middle
    if (rear) {
      const top = hf0.top, hb = new T.Box3(); for (const t of tris) if (Math.max(t[1], t[4], t[7]) >= top - 60) for (let k = 0; k < 9; k += 3) hb.expandByPoint(new T.Vector3(t[k], t[k + 1], t[k + 2]));
      const rc = hb.getCenter(new T.Vector3()); let ux = rc.x - c.x, uz = rc.z - c.z; const ul = Math.hypot(ux, uz) || 1; ux /= ul; uz /= ul;
      const out = Math.abs(ux) * (all.max.x - all.min.x) / 2 + Math.abs(uz) * (all.max.z - all.min.z) / 2 + 14 - ((rc.x - c.x) * ux + (rc.z - c.z) * uz);   // from the ridge to just clear of the whole thing
      hang = { boxes: [[hb.min.x, Math.max(0, hb.min.y), hb.min.z, hb.max.x, hb.max.y, hb.max.z]], at: [rc.x, rc.z], init: (u, v) => {
        const t = (v + d / 2) - rear;
        if (t < 0) { const e = out * Math.min(1, -t / 60); return [rc.x + ux * e - uz * u, top + 8 + t, rc.z + uz * e + ux * u]; }
        const px = rc.x - ux * (10 + t * 0.6) - uz * u, pz = rc.z - uz * (10 + t * 0.6) + ux * u;
        return [px, Math.max(hf0(px, pz) + 12, top + 8 - t * 1.2), pz];
      } };
    }
    const res = dropCloth({ height: hf0, at: at || [c.x + dx, c.z + dz], w, d, nx, ny, ...hang, ...(wave === undefined ? {} : { wave }), spin: rad(spin), seed: seed ?? this.h.S.seed + id.length });
    { const hh = res.pts.filter((_, i) => i % 3 === 1); if (!rear && hh.filter((v) => v > 150).length < hh.length * 0.5) throw new Error(`drapeOver('${id}'): the cloth slid off '${targetId}' onto the floor: put it nearer the middle of the seat or bed (dx/dz), or make it larger`); }
    { const hf = res.pts.filter((_, i) => i % 3 === 1), tops = hf0; if (Math.max(...hf) > tops.top + 40) throw new Error(`drapeOver('${id}'): the cloth rests ${Math.round(Math.max(...hf) - tops.top)} mm above the top of '${targetId}': move it (at or dx/dz) onto the seat, arm or bed, not the back`); }
    this.put(id, 'cloth', [0, 0], 0, { group, y, mount, params: { nx, ny, pts: res.pts, thick, tone } });
  }
  // spaced things on one top: a.onTop('desk', [{ id: 'lamp', asset: 'lamp' }, { id: 'books', asset: 'bookStack', params }, ...], { at: 'back' | 'centre' | 'front', margin: 50, group, turn })
  // lays the things in a row along the longer side of the top, in the order given, with equal gaps of at least `margin` mm between them and the edges, every footprint inside the edge; 'back' is the side nearer the area's back wall (lower z). It refuses with the length it needs when they do not fit.
  onTop(surfaceId, things, { at = 'centre', margin = 50, group, turn = 0 } = {}) {
    const { tris, all } = this.targetTris('onTop', surfaceId), hf = heightField(tris), x0 = all.min.x, x1 = all.max.x, z0 = all.min.z, z1 = all.max.z, alongX = (x1 - x0) >= (z1 - z0), L = alongX ? x1 - x0 : z1 - z0, W = alongX ? z1 - z0 : x1 - x0;
    const grp = group || this.h.S.home.objects.find((q) => q.id === `${this.id}-${surfaceId}`)?.group.split(':')[1];
    const items = things.map((t) => { const params = vary(this.h, t.asset, t.params, this.id), { w, d } = sizeOf(t.asset, params); return { ...t, params, a: alongX ? w : d, b: alongX ? d : w }; });
    const need = items.reduce((q, i) => q + i.a, 0) + (items.length + 1) * margin;
    if (need > L) throw new Error(`onTop('${surfaceId}'): the things need ${Math.round(need)} mm along the top and it is ${Math.round(L)} mm long: drop one or use a smaller piece`);
    const deep = items.find((i) => i.b + 2 * margin > W); if (deep) throw new Error(`onTop('${surfaceId}'): '${deep.id}' is ${Math.round(deep.b)} mm deep and the top is ${Math.round(W)} mm: it would hang over the edge`);
    const gap = (L - items.reduce((q, i) => q + i.a, 0)) / (items.length + 1); let p = (alongX ? x0 : z0) + gap;
    for (const i of items) {
      const along = p + i.a / 2, perp = at === 'back' ? (alongX ? z0 : x0) + margin + i.b / 2 : at === 'front' ? (alongX ? z1 : x1) - margin - i.b / 2 : (alongX ? (z0 + z1) / 2 : (x0 + x1) / 2), [px, pz] = alongX ? [along, perp] : [perp, along];
      let y = 0; for (const [dx, dz] of [[0, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]) y = Math.max(y, hf(px + dx * (alongX ? i.a : i.b) / 2, pz + dz * (alongX ? i.b : i.a) / 2));
      this.put(i.id, i.asset, [px, pz], i.turn ?? turn, { y: Math.round(y), mount: 'on', group: i.group || grp, params: i.params, ...(i.hero ? { hero: true } : {}) });
      p += i.a + gap;
    }
  }
  // a folded throw laid across a placed thing: layers stacked like a folded blanket, resting on the highest point under it. a.bandOn('throw', 'bed', { w: 1500, d: 380, at: [x, z] or dx/dz, layers: 3, tone, group })
  bandOn(id, targetId, { w = 1400, d = 380, at, dx = 0, dz = 0, layers = 3, tone = 'lo', group, spin = 0 } = {}) {
    const { tris, all, T } = this.targetTris('bandOn', targetId), f = heightField(tris), c = all.getCenter(new T.Vector3()), p = at || [c.x + dx, c.z + dz];
    let top = 0; for (let a = -w / 2; a <= w / 2; a += 40) for (let b = -d / 2; b <= d / 2; b += 40) top = Math.max(top, f(p[0] + a, p[1] + b));
    this.put(id, 'foldedThrow', p, spin, { group, y: Math.round(top), mount: 'on', params: { w, d, layers, tone } });
  }
  // the soft things of a seat in one call: a.seatSoft('sofa', { cushions: 2, throw: 'drape' | 'band' | false, tone: 'accent' | 'lo' | 'mid', group }). Cushions lean on the back, one per seat end (a sofa: seats - 1, at least 1; an armchair: 1); the throw drops onto the arm end ('drape', frozen cloth) or lies folded across the seat ('band').
  seatSoft(targetId, { cushions, throw: thr = 'drape', tone = 'lo', throwTone = tone, group } = {}) {
    const tgt = this.h.S.home.objects.find((q) => q.id === `${this.id}-${targetId}`); if (!tgt) throw new Error(`seatSoft('${targetId}'): place it first`);
    const T = (this.h.kit ||= createKit()).THREE, g0 = REGISTRY[tgt.asset](this.h.kit, { ...(tgt.params || {}) }); g0.updateMatrixWorld(true);
    const lb = new T.Box3().setFromObject(g0), tn = (tgt.turn || 0) + this.psi, th = rad(tn), W = lb.max.x - lb.min.x, D = lb.max.z - lb.min.z, cx = (lb.min.x + lb.max.x) / 2, cz = (lb.min.z + lb.max.z) / 2;
    const { tris, all } = this.targetTris('seatSoft', targetId), c = all.getCenter(new T.Vector3()), org = [c.x - (cx * Math.cos(th) + cz * Math.sin(th)), c.z - (-cx * Math.sin(th) + cz * Math.cos(th))];   // the object's origin in the area's frame, from where its parts really stand
    const toArea = (lx, lz) => [org[0] + lx * Math.cos(th) + lz * Math.sin(th), org[1] - lx * Math.sin(th) + lz * Math.cos(th)], f = heightField(tris), zo = lb.min.z + 480;
    const seats = tgt.params?.seats || (tgt.asset === 'armchair' ? 1 : 2), n = cushions ?? (tgt.asset === 'armchair' ? 1 : Math.max(1, seats - 1)), grp = group || tgt.group;
    for (let i = 0; i < n; i++) { const lx = n === 1 ? cx + (tgt.asset === 'armchair' ? 0 : W / 2 - 330) : cx - (W / 2 - 330) + i * (W - 660) / (n - 1), [px, pz] = toArea(lx, zo), [sx, sz] = toArea(lx, zo + 60), y = Math.round(f(sx, sz)) + 6;   // the seat height is read in front of the back
      this.put(`${targetId}-cushion${i + 1}`, 'cushion', [px, pz], tn + (i % 2 ? -6 : 8), { group: grp, y, mount: 'on', params: { w: 400, h: 320, thick: 130, lean: 17 + 4 * (i % 2), tone } }); }
    if (thr === 'drape') { try { const [ax, az] = toArea(cx - (W / 2 - 420), zo + 330); this.drapeOver(`${targetId}-throw`, targetId, { w: 1000, d: 700, wave: 10, at: [ax, az], spin: tn + 20, tone: throwTone, group: grp }); } catch (e) { if (process.env.SOFT_DEBUG) console.error(e.message); thr = 'band'; } }
    if (thr === 'band') { const [bx, bz] = toArea(cx + (W / 2 - 360), zo + 330); this.bandOn(`${targetId}-throw`, targetId, { w: 700, d: 380, at: [bx, bz], spin: tn, tone: throwTone, group: grp }); }
  }
  // ---- a cabinet run with slots: R.on('hob', 'pan') puts a pan on the middle of the first hob module
  run(F, id, left, modules, o = {}) {
    const { group = 'run', depth = 600, hero, ...params } = o, mods = []; let x = left;
    for (const m of modules) { mods.push({ ...m, xc: x + m.w / 2 }); x += m.w; }
    const length = x - left;
    F.put(id, 'baseRun', left, depth, { group, hero, params: { ...params, depth, modules } });
    if (modules.some((m) => m.ajar)) this.h.sign(this.id, 'drawer ajar');   // a module { kind: 'drawers', ajar: 0.4 } leaves its top drawer pulled out 0.4 of its travel
    let n = 0;
    return {
      length, left, depth, mods, F,
      mod: (kind, nth = 0) => { const m = mods.filter((q) => q.kind === kind)[nth]; if (!m) throw new Error(`run "${id}" has no ${kind} module #${nth}`); return m; },
      on(kind, asset, oo = {}) {
        if (kind === 'sink' && !['hob', 'hood'].includes(asset) && ASSETS[asset].mount !== 'wall') {   // the basin takes the sink module's top: a thing goes on the worktop beside it (the next module that is not a hob), else the call refuses
          const i = mods.findIndex((q) => q.kind === 'sink' && mods.filter((r) => r.kind === 'sink').indexOf(q) === (oo.nth || 0)), nb = [mods[i - 1], mods[i + 1]].filter((q) => q && !['hob', 'sink'].includes(q.kind));
          if (!nb.length) throw new Error(`R.on('sink', '${asset}'): the basin fills the sink module and no flat module stands beside it: put it on another module (R.on('doors' | 'drawers' | 'filler', ...))`);
          nb.sort((p, q) => (p.used || 0) - (q.used || 0)); return this.on(nb[0].kind, asset, { ...oo, nth: mods.filter((q) => q.kind === nb[0].kind).indexOf(nb[0]) });   // the emptier neighbour first
        }
        const m = this.mod(kind, oo.nth || 0); m.used = (m.used || 0) + 1; const meta = ASSETS[asset], top = params.top || 900, wall = meta.mount === 'wall';
        const xc = m.xc + (oo.dx || 0), oid = oo.id || `${id}-${asset}${n++ || ''}`;
        const o2 = { group, ...oo, params: oo.params }; delete o2.nth; delete o2.dx; delete o2.id;
        if (asset === 'hob' || asset === 'hood') return F.place(oid, asset, xc, { ...o2, depth });
        if (asset === 'pan') return F.place(oid, asset, xc + m.w * 0.2, { ...o2, y: 940, off: depth - 160, turn: o2.turn ?? -35 });
        return F.place(oid, asset, xc, { ...o2, y: o2.y ?? top, off: o2.off ?? depth * 0.55, ...(wall ? { off: 0, y: o2.y ?? meta.y } : {}) });
      },
    };
  }
  // ---- a table set: a table (round with r, or w x d) with chairs, a rug under it and slots over / on it
  table(id, { at, r, w = 1600, d = 900, chairs = 4, rug = true, cloth = false, group = 'table set', hero = true, h = 750, chairForm } = {}) {
    const round = !!r, p = this, TW = round ? 2 * r : w, TD = round ? 2 * r : d;
    if (rug) p.put(`${id}-rug`, 'rug', at, 0, { group, params: { w: TW + 1100, d: TD + 1100, ...(round ? { form: 'round' } : {}) } });   // (rug form: round for a round table, else dealt)
    p.put(id, round ? 'roundTable' : 'table', at, 0, { y: 7, lift: 7, group, hero, params: round ? { r, h } : { w, d, h } });
    if (cloth) p.put(`${id}-cloth`, 'tablecloth', at, 0, { y: h + 7, mount: 'on', group, params: { ...(round ? { r } : { w: w + 90, d: d + 90 }), drop: round ? 260 : 300, ...(cloth === 'accent' ? { tone: 'accent' } : {}) } });   // cloth: true | 'accent': a cloth whose shape follows the table (round skirt, or a rectangle that hangs over the long sides)
    const spots = round ? [[0, -1], [1, 0], [0, 1], [-1, 0]].slice(0, Math.min(4, chairs)).map(([a, b]) => [a * (r + 230), b * (r + 230)])
      : (() => { const per = Math.ceil(chairs / 2), out = []; for (let i = 0; i < per; i++) for (const s of [-1, 1]) { if (out.length < chairs) out.push([(i - (per - 1) / 2) * (w / per), s * (d / 2 + 310)]); } return out; })();
    const cnt = (this.h.counts ||= {}), nx = cnt.tableSet = (cnt.tableSet ?? this.h.S.seed % 4) + 1, cf = chairForm || ['ladder', 'spindle', 'bentwood', 'upholstered'][nx % 4];   // one chair form for the whole set
    spots.forEach(([dx, dz], i) => { const q = [at[0] + dx, at[1] + dz]; p.put(`${id}-chair-${i + 1}`, 'chair', q, deg(Math.atan2(at[0] + (round ? 0 : dx) - q[0], at[1] - q[1])), { y: 7, lift: 7, group, params: { form: cf } }); });
    return {
      at, over: (asset = 'pendantLamp', { dx = 0, dz = 0, ...o } = {}) => p.put(`${id}-${asset}`, asset, [at[0] + dx, at[1] + dz], 0, { mount: 'ceiling', group, ...o }),   // dx / dz slide it off the table's middle (up to a third of the table's length) to clear a window in the home view
      on: (asset, o = {}) => p.put(`${id}-${asset}`, asset, [at[0] + (o.dx || 0), at[1] + (o.dz || 0)], 0, { y: h + 7, mount: 'on', group, ...o }),
    };
  }
  topOf(id) { const o = this.h.S.home.objects.find((q) => q.id === `${this.id}-${id}`); if (!o) throw new Error(`topOf('${id}'): place it first`); return o.at[1] + (o.params?.h ?? ASSETS[o.asset].size[2]); }   // the height of the top of a placed thing: stand something on it with y: a.topOf('side-table')
  view({ target, az = 20, el = 15, dist, fit = 'objects' }) { this.cam = { target: this.P3(target), az: az - this.psi, el, fit, ...(dist ? { dist } : {}) }; }
  shot(name, from, look, fov = 30, subject) { this.shots.push({ name, from: this.P3(from), look: this.P3(look), fov, ...(subject ? { subject: `${this.id}:${subject}` } : {}) }); }
  // anything standing on a rug is lifted by its thickness (7 mm), so legs rest on the pile and not in it: done for every floor piece whose middle lies on a rug of this area
  liftOnRugs() {
    const objs = this.h.S.home.objects.filter((o) => o.area === this.id), rugs = objs.filter((o) => o.asset === 'rug');
    for (const o of objs) {
      if (o.asset === 'rug' || (o.mount || ASSETS[o.asset].mount) !== 'floor' || o.at[1] >= 7 || ['curtain', 'scuff', 'leaf', 'heightChart', 'baseRun', 'wallRun', 'fridge'].includes(o.asset)) continue;
      if (rugs.some((r) => { const { w, d } = sizeOf('rug', r.params), t = rad(r.turn || 0), dx = o.at[0] - r.at[0], dz = o.at[2] - r.at[2], lx = dx * Math.cos(t) - dz * Math.sin(t), lz = dx * Math.sin(t) + dz * Math.cos(t); return r.params?.form === 'round' ? Math.hypot(lx, lz) < Math.min(w, d) / 2 : Math.abs(lx) < w / 2 && Math.abs(lz) < d / 2; })) { o.at[1] = 7; if (o.lift === undefined) o.lift = 7; const { w: ow, d: od } = sizeOf(o.asset, o.params), to = rad(o.turn || 0); for (const q of objs) { if (q === o || q.mount !== 'on' || q.at[1] < 20) continue; const dx = q.at[0] - o.at[0], dz = q.at[2] - o.at[2], lx = dx * Math.cos(to) - dz * Math.sin(to), lz = dx * Math.sin(to) + dz * Math.cos(to); if (Math.abs(lx) < ow / 2 && Math.abs(lz) < od / 2) q.at[1] += 7; } }   // what stands on it rises with it
    }
  }
  // a small thing resting on the highest surface under it: a.restOn('cat', 'cat', 'seat', { dx, dz | at, turn, params, group }): a cat on a seat, a cushion on a chair, a book on a pile
  restOn(id, asset, targetId, { at, dx = 0, dz = 0, turn = 0, params, group } = {}) {
    const { tris, all, T } = this.targetTris('restOn', targetId), hf = heightField(tris), c = all.getCenter(new T.Vector3()), p = at || [c.x + dx, c.z + dz], pr = vary(this.h, asset, params, this.id), { w, d } = sizeOf(asset, pr);
    let y = 0; for (const [a, b] of [[0, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]) y = Math.max(y, hf(p[0] + a * w / 3, p[1] + b * d / 3));
    this.put(id, asset, p, turn, { y: Math.round(y), mount: 'on', group: group || this.h.S.home.objects.find((q) => q.id === `${this.id}-${targetId}`)?.group.split(':')[1], params: pr });
  }
  alive(list) { checkAlive(this.id, this.h.S.home.walls.filter((w) => w.id.startsWith(this.id + '-')), list); const ws = this.h.S.home.walls.filter((w) => w.id.startsWith(this.id + '-')); this.motion = list.map(({ kind }) => { const k = MOTION.kinds[kind]; return { kind, needs: k.needs, ...(k.needs.includes('openWindow') ? { via: pickVia(ws, k.flies) } : {}) }; }); return this; }   // living things (roll's `motion`; src/motion/index.js)
  out() { this.liftOnRugs(); const b = this.worldBounds(); return { id: this.id, name: this.name, ...(this.motion?.length ? { motion: this.motion } : {}), ...(this.group ? { group: this.group } : {}), O: this.O, psi: this.psi, bounds: { ...b, top: this.top }, camera: { home: this.cam, shots: this.shots } }; }
}
export const facing = (from, to) => deg(Math.atan2(to[0] - from[0], to[1] - from[1]));   // the turn that makes an object at `from` face `to`, in local x/z
