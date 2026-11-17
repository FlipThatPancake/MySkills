// @js:motion — living, moving things in a home: the framework (area-run.js calls createMotion once and motion.update(dt, areaId) every frame).
// What an area gets comes from the roll (roll.mjs → motion-roll.mjs, tables.json `motion`) and the spec (compose.mjs `a.alive(...)`) as scene.areas[i].motion = [{ kind, needs, via }]:
// at most 3 entries, never the same kind twice. `needs` may hold 'openWindow' (the thing comes through a window that is rendered open: `via` = [wall id, index of that opening]) and 'plant'.
//
// A PLUG-IN is a module in this folder that exports `default { sampled?: true, build(ctx) }`, registered in PLUGINS below and in tables.json motion.kinds:
//   build(ctx) -> thing = {
//     group?:   a THREE.Group the framework adds to the home (its meshes never cast baked light); set `thing.shown = false` to hide it (away, outside, asleep out of view);
//     update(dt): advance by dt seconds (dt <= 0.05), using only ctx.rnd for chance, so a thing replays the same from its seed;
//     bodies?(): the solid volumes it fills now, world mm: [{ c: [x, y, z], r, perch?: id of the object it rests on }]. A thing with `sampled: true` and bodies() is run by check-motion.mjs
//                for minutes of simulated time (fixed 1/30 s steps) and must never put a body inside an object, outside the room, or through a wall except by its open window.
//   }
//   ctx = { T (THREE), kit, home, entry, area ({ id, bounds }), rnd(a = 0, b = 1) (seeded), objects ([{ id, g, box (solid Box3, world), landing (world [x,y,z] | null), asset }]),
//     solids (boxes of everything solid in the area), walls ([{ W, id }]; W.d runs along the wall, W.n points into the room, W.len, W.to), openings ([opening]),
//     via (the opening named by the roll, or null), room: { x0, x1, z0, z1, ymin, ymax } (where a flier may be: the area's floor shrunk 150 mm, above 1000 mm, below the lamp line) }
//   opening = { id, W, op, centre: [x, z], n: [nx, nz] (into the room), u: [ux, uz] (along the wall), width, height, sill, open() 0 shut .. 1 wide, gap() the clear width at the middle now (mm), usable(r) gap >= 2 r + 30 }
// Rule for every plug-in: anything that comes in from outside uses `ctx.via` and goes only while via.usable(r) holds (the window is open); nothing passes through furniture at any frame.
// To add a kind: tables.json motion.kinds (say, needs, in, weight, flies), the module here, PLUGINS below; then `node check-motion.mjs` is part of check-home.
import * as THREE from '../vendor/three/three.module.js';
import { openable, gapOf } from './rules.js';
import butterfly from './butterfly.js';
import wind from './wind.js';
export const PLUGINS = { wind, butterfly };

const hash = (s) => { let h = 2166136261 >>> 0; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; };
const seeded = (seed) => { let s = seed >>> 0; return (a = 0, b = 1) => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return a + (b - a) * (((t ^ (t >>> 14)) >>> 0) / 4294967296); }; };

export function createMotion(kit, home, S) {
  const T = THREE, things = [], where = (g) => new T.Box3().setFromObject(g);
  home.group.updateMatrixWorld(true);
  // plants that sway are driven by the wind thing of their area only (kitchen/plant.js keeps its own blade update under userData.windUpdate)
  for (const g of Object.values(home.objects)) if (g.userData.gust && g.userData.update) { g.userData.windUpdate = g.userData.update; delete g.userData.update; }
  const solidBox = (g) => {
    const out = new T.Box3(), bb = new T.Box3();
    g.traverse((o) => { if (!o.isMesh || o.isLineSegments2 || o.userData.lines || o.material.isMeshBasicMaterial || kit.hulls.includes(o.material) || o.material === kit.depth) return; o.geometry.computeBoundingBox(); out.union(bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); });
    return out;
  };
  const inArea = (A, g) => { const o = g.userData.scene || {}; if (o.area) return o.area === A.id; const c = where(g).getCenter(new T.Vector3()), b = A.bounds; return c.x >= b.x0 && c.x <= b.x1 && c.z >= b.z0 && c.z <= b.z1; };
  const contextOf = (A, entry) => {
    const ws = home.walls.filter((W) => W.id && W.id.startsWith(A.id + '-')).map((W) => ({ W, id: W.id }));
    const openings = ws.flatMap(({ W }) => W.built.map((b, index) => {
      const p = b.group.getWorldPosition(new T.Vector3()), st = b.openables[0]?.userData.open, op = b.op;
      const o = { id: `${W.id}#${index}`, index, W, op, centre: [p.x, p.z], n: W.n, u: W.d, width: op.width, height: op.height, sill: op.sill || 0,
        open: () => (st ? st.v : 0), gap: () => (openable(op) ? gapOf(op, st ? st.v : 0, st?.max) : 0), usable: (r) => o.gap() >= 2 * r + 30 };
      return o;
    }));
    const objects = Object.entries(home.objects).filter(([, g]) => inArea(A, g)).map(([id, g]) => {
      const L = g.userData.landing; return { id, g, asset: g.userData.scene?.asset, box: solidBox(g), landing: L ? new T.Vector3(...L).applyMatrix4(g.matrixWorld).toArray() : null };
    }).filter((o) => !o.box.isEmpty());
    const b = A.bounds, via = entry.via ? openings.find((o) => o.W.id === entry.via[0] && o.index === entry.via[1]) || null : null;
    return { T, kit, home, entry, area: A, rnd: seeded(hash(`${S.seed}/${A.id}/${entry.kind}`)), objects, solids: objects.filter((o) => o.box.max.y > 500), walls: ws, openings, via,
      room: { x0: b.x0 + 150, x1: b.x1 - 150, z0: b.z0 + 150, z1: b.z1 - 150, ymin: 1000, ymax: Math.min((b.top || 2500) - 250, 2150) } };
  };
  for (const A of S.areas) for (const entry of A.motion || []) {
    const plug = PLUGINS[entry.kind];
    if (!plug) { things.push({ area: A.id, kind: entry.kind, entry, error: `no plug-in "${entry.kind}"` }); continue; }
    const ctx = contextOf(A, entry), th = plug.build(ctx) || {};
    Object.assign(th, { area: A.id, kind: entry.kind, entry, ctx, sampled: !!plug.sampled });
    if (th.group) { th.group.traverse((o) => { o.userData.nocast = true; }); home.group.add(th.group); th.group.visible = false; }
    things.push(th);
  }
  const paused = typeof location !== 'undefined' && /[?&]check\b/.test(location.search);   // ?check: nothing moves by itself, so the measuring checks see every plant at rest (the motion check steps things itself)
  return {
    things, PLUGINS,
    // each frame: the things of the area on show move (the others wait where they are)
    update(dt, areaId) {
      if (paused) return;
      dt = Math.min(dt, 0.05);
      for (const th of things) {
        const on = !areaId || th.area === areaId;
        if (on && th.update) th.update(dt);
        if (th.group) th.group.visible = on && th.shown !== false;
      }
    },
    // the checks (check-motion.mjs): step every sampled thing `seconds` of simulated time in fixed steps; fn(thing, t, bodies) sees each frame
    run(seconds, fn, dt = 1 / 30) {
      for (let t = 0; t < seconds; t += dt) for (const th of things) if (th.sampled && th.update) { th.update(dt); fn(th, t, th.bodies ? th.bodies() : []); }
      if (paused) for (const th of things) if (th.group) th.group.visible = false;
    },
  };
}
