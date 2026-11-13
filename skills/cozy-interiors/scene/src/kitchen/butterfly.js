// @js:kitchen-butterfly — a small butterfly (about 80 mm across, larger than life so it reads from the wide view) that wanders round the window side of the kitchen.
// Two painted wings per side, flapping 6-9 times a second with short glides; now and then it lands on the plant, the fruit bowl or the window sill and slowly opens and folds its wings.
// Kitchen millimetres. It keeps out of every solid (the BOXES below, padded) and never goes past x 3000, so it cannot cover the oven in the front view.
// `update(dt, on)` runs once a frame, only while the kitchen is visible (view3d.js).
import { paintCanvas } from './paint.js';
import { LAMP } from './atmosphere.js';

// Solid things, [x0, x1, y0, y1, z0, z1]: the counters with what stands on them, the wall cabinets, the hood and the lamp with its cord.
const BOXES = [
  [-20, 3300, 0, 935, -600, 0], [-20, 610, 0, 935, 0, 1500],
  [140, 590, 900, 1300, 890, 1460],               // countertop oven
  [-20, 2400, 1450, 2200, -600, -270], [2400, 3300, 1500, 2250, -600, -90],
  [580, 1020, 900, 1270, -400, 70],               // plant
  [160, 520, 900, 1150, -460, -120],              // fruit bowl with its bananas
  [1730, 2070, 900, 1380, -600, -380],            // cutting board
  [2500, 2800, 900, 1010, -560, -150],            // pan
  [LAMP.X - 165, LAMP.X + 165, LAMP.RIM - 10, 3400, LAMP.Z - 165, LAMP.Z + 165]
];
const PAD = 55;
const BOUNDS = { x: [330, 3000], y: [1000, 2150], z: [-560, 1400] };   // x stops at 3000: the oven column starts at 3300
const SILL = { spot: [10, 1036, 750], pre: [360, 1050, 750] };          // in through the gap between the open sashes (z 668..832), along z 750

export function butterfly(kit, { plant, bowl }) {
  const T = kit.THREE, g = kit.group();
  // Wings: shapes in mm, x out from the body, y forward; laid flat, so the flap is a turn about the body's axis. Each wing's root is a straight edge along the body
  // (the thorax), not one point: triangular forewings with a rounded outer edge, smaller rounded hindwings with a tail lobe.
  const shapeOf = (draw) => { const s = new T.Shape(); draw(s); return s; };
  const fore = shapeOf((s) => { s.moveTo(0, 7); s.quadraticCurveTo(19, 19, 38, 22); s.bezierCurveTo(48, 16, 46, -6, 27, -14); s.lineTo(0, -3); s.closePath(); });
  const hind = shapeOf((s) => { s.moveTo(0, -3); s.bezierCurveTo(13, -5, 29, -10, 32, -22); s.bezierCurveTo(33, -30, 27, -33, 24, -42); s.bezierCurveTo(18, -36, 13, -32, 9, -30); s.bezierCurveTo(4, -26, 1, -20, 0, -14); s.closePath(); });
  // the wash, with a faint darker edge band and veins fanning from the root painted into the canvas
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
    const geo = new T.ShapeGeometry(shape, 12);
    geo.computeBoundingBox();
    const b = geo.boundingBox, pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - b.min.x) / (b.max.x - b.min.x), (pos.getY(i) - b.min.y) / (b.max.y - b.min.y));
    geo.rotateX(Math.PI / 2);   // flat: shape y becomes forward (+z)
    const m = new T.Mesh(geo, mat);
    m.position.y = dy;
    return kit.outline(m, { tone: 'mid', crease: 60 });
  };
  const pivots = [1, -1].map((side) => {
    const p = kit.group();
    p.position.set(side * 1.8, 0, 0);
    p.scale.x = side;
    p.add(wing(fore, wingMats[0], 0.3), wing(hind, wingMats[1], 0));
    g.add(p);
    return p;
  });
  g.add(kit.cyl(0, 0, 13, 1.8, 28, { axis: 'z', seg: 8, tone: 'lo' }));       // body
  g.add(kit.solid(new T.SphereGeometry(3, 10, 8), 0, 0.3, 5, { smooth: true, tone: 'lo' }));      // thorax, where the wings meet
  g.add(kit.solid(new T.SphereGeometry(2.6, 10, 8), 0, 0.4, 15.5, { smooth: true, tone: 'lo' }));  // head
  for (const side of [1, -1]) {   // two thin antennae with a small club at the end
    g.add(kit.lines([[side * 0.8, 1, 17], [side * 3.5, 4, 26], [side * 3.5, 4, 26], [side * 7, 6, 33]], 'lo'));
    g.add(kit.solid(new T.SphereGeometry(1.3, 8, 6), side * 7, 6, 33.6, { smooth: true, tone: 'mid' }));
  }
  g.scale.setScalar(0.9);
  g.rotation.order = 'YXZ';

  // --- flight
  let r = 5;
  const rnd = (a = 0, b = 1) => { r = (r * 9301 + 49297) % 233280; return a + (b - a) * r / 233280; };
  const pos = new T.Vector3(...SILL.spot), vel = new T.Vector3(), tgt = new T.Vector3(), tmp = new T.Vector3(), probe = new T.Vector3();
  const sites = [
    { name: 'plant', spot: plant, pre: [plant[0], plant[1] + 170, plant[2]] },
    { name: 'bowl', spot: bowl, pre: [bowl[0], bowl[1] + 170, bowl[2]] },
    { name: 'sill', spot: SILL.spot, pre: SILL.pre }
  ];
  const POI = [[800, 1500, -170, 350], [360, 1300, -330, 160], [LAMP.X, 1750, LAMP.Z, 380], [2600, 1300, -220, 350], [420, 1500, 750, 300], [1500, 1400, 500, 450], [1000, 1250, 700, 300]];
  const inBox = (p, pad) => BOXES.some(([x0, x1, y0, y1, z0, z1]) => p.x > x0 - pad && p.x < x1 + pad && p.y > y0 - pad && p.y < y1 + pad && p.z > z0 - pad && p.z < z1 + pad);
  // a straight line from a to b that stays out of every padded solid
  const clear = (a, b) => { for (let i = 1; i < 14; i++) if (inBox(probe.lerpVectors(a, b, i / 14), PAD)) return false; return true; };
  let best = 1e9, stuck = 0, blocked = 0;   // `blocked`: seconds left of climbing over what it just ran into
  const pick = () => {
    for (let i = 0; i < 12; i++) {
      const [x, y, z, rad] = POI[Math.floor(rnd(0, POI.length))];
      tgt.set(x + rnd(-rad, rad), y + rnd(-rad * 0.5, rad * 0.5), z + rnd(-rad, rad));
      tgt.x = Math.min(BOUNDS.x[1], Math.max(BOUNDS.x[0], tgt.x)); tgt.y = Math.min(BOUNDS.y[1], Math.max(BOUNDS.y[0], tgt.y)); tgt.z = Math.min(BOUNDS.z[1], Math.max(BOUNDS.z[0], tgt.z));
      if (!inBox(tgt, PAD + 20) && clear(pos, tgt)) { best = 1e9; stuck = 0; return; }
    }
    tgt.set(1500, 1750, 500); best = 1e9; stuck = 0;
  };
  const push = () => {   // out of any solid it is in, along the shortest way, losing the speed into it
    for (const [x0, x1, y0, y1, z0, z1] of BOXES) {
      if (!(pos.x > x0 - PAD && pos.x < x1 + PAD && pos.y > y0 - PAD && pos.y < y1 + PAD && pos.z > z0 - PAD && pos.z < z1 + PAD)) continue;
      const d = [pos.x - (x0 - PAD), (x1 + PAD) - pos.x, pos.y - (y0 - PAD), (y1 + PAD) - pos.y, pos.z - (z0 - PAD), (z1 + PAD) - pos.z];
      const k = d.indexOf(Math.min(...d)), ax = 'xyz'[k >> 1], dir = k & 1 ? 1 : -1;
      pos[ax] += dir * d[k]; if (vel[ax] * dir < 0) vel[ax] = 0;
      blocked = 0.4;
    }
    for (const ax of 'xyz') {
      const [lo, hi] = BOUNDS[ax];
      if (pos[ax] < lo) { pos[ax] = lo; vel[ax] = Math.max(vel[ax], 0); } else if (pos[ax] > hi) { pos[ax] = hi; vel[ax] = Math.min(vel[ax], 0); }
    }
  };
  let st = 'land', site = sites[2], timer = 2.5, legs = 0, ph = rnd(0, 6), phase = 0, ang = 1.2, glide = 0, nextGlide = rnd(1.5, 4), freq = 7.5, yaw = Math.PI / 2, clock = 0;
  const goSite = () => { site = sites[Math.floor(rnd(0, sites.length))]; tgt.set(...site.pre); st = 'to-pre'; };
  g.position.copy(pos); g.rotation.y = yaw;

  const flap = (dt, moving) => {
    if (moving) {
      nextGlide -= dt;
      if (nextGlide < 0) { glide = rnd(0.3, 0.6); nextGlide = rnd(1.5, 4) + glide; freq = rnd(6, 9); }
      if (glide > 0) { glide -= dt; ang += (0.55 - ang) * Math.min(1, 8 * dt); }
      else { phase += freq * 2 * Math.PI * dt; ang = 0.5 + 0.85 * Math.sin(phase); }
    } else {
      // landed: wings slowly open and fold, one cycle every ~1.8 s, mostly folded up (angle 1.45 = vertical)
      const s = 0.5 + 0.5 * Math.sin(clock * 2 * Math.PI / 1.8);
      ang += ((1.45 - 1.15 * s * s) - ang) * Math.min(1, 6 * dt);
    }
    pivots[0].rotation.z = ang; pivots[1].rotation.z = -ang;
  };

  return {
    group: g,
    update(dt, on = true) {
      g.visible = on;
      if (!on) return;
      dt = Math.min(dt, 0.05); clock += dt;
      if (st === 'land') {
        timer -= dt; flap(dt, false);
        if (timer <= 0) { st = 'takeoff'; tgt.set(...site.pre); vel.set(0, 90, 0); }
        g.position.copy(pos);
        return;
      }
      const toTgt = tmp.copy(tgt).sub(pos), dist = toTgt.length();
      if (st === 'fly') {
        // no nearer to the target for 3 s (sliding along a solid): choose another
        if (dist < best - 40) { best = dist; stuck = 0; } else if ((stuck += dt) > 3) pick();
        if (dist < 130) { if (++legs >= 3 + Math.floor(rnd(0, 3))) { legs = 0; goSite(); } else pick(); }
      } else if (st === 'to-pre') {
        if (dist < (site.name === 'sill' ? 35 : 70)) { st = 'to-spot'; tgt.set(...site.spot); }
      } else if (st === 'to-spot') {
        if (dist < 8) { pos.set(...site.spot); vel.set(0, 0, 0); st = 'land'; timer = rnd(3, 6); g.position.copy(pos); return; }
      } else if (st === 'takeoff') {
        if (dist < 45) { st = 'fly'; legs = 0; pick(); }
      }
      // steer: toward the target at 0.33-0.6 m/s with a lazy sideways and up-down wander, so it never goes in a straight line
      const slow = st === 'fly' ? 1 : st === 'to-spot' ? Math.min(1, dist / 120) * 0.6 + 0.35 : Math.min(1, 0.3 + dist / 260);   // slowing down on the way to a place to land
      const sp = (330 + 130 * (1 + Math.sin(clock * 0.9 + ph))) * slow;
      const want = toTgt.normalize().multiplyScalar(sp);
      if (st === 'fly' || st === 'to-pre' || st === 'takeoff') {
        const k = st === 'fly' ? 1 : Math.min(1, dist / 260);   // the wandering dies down as it closes on a place to land
        want.x += 66 * k * Math.sin(clock * 1.7 + ph); want.z += 66 * k * Math.cos(clock * 1.3 + ph * 2);
        want.y += k * (150 * Math.sin(clock * 2.3 + ph * 3) + 60 * Math.sin(clock * 5.1));   // the little jumps up and down
      }
      if (blocked > 0) { blocked -= dt; want.y += 420; }
      vel.lerp(want, Math.min(1, (st === 'fly' ? 2.2 : 4) * dt));
      if (vel.length() > 700) vel.setLength(700);
      pos.addScaledVector(vel, dt);
      if (st === 'fly' || st === 'to-pre') push();
      g.position.copy(pos);
      const hs = Math.hypot(vel.x, vel.z);
      if (hs > 40) { let d = Math.atan2(vel.x, vel.z) - yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); yaw += d * Math.min(1, 5 * dt); }
      g.rotation.set(-Math.atan2(vel.y, Math.max(hs, 80)) * 0.5, yaw, 0);
      flap(dt, true);
    },
    pivots, sites, bounds: BOUNDS,
    get state() { return st; }
  };
}
