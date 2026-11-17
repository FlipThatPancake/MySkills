// @js:motion-bee — a honeybee (about 40 mm long, larger than life so it reads from the wide view) that buzzes in through the area's open window, darts about in short quick legs with a
// fast jitter, hovers to land on a plant, a fruit bowl or the window sill for a few seconds, and leaves again. Its flight is the shared one (flight.js) with a faster, twitchier tune.
// Body: furry thorax, striped abdomen with a sting, head with eyes and antennae, two pairs of clear wings that beat too fast to see (blurred wing pair) and fold when it rests.
import { paintCanvas } from '../kitchen/paint.js';
import { createFlight } from './flight.js';
const R = 28;   // the body's reach in mm, wings included
export default {
  sampled: true,
  build(ctx) {
    const { T, kit, rnd, via } = ctx, g = kit.group();
    if (!via) return { error: 'bee: no opening to come through', update() {} };
    const stripes = (seed) => {   // gold and brown bands along the abdomen (v runs along the body axis)
      const c = document.createElement('canvas'); c.width = 32; c.height = 128; const q = c.getContext('2d');
      q.fillStyle = '#f6f3ea'; q.fillRect(0, 0, 32, 128);
      const bands = [[0, 0.12, [236, 196, 70]], [0.12, 0.3, [96, 72, 44]], [0.3, 0.5, [236, 196, 70]], [0.5, 0.7, [96, 72, 44]], [0.7, 0.88, [236, 196, 70]], [0.88, 1, [96, 72, 44]]];
      for (const [a, b, [r, gg, bl]] of bands) { q.fillStyle = `rgba(${r},${gg},${bl},0.78)`; q.fillRect(0, a * 128, 32, (b - a) * 128 + 1); }
      return c;
    };
    const ball = (rx, ry, rz, z, mat, y = 0) => {   // an ellipsoid along z (the sphere's poles run along the body)
      const geo = new T.SphereGeometry(1, 16, 12); geo.rotateX(Math.PI / 2); geo.scale(rx, ry, rz);
      const m = new T.Mesh(geo, mat); m.position.set(0, y, z); return kit.outline(m, { tone: 'mid', crease: 50, smooth: true });
    };
    const gold = kit.paint(paintCanvas({ size: 64, wash: [[226, 176, 64], [214, 160, 56]], seed: 21, strokes: 40, blotches: 6, strength: 0.7 }));
    const band = kit.paint(stripes(3));
    const dark = kit.paint(paintCanvas({ size: 64, wash: [[70, 54, 36], [58, 44, 30]], seed: 22, strokes: 20, blotches: 4, strength: 0.8 }));
    g.add(ball(7.5, 7, 8.5, 5, gold), ball(7.2, 7, 13, -10.5, band), ball(5.2, 5, 5, 15.5, dark, -0.5));
    g.add(kit.solid(new T.ConeGeometry(1.1, 5, 6).rotateX(-Math.PI / 2), 0, 0, -26, { tone: 'lo' }));   // the sting
    for (const s of [1, -1]) {
      g.add(kit.solid(new T.SphereGeometry(2.3, 8, 6), s * 3.6, 1.6, 17, { smooth: true, tone: 'lo' }));   // eyes
      g.add(kit.lines([[s * 1, 3, 19.5], [s * 4, 7, 25], [s * 4, 7, 25], [s * 7, 8, 28]], 'lo'));         // antennae
      for (const [z, sp] of [[8, 5], [3, 8], [-1, 9]]) g.add(kit.lines([[s * 4, -5, z], [s * (4 + sp * 0.6), -9, z - 2], [s * (4 + sp * 0.6), -9, z - 2], [s * (4 + sp), -12, z - 6]], 'lo'));   // legs
    }
    const wingShape = (len, wid) => { const s = new T.Shape(); s.moveTo(0, 0); s.bezierCurveTo(len * 0.3, wid * 0.9, len * 0.85, wid * 0.8, len, 0); s.bezierCurveTo(len * 0.85, -wid * 0.45, len * 0.3, -wid * 0.3, 0, 0); return s; };
    const glass = kit.paint(paintCanvas({ size: 64, wash: [[200, 218, 232], [214, 226, 236]], seed: 23, strokes: 8, blotches: 3, strength: 0.35 }), true);
    const wingMesh = (len, wid, rotY) => {   // lies flat, root at the origin, tip out along +x
      const geo = new T.ShapeGeometry(wingShape(len, wid), 10); geo.computeBoundingBox(); const b = geo.boundingBox, pos = geo.attributes.position, uv = geo.attributes.uv;
      for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - b.min.x) / (b.max.x - b.min.x), (pos.getY(i) - b.min.y) / (b.max.y - b.min.y));
      geo.rotateX(Math.PI / 2); geo.rotateY(rotY); return kit.outline(new T.Mesh(geo, glass), { tone: 'lo', crease: 60 });
    };
    const pivots = [1, -1].map((side) => { const p = kit.group(); p.position.set(side * 2.5, 6.5, 6); p.scale.x = side; p.add(wingMesh(26, 9, 0.35), wingMesh(18, 6, 0.9)); g.add(p); return p; });
    g.rotation.order = 'YXZ';

    // ---- flight: the shared one, quick and jittery; the wings beat at a rate the frame step cannot follow, so they only seem to blur
    let phase = rnd(0, 6), clock = 0, rest = 0;
    const flap = (dt, moving) => {
      clock += dt;
      if (moving) { phase += 2 * Math.PI * (36 + 6 * Math.sin(clock * 3)) * dt; rest = 0.15; pivots[0].rotation.z = 0.55 * Math.sin(phase) + 0.25; }
      else { rest += (0.02 - rest) * Math.min(1, 6 * dt); pivots[0].rotation.z = 0.04 + 0.03 * Math.sin(clock * 9) + rest * 0.2; }
      pivots[1].rotation.z = -pivots[0].rotation.z;
    };
    return createFlight(ctx, g, {
      name: 'bee', R, pad: 42, flap, v0: 480, v1: 260, vmax: 1100, vIn: 420, turn: 4.5, wob: { xz: 150, y: [110, 90], f: [5.3, 4.1, 6.7, 13] },
      pre: 110, reach: 55, sillReach: 30, legReach: 100, sill: { dn: 22, up: 30, preDn: 280, preUp: 45 },
      t: { first: [1, 3], away: [10, 20], perch: [2, 4.5], leave: [2, 3.5], visit: 40 },
      orient: (gr, vel, yaw, hs) => gr.rotation.set(-Math.atan2(vel.y, Math.max(hs, 80)) * 0.5 - 0.3, yaw, 0),
    });
  },
};
