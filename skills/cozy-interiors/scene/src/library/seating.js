// @js:library-seating — sofa and armchair as one generator on the shared parts: legs, arms and soft cushions chosen by parameters (the space is in meta.js: armchair and sofa).
// Origin: middle of the footprint on the floor, back at -z. Params: seats (size), seatN (seat cushions: 1 bench, 2, 3), w, d, legs, arms, legH, backH, back 'loose' (a cushion per seat leaning on a frame) | 'tight' (one stuffed back) | 'fixed' (a firm upholstered back with a roll on top), piping, tone.
// An armchair without arms becomes a slipper chair: a tall puffy shaped back.
import { legs as legParts, arms as armParts } from './parts.js';
import { softBox, pillowGeometry } from './soft.js';
const DEG = Math.PI / 180;
function seat(kit, { seats, seatN, w, d, arms: arm = 'track', armW, legs = 'tapered', legH = 110, backH = 820, back = 'loose', piping = 'none', tone = 'mid' }) {
  const g = kit.group(), baseH = 140, y0 = legH + baseH, aw = arm === 'none' ? 0 : armW, inner = w - 2 * aw, n = seatN ?? seats, cw = inner / n, pts = [], slipper = seats === 1 && arm === 'none';
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) pts.push([sx * (w / 2 - 70), sz * (d / 2 - 70)]);
  g.add(legParts(kit, legs, pts, legH + 6, { r: seats === 1 ? 24 : 28, out: [0, 0] }));
  g.add(kit.rbox(-w / 2, legH, d / 2, w, baseH, d, slipper ? 50 : 14));                                  // the base
  g.add(armParts(kit, arm, { w, d, y0: legH + baseH * 0.5, top: legH + 540, armW: aw }));
  const rawBack = Math.max(backH - y0, 300), tightBack = back === 'tight' || back === 'fixed' || slipper;
  if (slipper) {   // a tall back that curves: a pillow shape, pinched at the seam, leaning
    const hb = rawBack + 140, b = kit.solid(pillowGeometry(kit.THREE, { w: w - 20, h: hb, thick: 260, edge: 150, n: 30 }), 0, 0, 0, { smooth: true, tone }); b.position.set(0, y0 + hb / 2 - 30, -d / 2 + 130); b.rotation.x = -9 * DEG; g.add(b);
  } else if (back === 'tight') {
    const b = softBox(kit, inner - 6, rawBack, 170, { r: 70, bulge: 26, piping, tone }); b.position.set(0, y0 + rawBack / 2, -d / 2 + 147); b.rotation.x = -7 * DEG; g.add(b);
  } else if (back === 'fixed') {   // a firm back with a roll along its top and two channels
    g.add(kit.rbox(-inner / 2, y0, -d / 2 + 190, inner, rawBack - 70, 190, 30, { tone }));
    g.add(kit.cyl(-inner / 2 + 40, y0 + rawBack - 70, -d / 2 + 190 - 95, 85, inner - 80, { axis: 'x', seg: 20, tone }));
    const ch = []; for (let i = 1; i < n + 1 && n > 1; i++) { const x = -inner / 2 + inner * i / (n + 0) ; if (i < n) ch.push([x, y0 + 30, -d / 2 + 192], [x, y0 + rawBack - 80, -d / 2 + 192]); }
    if (ch.length) g.add(kit.lines(ch, 'lo'));
  } else {   // a low frame back with a leaning cushion per seat
    g.add(kit.rbox(-inner / 2, y0, -d / 2 + 140, inner, rawBack * 0.55, 140, 30));
  }
  for (let i = 0; i < n; i++) {
    const cx = -inner / 2 + cw * (i + 0.5), len = d - (tightBack ? 256 : 210);
    const pad = softBox(kit, cw - 6, len, 150, { r: 52, bulge: 16, piping, tone, dent: 8 }); pad.rotation.x = -Math.PI / 2; pad.position.set(cx, y0 + 75, -d / 2 + (tightBack ? 250 : 210) + len / 2); g.add(pad);
    if (back === 'loose' && !slipper) { const bh = rawBack * 0.62, bc = softBox(kit, cw - 14, bh, 150, { r: 56, bulge: 24, piping, tone, dent: 10, dentAt: [0, 20] }); bc.rotation.x = -14 * DEG; bc.position.set(cx, y0 + 150 + bh / 2 - 8, -d / 2 + 140 + 175); g.add(bc); }
  }
  return kit.merge(g);
}
export const sofa = (kit, { seats = 3, w, d = 900, ...o } = {}) => seat(kit, { seats, w: w || (seats === 2 ? 1650 : 2100), d, armW: 200, ...o });
export const armchair = (kit, { w = 880, d = 860, ...o } = {}) => seat(kit, { seats: 1, w, d, armW: 170, ...o, seatN: 1, back: o.back === 'fixed' ? 'tight' : o.back });
