// @js:motion-paw — a cat's paw reaching out from behind a curtain, searching: it slips round the inner edge of one panel of the area's curtain, sweeps the floor and the air in front of the curtain (patting now and then), and withdraws; then it waits 6 to 16 s and tries again.
// Needs a full-width curtain panel (300 mm or more) by a solid wall or a window with a sill, never on a glass wall or door; needs a curtain in the area (an `a.put`/`wall.place` of the 'curtain' asset). The cat itself stays behind the fabric: the shoulder sits 20 mm beside the panel's edge in the gap between the fabric and the wall, so the arm never crosses the fabric, and it stops short of any solid it would touch.
// bodies(): three spheres along the arm and one on the paw, perched on the curtain. The look of the limb is in catmodel.js (foreleg).
import { foreleg } from './catmodel.js';
const ss = (x) => x * x * (3 - 2 * x);
export default {
  sampled: true,
  build(ctx) {
    const { T, kit, rnd, objects, solids } = ctx, cur = objects.find((o) => o.asset === 'curtain');
    if (!cur) return { error: 'paw: no curtain in this area to reach out from (place the curtain asset)', update() {} };
    const sc = cur.g.userData.scene || {}, w = sc.params?.w ?? 1500, pw = w * 0.22, panels = sc.params?.panels ?? 2;
    const side = panels > 1 && rnd() < 0.5 ? 1 : -1, ex = side * (w / 2 + 40 - pw), px = ex - side * 8;   // the panel's inner edge and the shoulder, in the curtain's own frame (x along the wall, +z into the room)
    const M = cur.g.matrixWorld;
    // a cat hides behind a full-width panel (at least 300 mm of fabric) that hangs by a solid wall, or at a window with a sill (it stands on the sill); a bundle on a glass wall or glass door has nothing behind it
    if (pw < 300) return { error: `paw: the curtain panel is ${Math.round(pw)} mm wide: too narrow to hide a cat (a panel at least 300 mm wide: curtain w 1370 or more)`, update() {} };
    const pc = new T.Vector3(ex - side * pw / 2, 0, 0).applyMatrix4(M); let sillY = 0;
    for (const o of ctx.openings) {
      const lat = (pc.x - o.centre[0]) * o.u[0] + (pc.z - o.centre[1]) * o.u[1], dn = (pc.x - o.W.to[0]) * o.W.n[0] + (pc.z - o.W.to[1]) * o.W.n[1];
      if (Math.abs(dn) > 500 || Math.abs(lat) > o.width / 2 + pw / 2) continue;   // not this wall, or beside this opening
      const glass = o.op.style === 'wall' || o.op.style === 'slider' || o.op.style === 'french' || (o.op.kind === 'window' && o.sill < 150);
      if (glass) return { error: `paw: this curtain panel hangs on a glass wall or glass door (${o.id}): no wall for a cat to stand behind (hang it by a solid wall, or at a window with a sill)`, update() {} };
      if (o.op.kind === 'window') sillY = Math.max(sillY, o.sill);   // the cat stands on the sill
    }
    const shoulder = new T.Vector3(px, sillY + 150, 44).applyMatrix4(M);
    const ax = new T.Vector3(1, 0, 0).transformDirection(M), az = new T.Vector3(0, 0, 1).transformDirection(M);   // world directions of the curtain's x and z
    const free = new T.Vector3().copy(ax).multiplyScalar(-side);   // toward the middle of the window
    const arm = foreleg(kit, { L: 190 }), g = kit.group(), pivot = kit.group();
    pivot.add(arm.group); g.add(pivot); pivot.position.copy(shoulder);
    const LEN = arm.L + arm.paw, tmp = new T.Vector3(), others = solids.filter((o) => o !== cur && o.box.max.y > 40);
    const pad = 14, clear = (p, r) => others.every((o) => o.box.distanceToPoint(p) > r + pad);
    // direction from yaw (toward the middle of the window) and pitch (down): rotate az toward `free`
    const dir = (yaw, pitch, out) => out.copy(az).multiplyScalar(Math.cos(yaw)).addScaledVector(free, Math.sin(yaw)).multiplyScalar(Math.cos(pitch)).addScaledVector(new T.Vector3(0, -1, 0), Math.sin(pitch)).normalize();
    const spheres = (yaw, pitch, ext) => { const d = dir(yaw, pitch, new T.Vector3()), L = LEN * ext; return [[0.3 * L, 20], [0.62 * L, 19], [L - 26, 24]].map(([k, r]) => ({ c: shoulder.clone().addScaledVector(d, k), r })); };
    // reach limit for a direction: the longest extension (0.35 .. 1) whose spheres are clear of solids and above the floor
    const reach = (yaw, pitch) => { for (let e = 1; e >= 0.35; e -= 0.1) { const s = spheres(yaw, pitch, e); if (s.every(({ c, r }) => c.y >= r + 2 && clear(c, r))) return e; } return 0; };
    if (reach(0.6, 0.3) < 0.5) return { error: 'paw: the space in front of the curtain edge is blocked', update() {} };
    let st = 'wait', timer = rnd(2, 6), ext = 0, yaw = 0.5, pitch = 0.3, ty = 0.5, tp = 0.3, te = 0.9, next = 0, tPat = 0, patting = 0, tAll = 0, shown = false;
    const apply = () => {
      const d = dir(yaw, pitch, tmp), q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 0, 1), d);   // the arm is built along +z
      pivot.quaternion.copy(q); pivot.scale.set(1, 1, Math.max(0.02, ext)); pivot.updateMatrixWorld(true);
    };
    const choose = () => { for (let i = 0; i < 8; i++) { const y = rnd(0.5, 1.0), p = rnd(0.12, 0.62), e = reach(y, p); if (e >= 0.5) { ty = y; tp = p; te = Math.min(1, e); return; } } };
    const th = {
      group: g, get shown() { return shown; }, get state() { return st; },
      update(dt) {
        tAll += dt;
        if (st === 'wait') { shown = false; timer -= dt; if (timer <= 0) { st = 'out'; timer = 0; ext = 0; yaw = 0.55; pitch = 0.25; choose(); next = rnd(0.8, 1.6); tAll = 0; shown = true; leaves = Math.floor(rnd(3, 6)); } return; }
        timer += dt;
        const k = Math.min(1, 3 * dt);
        if (st === 'out') { ext = Math.min(te, ss(Math.min(1, timer / 1.1)) * te); if (timer > 1.1) { st = 'search'; timer = 0; } }
        else if (st === 'search') {
          next -= dt; ext += (te - ext) * k;
          if (next <= 0) { leaves--; if (leaves <= 0) { st = 'in'; timer = 0; } else { choose(); next = rnd(0.9, 1.8); if (rnd() < 0.4) { patting = 0.35; } } }
          if (patting > 0) { patting -= dt; tp = Math.min(0.62, tp + 1.8 * dt); }
        } else if (st === 'in') { ext = Math.max(0, ext - dt / 0.9 * 1); if (ext <= 0.02) { st = 'wait'; shown = false; timer = rnd(6, 16); return; } }
        yaw += (ty - yaw) * k; pitch += (tp - pitch) * k;
        // never into a solid or the floor: shorten, else stay
        const r = reach(yaw, pitch); if (ext > r) ext = Math.max(0.02, r - 0.02);
        apply();
      },
      bodies() { return shown ? spheres(yaw, pitch, ext).map(({ c, r }) => ({ c: c.toArray(), r, perch: cur.id, ground: true })) : []; },
    };
    let leaves = 0;
    pivot.rotation.order = 'XYZ';
    return th;
  },
};
