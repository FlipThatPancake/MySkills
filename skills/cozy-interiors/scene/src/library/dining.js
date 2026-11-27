// @js:library-dining — a dining table and a chair, drawn like the kitchen: plain solids with soft outlines, painted nothing.
// table(kit, { w = 1600, d = 900, h = 750 }): origin at the middle of its footprint on the floor.
// chair(kit): origin at the middle of the seat's footprint on the floor, the front toward +z (turn it to face a table); seat at 450 mm, back to 810 mm.
export function table(kit, { w = 1600, d = 900, h = 750, form = 'legs' } = {}) {   // form legs (four legs and an apron) | trestle (two slab ends and a beam) | pedestal (one column on a cross foot)
  const g = kit.group(), lo = { tone: 'lo' }, TT = 36, L = 64, inset = 90;
  g.add(kit.rbox(-w / 2, h - TT, d / 2, w, TT, d, 8));                                             // the top
  if (form === 'trestle') {
    for (const sx of [-1, 1]) { g.add(kit.rbox(sx * (w / 2 - 230) - 28, 0, d / 2 - 110, 56, h - TT, d - 220, 4)); g.add(kit.box(sx * (w / 2 - 230) - 70, 0, 150, 140, 40, 300, lo)); g.add(kit.box(sx * (w / 2 - 230) - 70, 0, -d / 2 + 450, 140, 40, 300, lo)); }   // an end slab on two feet
    g.add(kit.rbox(-w / 2 + 230, h - TT - 130, 22, w - 460, 70, 44, 4, lo));                              // the beam between the ends
  } else if (form === 'pedestal') {
    g.add(kit.box(-80, 120, 80, 160, h - TT - 120, 160));                                           // the column
    g.add(kit.rbox(-Math.min(w, 900) / 2 + 60, 0, 45, Math.min(w, 900) - 120, 120, 90, 14));        // a cross foot, long way
    g.add(kit.rbox(-45, 0, Math.min(d, 700) / 2 - 60, 90, 120, Math.min(d, 700) - 120, 14));        // and across
  } else {
    g.add(kit.box(-w / 2 + inset, h - TT - 70, d / 2 - inset + 8, w - 2 * inset, 70, d - 2 * inset + 16, lo));   // a deep apron under it, set in
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(kit.box(sx * (w / 2 - inset - L / 2) - L / 2, 0, sz * (d / 2 - inset - L / 2) + L / 2, L, h - TT, L));
  }
  return kit.merge(g);
}
export function chair(kit, { form = 'ladder', seed = 1 } = {}) {   // form ladder (slatted back) | spindle (turned spindles) | bentwood (round seat, hoop back) | upholstered (padded seat and back, tapered legs)
  const T = kit.THREE, g = kit.group(), lo = { tone: 'lo' }, S = 430, LEG = 36, seatY = 415;
  const rod = (a, b, r0, r1, tone) => { const A = new T.Vector3(...a), B = new T.Vector3(...b), d = B.clone().sub(A), m = kit.solid(new T.CylinderGeometry(r1, r0, d.length(), 10), 0, 0, 0, { smooth: true, tone }); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); return m; };
  if (form === 'bentwood') {
    g.add(kit.cyl(0, seatY - 6, 0, 205, 36, { seg: 36 }));   // a seat with real thickness
    for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2, c = Math.cos(a), sn = Math.sin(a); g.add(rod([c * 150, seatY - 4, sn * 150], [c * 205, 0, sn * 205], 12, 9, 'lo')); }
    g.add(kit.cyl(0, 170, 0, 150, 12, { seg: 28, tone: 'lo', rTop: 150 }));
    const N = 10, arc = (hy, r) => { const o = []; for (let k = 0; k <= N; k++) { const a = Math.PI * (0.14 + 0.72 * k / N); o.push([Math.cos(a) * r, hy, -Math.sin(a) * r]); } return o; }, top = arc(700, 190), low = arc(600, 190);
    for (const R of [top, low]) for (let k = 0; k < N; k++) g.add(rod(R[k], R[k + 1], 11, 11, 'lo'));   // two curved back rails
    for (const k of [0, 3, 5, 7, N]) g.add(rod(low[k], top[k], 7, 7, 'lo'));
    for (const sx of [-1, 1]) { const e = sx < 0 ? N : 0; g.add(rod([sx * 170, seatY + 10, -100], [low[e][0], 600, low[e][2]], 10, 10, 'lo')); }
  } else if (form === 'upholstered') {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(kit.cyl(sx * 175, 0, sz * 175, 14, seatY - 30, { rTop: 24, seg: 12, tone: 'lo' }));
    g.add(kit.rbox(-S / 2 - 6, seatY - 30, S / 2 + 6, S + 12, 80, S + 12, 26));
    g.add(kit.rbox(-S / 2 - 2, seatY + 40, -S / 2 + 50, S + 4, 400, 64, 30));
    g.add(kit.lines([[-S / 2 + 40, seatY + 100, -S / 2 + 52], [S / 2 - 40, seatY + 100, -S / 2 + 52]], 'lo'));
  } else {
    g.add(kit.rbox(-S / 2, seatY, S / 2, S, 36, S, 8));                                              // the seat
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(kit.box(sx * (S / 2 - 22 - LEG / 2) - LEG / 2, 0, sz * (S / 2 - 22 - LEG / 2) + LEG / 2, LEG, seatY, LEG));
    for (const sx of [-1, 1]) g.add(kit.box(sx * (S / 2 - 22 - LEG / 2) - LEG / 2, seatY + 36, -S / 2 + 22 + LEG, LEG, 360, LEG, { through: true }));   // the back uprights run up into the top rail
    g.add(kit.rbox(-S / 2 + 22, 745, -S / 2 + 22 + LEG - 4, S - 44, 70, 26, 6, lo));                  // the top rail
    if (form === 'spindle') { for (let k = 0; k < 5; k++) g.add(kit.cyl(-S / 2 + 22 + LEG + 20 + k * ((S - 44 - 2 * LEG - 40) / 4), seatY + 36, -S / 2 + 22 + LEG / 2 - 2, 8, 300, { seg: 10, tone: 'lo' })); g.add(kit.rbox(-S / 2 + 22 + LEG, 520, -S / 2 + 22 + LEG - 8, S - 44 - 2 * LEG, 26, 18, 4, lo)); }
    else { g.add(kit.rbox(-S / 2 + 22 + LEG, 610, -S / 2 + 22 + LEG - 8, S - 44 - 2 * LEG, 36, 18, 4, lo)); g.add(kit.rbox(-S / 2 + 22 + LEG, 520, -S / 2 + 22 + LEG - 8, S - 44 - 2 * LEG, 30, 18, 4, lo)); }   // ladder rails
  }
  return kit.merge(g);
}
