// @js:library-dining — a dining table and a chair, drawn like the kitchen: plain solids with soft outlines, painted nothing.
// table(kit, { w = 1600, d = 900, h = 750 }): origin at the middle of its footprint on the floor.
// chair(kit): origin at the middle of the seat's footprint on the floor, the front toward +z (turn it to face a table); seat at 450 mm, back to 810 mm.
export function table(kit, { w = 1600, d = 900, h = 750 } = {}) {
  const g = kit.group(), lo = { tone: 'lo' }, TT = 36, L = 64, inset = 90;
  g.add(kit.rbox(-w / 2, h - TT, d / 2, w, TT, d, 8));                                             // the top
  g.add(kit.box(-w / 2 + inset, h - TT - 70, d / 2 - inset + 8, w - 2 * inset, 70, d - 2 * inset + 16, lo));   // a deep apron under it, set in
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(kit.box(sx * (w / 2 - inset - L / 2) - L / 2, 0, sz * (d / 2 - inset - L / 2) + L / 2, L, h - TT, L));
  return kit.merge(g);
}
export function chair(kit) {
  const g = kit.group(), lo = { tone: 'lo' }, S = 430, LEG = 36, seatY = 415;
  g.add(kit.rbox(-S / 2, seatY, S / 2, S, 36, S, 8));                                              // the seat
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(kit.box(sx * (S / 2 - 22 - LEG / 2) - LEG / 2, 0, sz * (S / 2 - 22 - LEG / 2) + LEG / 2, LEG, seatY, LEG));
  for (const sx of [-1, 1]) g.add(kit.box(sx * (S / 2 - 22 - LEG / 2) - LEG / 2, seatY + 36, -S / 2 + 22 + LEG, LEG, 360, LEG));   // the back uprights
  g.add(kit.rbox(-S / 2 + 22, 745, -S / 2 + 22 + LEG - 4, S - 44, 70, 26, 6, lo));                  // the top rail
  g.add(kit.rbox(-S / 2 + 22 + LEG, 610, -S / 2 + 22 + LEG - 8, S - 44 - 2 * LEG, 36, 18, 4, lo)); // a lower rail
  return kit.merge(g);
}
