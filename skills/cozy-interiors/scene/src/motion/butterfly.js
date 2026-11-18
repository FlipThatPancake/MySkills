// @js:motion-butterfly — a butterfly (about 165 mm across, much larger than life so it reads from the home view; a slow, wide wing beat of 3 to 4.5 flaps a second) that comes in through the area's open window, wanders near it,
// now and then lands on a plant, a fruit bowl or the window sill and slowly opens and folds its wings, and after a while leaves the way it came. It keeps out of every solid
// (the area's boxes, padded) and the walls; it goes through only `ctx.via`, only while that opening is open wide enough, and waits outside (hidden) otherwise.
// Ported from the original kitchen's butterfly (the flap, glides and wandering are the same; the places are found in the area instead of listed). `sampled`: check-motion.mjs runs it.
import { paintCanvas } from '../kitchen/paint.js';
import { createFlight } from './flight.js';
const R = 84, SCALE = 1.8;   // the body's reach in mm, wings included (what the checks measure), and the model's scale: about 165 mm across, so it reads at the home view
export default {
  sampled: true,
  build(ctx) {
    const { T, kit, rnd, via } = ctx, g = kit.group();
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
    g.scale.setScalar(SCALE); g.rotation.order = 'YXZ';

    // ---- flight: the shared one (flight.js); the wings are this module's
    let phase = 0, ang = 1.2, glide = 0, nextGlide = rnd(1.5, 4), freq = 3.8, clock = 0;
    const flap = (dt, moving) => {
      clock += dt;
      if (moving) {
        nextGlide -= dt;
        if (nextGlide < 0) { glide = rnd(0.3, 0.6); nextGlide = rnd(1.5, 4) + glide; freq = rnd(3.2, 4.6); }
        if (glide > 0) { glide -= dt; ang += (0.55 - ang) * Math.min(1, 8 * dt); } else { phase += freq * 2 * Math.PI * dt; ang = 0.45 + 1.0 * Math.sin(phase); }
      } else { const s = 0.5 + 0.5 * Math.sin(clock * 2 * Math.PI / 1.8); ang += ((1.45 - 1.15 * s * s) - ang) * Math.min(1, 6 * dt); }
      pivots[0].rotation.z = ang; pivots[1].rotation.z = -ang;
    };
    return createFlight(ctx, g, { name: 'butterfly', R, pad: R + 14, perchR: 56, flap, v0: 250, v1: 90, vmax: 520, vIn: 220, wob: { xz: 50, y: [110, 45] } });
  },
};
