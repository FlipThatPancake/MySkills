// @js:library-rooms — pieces for a bedroom, a home office, a hallway and a reading corner, drawn like the rest. Floor pieces have their origin in the middle of the footprint on the floor, front toward +z
// (a bed has its head toward -z: back it onto a wall); wall pieces (coatHooks) at the bottom middle on the wall face.
// bed({ w = 1600, l = 2100 }), bedsideTable({ w = 450, d = 380, h = 520 }), wardrobe({ w = 1200, h = 2100, d = 600 }), desk({ w = 1400, d = 700, h = 740 }), deskChair(), coatHooks({ n = 4, w = 900 }),
// daybed({ w = 1900, d = 850 }), readingChair() (an armchair with a high back), footstool({ w = 520 }), console({ w = 1100, d = 330, h = 800 }).
import { armchair } from './living.js';
const lo = { tone: 'lo' };
const bx = (kit) => (cx, y, cz, w, h, d, o) => kit.box(cx - w / 2, y, cz + d / 2, w, h, d, o), rb = (kit) => (cx, y, cz, w, h, d, r, o) => kit.rbox(cx - w / 2, y, cz + d / 2, w, h, d, r, o);
export function bed(kit, { w = 1600, l = 2100 } = {}) {
  const g = kit.group(), B = bx(kit), R = rb(kit);
  g.add(R(0, 0, 0, w + 60, 300, l, 14));                                                    // the base
  g.add(R(0, 300, 40, w - 20, 210, l - 100, 40, lo));                                       // the mattress
  g.add(B(0, 300, -l / 2 + 25, w + 60, 1000, 50));                                          // the headboard
  g.add(R(0, 505, 260, w - 40, 90, l - 760, 36));                                           // the duvet, folded back at the top
  for (const s of [-1, 1]) g.add(R(s * w * 0.24, 510, -l / 2 + 240, w * 0.4, 130, 330, 50, lo));   // two pillows
  return kit.merge(g);
}
export function bedsideTable(kit, { w = 450, d = 380, h = 520 } = {}) {
  const g = kit.group(), B = bx(kit), R = rb(kit), pts = [], z = d / 2 + 0.6;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(kit.cyl(sx * (w / 2 - 36), 0, sz * (d / 2 - 36), 16, 130, { rTop: 12, seg: 10, ...lo }));
  g.add(R(0, 130, 0, w, h - 130, d, 6)); 
  for (const y of [150, 330]) { pts.push([-w / 2 + 20, y, z], [w / 2 - 20, y, z], [w / 2 - 20, y, z], [w / 2 - 20, y + 170, z], [w / 2 - 20, y + 170, z], [-w / 2 + 20, y + 170, z], [-w / 2 + 20, y + 170, z], [-w / 2 + 20, y, z]); g.add(kit.cyl(0, y + 85, z, 14, 10, { axis: 'z', seg: 12, ...lo })); }
  g.add(kit.lines(pts, 'lo'));
  return kit.merge(g);
}
export function wardrobe(kit, { w = 1200, h = 2100, d = 600 } = {}) {
  const g = kit.group(), B = bx(kit), pts = [], z = d / 2 + 0.6, n = w >= 1400 ? 3 : 2, cw = (w - 40) / n;
  g.add(B(0, 0, 0, w, 70, d - 60, lo)); g.add(kit.rbox(-w / 2, 70, d / 2, w, h - 70, d, 8));
  for (let i = 0; i < n; i++) { const x0 = -w / 2 + 20 + i * cw + 4, x1 = x0 + cw - 8; pts.push([x0, 90, z], [x1, 90, z], [x1, 90, z], [x1, h - 40, z], [x1, h - 40, z], [x0, h - 40, z], [x0, h - 40, z], [x0, 90, z]); g.add(kit.cyl(i % 2 ? x0 + 36 : x1 - 36, h * 0.52, z + 4, 8, 260, { seg: 10, ...lo })); }
  g.add(kit.lines(pts, 'lo'));
  return kit.merge(g);
}
export function desk(kit, { w = 1400, d = 700, h = 740 } = {}) {
  const g = kit.group(), B = bx(kit), R = rb(kit), TT = 30, pts = [], z = d / 2 + 0.6;
  g.add(R(0, h - TT, 0, w, TT, d, 6));
  g.add(B(-w / 2 + 25, 0, 0, 30, h - TT, d - 60));                                          // a side panel
  g.add(R(w / 2 - 230, 0, 0, 440, h - TT, d - 40, 4)); g.add(B(0, 450, -d / 2 + 80, w - 80, 20, 20, lo));   // a drawer unit and a rail
  for (const y of [90, 280, 460]) { pts.push([w / 2 - 440, y, z - 20], [w / 2 - 30, y, z - 20], [w / 2 - 30, y, z - 20], [w / 2 - 30, y + 170, z - 20], [w / 2 - 30, y + 170, z - 20], [w / 2 - 440, y + 170, z - 20], [w / 2 - 440, y + 170, z - 20], [w / 2 - 440, y, z - 20]); g.add(kit.cyl(w / 2 - 235, y + 85, z - 16, 14, 10, { axis: 'z', seg: 12, ...lo })); }
  g.add(kit.lines(pts, 'lo'));
  return kit.merge(g);
}
export function deskChair(kit) {   // a swivel chair: five-star base, a gas post, a round seat and a curved back
  const T = kit.THREE, g = kit.group();
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5, c = Math.cos(a), s = Math.sin(a), m = kit.solid(new T.CylinderGeometry(12, 16, 290, 8), c * 145, 60, s * 145, { smooth: true, ...lo }); m.rotation.set(0, 0, 0); m.position.set(c * 145, 35, s * 145); m.scale.set(1, 1, 1); m.rotation.order = 'YXZ'; m.rotation.y = -a; m.rotation.z = Math.PI / 2; g.add(m); g.add(kit.cyl(c * 270, 0, s * 270, 26, 40, { seg: 12, ...lo })); }
  g.add(kit.cyl(0, 60, 0, 22, 330, { seg: 14, ...lo }));
  g.add(kit.cyl(0, 400, 0, 230, 70, { rTop: 215, seg: 32 }));
  g.add(kit.rbox(-190, 520, -180, 380, 330, 60, 60));
  g.add(kit.cyl(0, 470, -215, 14, 100, { seg: 10, ...lo }));
  return kit.merge(g);
}
export function coatHooks(kit, { n = 4, w = 900 } = {}) {   // a wooden board on the wall with hooks, a coat and a scarf
  const g = kit.group(), pts = [];
  g.add(kit.rbox(-w / 2, 0, 24, w, 120, 24, 6));
  for (let i = 0; i < n; i++) { const x = -w / 2 + w * (i + 0.5) / n; g.add(kit.cyl(x, 80, 24 + 55, 9, 55, { axis: 'z', seg: 10 })); g.add(kit.cyl(x, 80, 24 + 80, 13, 24, { seg: 10, ...lo })); }
  const x = -w / 2 + w * 1.5 / n; g.add(kit.rbox(x - 190, -980, 24 + 105, 380, 1060, 70, 60, lo));   // a coat on the second hook
  g.add(kit.rbox(-w / 2 + w * 3.5 / n - 60, -520, 24 + 75, 120, 590, 36, 26));                         // a scarf on the fourth
  return kit.merge(g);
}
export function daybed(kit, { w = 1900, d = 850 } = {}) {
  const g = kit.group(), B = bx(kit), R = rb(kit);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(kit.cyl(sx * (w / 2 - 70), 0, sz * (d / 2 - 60), 24, 170, { rTop: 18, seg: 12, ...lo }));
  g.add(R(0, 170, 0, w, 90, d, 10)); g.add(R(0, 260, 20, w - 40, 170, d - 40, 36, lo));
  g.add(R(0, 430, -d / 2 + 30, w, 380, 60, 14)); for (const s of [-1, 1]) g.add(R(s * (w / 2 - 30), 260, 0, 60, 330, d, 14));   // back and ends
  g.add(R(-w / 2 + 250, 430, 40, 140, 140, 520, 60));                                                // a bolster
  return kit.merge(g);
}
export const readingChair = (kit, p = {}) => armchair(kit, { w: 820, d: 900, ...p });
export function footstool(kit, { w = 520 } = {}) {
  const g = kit.group();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(kit.cyl(sx * (w / 2 - 50), 0, sz * (w / 2 - 50) * 0.8, 20, 130, { rTop: 14, seg: 10, ...lo }));
  g.add(kit.rbox(-w / 2, 130, w * 0.4, w, 170, w * 0.8, 40));
  return kit.merge(g);
}
export function console_(kit, { w = 1100, d = 330, h = 800 } = {}) {   // a narrow hall console with one drawer and a low shelf
  const g = kit.group(), pts = [], z = d / 2 + 0.6;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(kit.cyl(sx * (w / 2 - 40), 0, sz * (d / 2 - 36), 18, h - 70, { rTop: 14, seg: 10, ...lo }));
  g.add(kit.rbox(-w / 2, h - 30, d / 2, w, 30, d, 6)); g.add(kit.rbox(-w / 2 + 20, h - 140, d / 2 - 10, w - 40, 110, d - 20, 4)); g.add(kit.rbox(-w / 2 + 40, 200, d / 2 - 20, w - 80, 20, d - 40, 4, lo));
  g.add(kit.cyl(0, h - 85, z, 14, 10, { axis: 'z', seg: 12, ...lo }));
  return kit.merge(g);
}
