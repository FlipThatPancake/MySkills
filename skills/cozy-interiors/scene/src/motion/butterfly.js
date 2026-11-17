// @js:motion-butterfly — a butterfly (about 80 mm across, larger than life so it reads from the wide view) that comes in through the area's open window, wanders near it,
// now and then lands on a plant, a fruit bowl or the window sill and slowly opens and folds its wings, and after a while leaves the way it came. It keeps out of every solid
// (the area's boxes, padded by PAD) and the walls; it goes through only `ctx.via`, only while that opening is open wide enough, and waits outside (hidden) otherwise.
// Ported from the original kitchen's butterfly (the flap, glides and wandering are the same; the places are found in the area instead of listed). `sampled`: check-motion.mjs runs it.
import { paintCanvas } from '../kitchen/paint.js';
import { PAD } from './rules.js';
const R = 42;   // the body's reach in mm, wings included: what the checks measure
export default {
  sampled: true,
  build(ctx) {
    const { T, kit, rnd, via, room, solids, objects, walls } = ctx, g = kit.group(), tmp = new T.Vector3(), probe = new T.Vector3();
    if (!via) return { error: 'butterfly: no opening to come through', update() {} };
    // ---- the body: two painted wings per side
    const shapeOf = (draw) => { const s = new T.Shape(); draw(s); return s; };
    const fore = shapeOf((s) => { s.moveTo(0, 7); s.quadraticCurveTo(19, 19, 38, 22); s.bezierCurveTo(48, 16, 46, -6, 27, -14); s.lineTo(0, -3); s.closePath(); });
    const hind = shapeOf((s) => { s.moveTo(0, -3); s.bezierCurveTo(13, -5, 29, -10, 32, -22); s.bezierCurveTo(33, -30, 27, -33, 24, -42); s.bezierCurveTo(18, -36, 13, -32, 9, -30); s.bezierCurveTo(4, -26, 1, -20, 0, -14); s.closePath(); });
    const washOf = (shape, seed) => {
      const c = paintCanvas({ size: 128, wash: [[240, 214, 120], [244, 230, 160], [236, 200, 100]], seed, strokes: 30, blotches: 8, strength: 0.6 });
      const q = c.getContext('2d'), pts = shape.getPoints(24), S = 128;
      const x0 = Math.min(...pts.map((p) => p.x)), x1 = Math.max(...pts.map((p) => p.x)), y0 = Math.min(...pts.map((p) => p.y)), y1 = Math.max(...pts.map((p) => p.y));
      const P = (p) => [(p.x - x0) / (x1 - x0) * S, (1 - (p.y - y0) / (y1 - y0)) * S];
      q.save(); q.beginPath(); pts.forEach((p, i) => (i ? q.lineTo(...P(p)) : q.moveTo(...P(p)))); q.closePath(); q.clip();
      q.strokeStyle = 'rgba(120,96,48,0.3)'; q.lineWidth = S * 0.07; q.stroke();
      q.strokeStyle = 'rgba(120,96,48,0.2)'; q.lineWidth = 1.3;
      const root = P({ x: 0, y: (pts[0].y + pts[pts.length - 2].y) / 2 });
      for (let i = 2; i < pts.length - 2; i += 6) { q.beginPath(); q.moveTo(...root); q.lineTo(...P(pts[i])); q.stroke(); }
      q.restore();
      return c;
    };
    const wingMats = [kit.paint(washOf(fore, 11), true), kit.paint(washOf(hind, 12), true)];
    const wing = (shape, mat, dy) => {
      const geo = new T.ShapeGeometry(shape, 12); geo.computeBoundingBox();
      const b = geo.boundingBox, pos = geo.attributes.position, uv = geo.attributes.uv;
      for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - b.min.x) / (b.max.x - b.min.x), (pos.getY(i) - b.min.y) / (b.max.y - b.min.y));
      geo.rotateX(Math.PI / 2);
      const m = new T.Mesh(geo, mat); m.position.y = dy;
      return kit.outline(m, { tone: 'mid', crease: 60 });
    };
    const pivots = [1, -1].map((side) => { const p = kit.group(); p.position.set(side * 1.8, 0, 0); p.scale.x = side; p.add(wing(fore, wingMats[0], 0.3), wing(hind, wingMats[1], 0)); g.add(p); return p; });
    g.add(kit.cyl(0, 0, 13, 1.8, 28, { axis: 'z', seg: 8, tone: 'lo' }));
    g.add(kit.solid(new T.SphereGeometry(3, 10, 8), 0, 0.3, 5, { smooth: true, tone: 'lo' }));
    g.add(kit.solid(new T.SphereGeometry(2.6, 10, 8), 0, 0.4, 15.5, { smooth: true, tone: 'lo' }));
    for (const side of [1, -1]) {
      g.add(kit.lines([[side * 0.8, 1, 17], [side * 3.5, 4, 26], [side * 3.5, 4, 26], [side * 7, 6, 33]], 'lo'));
      g.add(kit.solid(new T.SphereGeometry(1.3, 8, 6), side * 7, 6, 33.6, { smooth: true, tone: 'mid' }));
    }
    g.scale.setScalar(0.9); g.rotation.order = 'YXZ';

    // ---- places, in the world: the window's door (inside and outside), perches
    const c = via.centre, n = via.n, at = (dn, y) => new T.Vector3(c[0] + n[0] * dn, y, c[1] + n[1] * dn);   // a point on the window's middle line, dn mm into the room
    const dnOf = (p, W = via.W) => (p.x - W.to[0]) * W.n[0] + (p.z - W.to[1]) * W.n[1];
    const free = (p, pad) => !solids.some(({ box }) => p.x > box.min.x - pad && p.x < box.max.x + pad && p.y > box.min.y - pad && p.y < box.max.y + pad && p.z > box.min.z - pad && p.z < box.max.z + pad);
    const clearLine = (a, b) => { for (let i = 1; i < 14; i++) if (!free(probe.lerpVectors(a, b, i / 14), PAD)) return false; return true; };
    // the height it goes through: the middle of the opening, else other heights across it, whichever has clear air in line with the opening
    const mid = via.sill + via.height / 2, ys = [mid, mid + 150, mid - 150, mid + 300, mid - 300].map((y) => Math.min(Math.max(y, via.sill + 140, 300), via.sill + via.height - 140)).filter((y) => y > 0);
    const yIn = ys.find((y) => clearLine(at(-450, y), at(380, y)) && free(at(380, y), PAD + 20));
    if (yIn === undefined) return { error: 'butterfly: the air in front of the opening is blocked (a tall thing stands in line with it)', update() {} };
    const OUT = at(-450, yIn), GATE = at(380, yIn);
    const sites = objects.filter((o) => o.landing && o.landing[1] + 170 >= room.ymin - 100).map((o) => ({ name: o.id, perch: o.id, spot: new T.Vector3(...o.landing), pre: new T.Vector3(o.landing[0], o.landing[1] + 170, o.landing[2]) }));
    if (via.op.kind === 'window') { const spot = at(25, via.sill + 36), pre = at(350, via.sill + 50); if (pre.y >= room.ymin - 100 && free(pre, PAD) && free(spot, 8)) sites.push({ name: 'sill', perch: null, spot, pre }); }
    const flyZone = { lat: 1800, dn0: 350, dn1: 2600 };

    // ---- flight
    const pos = OUT.clone(), vel = new T.Vector3(), tgt = new T.Vector3();
    const inBox = (p, pad) => !free(p, pad);
    const inRoom = (p) => p.x >= room.x0 && p.x <= room.x1 && p.z >= room.z0 && p.z <= room.z1;
    const clearOfWalls = (p) => walls.every(({ W }) => { const s = -((p.x - W.to[0]) * W.d[0] + (p.z - W.to[1]) * W.d[1]); return s < -40 || s > W.len + 40 || (p.x - W.to[0]) * W.n[0] + (p.z - W.to[1]) * W.n[1] > PAD; });
    let best = 1e9, stuck = 0, blocked = 0, st = 'away', site = null, timer = rnd(1.5, 4), legs = 0, leaveAfter = 0, visit = 0, ph = rnd(0, 6), phase = 0, ang = 1.2, glide = 0, nextGlide = rnd(1.5, 4), freq = 7.5, yaw = Math.atan2(n[0], n[1]), clock = 0, shown = false;
    const pick = () => {
      for (let i = 0; i < 14; i++) {
        const dn = rnd(flyZone.dn0, flyZone.dn1), lat = rnd(-flyZone.lat, flyZone.lat);
        tgt.set(c[0] + n[0] * dn + via.u[0] * lat, rnd(room.ymin, room.ymax), c[1] + n[1] * dn + via.u[1] * lat);
        if (inRoom(tgt) && clearOfWalls(tgt) && free(tgt, PAD + 20) && clearLine(pos, tgt)) { best = 1e9; stuck = 0; return; }
      }
      tgt.copy(GATE); best = 1e9; stuck = 0;
    };
    const push = (corridor) => {   // out of any solid or wall it is in, along the shortest way, losing the speed into it
      for (const { box } of solids) {
        const b0 = box.min, b1 = box.max;
        if (!(pos.x > b0.x - PAD && pos.x < b1.x + PAD && pos.y > b0.y - PAD && pos.y < b1.y + PAD && pos.z > b0.z - PAD && pos.z < b1.z + PAD)) continue;
        const d = [pos.x - (b0.x - PAD), (b1.x + PAD) - pos.x, pos.y - (b0.y - PAD), (b1.y + PAD) - pos.y, pos.z - (b0.z - PAD), (b1.z + PAD) - pos.z], k = d.indexOf(Math.min(...d)), ax = 'xyz'[k >> 1], dir = k & 1 ? 1 : -1;
        pos[ax] += dir * d[k]; if (vel[ax] * dir < 0) vel[ax] = 0; blocked = 0.4;
      }
      if (!corridor) for (const { W } of walls) {
        const s = -((pos.x - W.to[0]) * W.d[0] + (pos.z - W.to[1]) * W.d[1]), dn = (pos.x - W.to[0]) * W.n[0] + (pos.z - W.to[1]) * W.n[1];
        if (s > -40 && s < W.len + 40 && dn < PAD) { pos.x += W.n[0] * (PAD - dn); pos.z += W.n[1] * (PAD - dn); const vn = vel.x * W.n[0] + vel.z * W.n[1]; if (vn < 0) { vel.x -= vn * W.n[0]; vel.z -= vn * W.n[1]; } }
      }
      if (!corridor) { pos.x = Math.min(room.x1, Math.max(room.x0, pos.x)); pos.z = Math.min(room.z1, Math.max(room.z0, pos.z)); }
      pos.y = Math.min(room.ymax, Math.max(room.ymin - 120, pos.y));
    };
    const goSite = () => { site = sites[Math.floor(rnd(0, sites.length))]; tgt.copy(site.pre); st = 'to-pre'; };
    const goOut = () => { tgt.copy(GATE); st = 'to-gate'; };
    const flap = (dt, moving) => {
      if (moving) {
        nextGlide -= dt;
        if (nextGlide < 0) { glide = rnd(0.3, 0.6); nextGlide = rnd(1.5, 4) + glide; freq = rnd(6, 9); }
        if (glide > 0) { glide -= dt; ang += (0.55 - ang) * Math.min(1, 8 * dt); } else { phase += freq * 2 * Math.PI * dt; ang = 0.5 + 0.85 * Math.sin(phase); }
      } else { const s = 0.5 + 0.5 * Math.sin(clock * 2 * Math.PI / 1.8); ang += ((1.45 - 1.15 * s * s) - ang) * Math.min(1, 6 * dt); }
      pivots[0].rotation.z = ang; pivots[1].rotation.z = -ang;
    };
    const place = () => { g.position.copy(pos); };
    const steer = (dt, k, speed, corridor) => {
      const to = tmp.copy(tgt).sub(pos), dist = to.length(), want = to.normalize().multiplyScalar(speed);
      if (!corridor) { want.x += 66 * k * Math.sin(clock * 1.7 + ph); want.z += 66 * k * Math.cos(clock * 1.3 + ph * 2); want.y += k * (150 * Math.sin(clock * 2.3 + ph * 3) + 60 * Math.sin(clock * 5.1)); }
      if (blocked > 0) { blocked -= dt; want.y += 420; }
      vel.lerp(want, Math.min(1, (corridor ? 5 : 2.2) * dt));
      if (vel.length() > 700) vel.setLength(700);
      pos.addScaledVector(vel, dt); push(corridor);
      const hs = Math.hypot(vel.x, vel.z);
      if (hs > 40) { let d = Math.atan2(vel.x, vel.z) - yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); yaw += d * Math.min(1, 5 * dt); }
      g.rotation.set(-Math.atan2(vel.y, Math.max(hs, 80)) * 0.5, yaw, 0); place(); flap(dt, true);
      return dist;
    };
    g.rotation.y = yaw; place();
    const th = {
      group: g, via, R, get shown() { return shown; }, get state() { return st; },
      update(dt) {
        clock += dt;
        const usable = via.usable(R);
        if (st === 'away') {   // hidden outside; comes in when the window is open wide enough
          shown = false; timer -= dt;
          if (timer <= 0 && usable) { pos.copy(OUT); vel.set(0, 0, 0); tgt.copy(GATE); st = 'enter'; shown = true; visit = 0; leaveAfter = rnd(2, 4); g.position.copy(pos); }
          return;
        }
        visit += dt;
        if (st === 'land') {
          timer -= dt; flap(dt, false);
          if (timer <= 0) { st = 'takeoff'; tgt.copy(site.pre); vel.set(0, 90, 0); }
          place(); return;
        }
        if (st === 'enter') {   // straight along the opening's middle line, so it passes between the open sashes
          if (!usable && dnOf(pos) < 120) { vel.multiplyScalar(0.9); flap(dt, true); place(); return; }   // shut again before it was in: it waits outside the glass
          const d = steer(dt, 0, 260, true);
          if (d < 40) { st = 'fly'; legs = 0; pick(); }
          return;
        }
        if (st === 'out') {
          if (!usable && dnOf(pos) > 0) { st = 'fly'; legs = 0; pick(); return; }   // the window was shut on the way out: back into the room
          const d = steer(dt, 0, 260, true);
          if (d < 40) { st = 'away'; shown = false; timer = rnd(14, 26); }
          return;
        }
        const dist = tmp.copy(tgt).sub(pos).length();
        if (st === 'fly') {
          if (dist < best - 40) { best = dist; stuck = 0; } else if ((stuck += dt) > 3) pick();
          if (dist < 130) {
            legs++;
            if (visit > 50 || (legs >= leaveAfter && rnd() < 0.4)) goOut();
            else if (legs >= 3 + Math.floor(rnd(0, 3))) { legs = 0; goSite(); } else pick();
          }
        } else if (st === 'to-gate') {
          if (dist < 70) { if (usable) { tgt.copy(OUT); st = 'out'; } else { st = 'fly'; legs = 0; pick(); } }
        } else if (st === 'to-pre') {
          if (dist < (site.name === 'sill' ? 35 : 70)) { st = 'to-spot'; tgt.copy(site.spot); }
        } else if (st === 'to-spot') {
          if (dist < 8) { pos.copy(site.spot); vel.set(0, 0, 0); st = 'land'; timer = rnd(3, 6); place(); return; }
        } else if (st === 'takeoff') {
          if (dist < 45) { st = 'fly'; legs = 0; pick(); }
        }
        const slow = st === 'fly' || st === 'to-gate' ? 1 : st === 'to-spot' ? Math.min(1, dist / 120) * 0.6 + 0.35 : Math.min(1, 0.3 + dist / 260);
        const sp = (330 + 130 * (1 + Math.sin(clock * 0.9 + ph))) * slow;
        const k = st === 'fly' || st === 'to-gate' ? 1 : Math.min(1, dist / 260);
        if (st === 'to-spot') { const to = tmp.copy(tgt).sub(pos).normalize().multiplyScalar(sp); vel.lerp(to, Math.min(1, 4 * dt)); if (blocked > 0) blocked = 0; pos.addScaledVector(vel, dt); place(); flap(dt, true); return; }
        steer(dt, k, sp, false);
      },
      bodies() { return shown ? [{ c: pos.toArray(), r: R, perch: site && (st === 'land' || st === 'to-spot' || st === 'takeoff') ? site.perch : null, outside: dnOf(pos) < 0 ? via.id : null }] : []; },
    };
    return th;
  },
};
