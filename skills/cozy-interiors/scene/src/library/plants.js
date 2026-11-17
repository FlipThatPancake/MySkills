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
  const top = h - 40, lean = (R() - 0.5) * 0.22, n = 20, S = 10;
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
    for (let k = 0; k < f; k++) frond(kit, g, R, cane.end, a + k / f * Math.PI * 2 + R() * 0.5, 230 + R() * 110, { el: 1.2 + R() * 0.3, droop: 1.8 + R() * 0.6, pairs: 13, pinna: 105, wid: 12, r0: 3 });
  }
  return kit.merge(g);
}
export function monstera(kit, { h = 950, seed = 6 } = {}) {   // a monstera: long petioles that bend each broad heart leaf outward and down, slits from the edge toward the midrib, a row of holes beside it, a young whole leaf
  const g = kit.group(), R = rnd(seed); pot(kit, g, 150, 190, 300);
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = i * 2.4 + R() * 0.5, young = i === 2, spread = 0.25 + 0.2 * (i % 3) + 0.03 * i, hh = (h - 300 - 250) * (0.4 + 0.6 * ((i * 5) % 7) / 6);
    const st = curvedStem(kit, g, [Math.sin(a) * 25, 310, Math.cos(a) * 25], [Math.sin(a) * spread, 1, Math.cos(a) * spread], hh + 80, 1.0 + 0.5 * R(), 7, 7);
    const L = (young ? 150 : 250) + 50 * R(), lf = monsteraLeaf(kit, L, { slits: young ? 0 : 4 + (i % 2), depth: 0.6 + 0.2 * R(), seed: seed + i, fold: 0.1 + 0.08 * R(), bow: -0.12 - 0.2 * R() });
    const el = -0.75 + 0.55 * R();   // the stalk bends the leaf outward and down, its face turned outward and up
    place(kit, g, lf, st.end, norm([Math.sin(a), el, Math.cos(a)]), 0, [Math.sin(a) * 0.8, 0.7, Math.cos(a) * 0.8]);
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
  for (let k = 0; k < 17; k++) frond(kit, g, R, [0, 312, 0], k * 2.4 + R() * 0.4, 330 + R() * 260, { el: 0.85 + R() * 0.6, droop: 1.2 + R() * 0.7, pairs: 22, pinna: 78, wid: 15, sweep: 0.7 });
  return kit.merge(g);
}
export function pothos(kit, { seed = 6 } = {}) {   // pothos: vines that arch over the rim and hang down the pot and along the shelf, heart leaves on short stalks, smaller toward the tips
  const g = kit.group(), R = rnd(seed); g.add(kit.cyl(0, 0, 0, 50, 80, { rTop: 58, seg: 20, ...lo })); const t = potTop(kit, 58); t.position.y = 80; g.add(t);
  const nv = 8, K = 18;
  for (let v = 0; v < nv; v++) {
    const a = v / nv * Math.PI * 2 + R() * 0.4, ex = 30 + R() * 90, hang = R() < 0.5, pts = [];
    for (let i = 0; i <= K; i++) { const u = i / K, rho = 20 + 42 * Math.min(1, u * 3) + ex * Math.max(0, u - 0.3), y = Math.max(hang && u > 0.5 ? 8 + 55 * (1 - u) : 6, 86 + 80 * Math.sin(Math.PI * Math.min(1, u / 0.45)) * (u < 0.45 ? 1 : 0) - (u > 0.3 ? 260 * (u - 0.3) * (u - 0.3) * 3 : 0)); pts.push([Math.sin(a) * rho, Math.max(6, y), Math.cos(a) * rho]); }
    for (let i = 0; i < K; i++) g.add(stem(kit, pts[i], pts[i + 1], 2.2, 2));
    for (let i = 2; i <= K; i++) {
      const q = pts[i], p0 = pts[i - 1], tg = norm([q[0] - p0[0], q[1] - p0[1], q[2] - p0[2]]), s = i % 2 ? 1 : -1, size = (50 - 1.6 * i + R() * 10) * (i === K ? 0.7 : 1);
      const dr = norm([tg[0] + Math.cos(a) * s * 0.9, tg[1] * 0.5 - 0.1, tg[2] - Math.sin(a) * s * 0.9]);
      place(kit, g, blade(kit, size, size * 0.85, { profile: 'heart', fold: 0.1, bow: 0.12, curl: 0.1, veins: 3, N: 6, M: 4 }), [q[0], Math.max(4, q[1]), q[2]], dr, i, [0, 1, 0]);
    }
  }
  return kit.merge(g);
}
export function basil(kit, { seed = 6 } = {}) {   // basil: a bushy rounded mound 200-260 mm tall, oval cupped leaves in opposite pairs from the soil up, dense and spreading, smaller toward the top
  const g = kit.group(), R = rnd(seed); g.add(kit.cyl(0, 0, 0, 46, 70, { rTop: 56, seg: 20, ...lo })); const t = potTop(kit, 56); t.position.y = 70; g.add(t);
  const ns = 8;
  for (let s = 0; s < ns; s++) {
    const a = s / ns * Math.PI * 2 + R(), r = s === 0 ? 0 : 14 + R() * 16, top = (s === 0 ? 150 : 105 - 10 * R()) + R() * 20, base = [Math.sin(a) * r, 70, Math.cos(a) * r];
    const st = curvedStem(kit, g, base, [Math.sin(a) * (s ? 0.55 : 0.1), 1, Math.cos(a) * (s ? 0.55 : 0.1)], top, 0.2, 6, 2.5);
    for (let i = 1; i <= 6; i++) {
      const q = st.pts[i], size = 66 - (i - 1) * 5 + R() * 10;
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
