// @js:openings — windows, doors and arches set into a wall, in the old kitchen's style: thick reveals, one extruded piece per frame, a view outside.
// opening(kit, { kind: 'window' | 'door' | 'arch', width, height, sill = 0 (window), hinge: 'l' | 'r' (door), open: leaf angle in degrees })
//   style (window): 'sash' (default: the old kitchen's two sashes) | 'picture' (one large fixed pane, slim frame, 1 to 3 lights: bars) | 'wall' (a window wall: floor-level to near the ceiling, fixed lights between slim mullions: bars)
//   style (window, more): 'pair' (two tall narrow casements side by side, one column of panes each, a post between) | 'bay' (three angled panes projecting 500 mm (op.proud) outside, a seat at the sill)
//   style (door): 'french' (two glass leaves ajar inward, lights: rows of panes) | 'slider' (two glass panels, one slid half over the other); both open onto the outside. Plain wood door: no style.
//   style (arch): round (default) | cased | pass | widepass | portal | pocket, see STYLE.
//   sash: 'fixed' (a window whose sashes stay shut: it can stand over a sink) | default inward-opening.
//   -> { group, hole, openables, hit }. `openables` are the leaf / sashes (userData.open: click cycles states ajar -> wide -> shut); `hit` is a clear plane over a door or arch for a click that goes to another area (op.to). Built in the wall's own frame: the wall face is x = 0, the room is +x, z runs along the wall, y is up, the opening is centred on z = 0.
//   `hole` is the outline [z, y] of the cut in the wall (set.js cuts it). Nothing here is a real light or a real view: the view outside and the daylight are painted.
import { canvasOf, sheet, glow } from './sheet.js';

const rad = (d) => d * Math.PI / 180;
export const DEFAULTS = { window: { width: 1200, height: 1100, sill: 1000 }, door: { width: 900, height: 2050, sill: 0 }, arch: { width: 1100, height: 2250, sill: 0 } };

// the passages beyond a plain round arch: default sizes (mm); pass and widepass sit on a counter (sill 950)
export const STYLE = { cased: { width: 1000, height: 2150 }, pass: { width: 1100, height: 1050 }, widepass: { width: 2000, height: 1050 }, portal: { width: 1300, height: 2300 }, pocket: { width: 900, height: 2050 },
  // window kinds beyond the kitchen's two-sash window (style: 'picture' | 'wall'), and glass doors to the outside (kind 'door', style: 'french' | 'slider'): default sizes (mm)
  picture: { width: 2100, height: 1400, sill: 650 }, wall: { width: 3800, height: 2300, sill: 100 }, french: { width: 1500, height: 2250, sill: 0 }, slider: { width: 2400, height: 2250, sill: 0 }, pair: { width: 1100, height: 1800, sill: 450 }, bay: { width: 2400, height: 1500, sill: 450 } };
export const GLASS = ['french', 'slider'];   // door styles that are glass: they light the room and open onto the outside
const archPts = (w, h, inset = 0, n = 18) => {   // rectangle with a half-round top: [z, y] from the floor
  const r = w / 2 - inset, top = h - inset - r, pts = [[-r, 0], [r, 0]];
  for (let i = 0; i <= n; i++) { const a = Math.PI * i / n; pts.push([r * Math.cos(a), top + r * Math.sin(a)]); }
  return pts;
};
const rectPts = (z0, y0, z1, y1) => [[z0, y0], [z1, y0], [z1, y1], [z0, y1]];

export function opening(kit, op, vis = null) {
  const T = kit.THREE, d = DEFAULTS[op.kind], SD = STYLE[op.style] || {}, w = op.width ?? SD.width ?? d.width, h = op.height ?? SD.height ?? d.height, sill = op.sill ?? SD.sill ?? d.sill;
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

  // What lies beyond a door or arch is the world itself: the floor, its tiles and whatever room is there. Nothing is painted in.
  const beyond = () => {};
  const openables = [];
  const hitPlane = () => {   // clear, but still hit by a click: a door or arch that leads to another area
    const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    m.rotation.y = Math.PI / 2; m.position.set(-40, h / 2, 0); m.userData.go = op.to;
    return m;
  };
  let hit = null;

  // what lies outside: sky, a far roof and hedge; a glass door or window wall also shows a strip of paving or deck at the bottom
  const outside = (XB, Y0_, h_, patio) => {
    const c = canvasOf(160, 128), cg = c.getContext('2d'), gr = cg.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, '#e4edf6'); gr.addColorStop(0.55, '#f6f9fc'); gr.addColorStop(1, '#ffffff');
    cg.fillStyle = gr; cg.fillRect(0, 0, 160, 128);
    cg.fillStyle = '#e6e9e8'; cg.beginPath(); cg.moveTo(30, 100); cg.lineTo(60, 78); cg.lineTo(120, 78); cg.lineTo(135, 100); cg.fill();   // far roof
    cg.fillStyle = '#e3e9e1'; for (let i = 0; i < 14; i++) { cg.beginPath(); cg.arc(i * 12 + 4, 112 + (i % 3) * 3, 14 + (i % 4) * 3, 0, 6.3); cg.fill(); }   // hedge
    if (patio) { cg.fillStyle = '#eceae6'; cg.fillRect(0, 112, 160, 16); cg.strokeStyle = '#d4d2cc'; cg.lineWidth = 1; for (let i = 0; i < 9; i++) { cg.beginPath(); cg.moveTo(0, 114 + i * 1.6); cg.lineTo(160, 114 + i * 1.6); cg.stroke(); } }   // decking boards
    const sky = sheet(kit, c, w, h_, vis);
    sky.rotation.y = Math.PI / 2; sky.position.set(XB, Y0_ + h_ / 2, 0);
    return sky;
  };
  const glazedWin = op.kind === 'window' && (op.style === 'picture' || op.style === 'wall'), glassDoor = op.kind === 'door' && GLASS.includes(op.style);
  if (glazedWin) {   // picture: one large fixed pane; wall: a floor-level wall of fixed lights between slim mullions (op.bars = lights across, op.transom = height of a top light, 0 for none)
    const wl = op.style === 'wall', DEPTH = wl ? 150 : 130, L = 6, FW = wl ? 34 : 38, XB = -DEPTH, XF = -50, bars = op.bars ?? (wl ? Math.max(2, Math.round(w / 1000)) : w > 2000 ? 2 : 1), top = op.transom ?? (wl ? 380 : 0);
    hole = rectPts(Z0, Y0, Z1, Y1);
    g.add(outside(XB, Y0, h, wl));
    g.add(ext(rectPts(Z0, Y0, Z1, Y1), [rectPts(Z0 + L, Y0 + L, Z1 - L, Y1 - L)], XB, DEPTH));   // the reveal
    if (wl) { const CW = 26; g.add(ext(rectPts(Z0 - CW, Y0, Z1 + CW, Y1 + CW), [rectPts(Z0, Y0, Z1, Y1)], 0, 8)); }   // a slim casing, 8 mm proud
    else {
      const CW = 45, STOOL = Y0 + 30;
      g.add(ext([[Z0 - CW, STOOL], [Z0 - CW, Y1 + CW], [Z1 + CW, Y1 + CW], [Z1 + CW, STOOL], [Z1, STOOL], [Z1, Y1], [Z0, Y1], [Z0, STOOL]], null, 0, 12));
      g.add(kit.box(XB, STOOL - 30, Z1 + 70, DEPTH + 40, 30, w + 140, mid), kit.box(0, STOOL - 90, Z1 + 40, 11, 60, w + 80, mid));   // sill and apron
    }
    const fz0 = Z0 + L, fz1 = Z1 - L, fy0 = Y0 + L, fy1 = Y1 - L, iz0 = fz0 + FW, iz1 = fz1 - FW, iy0 = fy0 + (wl ? 90 : FW), iy1 = fy1 - FW, MUL = 36;   // a wall's bottom rail is 90 mm
    const holes = [], tz = top ? iy1 - top : iy1;
    const cols = (ya, yb) => { for (let i = 0; i < bars; i++) { const a = iz0 + i * (iz1 - iz0 + MUL) / bars, b = iz0 + (i + 1) * (iz1 - iz0 + MUL) / bars - MUL; holes.push(rectPts(a, ya, b, yb)); } };
    cols(iy0, top ? tz - MUL : iy1); if (top) cols(tz, iy1);
    g.add(ext(rectPts(fz0, fy0, fz1, fy1), holes, XF - 45, 45));   // one frame, all the lights cut from it
    const lines = [], xg = XF - 20;   // two short slanting strokes on each light: the glass catching the light
    for (const hp of holes) { const [a, b, c2, d2] = [hp[0][0], hp[0][1], hp[2][0], hp[2][1]]; if (d2 - b < 500) continue; const q = Math.min(c2 - a, d2 - b) * 0.35; lines.push([xg, d2 - q * 0.6, a + q * 0.4], [xg, d2 - q * 1.6, a + q * 1.4], [xg, d2 - q * 1.0, a + q * 0.4 + q * 0.9], [xg, d2 - q * 2.0, a + q * 1.3 + q * 0.9]); }
    g.add(kit.lines(lines, 'mid'));
  } else if (glassDoor) {   // french: two glass leaves ajar inward (op.lights = panes in a column); slider: two panels, one slid half over the other
    const sl = op.style === 'slider', DEPTH = 130, L = 14, CW = sl ? 45 : 60, XB = -DEPTH, XF = -50, FW = sl ? 36 : 48;
    hole = rectPts(Z0, 0, Z1, Y1);
    g.add(outside(XB, 0, h, true));
    g.add(ext(rectPts(Z0, 0, Z1, Y1), [rectPts(Z0 + L, 0, Z1 - L, Y1 - L)], XB, DEPTH));
    g.add(ext([[Z0 - CW, 0], [Z0 - CW, Y1 + CW], [Z1 + CW, Y1 + CW], [Z1 + CW, 0], [Z1, 0], [Z1, Y1], [Z0, Y1], [Z0, 0]], null, 0, 12));   // casing
    g.add(kit.box(XB, 0, Z1 + CW, DEPTH + 12, 14, w + 2 * CW, lo));   // the threshold
    const fz0 = Z0 + L, fz1 = Z1 - L, fy0 = 14, fy1 = Y1 - L, iz0 = fz0 + FW, iz1 = fz1 - FW, iy0 = fy0 + FW, iy1 = fy1 - FW;
    g.add(ext(rectPts(fz0, fy0, fz1, fy1), [rectPts(iz0, iy0, iz1, iy1)], XF - 45, 45));   // the frame, set 50 mm back
    if (sl) {
      const Wp = (iz1 - iz0) / 2 + 30, ST = 42, BR = 110, slide = op.slide ?? 0.45 * Wp, panel = (z0, x0) => { const z1 = z0 + Wp; g.add(ext(rectPts(z0, iy0, z1, iy1), [rectPts(z0 + ST, iy0 + BR, z1 - ST, iy1 - ST)], x0, 28)); return [z0, z1]; };
      panel(iz0, XF - 40);                          // the fixed panel behind
      const [b0, b1] = panel(iz1 - Wp - slide, XF - 8);   // the sliding panel in front, drawn half across
      g.add(kit.rbox(XF + 20, 900, b0 + 26, 14, 380, 16, 4, lo));   // a flat pull on its leading stile
      g.add(kit.lines([[XF + 22, iy0 + 4, iz0], [XF + 22, iy0 + 4, iz1]], 'mid'));   // the track
    } else {
      const W = (iz1 - iz0) / 2 - 2, SD = 40, ST = 58, BAR = 20, rows = op.lights ?? 4, ajar = op.open ?? 22, BR = 150, rh = (iy1 - iy0 - ST - BR - (rows - 1) * BAR) / rows;
      const leaf = (hinge, dir) => {
        const p = kit.group(), Zs = (u) => dir * u, panes = [];
        for (let j = 0; j < rows; j++) { const y0 = iy0 + BR + j * (rh + BAR); panes.push(rectPts(Math.min(Zs(ST), Zs(W - ST)), y0, Math.max(Zs(ST), Zs(W - ST)), y0 + rh)); }
        p.add(ext(rectPts(Math.min(0, Zs(W)), iy0, Math.max(0, Zs(W)), iy1), panes, -SD / 2, SD));
        [iy0 + 160, iy1 - 200].forEach((y) => { p.add(kit.box(SD / 2, y, Math.max(Zs(8), Zs(26)), 2.5, 80, 18, lo)); p.add(kit.cyl(SD / 2 + 3, y, Zs(17), 3.5, 80, { seg: 10, ...lo })); });
        p.position.set(XF - 22, 0, hinge); p.rotation.y = dir * rad(ajar);
        return p;
      };
      const sA = leaf(iz0, 1), sB = leaf(iz1, -1);
      sA.add(kit.rbox(SD / 2, 950, W - ST / 2 - 8, 16, 150, 2.5, 4, lo), kit.cyl(SD / 2 + 2.5, 1000, W - ST / 2 - 2, 3, 28, { axis: 'z', seg: 10, ...lo }));   // a long handle plate and a lever
      for (const [sx, dir] of [[sA, 1], [sB, -1]]) { sx.userData.open = { kind: 'door', dir, max: 75, v: ajar / 75, target: ajar / 75, states: [ajar / 75, 1, 0], i: 0, pair: [sA, sB] }; openables.push(sx); }
      g.add(sA, sB);
    }
  } else if (op.kind === 'window' && op.style === 'bay') {   // three angled panes projecting outside, a seat at the sill (op.proud = how far out, op.centre = the front pane's share of the width)
    const P = op.proud ?? 500, wc = w * (op.centre ?? 0.45), side = (w - wc) / 2, FW = 40, HT = 60, SEAT = 45, ROOF = 60, CW = 45, ph = h - SEAT - ROOF + 0, py0 = Y0, py1 = Y1 - ROOF;
    hole = rectPts(Z0, Y0, Z1, Y1);
    const outer = kit.group(); g.add(outer);
    g.add(outside(-P - 160, Y0, h + 100, false));
    // the pane frames: one ring each (ring 40 mm, one big glazed light), standing on the seat
    const pane = (len, x, z, r) => { const q = kit.group(), a = -len / 2, b = len / 2; q.add(ext(rectPts(a, py0, b, py1), [rectPts(a + FW, py0 + FW, b - FW, py1 - FW)], -22, 44)); q.position.set(x, 0, z); q.rotation.y = r; return q; };
    const sl = Math.hypot(P, side), r = Math.atan2(P, side);
    g.add(pane(wc, -P, 0, 0), pane(sl, -P / 2, wc / 2 + side / 2, r), pane(sl, -P / 2, -(wc / 2 + side / 2), -r));
    // seat and head: a flat plate in plan (x, -z), set at height y
    const slab = (y, t, inset = 0) => { const sh = new T.Shape([[0, -(w / 2)], [-P, -wc / 2], [-P, wc / 2], [0, w / 2]].map(([x, z]) => new T.Vector2(x, -z))); const m = kit.solid(new T.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false }), 0, 0, 0, mid); m.rotation.x = -Math.PI / 2; m.position.set(0, y, 0); return m; };
    g.add(slab(Y0 - SEAT, SEAT), slab(Y1 - ROOF, ROOF));
    // casing round the opening in the wall, 45 mm wide, 12 mm proud; the seat's front edge
    g.add(ext([[Z0 - CW, Y0 - SEAT], [Z0 - CW, Y1 + CW], [Z1 + CW, Y1 + CW], [Z1 + CW, Y0 - SEAT], [Z1, Y0 - SEAT], [Z1, Y1], [Z0, Y1], [Z0, Y0 - SEAT]], null, 0, 12));
    g.add(kit.box(0, Y0 - SEAT - 60, Z1 + 40, 11, 60, w + 80, mid));   // apron under the seat
    g.add(kit.lines([[10, Y0 - SEAT + 2, Z0 - 6], [10, Y0 - SEAT + 2, Z1 + 6]], 'mid'));
  } else if (op.kind === 'window') {
    const DEPTH = 120, L = 6, STOOL = Y0 + 30, XB = -DEPTH;
    hole = rectPts(Z0, Y0, Z1, Y1);
    // sky and garden at the back of the reveal
    const c = canvasOf(160, 128), cg = c.getContext('2d'), gr = cg.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, '#e4edf6'); gr.addColorStop(0.55, '#f6f9fc'); gr.addColorStop(1, '#ffffff');
    cg.fillStyle = gr; cg.fillRect(0, 0, 160, 128);
    cg.fillStyle = '#e6e9e8'; cg.beginPath(); cg.moveTo(30, 100); cg.lineTo(60, 78); cg.lineTo(120, 78); cg.lineTo(135, 100); cg.fill();   // far roof
    cg.fillStyle = '#e3e9e1'; for (let i = 0; i < 14; i++) { cg.beginPath(); cg.arc(i * 12 + 4, 112 + (i % 3) * 3, 14 + (i % 4) * 3, 0, 6.3); cg.fill(); }   // hedge
    const sky = sheet(kit, c, w, h, vis);
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
    const pair = op.style === 'pair', NC = pair ? 1 : 2, NR = pair ? 5 : 3, cw = (W - 2 * ST - (NC - 1) * BAR) / NC, rh = (iy1 - iy0 - 2 * ST - (NR - 1) * BAR) / NR, ajar = op.sash === 'fixed' ? 0 : (op.open ?? 26);
    const sash = (hinge, dir) => {
      const p = kit.group(), Zs = (u) => dir * u, panes = [];
      for (let i = 0; i < NC; i++) for (let j = 0; j < NR; j++) {
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
    if (op.sash !== 'fixed') for (const [sx, dir] of [[sA, 1], [sB, -1]]) { sx.userData.open = { kind: 'door', dir, max: 75, v: ajar / 75, target: ajar / 75, states: [ajar / 75, 1, 0], i: 0, pair: [sA, sB] }; openables.push(sx); }
    g.add(sA, sB);
  } else if (op.kind === 'door') {
    const DEPTH = 120, L = 16, CW = 70, hinge = op.hinge === 'l' ? -1 : 1, ajar = op.open ?? 25;
    hole = rectPts(Z0, 0, Z1, Y1);
    beyond(DEPTH, w, h);
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
    pivot.userData.open = { kind: 'door', dir: -sgn, max: 85, v: ajar / 85, target: ajar / 85, states: [ajar / 85, 1, 0], i: 0 };
    if (op.to) { pivot.userData.go = op.to; delete pivot.userData.open; hit = hitPlane(); g.add(hit); } else openables.push(pivot);
    g.add(pivot);
  } else {   // arch (op.style: round (default) | cased | pass | widepass | portal | pocket)
    const st = op.style || 'round', rectStyle = st !== 'round' && st !== 'portal' || op.shape === 'rect';
    const DEPTH = op.depth ?? (st === 'portal' ? 420 : 200), ring = 40, S0 = (st === 'pass' || st === 'widepass') ? (op.sill ?? 950) : 0, H1 = S0 + h;
    hole = rectStyle ? rectPts(Z0, S0, Z1, H1) : archPts(w, h);
    if (op.to) { hit = hitPlane(); g.add(hit); }
    if (op.beyond !== false) {   // a hint of the next space: a far wall, a shade deeper than this one, with its skirting; the floor lines run on to it (home.js)
      const bw = w + 500, bh = S0 + h + 300, c = canvasOf(128, 128), cg = c.getContext('2d'), gr = cg.createLinearGradient(0, 0, 0, 128);
      gr.addColorStop(0, 'rgba(226,226,221,0.0)'); gr.addColorStop(0.25, 'rgba(226,226,221,0.85)'); gr.addColorStop(1, 'rgba(232,232,227,0.95)');
      cg.fillStyle = gr; cg.fillRect(0, 0, 128, 128); cg.strokeStyle = 'rgba(160,160,155,0.7)'; cg.lineWidth = 1; const yb = 128 - 128 * 110 / bh; cg.beginPath(); cg.moveTo(0, yb); cg.lineTo(128, yb); cg.stroke();   // the skirting
      const far = sheet(kit, c, bw, bh, vis); far.rotation.y = Math.PI / 2; const FX = -(DEPTH + (op.hintAt ?? 1500)); far.position.set(FX, bh / 2, 0); g.add(far);
      // one thing of the next room, so the opening reads as a way through (op.hint: picture | rug | lamp | chair); a hatch shows a picture or a lamp only
      const hints = S0 ? ['picture', 'lamp'] : ['picture', 'rug', 'lamp', 'chair'], hk = hints.includes(op.hint) ? op.hint : hints[Math.abs(Math.round((op.at ?? w) / 37)) % hints.length], hz = (Math.abs(Math.round((op.at ?? w) / 53)) % 2 ? 1 : -1) * w * 0.22;
      if (hk === 'picture') { const a = hz - 210, b = hz + 210, y0 = S0 + 1250 - (S0 ? 700 : 0), y1 = y0 + 560, x = FX + 6; g.add(kit.lines([[x, y0, a], [x, y0, b], [x, y0, b], [x, y1, b], [x, y1, b], [x, y1, a], [x, y1, a], [x, y0, a], [x, y0 + 40, a + 40], [x, y0 + 40, b - 40], [x, y0 + 40, b - 40], [x, y1 - 40, b - 40], [x, y1 - 40, b - 40], [x, y1 - 40, a + 40], [x, y1 - 40, a + 40], [x, y0 + 40, a + 40]], 'mid')); }
      if (hk === 'rug') { const xa = -(DEPTH + 350), xb = FX + 250, a = -w * 0.46, b = w * 0.46, ln = []; for (const m of [0, 45]) ln.push([xa - m, 3, a + m], [xb + m, 3, a + m], [xb + m, 3, a + m], [xb + m, 3, b - m], [xb + m, 3, b - m], [xa - m, 3, b - m], [xa - m, 3, b - m], [xa - m, 3, a + m]); g.add(kit.lines(ln, 'mid')); }
      if (hk === 'lamp') { const x = FX + 260; g.add(kit.cyl(x, 0, hz, 110, 18, { seg: 20, tone: 'mid' }), kit.cyl(x, 18, hz, 11, 1400, { seg: 10, tone: 'mid' }), kit.cyl(x, 1320, hz, 160, 230, { rTop: 110, seg: 24, tone: 'mid', open: true })); }
      if (hk === 'chair') { const x = FX + 120, z = hz + 215, mk = (dx, dz) => kit.box(x + dx, 0, z - dz, 32, 430, 32, mid); g.add(kit.box(x, 430, z, 430, 36, 430, mid), kit.box(x, 466, z, 30, 400, 430, mid), mk(0, 0), mk(398, 0), mk(0, 398), mk(398, 398)); }
    }
    const shape = (inset) => rectStyle ? rectPts(Z0 + inset, S0 + (S0 ? inset : 0), Z1 - inset, H1 - inset) : archPts(w, h, inset);
    if (DEPTH > 0) g.add(ext(shape(0), [shape(6)], -DEPTH, DEPTH));   // a deep reveal with a 6 mm lining (depth 0: the casing alone, where the other room's arch has the reveal)
    // the reveal reads darker: close hatch lines across its sides and head
    { const pts = [], n = Math.round(DEPTH / 18), jam = (z) => { for (let i = 1; i < n; i++) { const x = -DEPTH + i * DEPTH / n; pts.push([x, S0 + 20, z], [x, Math.min(H1 - (rectStyle ? 20 : w / 2), 2000), z]); } };
      jam(Z0 + 7); jam(Z1 - 7); if (rectStyle) for (let i = 1; i < n; i++) { const x = -DEPTH + i * DEPTH / n; pts.push([x, H1 - 7, Z0 + 20], [x, H1 - 7, Z1 - 20]); } g.add(kit.lines(pts, 'mid')); }
    if (rectStyle) {   // a casing round a square-headed opening: 50 mm wide, 12 mm proud (a pass-through has it on four sides)
      const CW = st === 'cased' || st === 'pocket' ? 60 : 45;
      g.add(ext([[Z0 - CW, S0 ? S0 - CW : 0], [Z0 - CW, H1 + CW], [Z1 + CW, H1 + CW], [Z1 + CW, S0 ? S0 - CW : 0], [Z1, S0 ? S0 - CW : 0], [Z1, S0 ? S0 : 0], [Z1, H1], [Z0, H1], [Z0, S0 ? S0 : 0], [Z0, S0 ? S0 - CW : 0]], null, 0, 12));
      if (S0) { const cz = (w + 240) / 2, cf = 380;
      g.add(kit.rbox(-300, S0 - 40, cz, 700, 40, w + 240, 6), kit.box(0, 0, cz - 20, cf - 40, S0 - 40, w + 200, mid));   // the counter: a worktop 400 mm into the room and 300 mm out the far side, a cabinet body under it
      const ln = [], xf = cf - 40 + 0.5; for (let k = 0; k <= 2; k++) { const z = cz - 20 - k * (w + 200) / 2; ln.push([xf, 120, z], [xf, S0 - 60, z]); } ln.push([xf, 100, cz - 20], [xf, 100, cz - 20 - (w + 200)]);   // door seams and the toe-kick on its front
      g.add(kit.lines(ln, 'mid')); }   // a pass-through carries its own counter: keep 600 mm of floor clear in front of it
    } else {
      const R = w / 2 + ring, r = w / 2, arc = (rr, top) => Array.from({ length: 19 }, (_, i) => { const a = Math.PI * (1 - i / 18); return [rr * Math.cos(a), top + rr * Math.sin(a)]; });
      g.add(ext([[-R, 0], ...arc(R, h + ring - R), [R, 0], [r, 0], ...arc(r, h - r).reverse(), [-r, 0]], null, 0, 10));   // a slim architrave, 10 mm proud
    }
    if (st === 'portal') { g.add(kit.rbox(-DEPTH, 0, (w + 160) / 2, DEPTH + 90, 45, w + 160, 6));   // a threshold step through the deep reveal, running 90 mm out into the room
      g.add(kit.lines([[90, 46, Z0 - 80], [90, 46, Z1 + 80]], 'mid')); }
    if (st === 'pocket') {   // a door half slid into the wall: its leaf shows over one half, with a flush pull
      const lw = w / 2 + 20, z0 = op.slid === 'l' ? Z0 - 10 : Z1 - lw + 10; g.add(kit.rbox(-3, 0, z0 + lw, 22, h, lw, 4, { tone: 'lo' }));
      g.add(kit.cyl(20, 1000, op.slid === 'l' ? Z0 + lw - 70 : Z1 - lw + 70, 40, 10, { axis: 'x', seg: 20, tone: 'mid' }));
      g.add(kit.lines([[19, 40, z0], [19, h - 40, z0], [19, h - 40, z0 + lw], [19, 40, z0 + lw]], 'lo')); }
  }
  return { group: g, hole, width: w, height: h, sill: Y0, openables, hit, kind: op.kind };
}
