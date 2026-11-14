// compose.mjs — helpers for laying a home out in each area's own frame, then writing scene.json. A spec is a small script: scenes/seed-<n>.spec.mjs writes scenes/seed-<n>.json (see scenes/seed-12.spec.mjs for one that uses everything below).
// Everything is millimetres. An area has a local frame: x to the right, z toward the viewer, its backing wall along z = 0 (see the walls below). Areas are placed side by side with a 3000 mm gap, so no neighbour shows in an area's own view.
//   const H = new Home({ seed, floor: 'tiles' | 'boards' | 'plain' });
//   const a = H.area('kitchen', 'Kitchen', { rect: [0, 0, 6600, 4200] });      // rect: [x0, z0, x1, z1] of the floor the area owns (its bounds); psi turns the whole area 90, 180 or -90 degrees; O sets its place by hand
//   Walls (the room is in front of each one). Openings are { kind: 'window' | 'door' | 'arch', x, width, height, sill, sash: 'fixed', hinge: 'l' | 'r', to: <area id>, ... }; x is the opening's middle, measured from the wall's LEFT end as you see it from the room:
//   const back = a.back(6600, [openings]);            // along the back, z = 0, from x = 0 to the right
//   const left = a.left(4200, [openings], angle);     // meeting the back's left end; angle 90 (default) or 120 between the two walls; its left end is the front one
//   const right = a.right(4200, [openings], angle);   // meeting the back's right end; its left end is the back one
//   Placing on a wall (xc is where the middle of the thing is along the wall, measured like an opening's x; the distance out from the wall comes from the asset, see assets.mjs):
//   back.place('fridge', 'fridge', 5100);   back.place('sofa', 'sofa', 3200, { y: 7, lift: 7, params: { seats: 2 } });   back.place('pic', 'picture', 2000, { y: 1400 });   options: y, turn (added to facing out from the wall), params, off (override), group, hero, shadow
//   A cabinet run with slots:  const R = a.run(back, 'run', 1650, [modules], { group: 'run' });  R.on('hob', 'hob');  R.on('hob', 'hood');  R.on('hob', 'pan');  R.on('sink', 'kettle');  (the thing goes on the middle of that module)
//   A table set:  const T = a.table('dining', { at: [2800, 2800], r: 650 | w: 1700, d: 900, chairs: 4, rug: true });  T.over('pendantLamp');  T.on('vase')
//   Anywhere:  a.put(id, asset, [x, z], turn, { y, mount, group, hero, params, ... })  (the object's own origin at [x, z]; see assets.mjs).  a.view({ target, az, el }), a.shot(name, from, look, fov, group)
// Every object has a `group` (its run, table set, seating group or wall arrangement) and hero: true marks the area's main piece.
import { ASSETS } from './src/library/meta.js';
const rad = (d) => d * Math.PI / 180, deg = (r) => r * 180 / Math.PI, r0 = (v) => Math.round(v * 10) / 10;
export const GAP = 3000;
export class Home {
  constructor({ seed, floor = 'plain', height = 2700 }) { this.S = { units: 'mm', seed, home: { height, floor: { style: floor }, tiles: { origin: [0, 0] }, walls: [], objects: [] }, areas: [] }; this.list = []; }
  area(id, name, { O, psi = 0, rect }) {
    const a = new Area(this, id, name, O || [0, 0], psi, rect);
    if (!O) { const prev = this.list[this.list.length - 1], b = a.worldBounds(), x0 = prev ? prev.worldBounds().x1 + GAP : 0; a.O = [r0(x0 - b.x0), r0(-b.z0)]; }
    this.list.push(a); return a;
  }
  write(file, fs) { this.S.areas = this.list.map((a) => a.out()); fs.writeFileSync(file, JSON.stringify(this.S, null, 1)); return this.S; }
}
const sizeOf = (asset, params = {}) => {
  const m = ASSETS[asset]; if (!m) throw new Error(`unknown asset "${asset}"; node assets.mjs lists them`);
  let [w, d, h] = m.size;
  if (params.r) w = d = 2 * params.r; else { w = params.w ?? w; d = params.d ?? params.depth ?? d; }
  if (asset === 'baseRun' || asset === 'wallRun') w = params.length ?? (params.modules || []).reduce((s, x) => s + x.w, 0);
  if (asset === 'bed') { w = (params.w ?? 1600) + 60; d = params.l ?? 2100; }
  return { w, d, h, m };
};
class Area {
  constructor(h, id, name, O, psi, rect) { Object.assign(this, { h, id, name, O, psi, rect, cam: {}, shots: [], backLen: 0, top: 2500 }); }
  get c() { return Math.cos(rad(this.psi)); } get s() { return Math.sin(rad(this.psi)); }
  P([x, z]) { return [r0(this.O[0] + x * this.c - z * this.s), r0(this.O[1] + x * this.s + z * this.c)]; }
  P3([x, y, z]) { const p = this.P([x, z]); return [p[0], y, p[1]]; }
  worldBounds() { const [x0, z0, x1, z1] = this.rect, q = [[x0, z0], [x1, z1], [x0, z1], [x1, z0]].map((p) => this.P(p)); return { x0: Math.min(...q.map((p) => p[0])), x1: Math.max(...q.map((p) => p[0])), z0: Math.min(...q.map((p) => p[1])), z1: Math.max(...q.map((p) => p[1])) }; }
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
      put(oid, asset, ox, off, o = {}) { return p.put(oid, asset, F.at(ox, off), -phi + (o.turn || 0), o); },   // low level: the object's origin at ox along, off out
      place(oid, asset, xc, o = {}) {   // by the asset's own origin and size: xc is its middle along the wall
        const { w, d, m } = sizeOf(asset, o.params), y = o.y ?? (typeof m.y === 'number' ? m.y : 0), mount = o.mount || m.mount;
        const off = o.off ?? (m.origin === 'centre' ? d / 2 : m.origin === 'front-left' ? d : m.origin === 'front-centre' ? (o.depth ?? 600) : 0);
        const ox = m.origin === 'front-left' ? xc - w / 2 : xc;
        return F.put(oid, asset, ox, off, { ...o, y, mount });
      },
    };
    return F;
  }
  put(id, asset, [x, z], turn = 0, { y = 0, mount, group, hero, params, ...rest } = {}) {
    if (!ASSETS[asset]) throw new Error(`unknown asset "${asset}"; node assets.mjs lists them`);
    if (!group) throw new Error(`object "${id}" needs a group (its run, table set, seating group ...)`);
    const [wx, wz] = this.P([x, z]);
    this.h.S.home.objects.push({ id: `${this.id}-${id}`, asset, at: [wx, y, wz], ...(turn - this.psi ? { turn: r0(turn - this.psi) } : {}), mount: mount || ASSETS[asset].mount, ...(params ? { params } : {}), group: `${this.id}:${group}`, ...(hero ? { hero: true } : {}), area: this.id, ...rest });
  }
  // ---- a cabinet run with slots: R.on('hob', 'pan') puts a pan on the middle of the first hob module
  run(F, id, left, modules, o = {}) {
    const { group = 'run', depth = 600, hero, ...params } = o, mods = []; let x = left;
    for (const m of modules) { mods.push({ ...m, xc: x + m.w / 2 }); x += m.w; }
    const length = x - left;
    F.put(id, 'baseRun', left, depth, { group, hero, params: { ...params, modules } });
    let n = 0;
    return {
      length, left, depth, mods, F,
      mod: (kind, nth = 0) => { const m = mods.filter((q) => q.kind === kind)[nth]; if (!m) throw new Error(`run "${id}" has no ${kind} module #${nth}`); return m; },
      on(kind, asset, oo = {}) {
        const m = this.mod(kind, oo.nth || 0), meta = ASSETS[asset], top = params.top || 900, wall = meta.mount === 'wall';
        const xc = m.xc + (oo.dx || 0), oid = oo.id || `${id}-${asset}${n++ || ''}`;
        const o2 = { group, ...oo, params: oo.params }; delete o2.nth; delete o2.dx; delete o2.id;
        if (meta.origin === 'front-centre') return F.place(oid, asset, xc, { ...o2, depth });
        if (asset === 'pan') return F.place(oid, asset, xc + m.w * 0.2, { ...o2, y: 940, off: depth - 160, turn: o2.turn ?? -35 });
        return F.place(oid, asset, xc, { ...o2, y: o2.y ?? top, off: o2.off ?? depth * 0.55, ...(wall ? { off: 0, y: o2.y ?? meta.y } : {}) });
      },
    };
  }
  // ---- a table set: a table (round with r, or w x d) with chairs, a rug under it and slots over / on it
  table(id, { at, r, w = 1600, d = 900, chairs = 4, rug = true, group = 'table set', hero = true, h = 750 } = {}) {
    const round = !!r, p = this, TW = round ? 2 * r : w, TD = round ? 2 * r : d;
    if (rug) p.put(`${id}-rug`, 'rug', at, 0, { group, params: { w: TW + 1300, d: TD + 1300 } });
    p.put(id, round ? 'roundTable' : 'table', at, 0, { y: 7, lift: 7, group, hero, params: round ? { r, h } : { w, d, h } });
    const spots = round ? [[0, -1], [1, 0], [0, 1], [-1, 0]].slice(0, Math.min(4, chairs)).map(([a, b]) => [a * (r + 230), b * (r + 230)])
      : (() => { const per = Math.ceil(chairs / 2), out = []; for (let i = 0; i < per; i++) for (const s of [-1, 1]) { if (out.length < chairs) out.push([(i - (per - 1) / 2) * (w / per), s * (d / 2 + 310)]); } return out; })();
    spots.forEach(([dx, dz], i) => { const q = [at[0] + dx, at[1] + dz]; p.put(`${id}-chair-${i + 1}`, 'chair', q, deg(Math.atan2(at[0] + (round ? 0 : dx) - q[0], at[1] - q[1])), { y: 7, lift: 7, group }); });
    return {
      at, over: (asset = 'pendantLamp', o = {}) => p.put(`${id}-${asset}`, asset, at, 0, { mount: 'ceiling', group, ...o }),
      on: (asset, o = {}) => p.put(`${id}-${asset}`, asset, [at[0] + (o.dx || 0), at[1] + (o.dz || 0)], 0, { y: h + 7, mount: 'on', group, ...o }),
    };
  }
  view({ target, az = 20, el = 15, dist }) { this.cam = { target: this.P3(target), az: az - this.psi, el, fit: 'objects', ...(dist ? { dist } : {}) }; }
  shot(name, from, look, fov = 30, subject) { this.shots.push({ name, from: this.P3(from), look: this.P3(look), fov, ...(subject ? { subject: `${this.id}:${subject}` } : {}) }); }
  out() {
    const [x0, z0, x1, z1] = this.rect, c = [this.P([x0, z0]), this.P([x1, z1])];
    return { id: this.id, name: this.name, bounds: { x0: Math.min(c[0][0], c[1][0]), x1: Math.max(c[0][0], c[1][0]), z0: Math.min(c[0][1], c[1][1]), z1: Math.max(c[0][1], c[1][1]), top: this.top }, camera: { home: this.cam, shots: this.shots } };
  }
}
export const facing = (from, to) => deg(Math.atan2(to[0] - from[0], to[1] - from[1]));   // the turn that makes an object at `from` face `to`, in local x/z
