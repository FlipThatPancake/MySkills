// compose.mjs — helpers for laying a home out in each area's own frame, then writing scene.json.  Used by scenes/seed-<n>.spec.mjs: `node scenes/seed-8.spec.mjs` writes scenes/seed-8.json.
// An area has a local frame: x to the right, z toward the viewer, its backing wall on z = 0 (millimetres). The frame sits in the world at `O` turned by `psi` (0, 90, 180 or -90 degrees).
//   a.wall(id, [x, z], phi, len, openings)  a loose wall from [x, z] in direction phi (0 = along +x; the room is on its left); openings: [{ kind, x (mm from the wall's `to` end, to the middle), width, ... }]; returns a frame F
//   F.put(id, asset, x, off, { y, turn, ...object }) puts an object at x along the wall and `off` out from it, facing out from the wall (turn adds to that); F.at(x, off) gives the local point
//   a.put(id, asset, [x, z], turn, { y, mount, group, hero, params, ... }) puts one anywhere. Every object has a `group` (its run, table set, seating group or wall arrangement).
//   a.view({ target: [x, y, z], az, el, dist }), a.shot(name, from, look, fov): the area's home camera and tour shots, in local numbers.
const rad = (d) => d * Math.PI / 180, deg = (r) => r * 180 / Math.PI, r0 = (v) => Math.round(v * 10) / 10;
export class Home {
  constructor({ seed, floor = 'plain', height = 2700 }) { this.S = { units: 'mm', seed, home: { height, floor: { style: floor }, tiles: { origin: [0, 0] }, walls: [], objects: [] }, areas: [] }; this.n = 0; }
  area(id, name, { O = [0, 0], psi = 0, rect }) { const a = new Area(this, id, name, O, psi, rect); this.areas = [...(this.areas || []), a]; return a; }
  write(file, fs) { this.S.areas = this.areas.map((a) => a.out()); fs.writeFileSync(file, JSON.stringify(this.S, null, 1)); return this.S; }
}
class Area {
  constructor(h, id, name, O, psi, rect) { Object.assign(this, { h, id, name, O, psi, rect, cam: {}, shots: [] }); this.c = Math.cos(rad(psi)); this.s = Math.sin(rad(psi)); this.top = 2500; }
  P([x, z]) { return [r0(this.O[0] + x * this.c - z * this.s), r0(this.O[1] + x * this.s + z * this.c)]; }
  P3([x, y, z]) { const p = this.P([x, z]); return [p[0], y, p[1]]; }
  wall(id, [x, z], phi, len, openings = []) {
    const p = this, to = p.P([x, z]), ph = rad(phi + p.psi), r = [Math.cos(ph), Math.sin(ph)], n = [-r[1], r[0]];
    const from = [r0(to[0] + r[0] * len), r0(to[1] + r[1] * len)];
    p.h.S.home.walls.push({ id: `${p.id}-${id}`, from, to, openings: openings.map(({ x: ox, ...o }) => ({ ...o, at: len - ox })) });
    const F = {
      id, len, r, n, to, phi,
      at: (ox, off = 0) => [x + Math.cos(rad(phi)) * ox - Math.sin(rad(phi)) * off, z + Math.sin(rad(phi)) * ox + Math.cos(rad(phi)) * off],   // the local point
      put(oid, asset, ox, off, o = {}) { const q = F.at(ox, off); return p.put(oid, asset, q, -phi + (o.turn || 0), o); },
    };
    return F;
  }
  put(id, asset, [x, z], turn = 0, { y = 0, mount = 'floor', group, hero, params, ...rest } = {}) {
    const [wx, wz] = this.P([x, z]);
    this.h.S.home.objects.push({ id: `${this.id}-${id}`, asset, at: [wx, y, wz], ...(turn - this.psi ? { turn: r0(turn - this.psi) } : {}), mount, ...(params ? { params } : {}), group: `${this.id}:${group}`, ...(hero ? { hero: true } : {}), area: this.id, ...rest });
  }
  view({ target, az = 20, el = 15, dist }) { this.cam = { target: this.P3(target), az: az - this.psi, el, fit: 'objects', ...(dist ? { dist } : {}) }; }
  shot(name, from, look, fov = 30) { this.shots.push({ name, from: this.P3(from), look: this.P3(look), fov }); }
  out() {
    const [x0, z0, x1, z1] = this.rect, c = [this.P([x0, z0]), this.P([x1, z1])];
    return { id: this.id, name: this.name, bounds: { x0: Math.min(c[0][0], c[1][0]), x1: Math.max(c[0][0], c[1][0]), z0: Math.min(c[0][1], c[1][1]), z1: Math.max(c[0][1], c[1][1]), top: this.top }, camera: { home: this.cam, shots: this.shots } };
  }
}
export const facing = (from, to) => deg(Math.atan2(to[0] - from[0], to[1] - from[1]));   // the turn that makes an object at `from` face `to`, in local x/z
