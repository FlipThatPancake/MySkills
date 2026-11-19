// @js:library-kitchenware — small kitchen things, drawn like the rest. Origins: the middle of the foot (jars, kettle, herbs, trolley); teaTowel at the middle of its rail on the wall face.
// jars({ n = 3 }), kettle(), herbs({ n = 3 }), trolley({ w = 650, d = 400, h = 820 }), teaTowel({ w = 480 }).
import { drape } from './soft.js';
import { potTop } from './pots.js';
import { blade, place, curvedStem } from './leaves.js';
const lo = { tone: 'lo' };
export function jars(kit, { n = 3 } = {}) {   // canisters of different heights, each with a lid and a knob
  const g = kit.group(), hs = [190, 150, 220, 170];
  for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * 150, h = hs[i % hs.length]; g.add(kit.cyl(x, 0, 0, 62, h, { seg: 24 })); g.add(kit.cyl(x, h, 0, 66, 22, { seg: 24, ...lo })); g.add(kit.cyl(x, h + 22, 0, 12, 14, { seg: 12 })); }
  return kit.merge(g);
}
export function kettle(kit) {   // a stovetop kettle: tapered body, lid with a knob, a spout and an arched handle
  const T = kit.THREE, g = kit.group();
  g.add(kit.cyl(0, 0, 0, 105, 150, { rTop: 85, seg: 28 })); g.add(kit.cyl(0, 150, 0, 78, 22, { rTop: 40, seg: 28, ...lo })); g.add(kit.cyl(0, 172, 0, 14, 20, { seg: 12 }));
  const sp = kit.cyl(0, 0, 0, 24, 120, { rTop: 14, seg: 12, ...lo }); sp.position.set(112, 100, 0); sp.rotation.z = -0.9; g.add(sp);
  const arc = new T.CatmullRomCurve3([[-80, 150, 0], [-110, 215, 0], [-20, 245, 0], [60, 215, 0], [75, 150, 0]].map((p) => new T.Vector3(...p)));
  g.add(kit.solid(new T.TubeGeometry(arc, 16, 8, 8), 0, 0, 0, { smooth: true, ...lo }));
  return kit.merge(g);
}
// Three small herb pots in a row, each a different herb in green leaves: basil (oval leaves in pairs on upright stems), chives (a fountain of thin arching blades), parsley (rounded leaflets on bending stalks). Origin the middle of the row at the surface.
const rndH = (seed) => { let r = (seed || 1) * 9301 + 49297; return () => { r = (r * 9301 + 49297) % 233280; return r / 233280; }; };
const unit = (v) => { const l = Math.hypot(...v) || 1; return v.map((x) => x / l); };
export function herbs(kit, { n = 3, seed = 3 } = {}) {
  const g = kit.group(), R = rndH(seed), kinds = ['basil', 'chives', 'parsley', 'basil'], PH = 70;
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 120, kind = kinds[(i + (seed % 3)) % kinds.length], h = new (kit.THREE.Group)();
    h.add(kit.cyl(0, 0, 0, 38, PH, { rTop: 46, seg: 20, ...lo })); const top = potTop(kit, 46, { dip: 12 }); top.position.y = PH; h.add(top);
    if (kind === 'chives') {
      for (let k = 0; k < 26; k++) { const a = k / 26 * 6.2832 * 2.3 + R(), r = 6 + R() * 22, len = 90 + R() * 70, lean = 0.12 + R() * 0.5; place(kit, h, blade(kit, len, 5 + R() * 3, { profile: 'grass', fold: 0.4, bow: 0.5, veins: 0, N: 6, M: 2 }), [Math.sin(a) * r, PH - 6, Math.cos(a) * r], unit([Math.sin(a) * lean, 1, Math.cos(a) * lean]), 0, [0, 0, 1]); }
    } else {
      const stems = kind === 'basil' ? 5 : 8;
      for (let s = 0; s < stems; s++) {
        const a = s / stems * 6.2832 + R(), r = 5 + R() * 14, base = [Math.sin(a) * r, PH - 6, Math.cos(a) * r], top = (kind === 'basil' ? 85 : 70) + R() * 35, out = kind === 'basil' ? 0.12 : 0.55;
        const st = curvedStem(kit, h, base, [Math.sin(a) * out, 1, Math.cos(a) * out], top, 0.25, 4, 1.8);
        for (let q = 1; q <= 4; q++) {
          const pt = st.pts[q], size = (kind === 'basil' ? 38 : 26) - (q - 1) * 3 + R() * 5;
          for (const m of kind === 'basil' ? [0, 1] : [0]) { const b = a + (q % 2 ? 0 : 1.57) + m * Math.PI + (R() - 0.5) * 0.7; place(kit, h, blade(kit, size, size * (kind === 'basil' ? 0.75 : 0.9), { profile: kind === 'basil' ? 'oval' : 'heart', fold: 0.3, bow: 0.3, curl: 0.05, veins: 2, N: 5, M: 4 }), pt, unit([Math.sin(b), 0.15 + 0.05 * q + 0.3 * (R() - 0.3), Math.cos(b)]), b, [0, 1, 0]); }
        }
        place(kit, h, blade(kit, 24, 20, { profile: kind === 'basil' ? 'oval' : 'heart', fold: 0.3, bow: 0.1, veins: 0, N: 4, M: 3 }), st.end, [0, 1, 0], a, [0, 0, 1]);
      }
    }
    h.position.x = x; g.add(h);
  }
  return kit.merge(g);
}
// Salt and pepper: two small shakers or a salt pot beside a wooden pepper mill. form 'shakers' (a glass pair with pierced metal caps), 'mill' (a short salt cellar with a spoon, and a tall turned pepper mill). Origin the middle of the pair at the surface; about 130 wide.
export function saltPepper(kit, { form = 'shakers' } = {}) {
  const T = kit.THREE, g = kit.group(), P = (r, h) => [[r * 0.82, 0], [r, 4], [r * 1.02, h * 0.5], [r * 0.95, h]];
  if (form === 'mill') {
    g.add(kit.solid(new T.LatheGeometry([[0.01, 0], [34, 0], [38, 10], [40, 30], [34, 44], [0.01, 44]].map(([a, b]) => new T.Vector2(a, b)), 24), -42, 0, 0, { smooth: true, tone: 'lo' }));   // a salt cellar, lid up
    g.add(kit.cyl(-42, 44, 0, 8, 12, { seg: 10, tone: 'lo' }));
    g.add(kit.solid(new T.LatheGeometry([[0.01, 0], [28, 0], [30, 6], [22, 50], [20, 120], [26, 170], [18, 190], [9, 196], [0.01, 198]].map(([a, b]) => new T.Vector2(a, b)), 28), 40, 0, 0, { smooth: true }));   // the turned mill
    g.add(kit.lines(Array.from({ length: 22 }, (_, i) => { const a = i / 22 * 6.2832, b = (i + 1) / 22 * 6.2832; return [[40 + Math.cos(a) * 27, 56, Math.sin(a) * 27], [40 + Math.cos(b) * 27, 56, Math.sin(b) * 27]]; }).flat(), 'mid'));
    return kit.merge(g);
  }
  for (const [x, tone, holes] of [[-34, undefined, 3], [34, 'lo', 5]]) {
    g.add(kit.solid(new T.LatheGeometry(P(24, 78).map(([a, b]) => new T.Vector2(a, b)), 20), x, 0, 0, { smooth: true }));   // the glass body
    g.add(kit.solid(new T.LatheGeometry([[0.01, 78], [24, 78], [24, 90], [20, 98], [0.01, 100]].map(([a, b]) => new T.Vector2(a, b)), 20), x, 0, 0, { smooth: true, tone: tone || 'mid' }));   // the cap
    const hl = []; for (let i = 0; i < holes; i++) { const a = i / holes * 6.2832; hl.push([x + Math.cos(a) * 9, 100.6, Math.sin(a) * 9], [x + Math.cos(a) * 9 + 2, 100.6, Math.sin(a) * 9]); } hl.push([x, 100.6, 0], [x + 2, 100.6, 0]); g.add(kit.lines(hl, 'mid'));
  }
  return kit.merge(g);
}
export function trolley(kit, { w = 650, d = 400, h = 820 } = {}) {   // a kitchen trolley: three tiers on four posts, wheels, a rail along one side
  const g = kit.group(), T = 24;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { g.add(kit.cyl(sx * (w / 2 - 25), 60, sz * (d / 2 - 25), 14, h - 60, { seg: 12, through: true })); g.add(kit.cyl(sx * (w / 2 - 25), 0, sz * (d / 2 - 25), 30, 50, { seg: 16, ...lo })); }
  for (const y of [h - T, 380, 130]) g.add(kit.rbox(-w / 2, y, d / 2, w, T, d, 6));
  g.add(kit.cyl(-w / 2 + 25, h - 120, d / 2 - 10, 7, w - 50, { axis: 'x', seg: 12 }));
  return kit.merge(g);
}
export function teaTowel(kit, { w = 480, cw = 0, hang = 400, tone = 'lo', stripes = 'band', seed = 2 } = {}) {   // a rail on the wall with a tea towel folded over it: a front panel and a shorter back panel joined at a soft fold over the rail. The rail is at the bottom of the piece, the cloth hangs below it. stripes none|band|check
  const g = kit.group(), cWid = cw || w * 0.46, ph = seed * 1.7;
  for (const sx of [-1, 1]) g.add(kit.cyl(sx * (w / 2 - 20), 0, 60, 10, 60, { axis: 'z', seg: 12, ...lo }));
  g.add(kit.cyl(-w / 2, 0, 60, 10, w, { axis: 'x', seg: 14 }));
  const fr = drape(kit, cWid, hang, { folds: 2.5, depth: 22, thick: 7, flare: 0.03, phase: ph, nx: 24, ny: 12, tone }); fr.position.set(0, 12, 76); g.add(fr);   // the front panel
  const bk = drape(kit, cWid, hang * 0.72, { folds: 2, depth: 12, thick: 6, flare: 0.03, phase: ph + 1.3, nx: 18, ny: 8, tone }); bk.position.set(0, 12, 46); g.add(bk);   // the shorter back panel
  const fold = kit.cyl(-cWid / 2, 0, 61, 15.5, cWid, { axis: 'x', seg: 16, tone, through: true }); g.add(fold);   // the cloth over the rail: a soft fold
  const pts = [];
  if (stripes === 'band') for (const y of [-hang * 0.62, -hang * 0.66, -hang * 0.9, -hang * 0.94]) pts.push([-cWid / 2 * 1.02, y, 94], [cWid / 2 * 1.02, y, 94]);
  else if (stripes === 'check') { for (let k = -2; k <= 2; k++) pts.push([k * cWid * 0.18, -hang * 0.1, 95], [k * cWid * 0.18, -hang * 0.96, 95]); for (let y = -hang * 0.2; y > -hang * 0.95; y -= hang * 0.18) pts.push([-cWid / 2 * 0.95, y, 95], [cWid / 2 * 0.95, y, 95]); }
  if (pts.length) g.add(kit.lines(pts, 'mid'));
  return kit.merge(g);
}
