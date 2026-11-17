// @js:motion-cat — a cat that is always asleep, curled on a sensible surface of its area, breathing slowly (a breath every 3.6 s, the ribs rising, the head riding up) with now and then an ear twitch.
// It needs no window. Surface: a flat free spot on a bed, sofa, armchair, reading chair, window seat, bench or rug (the spot is found by rays down onto the area's own meshes, so it follows whatever the spec placed);
// failing that a free patch of bare floor. It never overlaps another object: the pose is tested with the same spheres check-motion.mjs measures. The look of the cat is in catmodel.js.
import { sleeper, SIZE } from './catmodel.js';
const PREFER = { bed: 5, sofa: 5, armchair: 4, readingChair: 4, windowSeat: 4, bench: 2, pouf: 2, rug: 2, floorCushion: 3 };
export default {
  sampled: true,
  build(ctx) {
    const { T, kit, rnd, objects, solids, walls, room } = ctx, g = kit.group();
    const cat = sleeper(kit, { seed: Math.floor(rnd(1, 1e6)) });
    g.add(cat.group); g.visible = false;
    // meshes a ray may hit: every fill of every object of the area
    const meshesOf = (o) => { const out = []; o.g.traverse((m) => { if (m.isMesh && !m.isLineSegments2 && !m.userData.kitLine && !m.userData.lines && !m.material.isMeshBasicMaterial && !kit.hulls.includes(m.material) && m.material !== kit.depth) out.push(m); }); return out; };
    const owner = new Map(); for (const o of objects) for (const m of meshesOf(o)) owner.set(m, o);
    const all = [...owner.keys()], ray = new T.Raycaster(), down = new T.Vector3(0, -1, 0), from = new T.Vector3();
    const hit = (x, z) => { from.set(x, 2600, z); ray.set(from, down); ray.far = 3000; const h = ray.intersectObjects(all, false)[0]; return h ? { y: h.point.y, o: owner.get(h.object), ny: h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld).y : 1 } : null; };
    const spheres = (x, y, z, yaw) => { const c = Math.cos(yaw), s = Math.sin(yaw), k = SIZE, at = (px, py, pz, r) => ({ c: [x + (px * c + pz * s) * k, y + py * k, z + (-px * s + pz * c) * k], r: r * k }); return [at(-60, 70, -40, 72), at(40, 70, -75, 70), at(85, 66, 5, 70), at(30, 70, 70, 65), at(-30, 60, 105, 50)]; };
    const clear = (sp, perchBox) => sp.every(({ c, r }) => {
      const p = new T.Vector3(...c);
      if (solids.concat(objects).some((o) => o.box !== perchBox && o.box.max.y > 100 && o.box.distanceToPoint(p) < r + 14)) return false;
      return walls.every(({ W }) => { const s = -((p.x - W.to[0]) * W.d[0] + (p.z - W.to[1]) * W.d[1]), dn = (p.x - W.to[0]) * W.n[0] + (p.z - W.to[1]) * W.n[1]; return s < -r || s > W.len + r || dn > r + 30; });
    });
    // candidate spots on each resting object
    const spots = [];
    const ring = [[0, 0]]; for (let k = 0; k < 8; k++) ring.push([Math.cos(k * Math.PI / 4) * 120, Math.sin(k * Math.PI / 4) * 120]);
    const bounds = ctx.area.bounds;
    const tryAt = (o, x, z, floorY) => {
      const hs = ring.map(([dx, dz]) => hit(x + dx, z + dz));
      if (floorY === undefined) { if (hs.some((h) => !h || h.o !== o || h.ny < 0.93)) return; const ys = hs.map((h) => h.y); if (Math.max(...ys) - Math.min(...ys) > 26) return; spots.push({ o, x, z, y: Math.max(...ys) - 2 }); }
      else { if (hs.some((h) => h && h.o !== o)) return; if (hs.some((h) => h && h.ny < 0.93)) return; const ys = hs.map((h) => (h ? h.y : floorY)); if (Math.max(...ys) - Math.min(...ys) > 12) return; spots.push({ o, x, z, y: Math.max(...ys) - 1 }); }
    };
    for (const o of objects) {
      if (!PREFER[o.asset]) continue;
      const b = o.box;
      for (let x = b.min.x + 100; x <= b.max.x - 100; x += 70) for (let z = b.min.z + 100; z <= b.max.z - 100; z += 70) tryAt(o, x, z);
    }
    let pick = null;
    const pose = (sp) => { for (let i = 0; i < 12; i++) { const yaw = rnd(0, Math.PI * 2), s = spheres(sp.x, sp.y, sp.z, yaw); if (clear(s, sp.o ? sp.o.box : null)) return { ...sp, yaw, s }; } return null; };
    const order = spots.map((s) => ({ s, w: PREFER[s.o.asset] * rnd(0.5, 1) })).sort((a, b) => b.w - a.w);
    for (const { s } of order.slice(0, 40)) { pick = pose(s); if (pick) break; }
    if (!pick) {   // bare floor: a free patch away from walls, preferably where the view is open
      const floors = [];
      for (let x = room.x0 + 200; x < room.x1 - 200; x += 110) for (let z = room.z0 + 200; z < room.z1 - 200; z += 110) { const h = hit(x, z); if (!h) floors.push({ o: null, x, z, y: 0 }); else if (h.o.asset === 'rug' && h.ny > 0.93) floors.push({ o: h.o, x, z, y: h.y - 1 }); }
      for (let i = 0; i < 80 && floors.length && !pick; i++) pick = pose(floors.splice(Math.floor(rnd(0, floors.length)), 1)[0]);
    }
    if (!pick) return { error: 'cat: no free spot to curl up (a flat surface or floor patch 500 mm across)', update() {} };
    g.position.set(pick.x, pick.y, pick.z); g.rotation.y = pick.yaw;
    const period = 3.6, ph0 = rnd(0, 1); let clock = 0, nextTwitch = rnd(6, 14), tw = -1;
    cat.breathe(ph0);
    return {
      group: g, spot: pick.o ? pick.o.id : 'floor',
      update(dt) {
        clock += dt; cat.breathe((clock / period + ph0) % 1);
        if (tw < 0 && clock > nextTwitch) tw = 0;
        if (tw >= 0) { tw += dt / 0.35; cat.twitch(Math.min(tw, 1)); if (tw >= 1) { tw = -1; cat.twitch(0); nextTwitch = clock + rnd(8, 20); } }
      },
      bodies() { return pick.s.map((b) => ({ c: b.c, r: b.r, perch: pick.o ? pick.o.id : null, ground: true })); },
    };
  },
};
