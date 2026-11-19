// @js:library-hanging — a hanging plant: a wall plate with a short arm and hook, three cords to a small pot, pothos vines trailing down Its footprint in meta.js is 520 wide: the plant owns 300 mm of clear wall beside its pot, so nothing stands against the vines.
// Origin: bottom middle on the wall like other wall things (y = the lowest vine tip); the plate stands 1000 mm above it, the pot 230 mm out from the wall.
import { blade, stem, place } from './leaves.js';
import { potTop } from './pots.js';
import { rod } from './parts.js';
const rnd = (seed) => { let r = (seed || 1) * 9301 + 49297; return () => { r = (r * 9301 + 49297) % 233280; return r / 233280; }; };
const norm = (v) => { const l = Math.hypot(...v) || 1; return v.map((x) => x / l); };
export function hangingPlant(kit, { seed = 6 } = {}) {
  const g = kit.group(), R = rnd(seed), mid = { tone: 'mid' }, ARM = 230, PH = 100, PR = 95, TOP = 1000, HY = TOP - 40;   // HY: the hook's height
  g.add(kit.box(-35, TOP - 90, 10, 70, 90, 10, mid));                      // the plate, flat on the wall (z 0 to 10)
  g.add(kit.box(-6, HY - 6, ARM + 6, 12, 12, ARM - 4, mid));              // the arm, from the plate out to the hook (z 10 to 236)
  const py = HY - 400 - PH, rimY = py + PH;                                // the pot: base at py, rim PH above; cords 400 mm long
  const pot = kit.group(); pot.add(kit.cyl(0, 0, 0, PR * 0.62, PH, { rTop: PR, seg: 28, tone: 'lo' })); const t = potTop(kit, PR); t.position.y = PH; pot.add(t); pot.position.set(0, py, ARM); g.add(pot);
  for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.5; g.add(rod(kit, [0, HY - 6, ARM], [Math.sin(a) * PR * 0.9, rimY - 2, ARM + Math.cos(a) * PR * 0.9], 2.5, 2.5, 'mid')); }   // three cords from the hook to the rim
  for (let v = 0; v < 5; v++) {                                            // vines over the rim and down, with heart leaves
    const a = v / 5 * 6.28 + R() * 0.5, len = Math.min(py - 30, 240 + R() * 260), n = 9, pts = [];
    for (let i = 0; i <= n; i++) { const u = i / n, out = Math.min(1, u * 3); pts.push([Math.sin(a) * (PR - 8 + 16 * out + 12 * Math.sin(u * 5 + v)), rimY - 6 - len * u, ARM + Math.cos(a) * (PR - 8 + 16 * out + 12 * Math.sin(u * 4 + v))]); }
    for (let i = 0; i < n; i++) g.add(stem(kit, pts[i], pts[i + 1], 2.2, 1.8));
    for (let i = 1; i <= n; i++) {
      const q = pts[i], p0 = pts[i - 1], tg = norm([q[0] - p0[0], q[1] - p0[1], q[2] - p0[2]]), s = i % 2 ? 1 : -1, size = (42 - 1.8 * i + R() * 6) * (i === n ? 0.7 : 1);
      place(kit, g, blade(kit, size, size * 0.85, { profile: 'heart', fold: 0.1, bow: 0.12, curl: 0.1, veins: 3, N: 6, M: 4 }), q, norm([tg[0] + Math.cos(a) * s * 0.9, tg[1] * 0.5 - 0.1, tg[2] - Math.sin(a) * s * 0.9]), i, [0, 1, 0]);
    }
  }
  return kit.merge(g);
}
