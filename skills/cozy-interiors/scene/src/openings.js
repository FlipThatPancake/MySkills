// @js:openings — windows, doors and arches set into a wall, in the old kitchen's style: thick reveals, one extruded piece per frame, a view outside.
// opening(kit, { kind: 'window' | 'door' | 'arch', width, height, sill = 0 (window), hinge: 'l' | 'r' (door), open: leaf angle in degrees })
//   -> { group, hole }. Built in the wall's own frame: the wall face is x = 0, the room is +x, z runs along the wall, y is up, the opening is centred on z = 0.
//   `hole` is the outline [z, y] of the cut in the wall (set.js cuts it). Nothing here is a real light or a real view: the view outside and the daylight are painted.
import { canvasOf, sheet } from './sheet.js';

const rad = (d) => d * Math.PI / 180;
export const DEFAULTS = { window: { width: 1200, height: 1100, sill: 1000 }, door: { width: 900, height: 2050, sill: 0 }, arch: { width: 1100, height: 2250, sill: 0 } };

const archPts = (w, h, inset = 0, n = 18) => {   // rectangle with a half-round top: [z, y] from the floor
  const r = w / 2 - inset, top = h - inset - r, pts = [[-r, 0], [r, 0]];
  for (let i = 0; i <= n; i++) { const a = Math.PI * i / n; pts.push([r * Math.cos(a), top + r * Math.sin(a)]); }
  return pts;
};
const rectPts = (z0, y0, z1, y1) => [[z0, y0], [z1, y0], [z1, y1], [z0, y1]];

export function opening(kit, op) {
  const T = kit.THREE, d = DEFAULTS[op.kind], w = op.width ?? d.width, h = op.height ?? d.height, sill = op.sill ?? d.sill;
  const g = kit.group(), mid = { tone: 'mid' }, lo = { tone: 'lo' };
  // A flat outline [z, y] (with optional holes) extruded `len` mm along x from x0. Shape x is -z; a quarter turn about y puts it in world z.
  const ext = (pts, holes, x0, len, opts = mid) => {
    const sh = new T.Shape(pts.map(([z, y]) => new T.Vector2(-z, y)));
    (holes || []).forEach((hp) => sh.holes.push(new T.Path(hp.map(([z, y]) => new T.Vector2(-z, y)))));
    const m = kit.solid(new T.ExtrudeGeometry(sh, { depth: len, bevelEnabled: false }), x0, 0, 0, opts);
    m.rotation.y = Math.PI / 2; m.position.set(x0, 0, 0);
    return m;
  };
  const Z0 = -w / 2, Z1 = w / 2, Y0 = op.kind === 'window' ? sill : 0, Y1 = Y0 + h;
  let hole;

  // What is seen through the opening, at the back of the reveal: a pale gradient wall, and (door, arch) a floor running away behind it.
  const beyond = (depth, wide, tall, floorFrom) => {
    const c = canvasOf(160, 128), cg = c.getContext('2d'), gr = cg.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, '#e7ebee'); gr.addColorStop(0.6, '#f4f6f7'); gr.addColorStop(1, '#fbfbfa');
    cg.fillStyle = gr; cg.fillRect(0, 0, 160, 128);
    const back = sheet(kit, c, wide, tall, true);
    back.rotation.y = Math.PI / 2; back.position.set(-depth, floorFrom + tall / 2, 0);
    g.add(back);
    if (floorFrom === 0) {   // the floor beyond: a soft white strip that melts away
      const fc = canvasOf(128, 8), fg = fc.getContext('2d'), gr2 = fg.createLinearGradient(0, 0, 128, 0);
      gr2.addColorStop(0, 'rgba(255,255,255,0)'); gr2.addColorStop(1, 'rgba(255,255,255,0.95)');
      fg.fillStyle = gr2; fg.fillRect(0, 0, 128, 8);
      const fl = sheet(kit, fc, 1800, wide, true);   // along x (out from the wall) by the opening's width; near end opaque, far end gone
      fl.rotation.x = -Math.PI / 2; fl.position.set(-depth - 900, 1, 0);
      g.add(fl);
    }
  };

  if (op.kind === 'window') {
    const DEPTH = 120, L = 6, STOOL = Y0 + 30, XB = -DEPTH;
    hole = rectPts(Z0, Y0, Z1, Y1);
    // sky and garden at the back of the reveal
    const c = canvasOf(160, 128), cg = c.getContext('2d'), gr = cg.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, '#e4edf6'); gr.addColorStop(0.55, '#f6f9fc'); gr.addColorStop(1, '#ffffff');
    cg.fillStyle = gr; cg.fillRect(0, 0, 160, 128);
    cg.fillStyle = '#e6e9e8'; cg.beginPath(); cg.moveTo(30, 100); cg.lineTo(60, 78); cg.lineTo(120, 78); cg.lineTo(135, 100); cg.fill();   // far roof
    cg.fillStyle = '#e3e9e1'; for (let i = 0; i < 14; i++) { cg.beginPath(); cg.arc(i * 12 + 4, 112 + (i % 3) * 3, 14 + (i % 4) * 3, 0, 6.3); cg.fill(); }   // hedge
    const sky = sheet(kit, c, w, h, true);
    sky.rotation.y = Math.PI / 2; sky.position.set(XB, (Y0 + Y1) / 2, 0);
    g.add(sky);
    g.add(ext(rectPts(Z0, Y0, Z1, Y1), [rectPts(Z0 + L, Y0 + L, Z1 - L, Y1 - L)], XB, DEPTH));   // the reveal: a tunnel through the wall, 6 mm linings
    const CW = 50;   // surround casing: an upside-down U, 50 mm wide, 12 mm proud
    g.add(ext([[Z0 - CW, STOOL], [Z0 - CW, Y1 + CW], [Z1 + CW, Y1 + CW], [Z1 + CW, STOOL], [Z1, STOOL], [Z1, Y1], [Z0, Y1], [Z0, STOOL]], null, 0, 12));
    g.add(kit.box(XB, STOOL - 30, Z1 + 70, DEPTH + 40, 30, w + 140, mid));          // the sill (stool), 40 mm into the room
    g.add(kit.box(0, STOOL - 90, Z1 + 40, 11, 60, w + 80, mid));                      // the apron under it
    const FW = 44, fy0 = STOOL, fy1 = Y1 - L, fz0 = Z0 + L, fz1 = Z1 - L, XF = -50;   // the frame: one ring, set 50 mm back
    g.add(ext(rectPts(fz0, fy0, fz1, fy1), [rectPts(fz0 + FW, fy0 + FW, fz1 - FW, fy1 - FW)], XF - 45, 45));
    // two sashes meeting in the middle, 2 x 3 panes each, hinged at the outer sides and ajar inward
    const iz0 = fz0 + FW, iz1 = fz1 - FW, iy0 = fy0 + FW, iy1 = fy1 - FW, W = (iz1 - iz0) / 2 - 2, SD = 30, ST = 34, BAR = 20;
    const cw = (W - 2 * ST - BAR) / 2, rh = (iy1 - iy0 - 2 * ST - 2 * BAR) / 3, ajar = op.open ?? 26;
    const sash = (hinge, dir) => {
      const p = kit.group(), Zs = (u) => dir * u, panes = [];
      for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) {
        const u0 = ST + i * (cw + BAR), y0 = iy0 + ST + j * (rh + BAR);
        panes.push(rectPts(Math.min(Zs(u0), Zs(u0 + cw)), y0, Math.max(Zs(u0), Zs(u0 + cw)), y0 + rh));
      }
      p.add(ext(rectPts(Math.min(0, Zs(W)), iy0, Math.max(0, Zs(W)), iy1), panes, -SD / 2, SD));
      [iy0 + 110, iy1 - 190].forEach((y) => {   // two hinge leaves and pins on the room side of the hinge stile
        p.add(kit.box(SD / 2, y, Math.max(Zs(8), Zs(26)), 2.5, 80, 18, lo));
        p.add(kit.cyl(SD / 2 + 3, y, Zs(17), 3.5, 80, { seg: 10, ...lo }));
      });
      p.position.set(XF - 22, 0, hinge); p.rotation.y = dir * rad(ajar);
      return p;
    };
    const sA = sash(iz0, 1), sB = sash(iz1, -1);
    sA.add(kit.rbox(SD / 2, (iy0 + iy1) / 2 - 30, W - ST / 2 - 8, 16, 60, 2.5, 4, lo));   // latch plate and lever on the free stile
    sA.add(kit.cyl(SD / 2 + 2.5, (iy0 + iy1) / 2, W - ST / 2 - 2, 3, 28, { axis: 'z', seg: 10, ...lo }));
    g.add(sA, sB);
    // daylight: a soft warm patch on the floor inside, rays going +x and down at 35 degrees
    const tan = 0.7, drift = 0.2, x0 = (Y0 - 0) / tan, x1 = Math.min((Y1 - 0) / tan, 2800), pad = 120, k = 0.1, PW = x1 - x0 + 2 * pad, PH = w + 2 * pad + drift * x1;
    const cv = canvasOf(PW * k, PH * k), q = cv.getContext('2d');
    q.filter = 'blur(11px)'; q.fillStyle = 'rgba(255,238,200,0.2)';
    q.beginPath(); q.moveTo(pad * k, pad * k); q.lineTo((pad + x1 - x0) * k, (pad + drift * (x1 - x0)) * k); q.lineTo((pad + x1 - x0) * k, (pad + w + drift * (x1 - x0)) * k); q.lineTo(pad * k, (pad + w) * k); q.closePath(); q.fill();
    const patch = sheet(kit, cv, PW, PH, true);
    patch.rotation.x = -Math.PI / 2; patch.position.set((x0 + x1) / 2, 1.5, drift * (x1 - x0) / 2);
    g.add(patch);
  } else if (op.kind === 'door') {
    const DEPTH = 120, L = 16, CW = 70, hinge = op.hinge === 'l' ? -1 : 1, ajar = op.open ?? 28;
    hole = rectPts(Z0, 0, Z1, Y1);
    beyond(DEPTH, w, h, 0);
    g.add(ext(rectPts(Z0, 0, Z1, Y1), [rectPts(Z0 + L, 0, Z1 - L, Y1 - L)], -DEPTH, DEPTH));   // the reveal with a 16 mm lining and a head
    g.add(ext([[Z0 - CW, 0], [Z0 - CW, Y1 + CW], [Z1 + CW, Y1 + CW], [Z1 + CW, 0], [Z1, 0], [Z1, Y1], [Z0, Y1], [Z0, 0]], null, 0, 14));   // casing, 14 mm proud
    g.add(kit.box(-DEPTH, 0, Z1 + CW, DEPTH + 14, 14, w + 2 * CW, lo));                          // the threshold
    // the leaf, hinged at one jamb, set back in the reveal and ajar into the room
    const Lw = w - 2 * L - 6, hh = Y1 - L - 14, leaf = kit.group(), sgn = hinge;
    const lz0 = sgn > 0 ? -Lw : 0;   // the leaf runs from the hinge along -z (hinge on the +z jamb) or +z
    leaf.add(kit.box(-20, 14, lz0 + Lw, 40, hh, Lw));
    const lines = [], inset = 60, pz0 = lz0 + inset, pz1 = lz0 + Lw - inset, face = 20.4;   // two recessed panels drawn as lines on the room face
    for (const [a, b] of [[14 + 120, 14 + hh * 0.46], [14 + hh * 0.54, 14 + hh - 120]]) lines.push([face, a, pz0], [face, a, pz1], [face, a, pz1], [face, b, pz1], [face, b, pz1], [face, b, pz0], [face, b, pz0], [face, a, pz0]);
    leaf.add(kit.lines(lines));
    const knobZ = sgn > 0 ? lz0 + 70 : lz0 + Lw - 70;
    leaf.add(kit.cyl(20, 1000, knobZ, 22, 4, { axis: 'x', seg: 20, ...lo }), kit.cyl(24, 1000, knobZ, 12, 40, { axis: 'x', seg: 16, ...lo }));   // a rose and a round knob
    const pivot = kit.group(); pivot.add(leaf);
    pivot.position.set(-60, 0, sgn > 0 ? Z1 - L - 3 : Z0 + L + 3);
    pivot.rotation.y = -sgn * rad(ajar);   // tip toward +x
    g.add(pivot);
  } else {   // arch
    const DEPTH = op.depth ?? 200, ring = 40;
    hole = archPts(w, h);
    beyond(DEPTH, w, h, 0);
    g.add(ext(archPts(w, h), [archPts(w, h, 6)], -DEPTH, DEPTH));   // a deep reveal with a 6 mm lining
    // a slim architrave round the arch, 10 mm proud: its outer outline is the arch grown by `ring`
    const R = w / 2 + ring, r = w / 2, arc = (rr, top) => Array.from({ length: 19 }, (_, i) => { const a = Math.PI * (1 - i / 18); return [rr * Math.cos(a), top + rr * Math.sin(a)]; });
    g.add(ext([[-R, 0], ...arc(R, h + ring - R), [R, 0], [r, 0], ...arc(r, h - r).reverse(), [-r, 0]], null, 0, 10));
  }
  return { group: g, hole, width: w, height: h, sill: Y0 };
}
