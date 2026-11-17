// @js:motion-flight — the flight of a visitor that comes in through the area's open window, shared by the butterfly, the bee and the bird (each module builds its body and
// passes the numbers that make its flight its own): enters along the window's middle line, wanders the room in legs, now and then perches (on a plant, a fruit bowl, the sill, the top of
// a cabinet: the plug-in's `sites`), takes off, and after a while leaves the way it came. It keeps out of every solid (the area's boxes, padded by `pad`) and the walls; it goes through only
// `ctx.via`, only while `via.usable(R)` (the window is open wide enough), and waits outside, hidden, otherwise. Chance comes only from ctx.rnd.
// createFlight(ctx, g, cfg) -> thing { group, via, R, state, shown, update(dt), bodies() }, or { error } when the air before the window is blocked. g faces +z. cfg (defaults are the butterfly's):
//   R (42) body reach in mm; perchR (R) its reach while perched; pad (PAD) what it keeps from a solid; flap(dt, moving, st) wings each frame (st: the flight state);
//   v0 330, v1 130 (cruise speed v0 + v1 (1 + sin)), vmax 700, vIn 260 (through the window), turn 2.2 (steering rate), wob { xz 66, y [150, 60], f [1.7, 1.3, 2.3, 5.1] } wander;
//   pre 170 (height above a landing it approaches from), sill { dn 25, up 36, preDn 350, preUp 50 } or null for no sill perch, sites(h) -> [{ name, perch, spot, pre }] replaces the default
//   landings (h = { at, free, room, objects, rnd, T }), reach 70 / sillReach 35 / legReach 130 (how near counts as arrived),
//   span (R) how far the body and its wings reach from the centre: the keep-out distance from every camera is 900 mm + span; extra() -> [{ c: [x, y, z], r }] more spheres it fills now (wing tips),
//   measured by check-motion like the main body.
//   t { first [1.5, 4], away [14, 26], perch [3, 6], leave [2, 4], visit 50 } seconds, orient(g, vel, yaw, hs) sets the body's tilt (default: nose follows the climb).
import { PAD } from './rules.js';
export function createFlight(ctx, g, cfg = {}) {
    const { T, rnd, via, room, solids, objects, walls, cameras = () => [] } = ctx, tmp = new T.Vector3(), probe = new T.Vector3();
    const R = cfg.R ?? 42, pad = cfg.pad ?? PAD, flap = cfg.flap || (() => {}), t = { first: [1.5, 4], away: [14, 26], perch: [3, 6], leave: [2, 4], visit: 50, ...(cfg.t || {}) };
    const v0 = cfg.v0 ?? 330, v1 = cfg.v1 ?? 130, vmax = cfg.vmax ?? 700, vIn = cfg.vIn ?? 260, turn = cfg.turn ?? 2.2, wob = { xz: 66, y: [150, 60], f: [1.7, 1.3, 2.3, 5.1], ...(cfg.wob || {}) };
    const reach = cfg.reach ?? 70, sillReach = cfg.sillReach ?? 35, legReach = cfg.legReach ?? 130, preUp = cfg.pre ?? 170, bodyR = (st) => (st === 'land' || st === 'to-spot' || st === 'takeoff' ? cfg.perchR ?? R : R);
    const orient = cfg.orient || ((g, vel, yaw, hs) => g.rotation.set(-Math.atan2(vel.y, Math.max(hs, 80)) * 0.5, yaw, 0));
    const KEEP = 900 + (cfg.span ?? R), camOk = (p) => cameras().every((c) => p.distanceTo(c) > KEEP + 60);   // a flier keeps 900 mm from the home-view camera and every tour shot camera (else a half-clipped giant fills the frame)
    const sillCfg = cfg.sill === undefined ? { dn: 25, up: 36, preDn: 350, preUp: 50 } : cfg.sill;
    // ---- places, in the world: the window's door (inside and outside), perches
    const c = via.centre, n = via.n, at = (dn, y) => new T.Vector3(c[0] + n[0] * dn, y, c[1] + n[1] * dn);   // a point on the window's middle line, dn mm into the room
    const dnOf = (p, W = via.W) => (p.x - W.to[0]) * W.n[0] + (p.z - W.to[1]) * W.n[1];
    const free = (p, pad) => camOk(p) && !solids.some(({ box }) => p.x > box.min.x - pad && p.x < box.max.x + pad && p.y > box.min.y - pad && p.y < box.max.y + pad && p.z > box.min.z - pad && p.z < box.max.z + pad);
    const clearLine = (a, b) => { for (let i = 1; i < 14; i++) if (!free(probe.lerpVectors(a, b, i / 14), pad)) return false; return true; };
    // the height it goes through: the middle of the opening, else other heights across it, whichever has clear air in line with the opening
    const mid = via.sill + via.height / 2, ys = [mid, mid + 150, mid - 150, mid + 300, mid - 300].map((y) => Math.min(Math.max(y, via.sill + 140, 300), via.sill + via.height - 140)).filter((y) => y > 0);
    const yIn = ys.find((y) => clearLine(at(-450, y), at(380, y)) && free(at(380, y), pad + 20));
    if (yIn === undefined) return { error: `${cfg.name || 'flier'}: the air in front of the opening is blocked (a tall thing stands in line with it)`, update() {} };
    const OUT = at(-450, yIn), GATE = at(380, yIn);
    const sites = cfg.sites ? cfg.sites({ at, free, room, objects, rnd, T, solids, via }) : objects.filter((o) => o.landing && o.landing[1] + preUp >= room.ymin - 100).map((o) => ({ name: o.id, perch: o.id, spot: new T.Vector3(...o.landing), pre: new T.Vector3(o.landing[0], o.landing[1] + preUp, o.landing[2]) })).filter((q) => camOk(q.spot) && camOk(q.pre));
    if (sillCfg && via.op.kind === 'window') {   // a sill perch faces the window (face): wings spread along the wall, and the take-off keeps that heading until it is clear of the wall
       const spot = at(sillCfg.dn, via.sill + sillCfg.up), pre = at(sillCfg.preDn, via.sill + sillCfg.preUp); if (pre.y >= room.ymin - 100 && free(pre, pad) && free(spot, 8)) sites.push({ name: 'sill', perch: null, spot, pre, face: [-n[0], -n[1]] }); }
    const flyZone = { lat: 1800, dn0: 350, dn1: 2600 };

    // ---- flight
    const pos = OUT.clone(), vel = new T.Vector3(), tgt = new T.Vector3();
    const inBox = (p, pad) => !free(p, pad);
    const inRoom = (p) => p.x >= room.x0 && p.x <= room.x1 && p.z >= room.z0 && p.z <= room.z1;
    const clearOfWalls = (p) => walls.every(({ W }) => { const s = -((p.x - W.to[0]) * W.d[0] + (p.z - W.to[1]) * W.d[1]); return s < -40 || s > W.len + 40 || (p.x - W.to[0]) * W.n[0] + (p.z - W.to[1]) * W.n[1] > pad; });
    let best = 1e9, stuck = 0, blocked = 0, st = 'away', site = null, timer = rnd(...t.first), legs = 0, leaveAfter = 0, visit = 0, ph = rnd(0, 6), yaw = Math.atan2(n[0], n[1]), clock = 0, shown = false;
    const pick = () => {
      for (let i = 0; i < 14; i++) {
        const dn = rnd(flyZone.dn0, flyZone.dn1), lat = rnd(-flyZone.lat, flyZone.lat);
        tgt.set(c[0] + n[0] * dn + via.u[0] * lat, rnd(room.ymin, room.ymax), c[1] + n[1] * dn + via.u[1] * lat);
        if (inRoom(tgt) && clearOfWalls(tgt) && free(tgt, pad + 20) && clearLine(pos, tgt)) { best = 1e9; stuck = 0; return; }
      }
      tgt.copy(GATE); best = 1e9; stuck = 0;
    };
    const push = (corridor) => {   // out of any solid or wall it is in, along the shortest way, losing the speed into it
      for (const { box } of solids) {
        const b0 = box.min, b1 = box.max;
        if (!(pos.x > b0.x - pad && pos.x < b1.x + pad && pos.y > b0.y - pad && pos.y < b1.y + pad && pos.z > b0.z - pad && pos.z < b1.z + pad)) continue;
        const d = [pos.x - (b0.x - pad), (b1.x + pad) - pos.x, pos.y - (b0.y - pad), (b1.y + pad) - pos.y, pos.z - (b0.z - pad), (b1.z + pad) - pos.z], k = d.indexOf(Math.min(...d)), ax = 'xyz'[k >> 1], dir = k & 1 ? 1 : -1;
        pos[ax] += dir * d[k]; if (vel[ax] * dir < 0) vel[ax] = 0; blocked = 0.4;
      }
      for (const c of cameras()) { const d = pos.distanceTo(c); if (d < KEEP && d > 1e-6) { pos.addScaledVector(probe.copy(pos).sub(c).normalize(), KEEP - d); blocked = 0.4; } }
      if (!corridor) for (const { W } of walls) {
        const s = -((pos.x - W.to[0]) * W.d[0] + (pos.z - W.to[1]) * W.d[1]), dn = (pos.x - W.to[0]) * W.n[0] + (pos.z - W.to[1]) * W.n[1];
        if (s > -40 && s < W.len + 40 && dn < pad) { pos.x += W.n[0] * (pad - dn); pos.z += W.n[1] * (pad - dn); const vn = vel.x * W.n[0] + vel.z * W.n[1]; if (vn < 0) { vel.x -= vn * W.n[0]; vel.z -= vn * W.n[1]; } }
      }
      if (!corridor) { pos.x = Math.min(room.x1, Math.max(room.x0, pos.x)); pos.z = Math.min(room.z1, Math.max(room.z0, pos.z)); }
      pos.y = Math.min(room.ymax, Math.max(room.ymin - 120, pos.y));
    };
    const goSite = () => { if (!sites.length) { pick(); st = 'fly'; return; } site = sites[Math.floor(rnd(0, sites.length))]; tgt.copy(site.pre); st = 'to-pre'; };
    const goOut = () => { tgt.copy(GATE); st = 'to-gate'; };
    const place = () => { g.position.copy(pos); };
    const steer = (dt, k, speed, corridor) => {
      const to = tmp.copy(tgt).sub(pos), dist = to.length(), want = to.normalize().multiplyScalar(speed);
      if (!corridor) { want.x += wob.xz * k * Math.sin(clock * wob.f[0] + ph); want.z += wob.xz * k * Math.cos(clock * wob.f[1] + ph * 2); want.y += k * (wob.y[0] * Math.sin(clock * wob.f[2] + ph * 3) + wob.y[1] * Math.sin(clock * wob.f[3])); }
      if (blocked > 0) { blocked -= dt; want.y += 420; }
      vel.lerp(want, Math.min(1, (corridor ? 5 : turn) * dt));
      if (vel.length() > vmax) vel.setLength(vmax);
      pos.addScaledVector(vel, dt); push(corridor);
      const hs = Math.hypot(vel.x, vel.z);
      if (hs > 40 && !(st === 'takeoff' && site && site.face && pos.distanceTo(site.spot) < 260)) { let d = Math.atan2(vel.x, vel.z) - yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); yaw += d * Math.min(1, 5 * dt); }
      orient(g, vel, yaw, hs); place(); flap(dt, true, st);
      return dist;
    };
    g.rotation.y = yaw; place();
    const th = {
      group: g, via, R, pos, vel, get shown() { return shown; }, get state() { return st; },
      update(dt) {
        clock += dt;
        const usable = via.usable(R);
        if (st === 'away') {   // hidden outside; comes in when the window is open wide enough
          shown = false; timer -= dt;
          if (timer <= 0 && usable) { pos.copy(OUT); vel.set(0, 0, 0); tgt.copy(GATE); st = 'enter'; shown = true; visit = 0; leaveAfter = rnd(...t.leave); g.position.copy(pos); }
          return;
        }
        visit += dt;
        if (st === 'land') {
          timer -= dt; flap(dt, false, st);
          if (timer <= 0) { st = 'takeoff'; tgt.copy(site.pre); vel.set(0, 90, 0); }
          place(); return;
        }
        if (st === 'enter') {   // straight along the opening's middle line, so it passes between the open sashes
          if (!usable && dnOf(pos) < 120) { vel.multiplyScalar(0.9); flap(dt, true, st); place(); return; }   // shut again before it was in: it waits outside the glass
          const d = steer(dt, 0, vIn, true);
          if (d < 40) { st = 'fly'; legs = 0; pick(); }
          return;
        }
        if (st === 'out') {
          if (!usable && dnOf(pos) > 0) { st = 'fly'; legs = 0; pick(); return; }   // the window was shut on the way out: back into the room
          const d = steer(dt, 0, vIn, true);
          if (d < 40) { st = 'away'; shown = false; timer = rnd(...t.away); }
          return;
        }
        const dist = tmp.copy(tgt).sub(pos).length();
        if (st === 'fly') {
          if (dist < best - 40) { best = dist; stuck = 0; } else if ((stuck += dt) > 3) pick();
          if (dist < legReach) {
            legs++;
            if (visit > t.visit || (legs >= leaveAfter && rnd() < 0.4)) goOut();
            else if (legs >= 3 + Math.floor(rnd(0, 3))) { legs = 0; goSite(); } else pick();
          }
        } else if (st === 'to-gate') {
          if (dist < reach) { if (usable) { tgt.copy(OUT); st = 'out'; } else { st = 'fly'; legs = 0; pick(); } }
        } else if (st === 'to-pre') {
          if (dist < (site.name === 'sill' ? sillReach : reach)) { st = 'to-spot'; tgt.copy(site.spot); }
        } else if (st === 'to-spot') {
          if (dist < 8) { pos.copy(site.spot); vel.set(0, 0, 0); st = 'land'; timer = rnd(...t.perch); place(); return; }
        } else if (st === 'takeoff') {
          if (dist < 45) { st = 'fly'; legs = 0; pick(); }
        }
        const slow = st === 'fly' || st === 'to-gate' ? 1 : st === 'to-spot' ? Math.min(1, dist / 120) * 0.6 + 0.35 : Math.min(1, 0.3 + dist / 260);
        const sp = (v0 + v1 * (1 + Math.sin(clock * 0.9 + ph))) * slow;
        const k = st === 'fly' || st === 'to-gate' ? 1 : Math.min(1, dist / 260);
        // to-spot eases in (speed follows the distance), so it never overshoots a spot next to a wall
        if (st === 'to-spot') { const to = tmp.copy(tgt).sub(pos), d = to.length(); to.normalize().multiplyScalar(Math.min(sp, Math.max(50, d * 3.5))); vel.lerp(to, Math.min(1, 4 * dt)); if (blocked > 0) blocked = 0; pos.addScaledVector(vel, dt); if (site.face) { let d = Math.atan2(site.face[0], site.face[1]) - yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); yaw += d * Math.min(1, 6 * dt); g.rotation.y = yaw; } place(); flap(dt, true, st); return; }
        steer(dt, k, sp, false);
      },
      bodies() {
        if (!shown) return [];
        const main = { c: pos.toArray(), r: bodyR(st), perch: site && (st === 'land' || st === 'to-spot' || st === 'takeoff') ? site.perch : null, outside: dnOf(pos) < 0 ? via.id : null };
        return [main, ...(cfg.extra && st !== 'land' ? cfg.extra() : []).map((e) => ({ ...e, perch: main.perch, outside: main.outside }))];
      },
    };
    return th;
}
