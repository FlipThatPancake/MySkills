// @js:kitchen-atmosphere — what makes the room feel lived in: soft contact shadows (halos), floor tiles and the window with its painted daylight.
// All in kitchen millimetres, like room.js. Nothing here is a real light: shadows and daylight are textures that fade with the kitchen.
const HALO = 'rgba(138,138,128,';   // anatomy's halo colour; its alpha is passed per halo

function canvasOf(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(2, Math.ceil(w)); c.height = Math.max(2, Math.ceil(h));
  return c;
}
// A transparent textured plane that follows the kitchen's fade and never writes depth.
function sheet(kit, canvas, w, h, side = false) {
  const T = kit.THREE, t = new T.CanvasTexture(canvas);
  t.colorSpace = T.SRGBColorSpace;
  const mat = new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const m = new T.Mesh(new T.PlaneGeometry(w, h), mat);
  m.renderOrder = 1;
  m.onBeforeRender = () => { mat.opacity = kit.fill.uniforms.uOpacity.value * (side ? kit.sideVis.value : 1); };
  return m;
}

// A blurred halo round a footprint (a0..a1 by b0..b1) on a floor-like surface at height `at` ('floor': a = x, b = z),
// on the back wall at depth `at` ('back': a = x, b = y) or on the side wall at x = `at` ('side': a = z, b = y).
export function halo(kit, orient, a0, a1, b0, b1, at, alpha = 0.26) {
  const pad = 140, k = 0.1, W = a1 - a0 + 2 * pad, H = b1 - b0 + 2 * pad;
  const c = canvasOf(W * k, H * k), g = c.getContext('2d');
  g.filter = 'blur(8px)';
  g.fillStyle = HALO + alpha + ')';
  g.fillRect(pad * k, pad * k, (a1 - a0) * k, (b1 - b0) * k);
  const m = sheet(kit, c, W, H, orient === 'side'), ca = (a0 + a1) / 2, cb = (b0 + b1) / 2;
  if (orient === 'floor') { m.rotation.x = -Math.PI / 2; m.position.set(ca, at, cb); }
  else if (orient === 'back') m.position.set(ca, cb, at);
  else { m.rotation.y = Math.PI / 2; m.position.set(at, cb, ca); }
  return m;
}

// Contact shadows for the whole room.
export function shadows(kit, { SIZE, WALL_Z }) {
  const g = kit.group(), add = (m) => (g.add(m), m);
  const wz = WALL_Z - 2, sx = -12;
  add(halo(kit, 'floor', 0, 4220, -600, 0, 1.5));                     // main run and oven column
  add(halo(kit, 'floor', 4220, SIZE.w, -600, 100, 1.5));              // fridge
  add(halo(kit, 'floor', 0, 600, 0, SIZE.front, 1.5));                // the return
  add(halo(kit, 'floor', 190, 540, 960, 1410, 901, 0.3));             // countertop oven
  add(halo(kit, 'back', 0, 2400, 1450, 1700, wz, 0.22));              // under the wall cabinets
  add(halo(kit, 'back', 2400, 3300, 1500, 1650, wz, 0.22));           // under the hood
  add(halo(kit, 'floor', -14, SIZE.w + 400, -604, -560, 1.5, 0.3));   // back wall meets floor
  add(halo(kit, 'floor', -14, 40, -604, SIZE.front + 400, 1.5, 0.3)); // side wall meets floor
  add(halo(kit, 'back', -14, 40, 0, 2300, wz, 0.3));                  // wall corner, back wall side
  add(halo(kit, 'side', -604, -550, 0, 2300, sx, 0.3));               // wall corner, side wall side
  return g;
}

// A 600 mm floor grid, square to the back wall, that fades out 1.5 m beyond the units.
export function tiles(kit, { SIZE, WALL_Z }) {
  const g = kit.group();
  const out = (p) => Math.hypot(Math.max(-p[0], p[0] - SIZE.w, 0), Math.max(p[2] - SIZE.front, 0));
  const tone = (p) => { const t = Math.min(1, out(p) / 1500); return t * t * (3 - 2 * t); };
  for (let z = WALL_Z + 600; z <= SIZE.front + 1500; z += 600) g.add(kit.meltingLine([0, -2, z], [SIZE.w + 1500, -2, z], tone, 80, 'lo'));
  for (let x = 600; x <= SIZE.w + 1500; x += 600) g.add(kit.meltingLine([x, -2, WALL_Z], [x, -2, SIZE.front + 1500], tone, 80, 'lo'));
  return g;
}

// The window in the side wall above the return (1200 x 1100, sill at 1000 mm). room.js cuts the opening into the wall.
export const WIN = { Z0: 150, Z1: 1350, Y0: 1000, Y1: 2100, DEPTH: 120 };
// The window: a white casement, drawn the way a real one is built. Every part is ONE extruded piece (the surround, the frame, each sash with its glazing bars),
// so the only lines are real outlines and no lines show where parts "meet". Two sashes hinged at the outer sides, opened inward; a window sill (stool) that
// sticks 40 mm into the room with an apron under it; a slim surround casing, 50 mm wide and 12 mm proud of the wall; a painted garden behind the glass.
// `daylight` is painted: a soft warm patch on the return's counter. No real light is involved.
const SASH_OPEN = 26;   // degrees, inward
const rad = (d) => d * Math.PI / 180;
export function windowAndLight(kit) {
  const T = kit.THREE, g = kit.group();
  const { Z0, Z1, Y0, Y1, DEPTH } = WIN, XB = -14 - DEPTH, L = 6, mid = { tone: 'mid' }, lo = { tone: 'lo' };
  // A flat outline (points are [z, y], with optional holes) extruded `d` mm along x from x0. Shape x is -z, so rotating it a quarter turn about y puts it in world z.
  const ext = (pts, holes, x0, d, opts = mid) => {
    const sh = new T.Shape(pts.map(([z, y]) => new T.Vector2(-z, y)));
    (holes || []).forEach((h) => sh.holes.push(new T.Path(h.map(([z, y]) => new T.Vector2(-z, y)))));
    const m = kit.solid(new T.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false }), x0, 0, 0, opts);
    m.rotation.y = Math.PI / 2;
    m.position.set(x0, 0, 0);
    return m;
  };
  const rect = (z0, y0, z1, y1) => [[z0, y0], [z1, y0], [z1, y1], [z0, y1]];
  // sky and garden, at the back of the reveal: a faint cool sky, a pale hedge line and a far roof
  const c = canvasOf(160, 128), cg = c.getContext('2d'), grd = cg.createLinearGradient(0, 0, 0, 128);
  grd.addColorStop(0, '#e4edf6'); grd.addColorStop(0.55, '#f6f9fc'); grd.addColorStop(1, '#ffffff');
  cg.fillStyle = grd; cg.fillRect(0, 0, 160, 128);
  cg.fillStyle = '#e6e9e8'; cg.beginPath(); cg.moveTo(30, 100); cg.lineTo(60, 78); cg.lineTo(120, 78); cg.lineTo(135, 100); cg.fill();   // far roof
  cg.fillStyle = '#e3e9e1'; for (let i = 0; i < 14; i++) { cg.beginPath(); cg.arc(i * 12 + 4, 112 + (i % 3) * 3, 14 + (i % 4) * 3, 0, 6.3); cg.fill(); }   // hedge
  const sky = sheet(kit, c, Z1 - Z0, Y1 - Y0, true);
  sky.rotation.y = Math.PI / 2; sky.position.set(XB, (Y0 + Y1) / 2, (Z0 + Z1) / 2);
  g.add(sky);

  const STOOL = 1030;   // top of the window sill
  // the reveal: the tunnel through the wall, one piece with 6 mm linings
  g.add(ext(rect(Z0, Y0, Z1, Y1), [rect(Z0 + L, Y0 + L, Z1 - L, Y1 - L)], XB, DEPTH));
  // the surround casing on the wall: an upside-down U, 50 mm wide, 12 mm proud
  const CW = 50;
  g.add(ext([[Z0 - CW, STOOL], [Z0 - CW, Y1 + CW], [Z1 + CW, Y1 + CW], [Z1 + CW, STOOL], [Z1, STOOL], [Z1, Y1], [Z0, Y1], [Z0, STOOL]], null, -14, 12));
  // the sill (stool): sticks 40 mm into the room, with ends that reach past the casing, and the apron under it
  g.add(kit.box(XB, STOOL - 30, Z1 + 70, 160, 30, Z1 - Z0 + 140, mid));
  g.add(kit.box(-14, STOOL - 90, Z1 + 40, 11, 60, Z1 - Z0 + 80, mid));
  // the frame, set 50 mm back from the wall face: one ring, 44 mm wide, 45 deep
  const FW = 44, fy0 = STOOL, fy1 = Y1 - L, fz0 = Z0 + L, fz1 = Z1 - L, XF = -14 - 50;
  g.add(ext(rect(fz0, fy0, fz1, fy1), [rect(fz0 + FW, fy0 + FW, fz1 - FW, fy1 - FW)], XF - 45, 45));
  // two sashes meeting in the middle, each a single piece with 2 x 3 panes; hinged at the outer sides and swung inward
  const iz0 = fz0 + FW, iz1 = fz1 - FW, iy0 = fy0 + FW, iy1 = fy1 - FW, W = (iz1 - iz0) / 2 - 2, SD = 30, ST = 34, BAR = 20;
  const cw = (W - 2 * ST - BAR) / 2, rh = (iy1 - iy0 - 2 * ST - 2 * BAR) / 3;
  const sash = (hinge, dir) => {
    const p = kit.group();
    const Zs = (u) => dir * u;                                                // distance from the hinge, in world z
    const panes = [];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) {
      const u0 = ST + i * (cw + BAR), y0 = iy0 + ST + j * (rh + BAR);
      panes.push(rect(Math.min(Zs(u0), Zs(u0 + cw)), y0, Math.max(Zs(u0), Zs(u0 + cw)), y0 + rh));
    }
    p.add(ext(rect(Math.min(0, Zs(W)), iy0, Math.max(0, Zs(W)), iy1), panes, -SD / 2, SD));
    // two hinge leaves and pins on the room side of the hinge stile
    [iy0 + 110, iy1 - 190].forEach((y) => {
      p.add(kit.box(SD / 2, y, Math.max(Zs(8), Zs(26)), 2.5, 80, 18, lo));
      p.add(kit.cyl(SD / 2 + 3, y, Zs(17), 3.5, 80, { seg: 10, ...lo }));
    });
    p.position.set(XF - 22, 0, hinge);
    p.rotation.y = dir * rad(SASH_OPEN);
    return p;
  };
  const sA = sash(iz0, 1), sB = sash(iz1, -1);
  // latch on the free stile of the left-hand sash (as seen from inside, the one with the lower z): a small plate and a lever
  sA.add(kit.rbox(SD / 2, (iy0 + iy1) / 2 - 30, W - ST / 2 - 8, 16, 60, 2.5, 4, lo));
  sA.add(kit.cyl(SD / 2 + 2.5, (iy0 + iy1) / 2, W - ST / 2 - 2, 3, 28, { axis: 'z', seg: 10, ...lo }));
  g.add(sA, sB);

  // daylight: rays go +x and down at 35 degrees, a little toward +z
  const tan = 0.7, drift = 0.2;
  const hit = (z0, y0, plane) => { const t = (y0 - plane) / tan; return [t, z0 + drift * t]; };
  const patch = (plane, xMax, at) => {
    const pts = [[Z0, Y0], [Z1, Y0], [Z1, Y1], [Z0, Y1]].map(([z, y]) => hit(z, y, plane));
    const x0 = Math.min(...pts.map(p => p[0])), x1 = Math.min(xMax, Math.max(...pts.map(p => p[0])));
    const z0 = Math.min(...pts.map(p => p[1])), z1 = Math.max(...pts.map(p => p[1]));
    const pad = 120, k = 0.1, W = x1 - x0 + 2 * pad, H = z1 - z0 + 2 * pad;
    const cv = canvasOf(W * k, H * k), q = cv.getContext('2d');
    const P = (x, z) => [(x - x0 + pad) * k, (z - z0 + pad) * k];
    const strip = (ta, tb, za, zb) => {   // a band between two rays-lengths ta..tb, across z from za to zb (at the window)
      const corner = (t, z) => P(Math.min(t, xMax), z + drift * t);
      q.beginPath();
      [corner(ta, za), corner(tb, za), corner(tb, zb), corner(ta, zb)].forEach(([x, y], i) => (i ? q.lineTo(x, y) : q.moveTo(x, y)));
      q.closePath(); q.fill();
    };
    q.filter = 'blur(11px)';
    q.fillStyle = 'rgba(255,238,200,0.22)';
    strip((Y0 - plane) / tan, (Y1 - plane) / tan, Z0, Z1);
    const m = sheet(kit, cv, W, H, true);
    m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, at, (z0 + z1) / 2);
    return m;
  };
  g.add(patch(900, 620, 901.5));    // the return's counter, which ends at x = 620
  return g;
}

// A pendant lamp over the open floor inside the L: a 300 mm dome shade whose rim hangs 1950 mm above the floor, on a thin cord that melts into the wall tone toward the
// top (the ceiling is never drawn). It is daytime: the lamp is off and casts no light. Kitchen millimetres, like room.js.
export const LAMP = { X: 1500, Z: 900, RIM: 1950, H: 170, R: 150 };
export function pendantLamp(kit) {
  const T = kit.THREE, g = kit.group(), { X, Z, RIM, H, R } = LAMP;
  const prof = [];
  for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI / 2; prof.push(new T.Vector2(Math.max(0.01, R * Math.cos(a) * (1 - 0.04 * Math.sin(a))), H * Math.sin(a))); }
  const shade = kit.solid(new T.LatheGeometry(prof, 40), X, RIM, Z, { smooth: true, tone: 'mid' });
  g.add(shade);
  g.add(kit.solid(new T.CircleGeometry(R - 1, 40).rotateX(Math.PI / 2), X, RIM + 1, Z, { tone: 'lo' }));   // a pale diffuser closes the underside, so it reads light, not a grey hole
  const rim = [];
  for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2, b = (i + 1) / 40 * Math.PI * 2; rim.push([X + Math.cos(a) * R, RIM + 0.5, Z + Math.sin(a) * R], [X + Math.cos(b) * R, RIM + 0.5, Z + Math.sin(b) * R]); }
  g.add(kit.lines(rim, 'mid'));
  g.add(kit.cyl(X, RIM + H - 2, Z, 14, 34, { seg: 16, tone: 'lo' }));                 // the socket cap on top
  const top = 3300, full = 2500;                                                      // the cord is at full strength up to 2500 mm, then melts out by 3300
  g.add(kit.meltingLine([X, RIM + H + 30, Z], [X, top, Z], (p) => Math.min(1, Math.max(0, (p[1] - full) / (top - full))), 70));
  return g;
}
