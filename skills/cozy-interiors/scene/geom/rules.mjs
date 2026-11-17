// the rules that need contacts: penetrates, floating, overhangs, sunk. One table of tolerances, one place.
import { BUILT_IN, FLATMARK, PAN, RUG, SOFT, isFree, softKind } from './kinds.mjs';
import { pairs } from './world.mjs';

export const TOL = { hard: 2, soft: 30, wall: 10, floatGap: 2, overhang: 0.15, sunk: { cloth: 8, seat: 30, rug: 5, hard: 2 } };

const hull2 = (P) => { P = [...P].sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (P.length < 3) return P; const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], up = []; for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); } for (const p of [...P].reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } return lo.slice(0, -1).concat(up.slice(0, -1)); };
const parea = (P) => { let A = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; A += a[0] * b[1] - b[0] * a[1]; } return Math.abs(A) / 2; };
const clip = (P, Q) => { let out = P; for (let i = 0; i < Q.length && out.length; i++) { const a = Q[i], b = Q[(i + 1) % Q.length], inp = out; out = []; const side = (p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]); for (let j = 0; j < inp.length; j++) { const p = inp[j], q = inp[(j + 1) % inp.length], sp = side(p), sq = side(q); if (sp >= 0) out.push(p); if ((sp >= 0) !== (sq >= 0)) { const t = sp / (sp - sq); out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]); } } } return out; };
const ptsNear = (parts, y, tol) => { const out = []; for (const p of parts) for (let i = 0; i < p.tris.length; i += 3) if (Math.abs(p.tris[i + 1] - y) < tol) out.push([p.tris[i], p.tris[i + 2]]); return out; };
export const lowest = (o) => { let y = Infinity; for (const p of o.parts) y = Math.min(y, p.box.mn[1]); return y; };

// is the part `b` a supporter of the part `a`: it is not a wall, it starts below the foot of `a`, and the contact is not a sideways touch
export const supports = (c, mine) => {
  const A = mine === 'a' ? c.a : c.b, B = mine === 'a' ? c.b : c.a;
  if (B.role === 'wall') return false; if (B.mn[1] > A.mn[1] + 5) return false;
  return c.approx || Math.abs(c.normal.y) > 0.3;
};

export function applyRules(Q, list) {
  const O = Q.objects, asset = (id) => O[id]?.asset || id, mount = (id) => O[id]?.mount || 'fixed', find = [];
  const pr = pairs(list), name = (id) => (O[id] ? `${id} (${asset(id)})` : id === 'floor' ? 'the floor' : 'a wall or opening');
  const isSupportPair = (c, x, y) => { const mine = c.a.owner === x ? 'a' : 'b'; return supports(c, mine); };

  // ---------- penetrates
  for (const [k, c] of pr) {
    const [x, y] = [c.a.owner, c.b.owner], depth = -c.d; if (depth <= TOL.hard) continue;
    if (mount(x).startsWith('in:') || mount(y).startsWith('in:')) continue;
    if (BUILT_IN.test(asset(x)) && BUILT_IN.test(asset(y))) continue;                      // a hob, sink or tap is let into its worktop
    if ([x, y].includes('floor') && [x, y].some((q) => FLATMARK.test(asset(q)) || /^(wall|ceiling)/.test(mount(q)))) continue;
    const env = [c.a, c.b].find((e) => e.role !== 'object'), wallish = env?.role === 'wall';
    if (wallish && [x, y].some((q) => /^(wall|ceiling)/.test(mount(q)))) continue;           // a wall piece touches its wall
    const rugPair = [x, y].some((q) => RUG.test(asset(q))); if (rugPair) continue;           // things stand on a rug's pile: the sunk rule
    const soft = SOFT.test(asset(x)) || SOFT.test(asset(y)), tol = wallish ? TOL.wall : soft ? TOL.soft : TOL.hard;
    if (depth > tol) { const a = O[x] ? x : y, b = a === x ? y : x; find.push({ rule: 'penetrates', id: a, other: b, assets: [asset(a), asset(b)], depth: +depth.toFixed(1), soft, text: `${name(a)} is ${Math.round(depth)} mm inside ${name(b)}${soft ? ' (soft pair, tolerance 30 mm)' : ''}` }); }
  }
  // ---------- floating, overhangs, sunk: one pass per free object
  const bySupporter = {};
  for (const o of Q.loadedObjects) {
    if (!isFree(o)) continue;
    const cs = list.filter((c) => c.a.owner === o.id || c.b.owner === o.id);
    const sup = [], deepest = {}; let gap = Infinity;
    for (const c of cs) {
      const mine = c.a.owner === o.id ? 'a' : 'b', other = mine === 'a' ? c.b : c.a; if (mount(other.owner).startsWith('in:')) continue;
      if (!supports(c, mine)) continue; gap = Math.min(gap, c.d);
      if (c.d <= TOL.floatGap) sup.push({ c, other });
      if (c.d < 0) { const kk = other.owner; if (!deepest[kk] || c.d < deepest[kk]) deepest[kk] = c.d; }
    }
    if (!sup.length) { find.push({ rule: 'floating', id: o.id, asset: o.asset, gap: gap === Infinity ? null : +gap.toFixed(1), text: `${o.id} (${o.asset}): nothing holds it up${gap === Infinity ? '' : ` (the nearest surface below is ${Math.round(gap)} mm away)`}` }); continue; }
    bySupporter[o.id] = sup;
    // sunk: how deep its foot is inside a soft or rugged supporter
    for (const [sid, d] of Object.entries(deepest)) {
      const sk = softKind(asset(sid)) || (RUG.test(asset(sid)) ? 'rug' : null) || (softKind(o.asset) ? softKind(o.asset) : null); if (!sk && !(-d > TOL.sunk.hard)) continue;
      const tol = sk ? TOL.sunk[sk] : TOL.sunk.hard;
      if (sid === 'floor' || (sid === 'env')) { if (-d > TOL.hard && !sk) { /* sunk into the floor or an opening: penetrates covers it */ } continue; }
      if (!sk) continue;
      if (-d > tol) find.push({ rule: 'sunk', id: o.id, asset: o.asset, into: sid, depth: +(-d).toFixed(1), text: `${o.id} (${o.asset}): its base is ${Math.round(-d)} mm below the surface of ${sid} (${asset(sid)}); at most ${tol} mm` });
    }
    // overhangs
    const y0 = lowest(o), base = hull2(ptsNear(o.parts, y0, 3)), Ba = parea(base); if (Ba < 1) continue;
    let cover = 0, onFloor = sup.some((s) => s.other.owner === 'floor'); const tops = new Set(), names = new Set();
    for (const { other } of sup) { names.add(other.owner); if (other.owner === 'floor') continue; tops.add(other); }
    const polys = [];
    for (const e of tops) { const top = hull2(ptsNear([e.part], y0, 4)); if (top.length >= 3) polys.push(top); }
    if (PAN.test(o.asset)) for (const id of names) if (/^hob$/.test(asset(id))) { const ho = O[id], all = []; for (const p of ho.parts) for (let i = 0; i < p.tris.length; i += 3) all.push([p.tris[i], p.tris[i + 2]]); polys.push(hull2(all)); }   // a pan stands anywhere inside the hob's outline
    if (onFloor) cover = Ba; else for (const top of polys) cover += parea(clip(base, top));
    const over = 1 - Math.min(1, cover / Ba);
    if (over > TOL.overhang) find.push({ rule: 'overhangs', id: o.id, asset: o.asset, pct: Math.round(over * 100), on: [...names], text: `${o.id} (${o.asset}): ${Math.round(over * 100)}% of its base reaches past what it stands on (${[...names].join(', ')})` });
  }
  return { find, supporters: bySupporter };
}
