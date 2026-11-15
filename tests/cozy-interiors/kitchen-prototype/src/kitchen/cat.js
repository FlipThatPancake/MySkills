// @js:kitchen-cat — a slim procedural cat (about 460 mm nose to rump, tail extra) built from rigid parts: capsules, spheres, cones, in the light tone with the kit's outlines.
// Rigid parts keep the outlines right while the joints move, so there is no skinning. The cat is in kitchen millimetres: `root` stands on the floor (or counter) at (x, y, z)
// and faces along its local +z; `update(dt, explore)` is called from the render loop.
// Behaviours: scratching the return's end panel (the default and the "Cat explores" off state), and a wander loop on fixed waypoint lists: floor walks, sit, look
// around, scratching, and jumps up onto the counter and back down. No physics; nothing here can pass through a cabinet because the routes are fixed lists.
const D2R = Math.PI / 180;
const PANEL = { x: 290, z: 1500 };           // the scratched end panel of the return (faces +z)
const SCRATCH_YAW = Math.PI + 25 * D2R;       // facing the panel, turned 25° toward -x so the camera, which looks from +x, sees more of its side
const SCRATCH_SPOT = { x: 290, z: 1500 };    // root position is solved in `scratchRoot()`
const W0 = [790, 1660];                       // way in and out of the scratch spot, clear of the return (x 0..620, z up to 1520)
const FLOOR_ZONE = { x0: 850, x1: 3150, z0: 280, z1: 1300 };   // free floor; never in front of the oven column (x 3300+) or inside the return
const COUNTER_Y = 900, COUNTER_Z = -14;
const COUNTER_X = [760, 1050, 1750, 2100, 2330];   // spots on the clear front strip of the main counter (sink, hob and pan are behind it)
const JUMP_Z = 190;                           // where it jumps from and lands on the floor in front of the counter

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export function cat(kit) {
  const T = kit.THREE, lo = { tone: 'mid', smooth: true, crease: 75 };   // the cat is the one small thing that must read from the wide view, so its outline takes the kitchen's darker line tone
  const root = kit.group(), pelvis = kit.group(), torso = kit.group();
  root.add(pelvis); pelvis.add(torso);
  const part = (geo, x, y, z, parent, opts = lo) => { const m = kit.solid(geo, x, y, z, opts); parent.add(m); return m; };
  const sphere = (r, sx = 1, sy = 1, sz = 1) => { const g = new T.SphereGeometry(r, 18, 12); g.scale(sx, sy, sz); return g; };

  // ---- body: one smooth shape along the torso's +z, deeper at the chest than at the waist, with a slight dip in the back; the pelvis is its origin
  const bump = (z, c, w) => Math.exp(-(((z - c) / w) * ((z - c) / w)));
  const bodyGeo = () => {
    const prof = [[-30, 0], [-24, 20], [-8, 35], [20, 43], [50, 42], [80, 37], [110, 36], [140, 41], [168, 50], [195, 54], [220, 49], [240, 36], [248, 20], [252, 0]];
    const curve = new T.SplineCurve(prof.map(([z, r]) => new T.Vector2(r, z)));
    const g = new T.LatheGeometry(curve.getPoints(40).map((q) => new T.Vector2(Math.max(0, q.x), q.y)), 22);
    g.rotateX(Math.PI / 2);
    const pa = g.attributes.position;
    for (let i = 0; i < pa.count; i++) {
      const z = pa.getZ(i), y = pa.getY(i);
      pa.setY(i, y - 8 * bump(z, 195, 38) - (y > 0 ? 5 * bump(z, 105, 50) : 0));   // the chest drops, the back dips
    }
    g.computeVertexNormals();
    return g;
  };
  part(bodyGeo(), 0, 0, 0, torso);
  // ---- head on a short neck: a wedge (wide at the cheeks, narrowing to the nose), a short muzzle, two flat triangular ears on top
  const neck = kit.group(); neck.position.set(0, 22, 236); torso.add(neck);
  const head = kit.group(); head.position.set(0, 16, 16); neck.add(head);
  const wedgeGeo = (r) => {
    const g = new T.SphereGeometry(r, 18, 12), pa = g.attributes.position;
    for (let i = 0; i < pa.count; i++) {
      const f = (pa.getZ(i) + r) / (2 * r);          // 0 at the back of the skull, 1 at the nose
      pa.setXYZ(i, pa.getX(i) * (1.12 - 0.5 * f), pa.getY(i) * (1.0 - 0.22 * f), pa.getZ(i) * 1.08);
    }
    g.computeVertexNormals();
    return g;
  };
  part(wedgeGeo(31), 0, 0, 0, head);
  part(sphere(12, 1, 0.8, 1.1), 0, -9, 27, head);       // muzzle
  [-1, 1].forEach((s) => {
    const g = new T.ConeGeometry(12, 30, 3); g.scale(1, 1, 0.4);
    const ear = part(g, s * 19, 29, -3, head, { tone: 'mid', crease: 30 });
    ear.rotation.z = -s * 0.28; ear.rotation.x = -0.12;
    head.add(kit.lines([[s * 11, 6, 27], [s * 18, 8, 23]]));   // a short eye line
  });
  // ---- legs: shoulder/hip group -> upper limb -> knee group -> lower limb -> small oval paw. A limb is thick at the top and tapers to the bottom.
  const limbGeo = (r0, r1, len) => {
    const pts = [], n = 6;
    for (let i = 0; i <= n; i++) { const a = i / n * Math.PI / 2; pts.push(new T.Vector2(r1 * Math.sin(a), -len - r1 * Math.cos(a))); }     // bottom cap
    for (let i = 0; i <= n; i++) { const a = i / n * Math.PI / 2; pts.push(new T.Vector2(r0 * Math.cos(a), r0 * Math.sin(a))); }              // top cap
    return new T.LatheGeometry(pts, 12);
  };
  const legs = [];
  const leg = (x, y, z, parent, up, low) => {
    const top = kit.group(); top.position.set(x, y, z); parent.add(top);
    part(limbGeo(up.r0, up.r1, up.len), 0, 0, 0, top);
    const knee = kit.group(); knee.position.set(0, -up.len, 0); top.add(knee);
    part(limbGeo(low.r0, low.r1, low.len), 0, 0, 0, knee);
    const paw = kit.group(); paw.position.set(0, -(low.len + 5), 6); knee.add(paw);
    part(sphere(10, 1, 0.6, 1.5), 0, 0, 0, paw);
    const L = { top, knee, paw, side: Math.sign(x) };
    legs.push(L);
    return L;
  };
  const FU = { r0: 17, r1: 11, len: 62 }, FL = { r0: 11, r1: 7.5, len: 58 }, HU = { r0: 26, r1: 12, len: 64 }, HL = { r0: 12, r1: 7.5, len: 66 };
  const front = [leg(-30, -8, 200, torso, FU, FL), leg(30, -8, 200, torso, FU, FL)];
  const hind = [leg(-32, -6, 6, pelvis, HU, HL), leg(32, -6, 6, pelvis, HU, HL)];
  // ---- tail: ONE smooth tube, thick at the base and tapering to the tip. Six invisible joints bend it; every frame the tube is laid along a spline through them.
  const tail = [], TJ = 36;
  const tailBase = kit.group(); tailBase.position.set(0, 8, -14); torso.add(tailBase);
  let tp = tailBase;
  for (let i = 0; i < 6; i++) { const j = kit.group(); j.position.set(0, i ? 0 : 0, i ? -TJ : -20); tp.add(j); tail.push(j); tp = j; }
  const tailTip = kit.group(); tailTip.position.set(0, 0, -TJ); tp.add(tailTip);
  const TR = 16, TM = 10, tailGeo = new T.BufferGeometry();
  tailGeo.setAttribute('position', new T.BufferAttribute(new Float32Array(((TR + 1) * TM + 1) * 3), 3));
  tailGeo.setAttribute('normal', new T.BufferAttribute(new Float32Array(((TR + 1) * TM + 1) * 3), 3));
  const ti = [];
  for (let i = 0; i < TR; i++) for (let k = 0; k < TM; k++) { const a = i * TM + k, b = i * TM + (k + 1) % TM, c = a + TM, d = b + TM; ti.push(a, b, c, b, d, c); }
  for (let k = 0; k < TM; k++) ti.push(TR * TM + k, TR * TM + (k + 1) % TM, (TR + 1) * TM);   // the tip closes in a point
  tailGeo.setIndex(ti);
  const tailMesh = part(tailGeo, 0, 0, 0, torso, { tone: 'mid', smooth: true, crease: 181 });   // no crease lines: they would not follow the bend
  tailMesh.frustumCulled = false;
  const tailChain = [tailBase, ...tail, tailTip], tm = new T.Matrix4(), tv = new T.Vector3();
  const tailPts = chain => chain.map(() => new T.Vector3());
  const tp0 = tailPts(tailChain), tNorm = new T.Vector3(), tBin = new T.Vector3(), tTan = new T.Vector3();
  function shapeTail() {
    tm.identity();
    tailChain.forEach((j, i) => { j.updateMatrix(); tm.multiply(j.matrix); tp0[i].set(0, 0, 0).applyMatrix4(tm); });
    const curve = new T.CatmullRomCurve3(tp0, false, 'catmullrom', 0.5), pos = tailGeo.attributes.position;
    tNorm.set(1, 0, 0);
    for (let i = 0; i <= TR; i++) {
      const u = i / TR, c = curve.getPoint(u, tv.clone());
      curve.getTangent(u, tTan);
      tNorm.addScaledVector(tTan, -tNorm.dot(tTan)).normalize();       // carried along the curve, so the tube never twists
      tBin.crossVectors(tTan, tNorm);
      const r = lerp(12, 5.5, u) * (i === TR ? 0.7 : 1);
      for (let k = 0; k < TM; k++) {
        const a = k / TM * Math.PI * 2, cs = Math.cos(a) * r, sn = Math.sin(a) * r;
        pos.setXYZ(i * TM + k, c.x + tNorm.x * cs + tBin.x * sn, c.y + tNorm.y * cs + tBin.y * sn, c.z + tNorm.z * cs + tBin.z * sn);
      }
      if (i === TR) { const e = tTan.clone().multiplyScalar(5); pos.setXYZ((TR + 1) * TM, c.x + e.x, c.y + e.y, c.z + e.z); }
    }
    pos.needsUpdate = true;
    tailGeo.computeVertexNormals();
  }
  root.userData.cat = true;

  // ---- poses (degrees): `pitch` raises the nose; fu/hu are the shoulder and hip swing (negative = foot forward), fl/hl the knee bend
  const POSE = {
    stand: { pitch: 0, fu: -4, fl: 10, hu: -24, hl: 52, head: 4, tb: 35, tc: -9 },
    sit: { pitch: 52, fu: 52, fl: 4, hu: -80, hl: 156, head: -30, tb: -12, tc: 5 },
    // the scratcher: nose up ~70°, hind legs flexed, arms stretched up the panel (tuned so the paws land at about 400 mm)
    scratch: { pitch: 70, fu: -8, fl: 6, hu: -38, hl: 76, head: -10, tb: -12, tc: 8 },
    crouch: { pitch: -6, fu: 22, fl: 54, hu: -52, hl: 112, head: 10, tb: 4, tc: 2 },
    air: { pitch: 30, fu: -78, fl: 12, hu: 38, hl: 14, head: 2, tb: 8, tc: -4 },
    look: { pitch: 0, fu: -4, fl: 10, hu: -24, hl: 52, head: 8, tb: 30, tc: -8 }
  };
  const cur = {};
  Object.keys(POSE.stand).forEach((k) => { cur[k] = POSE.stand[k]; });
  cur.walk = 0; cur.lookYaw = 0; cur.scratchAmp = 0;

  // ---- behaviour state
  const S = { mode: 'scratch', pose: 'scratch', t: 0, phase: 0, plan: [], hold: 0, yaw: SCRATCH_YAW, pos: { x: SCRATCH_SPOT.x, y: 0, z: 0 }, jump: null, speed: 0, walking: false, sway: 0, rnd: 1, frames: 0 };
  const rand = () => { S.rnd = (S.rnd * 16807) % 2147483647; return S.rnd / 2147483647; };   // a small seeded generator, so a run is repeatable
  const between = (a, b) => a + (b - a) * rand();

  // The scratcher's root position: its front paws just touch the panel (found once, from the pose itself).
  let scratchRootZ = null;
  function applyPose(dt, tgt, groundY, ground = true) {
    const k = 1 - Math.exp(-dt * 9);
    for (const key of Object.keys(POSE.stand)) cur[key] = lerp(cur[key], tgt[key], k);
    const t = S.t, w = cur.walk, ph = S.phase;
    const sc = cur.scratchAmp, sa = Math.sin(t * 5.2) * 14 * sc;
    torso.rotation.x = -cur.pitch * D2R;
    head.rotation.x = -cur.head * D2R + (Math.sin(t * 1.3) * 3 * (1 - w)) * D2R;
    head.rotation.y = cur.lookYaw;
    const bob = Math.sin(t * 2.2) * 2.2 * (1 - w);     // breathing
    // legs: walking adds a swing per leg, phase-offset in diagonal pairs
    const swing = (L, off, isFront) => {
      const s = Math.sin(ph + off), amp = (isFront ? 26 : 22) * w;
      const up = (isFront ? cur.fu : cur.hu) + s * amp;
      const lowB = (isFront ? cur.fl : cur.hl) + Math.max(0, Math.cos(ph + off)) * 40 * w;
      L.top.rotation.x = up * D2R; L.knee.rotation.x = lowB * D2R;
    };
    swing(front[0], 0, true); swing(front[1], Math.PI, true); swing(hind[0], Math.PI, false); swing(hind[1], 0, false);
    if (sc > 0.01) {                                      // the scratch: the arms take turns pulling down the panel
      front[0].top.rotation.x += (sa - (S.bias ? S.bias[0] : 0) * sc) * D2R; front[1].top.rotation.x += (-sa - (S.bias ? S.bias[1] : 0) * sc) * D2R;
      front[0].knee.rotation.x += (Math.max(0, -sa) * 1.2) * D2R; front[1].knee.rotation.x += (Math.max(0, sa) * 1.2) * D2R;
    }
    // tail: six joints, the tip swaying; shapeTail() lays the tube along them
    tail.forEach((j, i) => {
      j.rotation.x = (cur.tb * (i === 0 ? 1 : 0) + cur.tc * (i ? 1 : 0)) * D2R + Math.sin(t * 1.7 + i * 0.6) * 0.03 * i;
      j.rotation.y = Math.sin(t * 2.3 - i * 0.7) * (0.05 + 0.04 * i) * (0.6 + 0.8 * w + 0.5 * cur.scratchAmp);
    });
    // body height: lowest paw on the ground (floor or counter); the walk adds a small bob
    pelvis.position.y = 200;
    if (ground) {
      root.position.y = groundY; root.updateMatrixWorld(true);
      let minY = 1e9;
      legs.forEach((L) => { const p = L.paw.getWorldPosition(new T.Vector3()); root.parent.worldToLocal(p); minY = Math.min(minY, p.y - 6); });
      pelvis.position.y += groundY - minY;
      pelvis.position.y += Math.abs(Math.sin(ph)) * 4 * w + bob * 0.3;
    }
  }

  function placeRoot() { root.position.x = S.pos.x; root.position.z = S.pos.z; root.rotation.y = S.yaw; }

  // ---- movement helpers
  // Walk toward (x, z); true on arrival. Turns first when the target is far off its heading.
  function walkTo(dt, x, z, vmax = 340, arriveR = 18) {
    const dx = x - S.pos.x, dz = z - S.pos.z, dist = Math.hypot(dx, dz);
    if (dist < arriveR) { S.speed = lerp(S.speed, 0, 1 - Math.exp(-dt * 10)); return true; }
    const want = Math.atan2(dx, dz), err = wrap(want - S.yaw);
    S.yaw += clamp(err, -3.2 * dt, 3.2 * dt);
    const v = Math.min(vmax, dist * 2.6 + 60) * Math.max(0, 1 - Math.abs(err) / 1.1);
    S.speed = lerp(S.speed, v, 1 - Math.exp(-dt * 6));
    S.pos.x += Math.sin(S.yaw) * S.speed * dt; S.pos.z += Math.cos(S.yaw) * S.speed * dt;
    return false;
  }
  function turnTo(dt, heading) { const err = wrap(heading - S.yaw); S.yaw += clamp(err, -3.5 * dt, 3.5 * dt); return Math.abs(err) < 0.05; }

  // ---- the plan: a list of steps, each {type, ...}; `next()` fills it
  const walk = (x, z, y = 0) => ({ type: 'walk', x, z, y });
  function nextPlan() {
    const r = rand(), onCounter = S.pos.y > 100;
    if (onCounter) return [];                       // a counter plan always ends with the jump down, never replanned here
    const pick = () => walk(Math.round(between(FLOOR_ZONE.x0, FLOOR_ZONE.x1)), Math.round(between(FLOOR_ZONE.z0, FLOOR_ZONE.z1)));
    const inScratchArea = S.pos.z > 1500;
    const out = inScratchArea ? [walk(W0[0], W0[1])] : [];
    if (r < 0.34) return out.concat([pick(), { type: 'idle', pose: rand() < 0.5 ? 'sit' : 'look', for: between(3, 6) }, pick(), { type: 'idle', pose: 'sit', for: between(2, 4) }]);
    if (r < 0.62) {                                  // up on the counter and back down
      const jx = COUNTER_X[Math.floor(rand() * COUNTER_X.length)], ex = COUNTER_X[Math.floor(rand() * COUNTER_X.length)];
      const spot = COUNTER_X[Math.floor(rand() * COUNTER_X.length)];
      return out.concat([walk(jx, JUMP_Z + 150), { type: 'jumpUp', x: jx }, walk(spot, COUNTER_Z, COUNTER_Y), { type: 'idle', pose: rand() < 0.6 ? 'sit' : 'look', for: between(4, 7), face: Math.PI / 2 }, walk(ex, COUNTER_Z, COUNTER_Y), { type: 'jumpDown', x: ex }]);
    }
    if (r < 0.9) return out.concat([walk(W0[0], W0[1]), walk(SCRATCH_SPOT.x, 1740), { type: 'scratch', for: between(6, 10) }, walk(W0[0], W0[1])]);
    return out.concat([pick(), { type: 'idle', pose: 'look', for: between(3, 5) }]);
  }

  let step = null;
  function begin(st) {
    step = st; S.hold = 0;
    if (st.type === 'jumpUp') S.jump = { from: { x: st.x, y: 0, z: JUMP_Z }, to: { x: st.x, y: COUNTER_Y, z: COUNTER_Z + 0 }, t: -0.45, dur: 0.78, peak: 190 };
    if (st.type === 'jumpDown') S.jump = { from: { x: st.x, y: COUNTER_Y, z: COUNTER_Z }, to: { x: st.x, y: 0, z: JUMP_Z }, t: -0.45, dur: 0.78, peak: 120 };
  }

  function update(dt, explore) {
    dt = Math.min(dt, 0.05);
    S.t += dt;
    let pose = 'stand', ground = true, groundY = S.pos.y, lookYaw = 0, scratch = 0, walking = false;
    if (!explore) {
      if (S.mode !== 'scratch') { S.mode = 'scratch'; S.plan = []; step = null; S.jump = null; }
    } else if (S.mode === 'scratch' && !step) { S.mode = 'explore'; step = { type: 'scratchOut' }; }

    if (S.mode === 'scratch') {
      // the home pose: facing the panel, standing on the hind legs, arms up the scratches
      pose = 'scratch'; scratch = 1;
      S.yaw = lerp(S.yaw, SCRATCH_YAW, 1 - Math.exp(-dt * 6));
      S.pos.x = lerp(S.pos.x, SCRATCH_SPOT.x, 1 - Math.exp(-dt * 4)); S.pos.y = 0;
      S.pos.z = lerp(S.pos.z, scratchRootZ == null ? 1660 : scratchRootZ, 1 - Math.exp(-dt * 4));
    } else {
      if (!step) { if (!S.plan.length) S.plan = nextPlan(); step = S.plan.length ? null : { type: 'idle', pose: 'stand', for: 1 }; if (!step) begin(S.plan.shift()); }
      const st = step;
      if (st.type === 'scratchOut') {                 // leave the panel: drop to all fours and back off
        pose = 'stand'; S.pos.y = 0;
        const ok = walkTo(dt, S.pos.x, 1740, 160, 10); walking = !ok;
        if (ok || S.t - (st.t0 = st.t0 ?? S.t) > 1.6) step = null;
      } else if (st.type === 'walk') {
        S.pos.y = st.y || 0; groundY = S.pos.y;
        const ok = walkTo(dt, st.x, st.z); walking = S.speed > 25; pose = 'stand';
        if (ok && S.speed < 30) step = null;
      } else if (st.type === 'idle') {
        S.hold += dt; pose = st.pose || 'stand';
        if (st.face != null) turnTo(dt, st.face);          // on the counter it sits along the edge, not hanging over it
        if (pose === 'look') lookYaw = Math.sin(S.hold * 1.4) * 0.9;
        S.speed = 0;
        if (S.hold > st.for) step = null;
      } else if (st.type === 'scratch') {
        const dx = SCRATCH_SPOT.x - S.pos.x, dz = (scratchRootZ ?? 1660) - S.pos.z;
        if (S.hold === 0 && Math.hypot(dx, dz) > 12) { const ok = turnTo(dt, SCRATCH_YAW); walkTo(dt, SCRATCH_SPOT.x, scratchRootZ ?? 1660, 160, 8); walking = S.speed > 20; if (Math.hypot(dx, dz) < 14 && ok) S.hold = 0.001; }
        else { S.hold += dt; pose = 'scratch'; scratch = 1; S.yaw = lerp(S.yaw, SCRATCH_YAW, 1 - Math.exp(-dt * 6)); S.speed = 0; if (S.hold > st.for) step = null; }
        if (S.hold === 0) pose = 'stand';
      } else if (st.type === 'jumpUp' || st.type === 'jumpDown') {
        const j = S.jump, up = st.type === 'jumpUp';
        // face the way it goes first, then crouch, spring, land
        const heading = Math.atan2(j.to.x - j.from.x, j.to.z - j.from.z);
        if (j.t <= -0.45 + 1e-6 && !turnTo(dt, heading)) { pose = 'stand'; S.speed = 0; }
        else {
          j.t += dt;
          if (j.t < 0) { pose = 'crouch'; S.pos.x = j.from.x; S.pos.z = j.from.z; S.pos.y = j.from.y; groundY = j.from.y; }
          else if (j.t < j.dur) {
            const u = j.t / j.dur;
            S.pos.x = lerp(j.from.x, j.to.x, u); S.pos.z = lerp(j.from.z, j.to.z, u);
            S.pos.y = lerp(j.from.y, j.to.y, u) + Math.sin(u * Math.PI) * j.peak * (up ? 1 : 1);
            pose = 'air'; ground = false;
            S.yaw = heading;
          } else if (j.t < j.dur + 0.4) { S.pos.x = j.to.x; S.pos.z = j.to.z; S.pos.y = j.to.y; groundY = j.to.y; pose = 'crouch'; }
          else { S.pos.x = j.to.x; S.pos.z = j.to.z; S.pos.y = j.to.y; S.jump = null; step = null; }
        }
      }
    }
    // smooth the walk amount and the phase
    cur.walk = lerp(cur.walk, walking ? 1 : 0, 1 - Math.exp(-dt * 8));
    if (walking || cur.walk > 0.05) S.phase += (S.speed / 118) * dt * 2.2 + (walking ? 0 : 0);
    cur.lookYaw = lerp(cur.lookYaw, lookYaw, 1 - Math.exp(-dt * 6));
    cur.scratchAmp = lerp(cur.scratchAmp, scratch, 1 - Math.exp(-dt * 5));
    placeRoot();
    applyPose(dt, POSE[pose] || POSE.stand, groundY, ground);
    shapeTail();
    if (!ground) { pelvis.position.y = 200 - 0; root.position.y = S.pos.y; }
    // in the scratch pose the paws reach the panel: solve the root's z once, from the posed paws
    if (scratchRootZ == null && S.mode === 'scratch' && ++S.frames > 6) solveScratch();
  }

  // Find where the root must stand so the front paws touch the panel: measured from the scratch pose itself, without the pulling sway and with the walk off.
  function solveScratch() {
    const keep = { ...cur };
    Object.assign(cur, POSE.scratch, { walk: 0, scratchAmp: 0 });
    S.yaw = SCRATCH_YAW; placeRoot();
    applyPose(0, POSE.scratch, 0, true);
    root.updateMatrixWorld(true);
    const reaches = front.map((L) => { const p = L.paw.getWorldPosition(new T.Vector3()); root.parent.worldToLocal(p); return root.position.z - p.z; });
    const reach = Math.max(...reaches);
    S.bias = reaches.map((r) => (reach - r) / 130 / D2R);   // turned 25° off the panel, the far arm needs to reach further: its shoulder swings forward by this many degrees
    Object.assign(cur, keep);
    scratchRootZ = PANEL.z + reach + 4;
  }

  // start already posed: settled, a few frames
  S.pos.z = 1660;
  const api = {
    group: root, update,
    // a fixed pose for screenshots and checks: state name, position and heading
    debug: { S, POSE, legs, front, hind, tail, torso, pelvis, head, setPlan(p) { S.mode = 'explore'; S.plan = p; step = null; }, get step() { return step; } }
  };
  return api;
}
