// @js:library-plants — plants that read as species at a glance, every leaf drawn as a leaf (see leaves.js): fiddle-leaf fig, palm, monstera, snake plant, fern, trailing pothos, basil.
import { blade, monsteraLeaf, stem, place, curvedStem } from './leaves.js';
import { potTop } from './pots.js';
const rnd = (seed) => { let r = (seed || 1) * 9301 + 49297; return () => { r = (r * 9301 + 49297) % 233280; return r / 233280; }; };
const lo = { tone: 'lo' };
const pot = (kit, g, r0, r1, h) => { g.add(kit.cyl(0, 0, 0, r0, h, { rTop: r1, seg: 32, ...lo })); const t = potTop(kit, r1); t.position.y = h; g.add(t); };
const norm = (v) => { const l = Math.hypot(...v) || 1; return v.map((x) => x / l); };
const dirOf = (a, el) => [Math.sin(a) * Math.cos(el), Math.sin(el), Math.cos(a) * Math.cos(el)];   // azimuth a, elevation el (radians)

// a frond: a curved rachis with pairs of narrow leaflets that shorten toward the tip; fronds arch out and down
function frond(kit, g, R, from, a, len, { el = 1.1, droop = 1.4, pairs = 13, pinna = 110, wid = 22, sweep = 0.9, r0 = 4 } = {}) {
  const side = [Math.cos(a), 0, -Math.sin(a)], pts = [from.slice()]; let p = from.slice(), e = el;
  const N = 24, L = [];
  for (let i = 1; i <= N; i++) { e -= droop / N; const d = dirOf(a, e); p = [p[0] + d[0] * len / N, p[1] + d[1] * len / N, p[2] + d[2] * len / N]; pts.push(p); }
  for (let i = 0; i < N; i++) L.push(pts[i], pts[i + 1]);
  g.add(kit.lines(L, 'green'));
  for (let i = 0; i < pairs; i++) {
    const t = 0.14 + 0.86 * i / (pairs - 1) - (i === pairs - 1 ? 0.02 : 0), k = Math.min(N - 1, Math.floor(t * N)), q = pts[k], tg = norm([pts[k + 1][0] - q[0], pts[k + 1][1] - q[1], pts[k + 1][2] - q[2]]);
    const ln = pinna * (0.45 + 0.55 * Math.sin(Math.PI * (0.1 + 0.8 * t))) * (0.9 + 0.2 * R());
    for (const s of [-1, 1]) { const dr = norm([tg[0] * sweep + side[0] * s, tg[1] * sweep + side[1] * s - 0.25, tg[2] * sweep + side[2] * s]); place(kit, g, blade(kit, ln, wid, { profile: 'lance', fold: 0.1, bow: 0.12, curl: 0, veins: 0, N: 4, M: 2 }), q, dr, a, [0, 1, 0]); }
  }
  const t = pts[N], pr = pts[N - 1]; place(kit, g, blade(kit, pinna * 0.7, wid, { profile: 'lance', fold: 0.1, bow: 0.1, veins: 0, N: 4, M: 2 }), t, norm([t[0] - pr[0], t[1] - pr[1], t[2] - pr[2]]), a, [0, 1, 0]);   // a terminal leaflet
}

export function fiddle(kit, { h = 950, seed = 6 } = {}) {   // a fiddle-leaf fig: a bare lower trunk, then broad violin-shaped leaves with wavy edges and pale veins set close up the trunk, mostly facing out, a folded new leaf at the tip
  const g = kit.group(), R = rnd(seed); pot(kit, g, 140, 180, 300);
  const top = h - 200, lean = (R() - 0.5) * 0.22, n = 20, S = 10;
  const trunk = curvedStem(kit, g, [0, 315, 0], [lean, 1, 0.05], top - 315, 0.25, S, 12);
  for (let i = 0; i < n; i++) {
    const t = 0.3 + 0.7 * i / (n - 1), q = trunk.pts[Math.min(S, Math.round(t * S))], a = i * 2.4 + R() * 0.5;
    const len = (200 + 110 * Math.sin(Math.PI * (0.05 + 0.9 * (1 - Math.abs(t - 0.6) / 0.7)))) * (0.88 + 0.24 * R()) * (i === n - 1 ? 0.55 : 1), up = 0.12 + 0.55 * t * t;
    const dr = norm([Math.sin(a), up, Math.cos(a)]), pet = 25 + 15 * R(), end = [q[0] + dr[0] * pet, q[1] + dr[1] * pet, q[2] + dr[2] * pet];
    g.add(stem(kit, q, end, 4, 3));
    place(kit, g, blade(kit, len, len * (0.72 + 0.1 * R()), { profile: 'fiddle', fold: 0.1 + 0.1 * R(), bow: 0.05 + 0.18 * R(), curl: 0.08, veins: 8, N: 16, M: 8, ruffle: 0.07 }), end, norm([dr[0], dr[1] * 0.5 + 0.12, dr[2]]), a, [dr[0] * 0.4, 1, dr[2] * 0.4]);
  }
  place(kit, g, blade(kit, 120, 36, { profile: 'lance', fold: 0.5, bow: 0.05, curl: 0, veins: 0, N: 6, M: 2 }), trunk.end, norm([lean, 1, 0.05]), 0, [0, 0, 1]);   // the new leaf: a folded spear
  return kit.merge(g);
}
export function palm(kit, { h = 950, seed = 6 } = {}) {   // a parlour palm: a clump of thin ringed canes at different heights, each crowned with arching fronds of narrow paired leaflets
  const g = kit.group(), R = rnd(seed); pot(kit, g, 130, 170, 300);
  const nc = 5;
  for (let c = 0; c < nc; c++) {
    const a = c * 2.4 + R(), top = h - 250 - ((c * 3) % 5) * 55, lean = 0.05 + 0.08 * R(), base = [Math.sin(a) * 30, 310, Math.cos(a) * 30];
    const cane = curvedStem(kit, g, base, [Math.sin(a) * lean, 1, Math.cos(a) * lean], top - 310, 0.1, 5, 7);
    for (let k = 1; k < 4; k++) { const q = cane.pts[Math.min(5, 1 + k)]; g.add(kit.lines([[q[0] - 8, q[1], q[2]], [q[0] + 8, q[1], q[2] + 4]], 'green')); }   // the rings where old fronds fell
    const f = 4 + (c % 2);
    for (let k = 0; k < f; k++) frond(kit, g, R, cane.end, a + k / f * Math.PI * 2 + R() * 0.5, 200 + R() * 90, { el: 1.2 + R() * 0.3, droop: 1.8 + R() * 0.6, pairs: 13, pinna: 105, wid: 12, r0: 3 });
  }
  return kit.merge(g);
}
export function monstera(kit, { h = 950, seed = 6 } = {}) {   // a monstera: long petioles that bend each broad heart leaf outward and down, slits from the edge toward the midrib, a row of holes beside it, a young whole leaf
  const g = kit.group(), R = rnd(seed); pot(kit, g, 150, 190, 300);
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = i * 2.4 + R() * 0.5, young = i === 2, spread = 0.08 + 0.07 * (i % 3) + 0.012 * i, hh = (h - 300 - 260) * (0.5 + 0.5 * ((i * 5) % 7) / 6);
    const st = curvedStem(kit, g, [Math.sin(a) * 25, 310, Math.cos(a) * 25], [Math.sin(a) * spread, 1, Math.cos(a) * spread], hh + 80, 0.5 + 0.3 * R(), 7, 7);
    const L = (young ? 110 : 185) + 30 * R(), lf = monsteraLeaf(kit, L, { slits: young ? 0 : 4 + (i % 2), depth: 0.6 + 0.2 * R(), seed: seed + i, fold: 0.1 + 0.08 * R(), bow: -0.12 - 0.2 * R() });
    const el = -0.95 + 0.4 * R();   // the stalk bends the leaf outward, its face turned outward and slightly up
    place(kit, g, lf, st.end, norm([Math.sin(a), el, Math.cos(a)]), 0, [Math.sin(a) * 1.5, 0.5, Math.cos(a) * 1.5]);
  }
  return kit.merge(g);
}
export function snake(kit, { h = 950, seed = 6 } = {}) {   // a snake plant: stiff upright sword blades, pointed, with wavy crossbands and a pale border, a few leaning and twisting, in a square planter
  const g = kit.group(), R = rnd(seed);
  g.add(kit.box(-150, 0, 150, 300, 310, 300, lo)); g.add(kit.box(-162, 310, 162, 324, 22, 324));
  for (let k = 0; k < 15; k++) {
    const a = k * 2.4 + R(), r = 15 + R() * 90, len = (300 + R() * (h - 700)) * (k < 4 ? 1 : 0.8), tilt = 0.04 + R() * 0.3;
    const bl = blade(kit, len, 62 + R() * 34, { profile: 'sword', fold: 0.12 + 0.1 * R(), bow: 0.02 + 0.1 * R(), curl: 0, veins: 0, bands: 10, edge: 0.1, N: 16, M: 4, wave: 0.02 });
    place(kit, g, bl, [Math.sin(a) * r, 330, Math.cos(a) * r], norm([Math.sin(a) * tilt, 1, Math.cos(a) * tilt]), a, [Math.sin(a), 0.1, Math.cos(a)]);
  }
  return kit.merge(g);
}
export function fern(kit, { h = 950, seed = 6 } = {}) {   // a big Boston fern: a fountain of arching fronds of many fine paired leaflets, some over the rim
  const g = kit.group(), R = rnd(seed); pot(kit, g, 150, 190, 300);
  for (let k = 0; k < 17; k++) frond(kit, g, R, [0, 312, 0], k * 2.4 + R() * 0.4, 200 + R() * 130, { el: 0.85 + R() * 0.6, droop: 1.2 + R() * 0.7, pairs: 22, pinna: 78, wid: 15, sweep: 0.7 });
  return kit.merge(g);
}
export function pothos(kit, { seed = 6 } = {}) {   // pothos: a few short vines hang down the pot and stop at the surface it stands on, 2-3 longer ones run along the surface; heart leaves on short stalks, smaller toward the tips
  const g = kit.group(), R = rnd(seed); g.add(kit.cyl(0, 0, 0, 50, 80, { rTop: 58, seg: 20, ...lo })); const t = potTop(kit, 58); t.position.y = 80; g.add(t);
  const K = 18, run = R() * 6.28, vines = [];
  for (let v = 0; v < 4; v++) vines.push({ a: v / 4 * 6.28 + R() * 0.6, ex: 0, K: 7 });   // hanging vines: over the rim and down the pot side
  for (let v = 0; v < 3; v++) vines.push({ a: run + (v - 1) * 0.5 + R() * 0.2, ex: 30 + R() * 25, K });   // vines that run along the surface
  for (const { a, ex, K: n } of vines) {
    const pts = [];
    for (let i = 0; i <= n; i++) { const u = i / n, over = Math.min(1, u * (ex ? 4 : 2.2)); pts.push([Math.sin(a) * (22 + 40 * over + ex * Math.max(0, u - 0.25)), Math.max(5, ex ? 84 + 70 * Math.sin(Math.PI * Math.min(1, u / 0.3)) * (u < 0.3 ? 1 : 0) - 150 * Math.max(0, u - 0.3) : 84 + 30 * Math.sin(Math.PI * Math.min(1, u / 0.2)) * (u < 0.2 ? 1 : 0) - 82 * u * 1.1), Math.cos(a) * (22 + 40 * over + ex * Math.max(0, u - 0.25))]); }
    for (let i = 0; i < n; i++) g.add(stem(kit, pts[i], pts[i + 1], 2.2, 2));
    for (let i = 2; i <= n; i++) {
      const q = pts[i], p0 = pts[i - 1], tg = norm([q[0] - p0[0], q[1] - p0[1], q[2] - p0[2]]), s = i % 2 ? 1 : -1, size = (40 - 1.2 * i * (18 / n) + R() * 6) * (i === n ? 0.7 : 1), onSurface = q[1] <= 8;
      const dr = onSurface ? norm([tg[0] + Math.cos(a) * s * 1.2, 0.05, tg[2] - Math.sin(a) * s * 1.2]) : norm([tg[0] + Math.cos(a) * s * 0.9, tg[1] * 0.5 - 0.1, tg[2] - Math.sin(a) * s * 0.9]);
      place(kit, g, blade(kit, size, size * 0.85, { profile: 'heart', fold: 0.1, bow: 0.12, curl: 0.1, veins: 3, N: 6, M: 4 }), [q[0], Math.max(4, q[1]), q[2]], dr, i, [0, 1, 0]);
    }
  }
  return kit.merge(g);
}
export function basil(kit, { seed = 6 } = {}) {   // basil: a bushy rounded mound 200-260 mm tall, oval cupped leaves in opposite pairs from the soil up, dense and spreading, smaller toward the top
  const g = kit.group(), R = rnd(seed); g.add(kit.cyl(0, 0, 0, 46, 70, { rTop: 56, seg: 20, ...lo })); const t = potTop(kit, 56); t.position.y = 70; g.add(t);
  const ns = 8;
  for (let s = 0; s < ns; s++) {
    const a = s / ns * Math.PI * 2 + R(), r = s === 0 ? 0 : 8 + R() * 14, top = (s === 0 ? 150 : 105 - 10 * R()) + R() * 20, base = [Math.sin(a) * r, 70, Math.cos(a) * r];
    const st = curvedStem(kit, g, base, [Math.sin(a) * (s ? 0.1 : 0.1), 1, Math.cos(a) * (s ? 0.1 : 0.1)], top, 0.2, 6, 2.5);
    for (let i = 1; i <= 6; i++) {
      const q = st.pts[i], size = 42 - (i - 1) * 3 + R() * 6;
      for (const m of [0, 1]) { if (i > 1 && R() < 0.2) continue; const b = a + (i % 2 ? 0 : Math.PI / 2) + m * Math.PI + (R() - 0.5) * 0.7; place(kit, g, blade(kit, size, size * 0.8, { profile: 'oval', fold: 0.3, bow: 0.3, curl: 0.06, veins: 2, N: 5, M: 4 }), q, norm([Math.sin(b), 0.1 + 0.05 * i + 0.3 * (R() - 0.3), Math.cos(b)]), b, [0, 1, 0]); }
    }
    place(kit, g, blade(kit, 34, 24, { profile: 'oval', fold: 0.3, bow: 0.1, veins: 0, N: 4, M: 3 }), st.end, [0, 1, 0], a, [0, 0, 1]);
  }
  return kit.merge(g);
}
export function smallFern(kit, { seed = 6 } = {}) {   // a small fern on a worktop: a fan of fine fronds
  const g = kit.group(), R = rnd(seed); g.add(kit.cyl(0, 0, 0, 48, 72, { rTop: 58, seg: 20, ...lo })); const t = potTop(kit, 58); t.position.y = 72; g.add(t);
  for (let k = 0; k < 9; k++) frond(kit, g, R, [0, 76, 0], k * 2.4 + R() * 0.4, 130 + R() * 90, { el: 1.0 + R() * 0.5, droop: 1.3 + R() * 0.5, pairs: 11, pinna: 38, wid: 9, sweep: 0.7 });
  return kit.merge(g);
}

// ---- vase contents: cut stems with real leaves (the old discs and lollipops are gone). Origin: the middle of the vase's foot; the vase body is drawn here, stems rise from its mouth at `mouth`.
const vaseBody = (kit, g, form) => {
  if (form === 1) { g.add(kit.cyl(0, 0, 0, 80, 130, { rTop: 85, seg: 24 })); g.add(kit.cyl(0, 130, 0, 85, 80, { rTop: 42, seg: 24 })); return 210; }   // a round jug
  if (form === 2) { g.add(kit.cyl(0, 0, 0, 70, 200, { rTop: 70, seg: 24 })); return 200; }   // a tall cylinder
  g.add(kit.cyl(0, 0, 0, 55, 90, { rTop: 85, seg: 24 })); g.add(kit.cyl(0, 90, 0, 85, 70, { rTop: 60, seg: 24 })); return 160;   // a bowl-shaped vase
};
// a leafy stem: a curved cut stem with leaves along the upper part, sized to taper toward the tip; `pair` puts them in opposite pairs, else alternate; fork adds side shoots
function leafyStem(kit, g, R, from, dir, len, { bend = 0.6, leaf, size = 30, from0 = 0.3, step = 1, pair = false, shoots = 0 } = {}) {
  const n = 12, st = curvedStem(kit, g, from, dir, len, bend, n, 2.6);
  const side = (a, k) => [Math.cos(a) * k, 0, -Math.sin(a) * k];
  for (let i = Math.floor(n * from0); i <= n; i += step) {
    const q = st.pts[i], p0 = st.pts[Math.max(0, i - 1)], tg = norm([q[0] - p0[0], q[1] - p0[1], q[2] - p0[2]]), t = i / n, sz = size * (1.15 - 0.6 * t) * (0.85 + 0.3 * R());
    const a = i * 2.4 + R();
    for (const s of pair ? [-1, 1] : [i % 2 ? 1 : -1]) place(kit, g, leaf(sz), q, norm([tg[0] * 0.8 + Math.sin(a) * s, tg[1] * 0.8 + 0.15, tg[2] * 0.8 + Math.cos(a) * s]), a, [0, 1, 0]);
  }
  place(kit, g, leaf(size * 0.6), st.end, norm(st.dir), 0, [0, 0, 1]);
  for (let k = 0; k < shoots; k++) {   // short side shoots, themselves leafy
    const i = 4 + 3 * k, q = st.pts[i], a = k * 3.1 + R(), d = norm([Math.sin(a) * 0.7 + st.dir[0] * 0.4, 0.8, Math.cos(a) * 0.7 + st.dir[2] * 0.4]), sh = curvedStem(kit, g, q, d, len * 0.38, bend, 6, 1.8);
    for (let j = 2; j <= 6; j += 1) { const p = sh.pts[j], b = j * 2.1 + k; place(kit, g, leaf(size * (1 - 0.45 * j / 6)), p, norm([Math.sin(b), 0.5 + 0.3 * R(), Math.cos(b)]), b, [0, 1, 0]); }
    place(kit, g, leaf(size * 0.5), sh.end, norm(sh.dir), 0, [0, 0, 1]);
  }
}
export function vaseStems(kit, { form = 1, h = 280, stems = 5, seed = 3 } = {}) {   // 1 eucalyptus: arching stems of small round leaves in pairs | 2 leafy branches: forked branches of pointed leaves | 3 olive twigs: slim twigs dense with narrow leaves
  const g = kit.group(), R = rnd(seed + form * 5), m = vaseBody(kit, g, form), n = Math.min(stems, 5);
  for (let s = 0; s < n; s++) {
    const a = s * 2.4 + R(), lean = 0.12 + 0.32 * R() + (s ? 0 : -0.1), dir = [Math.sin(a) * lean, 1, Math.cos(a) * lean], base = [Math.sin(a) * 18, m - 6, Math.cos(a) * 18];
    if (form === 1) leafyStem(kit, g, R, base, dir, 300 + R() * 220, { bend: 0.9 + 0.5 * R(), leaf: (z) => blade(kit, z, z * 0.95, { profile: 'oval', fold: 0.18, bow: 0.1, curl: 0.04, veins: 0, N: 4, M: 3 }), size: 36, from0: 0.25, pair: true });
    else if (form === 2) leafyStem(kit, g, R, base, dir, 300 + R() * 200, { bend: 0.5 + 0.4 * R(), leaf: (z) => blade(kit, z, z * 0.42, { profile: 'lance', fold: 0.16, bow: 0.12, curl: 0.05, veins: 3, N: 6, M: 4 }), size: 78, from0: 0.35, shoots: 2 });
    else leafyStem(kit, g, R, base, dir, 320 + R() * 220, { bend: 0.7 + 0.4 * R(), leaf: (z) => blade(kit, z, z * 0.17, { profile: 'lance', fold: 0.1, bow: 0.08, curl: 0, veins: 0, N: 4, M: 2 }), size: 48, from0: 0.15, pair: true, shoots: 1 });
  }
  return kit.merge(g);
}
