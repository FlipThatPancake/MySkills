// @js:motion-bird — a small songbird (sparrow-like, about 200 mm from beak to tail, wingspan 340 mm: larger than life so it reads from the wide view) that flies in through the area's open window
// (a wide one: it needs a gap of 290 mm), wanders the room in smooth bounding flight, lands on the sill or on top of a wardrobe, cabinet, shelf or chest, looks about, and leaves again.
// Built from the reference photos in references/birds/songbird/: round head, short conical beak, teardrop body, fan tail, broad wings with fingered primaries and a bend at the wrist.
// The flap: the shoulder lifts and drops the whole wing, the wrist lags it so the hand folds back on the upstroke, the wing twists leading-edge-down on the downstroke, the body bobs against it.
// A flight burst of flaps is followed by a short glide with wings spread. Landing: wings up and beating fast, tail fanned and down, feet forward. Perched: wings folded along the back, head turning,
// tail flicking. The flight itself is the shared one (flight.js). `sampled`: check-motion.mjs runs it.
import { paintCanvas } from '../kitchen/paint.js';
import { createFlight } from './flight.js';
const R = 125, RP = 62, SPAN = 205;   // reach in mm (wings included) while flying and while perched
const TOPS = ['wardrobe', 'glazedCabinet', 'readShelf', 'shelf', 'sideboard', 'chestOfDrawers', 'fridge', 'console'];   // flat tops a bird may stand on
export default {
  sampled: true,
  build(ctx) {
    const { T, kit, rnd, via } = ctx, g = kit.group(), rig = kit.group();
    if (!via) return { error: 'bird: no opening to come through', update() {} };
    g.add(rig);
    const mat = (wash, seed, strokes = 30, strength = 0.8, dbl = false) => kit.paint(paintCanvas({ size: 96, wash, seed, strokes, blotches: 7, strength }), dbl);
    const back = mat([[148, 110, 74], [160, 122, 84], [226, 214, 194], [240, 232, 216]], 31), cap = mat([[128, 118, 108], [150, 112, 76], [232, 222, 204], [240, 232, 216]], 32, 18),
      wingM = mat([[176, 138, 96], [150, 112, 76]], 33, 60, 0.75, true), tailM = mat([[150, 116, 82], [128, 96, 66]], 34, 40, 0.75, true), bibM = mat([[70, 58, 48], [60, 50, 42]], 35, 10, 0.9),
      horn = mat([[204, 172, 122], [186, 152, 104]], 36, 6, 0.8), eyeM = mat([[34, 30, 28], [30, 26, 24]], 37, 2, 0.95);
    const ball = (rx, ry, rz, p, m, parent = rig) => { const geo = new T.SphereGeometry(1, 18, 14); geo.scale(rx, ry, rz); const o = new T.Mesh(geo, m); o.position.set(...p); parent.add(kit.outline(o, { tone: 'mid', crease: 50, smooth: true })); return o; };
    ball(28, 27, 52, [0, 0, 0], back);                       // body (poles up: the canvas runs brown back to cream belly)
    ball(12, 10, 11, [0, 4, 42], bibM);                      // dark bib on the chest
    const neck = kit.group(); neck.position.set(0, 12, 36); rig.add(neck);
    ball(19, 18.5, 20, [0, 8, 10], cap, neck);               // head
    for (const s of [1, -1]) ball(3.2, 3.2, 3.2, [s * 13.5, 12, 18], eyeM, neck);
    const beak = new T.Mesh(new T.ConeGeometry(6.4, 16, 10).rotateX(Math.PI / 2), horn); beak.position.set(0, 6, 36); neck.add(kit.outline(beak, { tone: 'lo', crease: 50 }));
    // tail: a long wedge with a shallow notch, hinged at the rump
    const tailShape = new T.Shape(); [[-11, 0], [11, 0], [19, -72], [7, -80], [0, -74], [-7, -80], [-19, -72]].forEach(([x, y], i) => (i ? tailShape.lineTo(x, y) : tailShape.moveTo(x, y)));
    const tail = kit.group(); tail.position.set(0, 3, -44);
    { const geo = new T.ShapeGeometry(tailShape, 4); geo.computeBoundingBox(); const b = geo.boundingBox, pos = geo.attributes.position, uv = geo.attributes.uv;
      for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - b.min.x) / (b.max.x - b.min.x), (pos.getY(i) - b.min.y) / (b.max.y - b.min.y));
      geo.rotateX(Math.PI / 2); tail.add(kit.outline(new T.Mesh(geo, tailM), { tone: 'mid', crease: 60 })); }
    tail.add(kit.lines([[0, 0, -8], [0, 0, -72], [0, 0, -8], [-11, 0, -70], [0, 0, -8], [11, 0, -70]], 'lo'));
    rig.add(tail);
    // wings: an inner part (arm) and an outer part (hand with five fingered primaries), hinged at the wrist; the shape runs along x, the front edge toward +z
    const flat = (pts, m) => {
      const s = new T.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
      const geo = new T.ShapeGeometry(s, 4); geo.computeBoundingBox(); const b = geo.boundingBox, pos = geo.attributes.position, uv = geo.attributes.uv;
      for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - b.min.x) / (b.max.x - b.min.x), (pos.getY(i) - b.min.y) / (b.max.y - b.min.y));
      geo.rotateX(Math.PI / 2); return kit.outline(new T.Mesh(geo, m), { tone: 'mid', crease: 60 });
    };
    const arm = [[0, 14], [34, 22], [64, 18], [64, -52], [48, -46], [32, -52], [16, -46], [0, -42]];
    const hand = [[0, 18], [30, 14], [62, 4], [92, -10], [87, -18], [76, -15], [78, -27], [64, -23], [64, -37], [50, -31], [48, -47], [34, -40], [28, -52], [0, -52]];
    const pivots = [1, -1].map((side) => {
      const box = kit.group(); box.position.set(side * 17, 14, 16); box.scale.x = side;
      const p = kit.group(); p.rotation.order = 'YZX'; const w = kit.group(), outer = kit.group(); outer.position.x = 64; outer.rotation.order = 'YZX';
      const tip = new T.Object3D(); tip.position.set(92, 0, -10); outer.add(tip);   // the wing tip: check-motion measures a sphere here
      w.add(flat(arm, wingM)); outer.add(flat(hand, wingM)); outer.add(kit.lines([[66, -14, 0], [38, -48, 0], [66, 0, 0], [60, -28, 0]].map(([x, z, y]) => [x - 64, y, z]), 'lo')); w.add(outer); p.add(w); box.add(p); rig.add(box);
      return { p, w, outer, box, side, tip };
    });
    // feet and legs (hang below the body when perched or landing; tucked away in flight)
    const feet = kit.group(); for (const s of [1, -1]) feet.add(kit.lines([[s * 10, -22, 4], [s * 10, -46, 10], [s * 10, -46, 10], [s * 10, -50, 20], [s * 10, -46, 10], [s * 15, -50, 18], [s * 10, -46, 10], [s * 5, -50, 18]], 'lo'));
    rig.add(feet);
    g.rotation.order = 'YXZ';

    // ---- pose, eased from state to state
    const P = { fold: 1, amp: 0, mid: 0.1, tail: 0, fan: 0, legs: 1, nose: 0, look: 0 };   // fold 1 wings shut .. 0 open; amp flap amplitude; legs 1 out
    let phase = rnd(0, 6), burst = rnd(0.6, 1.2), glideT = 0, clock = 0, lookTo = 0, lookT = rnd(0.5, 1.5), flickT = rnd(1, 3), flick = 0, hold = 0;
    const ease = (k, to, dt, rate = 8) => { P[k] += (to - P[k]) * Math.min(1, rate * dt); };
    const flap = (dt, moving, st) => {
      clock += dt;
      let freq = 0, rate = 8, tgt;
      if (!moving) {   // perched
        tgt = { fold: 1, amp: 0, mid: 0.1, tail: -0.35, fan: 0, legs: 1, nose: 0.55 };
        lookT -= dt; if (lookT <= 0) { lookTo = (rnd() - 0.5) * 1.5; lookT = rnd(0.6, 2.2); }
        flickT -= dt; if (flickT <= 0) { flick = 1; flickT = rnd(1.5, 4); } flick = Math.max(0, flick - dt * 3);
        P.look += (lookTo - P.look) * Math.min(1, 9 * dt);
      } else if (st === 'to-spot') { tgt = { fold: 0, amp: 1.1, mid: 0.5, tail: -0.5, fan: 1, legs: 1, nose: 0.5 }; freq = 9.5; rate = 10; }
      else if (st === 'takeoff') { tgt = { fold: 0, amp: 1.15, mid: 0.4, tail: -0.2, fan: 0.6, legs: 0.6, nose: 0.3 }; freq = 9; rate = 10; }
      else {
        const tight = st === 'enter' || st === 'out' ? 0.3 : 1;   // through the window the wings are swept back and held in (the open gap is narrower than the span)
        if (tight < 1) { tgt = { fold: 0.85, amp: 0.3, mid: 0.1, tail: -0.2, fan: 0.2, legs: 0, nose: 0 }; freq = 6; rate = 10; }
        else if (glideT > 0) { glideT -= dt; tgt = { fold: 0, amp: 0.05, mid: 0.2, tail: -0.1, fan: 0.4, legs: 0, nose: 0 }; if (glideT <= 0) burst = rnd(0.7, 1.4); }
        else { burst -= dt; freq = 7 + 1.2 * Math.sin(clock * 0.8); tgt = { fold: 0, amp: 0.8, mid: 0.1, tail: -0.2, fan: 0.35, legs: 0, nose: 0 }; if (burst <= 0) glideT = rnd(0.18, 0.3); }
        P.look += (0 - P.look) * Math.min(1, 6 * dt);
      }
      for (const k of Object.keys(tgt)) ease(k, tgt[k], dt, k === 'fold' ? (rate > 8 ? 12 : 7) : rate);
      phase += freq * 2 * Math.PI * dt;
      const s = Math.sin(phase), open = 1 - P.fold, sh = P.mid + P.amp * 0.85 * s + 0.9 * flick * P.fold * 0.2;
      for (const { p, w, outer, box, side } of pivots) {
        box.position.set(side * (17 + 12 * P.fold), 14 + 7 * P.fold, 16 - 3 * P.fold);   // folded, the wing lies on the flank, outside the body
        p.rotation.set(0.28 * P.amp * Math.cos(phase) * open - 1.25 * P.fold, 1.5 * P.fold, sh * open);   // twist about the span (on its edge, hanging down the flank, when folded), sweep back when folded, shoulder up and down
        w.scale.set(1 - 0.4 * P.fold, 1, 1 - 0.42 * P.fold);
        outer.rotation.set(0, 0, 0.5 * P.amp * Math.sin(phase - 1.1) * open - 0.12 * open);              // the hand lags the arm and folds back on the upstroke
      }
      tail.rotation.x = P.tail + 0.08 * Math.sin(phase * 2) * open + (P.fold ? 0.12 * flick : 0); tail.scale.x = 1 + 0.45 * P.fan;
      feet.visible = P.legs > 0.25; feet.scale.setScalar(Math.max(0.01, P.legs));
      neck.rotation.set(0, P.look, 0);
      rig.position.y = 5 * P.amp * -Math.sin(phase - 0.5) * open; rig.rotation.x = -P.nose + 0.05 * P.amp * Math.sin(phase - 0.5) * open;
      if (!moving || st === 'to-spot') g.rotation.x += ((st === 'to-spot' ? -0.15 : 0) - g.rotation.x) * Math.min(1, 8 * dt);   // level out for the landing and the perch
    };

    const wp = new T.Vector3();
    // ---- places to stand: the flat tops of wardrobes, cabinets, shelves and chests, and the sill (flight.js adds that)
    const sites = ({ free, room, objects, solids, T: TT }) => {
      // landing flutter reaches the wing span. A wall nearer than that is allowed when it is the only one and the bird faces it (the wings then spread along it): the site's `face`; two near walls or one closer than 80 mm rule the spot out
      const wallsNear = (x, z) => ctx.walls.map(({ W }) => ({ W, s: -((x - W.to[0]) * W.d[0] + (z - W.to[1]) * W.d[1]), dn: (x - W.to[0]) * W.n[0] + (z - W.to[1]) * W.n[1] })).filter(({ W, s, dn }) => s > -SPAN && s < W.len + SPAN && dn < SPAN + 10);
      const faceAt = (x, z) => { const w = wallsNear(x, z); if (!w.length) return null; return w.length === 1 && w[0].dn >= 80 ? [-w[0].W.n[0], -w[0].W.n[1]] : undefined; };
      const out = [];
      for (const o of objects) {
        if (!TOPS.includes(o.asset)) continue;
        const b = o.box, w = b.max.x - b.min.x, d = b.max.z - b.min.z, top = b.max.y;
        if (w < 240 || d < 240 || top < 700 || top + 110 > room.ymax) continue;
        for (let i = 0; i < 3; i++) {
          const x = (b.min.x + b.max.x) / 2 + (rnd() - 0.5) * (w - 200), z = (b.min.z + b.max.z) / 2 + (rnd() - 0.5) * (d - 200);
          const spot = new TT.Vector3(x, top + 46, z), pre = new TT.Vector3(x, top + 150, z);
          const clear = (p, pad) => !solids.some((s) => s.id !== o.id && p.x > s.box.min.x - pad && p.x < s.box.max.x + pad && p.y > s.box.min.y - pad && p.y < s.box.max.y + pad && p.z > s.box.min.z - pad && p.z < s.box.max.z + pad);
          const face = faceAt(x, z);
          if (face !== undefined && clear(spot, RP + 8) && clear(pre, SPAN) && free(pre, SPAN) && x > room.x0 + RP && x < room.x1 - RP && z > room.z0 + RP && z < room.z1 - RP) { out.push({ name: o.id, perch: o.id, spot, pre, ...(face ? { face } : {}) }); break; }
        }
      }
      return out;
    };
    return createFlight(ctx, g, {
      name: 'bird', R, span: SPAN, perchR: RP, pad: SPAN,
      extra: () => { g.updateMatrixWorld(true); return pivots.map(({ tip }) => ({ c: tip.getWorldPosition(wp).toArray(), r: 30 })); }, flap, sites, pre: 150, v0: 430, v1: 140, vmax: 900, vIn: 480, turn: 1.7, wob: { xz: 45, y: [70, 30], f: [0.9, 0.7, 1.3, 2.9] },
      reach: 80, sillReach: 40, legReach: 160, sill: { dn: 130, up: 50, preDn: 520, preUp: 110 }, t: { first: [2, 5], away: [18, 34], perch: [5, 11], leave: [3, 5], visit: 70 },
      orient: (gr, vel, yaw, hs) => gr.rotation.set(-Math.atan2(vel.y, Math.max(hs, 80)) * 0.7 - 0.05, yaw, 0),
    });
  },
};
