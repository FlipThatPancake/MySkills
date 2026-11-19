// openplan.mjs — open-plan homes: the roll's deal (dealOpenPlan, called by roll.mjs) and the rules the spec and the checks share.
// In an open-plan home two or three areas share one floor and one back wall. Something real marks where one area ends: a separator (island, sofa back, open shelf, rug edge, hanging light, half wall, floor change).
// roll.mjs adds `openPlan` to its result: { layout: 'row' | 'corner', turn: seam index (corner only), chain: [area ids in order], seams: [{ a, b, separators: [...], overlap }], behind: [areas behind a passage], say }.
// Each joined area also gets `a.open = { index, ends: ['start'?, 'end'?] }` and its backing, kitchen shape and openings are made to fit (no side wall on a seam).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const T = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'tables.json'), 'utf8')), OP = T.openPlan;
export const FURNITURE = Object.entries(OP.separators).filter(([, s]) => s.furniture).map(([k]) => k);
export const SEAM_REACH = 800;   // a separator stands within this many mm of its seam (check-home)
export const WALKWAY = 900;      // clear walkway across every seam
export const ISLAND_GAP = [1000, 1200];   // an island keeps this far from the kitchen run
export const HALF_WALL = 1000;
export const GLIMPSE = 0.25;     // the neighbour takes at most this share of the frame's width

// the deal: mutates `out` (roll's result); `describe(id, area)` rebuilds an area's `say`
export function dealOpenPlan(out, seed, kinds, describe, forced = null) {   // forced: the areas the agent said share one room (in order); null leaves it to the dice
  let s = (seed ^ 0x27d4eb2f) >>> 0;   // a fifth stream deals open plan, so every older pick for a seed stays the same
  const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pickW = (list, w = (x) => x.w) => { const tot = list.reduce((a, x) => a + w(x), 0); let q = rnd() * tot; for (const x of list) { q -= w(x); if (q < 0) return x; } return list[list.length - 1]; };
  const main = OP.joinable.filter((k) => kinds.includes(k)), nook = Object.keys(OP.nook).filter((k) => kinds.includes(k) && kinds.includes(OP.nook[k]));
  const roll = rnd(); if (forced === null ? (main.length + nook.length < 2 || roll >= OP.chance) : forced.length < 2) return;   // (the stream is spent the same either way)
  // which areas join, and in what order
  let chain;
  const whole = rnd() < OP.wholeChainChance;
  if (forced) chain = forced.slice();
  else if (main.length >= 3 && whole) { const ord = pickW(OP.orders.filter((o) => o.of.every((k) => main.includes(k)))); chain = ord.of.slice(); }
  else if (main.length >= 2) { const pr = pickW(OP.pairs.filter((p) => p.of.every((k) => main.includes(k)))); chain = pr.of.slice(); }
  else chain = [main[0]];   // living alone with its nook
  if (rnd() < 0.5 && !forced) chain.reverse();
  if (!forced) for (const n of nook) { const host = OP.nook[n]; if (chain.includes(host) && rnd() < OP.nookChance) chain.splice(chain.indexOf(host) + 1, 0, n); }
  if (chain.length < 2) return;
  // layout
  const layout = pickWeights(OP.layouts, rnd), turn = layout === 'corner' ? Math.floor(rnd() * (chain.length - 1)) : null;
  // seams: separators (at least one furniture) and overlap
  const seams = [];
  for (let i = 0; i + 1 < chain.length; i++) {
    const pair = [chain[i], chain[i + 1]], ok = (k) => { const sp = OP.separators[k], need = sp.needs; return !need || pair.includes(need) || (need === 'living' && pair.some((p) => OP.nook[p] === 'living')); };
    const furn = FURNITURE.filter(ok).map((k) => ({ k, w: OP.separators[k].w })), first = pickW(furn).k, seps = [first];
    if (rnd() < OP.secondChance) { const rest = Object.keys(OP.separators).filter((k) => k !== first && ok(k) && !(first === 'peninsula' && k === 'island') && !(first === 'island' && k === 'peninsula')).map((k) => ({ k, w: OP.separators[k].w })); if (rest.length) seps.push(pickW(rest).k); }
    seams.push({ a: pair[0], b: pair[1], separators: seps, overlap: OP.overlap[Math.floor(rnd() * OP.overlap.length)] });
  }
  // fit the areas: a side wall may stand only on an outer end; a kitchen next to an island/peninsula takes that shape
  const n = chain.length, W = T.backingWeights.freeShapes;
  chain.forEach((id, i) => {
    const a = out.areas[id], leg2Start = layout === 'corner' && i === turn + 1;
    const ends = [i === 0 ? 'start' : null, i === n - 1 ? 'end' : null].filter(Boolean);
    const allowed = T.backing.filter((b) => b.walls === 1 || (b.second === 'left' ? ends.includes('start') && !leg2Start : ends.includes('end')));
    const cur = T.backing.find((b) => b.id === a.backing);
    if (!allowed.includes(cur)) {
      const bag = allowed.map((b) => ({ ...b, w: W[b.id] || 1 })), b = pickW(bag); a.backing = b.id;
      a.openings = a.openings.map((o) => ({ ...o, on: b.walls === 1 ? 'first' : o.on }));
    }
    a.open = { index: i, ends };
    if (id === 'kitchen') {
      const sep = seams.filter((q) => q.a === id || q.b === id).flatMap((q) => q.separators), want = sep.includes('island') ? 'island' : sep.includes('peninsula') ? 'peninsula' : null;
      const corner = T.backing.find((b) => b.id === a.backing).walls === 2 && T.backing.find((b) => b.id === a.backing).angle === 90;
      if (want) a.shape = want; else if (!corner && (a.shape === 'L' || a.shape === 'U')) a.shape = ['straight', 'galley'][Math.floor(rnd() * 2)];
      a.shapeNote = T.kitchen.shapeNotes[a.shape];
    }
  });
  const behind = kinds.filter((k) => !chain.includes(k));
  const sayOf = (q) => `${q.a} | ${q.b}: ${q.separators.map((k) => OP.separators[k].say).join(' and ')}; the areas share ${q.overlap} mm`;
  const say = `OPEN PLAN, ${layout}${layout === 'corner' ? ` (the chain turns 90 degrees at the seam after ${chain[turn]})` : ' (one long back wall)'}: ${chain.join(' - ')}. ${seams.map(sayOf).join('. ')}.${behind.length ? ` Behind a passage: ${behind.join(', ')}.` : ''} No wall stands on a seam; a side wall only on an outer end.`;
  const floor = chain.includes('kitchen') && out.floor === 'boards' && rnd() < OP.kitchenTiles ? Object.fromEntries(chain.map((id) => [id, id === 'kitchen' ? 'tiles' : 'boards'])) : null;   // one floor across an open room; the kitchen part may switch to tiles (the change is a straight line by a furniture separator)
  out.openPlan = { layout, ...(turn === null ? {} : { turn }), chain, seams, behind, say, ...(floor ? { floor } : {}) };
  for (const id of chain) out.areas[id].say = describe(id, out.areas[id]) + ` | open plan: ${out.areas[id].open.ends.length ? 'at the ' + out.areas[id].open.ends.join(' and ') + ' of the chain' : 'in the middle of the chain'}`;
}
function pickWeights(obj, rnd) { const e = Object.entries(obj), tot = e.reduce((a, [, w]) => a + w, 0); let q = rnd() * tot; for (const [k, w] of e) { q -= w; if (q < 0) return k; } return e[e.length - 1][0]; }

// ---- joining (compose.mjs: H.join(a, b, { layout, share }))
// b must be a fresh area: call H.join right after H.area(...) for b and before any wall or object of b, because every later point is mapped through b.O and b.psi. a has its back wall (and, for a corner, nothing else on its seam side).
//   separators: the kinds the roll dealt for this seam (roll.mjs openPlan.seams[i].separators); check-home looks for a piece tagged sep: '<kind>' by the seam.
//   layout 'row':    b continues a's back wall in a straight line; b's frame has the same turn as a's; its origin is where a's back wall ends. b.rect[0] becomes -share, so the two floors overlap by `share` mm.
//   layout 'corner': the chain turns 90 degrees (to the right, as seen from a's room): a's right wall runs on as b's back wall, so b stands against it, its room to the left of a's end. join builds that right wall (a.right(len, [])), the stretch of the wall that stands beside a. b.rect[0] is 0 and its floor starts `share` mm inside a's depth.
// Both areas go into one group (H.S.groups): they share one floor, the page draws the group at rest, and the camera glides between its areas without hiding any of them.
export function joinAreas(H, a, b, { layout = 'row', share = 0, separators = [] } = {}) {
  if (!a.backLen) throw new Error(`H.join: area "${a.id}" has no back wall yet: call a.back(...) before joining`);
  if (b.h.S.home.walls.some((w) => w.id.startsWith(b.id + '-')) || b.h.S.home.objects.some((o) => o.area === b.id)) throw new Error(`H.join: area "${b.id}" already has walls or objects: join it right after H.area(...)`);
  if (share < 0 || share > 1000) throw new Error(`H.join: share must be 0 to 1000 mm (got ${share})`);
  const end = a.backAt[0] + a.backLen;
  if (layout === 'row') { b.psi = a.psi; b.O = a.P([end, 0]); b.rect = [-share, b.rect[1], b.rect[2], b.rect[3]]; }
  else if (layout === 'corner') {
    const d = a.rect[3] - share; a.cornerWall = a.right(d, [], 90);   // a.cornerWall: the wall helper, to place things on the stretch beside the corner   // the wall beside a: a's right wall, whose far end is where b's back wall begins
    b.psi = a.psi + 90; b.O = a.P([end, d]); b.rect = [0, b.rect[1], b.rect[2], b.rect[3]];
  } else throw new Error(`H.join: layout is 'row' or 'corner' (got "${layout}")`);
  b.unplaced = false;
  const gid = a.planGroup || `g${(H.groups ||= []).length + 1}`, G = H.groups.find((g) => g.id === gid) || (H.groups.push({ id: gid, areas: [a.id], seams: [] }), H.groups[H.groups.length - 1]);
  a.planGroup = b.planGroup = gid; G.areas.push(b.id);
  G.seams.push({ a: a.id, b: b.id, layout, share, kinds: separators });   // the seam line is worked out at write time, from b's frame (seamLine)
  return b;
}
// the seam as a world segment: b's local x = rect[0] + share / 2, from the back wall (z = 0) to the front of b's floor
export function seamLine(H, s) {
  const b = H.list.find((q) => q.id === s.b), x = b.rect[0] + s.share / 2;
  return { a: s.a, b: s.b, layout: s.layout, share: s.share, p0: b.P([x, 0]), p1: b.P([x, b.rect[3]]), normal: b.P([1, 0]).map((v, i) => v - b.O[i]), kinds: s.kinds || [] };
}

// ---- floor change: H.floorZones({ kitchen: 'tiles', dining: 'boards', living: 'boards' }) gives areas of a group their own floor style (tiles in the kitchen, boards beyond). The floor then changes along the seam's midline in one straight, clean line with a divider drawn on it.
// Do it for areas that are joined; the zones are worked out at write time. A floor change belongs with a furniture separator (check-home: it stands within 500 mm of the line).
export function zoneList(H) {
  if (!H.zoneStyles) return null;
  const M = 1500, out = [];
  for (const G of H.groups || []) for (const id of G.areas) {
    const st = H.zoneStyles[id]; if (!st) continue;
    const a = H.list.find((q) => q.id === id), b = a.worldBounds(), r = [b.x0 - M, b.z0 - M, b.x1 + M, b.z1 + M];   // [x0, z0, x1, z1]
    const edges = [];
    for (const s of G.seams.map((q) => seamLine(H, q))) {
      if (s.a !== id && s.b !== id) continue;
      const n = s.normal, ax = Math.abs(n[0]) > 0.5 ? 0 : 1, sg = Math.sign(n[ax]), c = s.p0[ax], other = H.zoneStyles[s.a === id ? s.b : s.a];
      const far = s.a === id;   // a's far edge along the normal, b's near edge
      if (ax === 0) { if (far === (sg > 0)) r[2] = c; else r[0] = c; } else { if (far === (sg > 0)) r[3] = c; else r[1] = c; }
      if (other && other !== st && s.b === id) edges.push([s.p0, s.p1]);   // the divider is drawn once, by the later area's zone
    }
    out.push({ area: id, style: st, rect: r.map((v) => Math.round(v)), ...(edges.length ? { edge: edges[0] } : {}) });
  }
  return out;
}
