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
export function dealOpenPlan(out, seed, kinds, describe) {
  let s = (seed ^ 0x27d4eb2f) >>> 0;   // a fifth stream deals open plan, so every older pick for a seed stays the same
  const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pickW = (list, w = (x) => x.w) => { const tot = list.reduce((a, x) => a + w(x), 0); let q = rnd() * tot; for (const x of list) { q -= w(x); if (q < 0) return x; } return list[list.length - 1]; };
  const main = OP.joinable.filter((k) => kinds.includes(k)), nook = Object.keys(OP.nook).filter((k) => kinds.includes(k) && kinds.includes(OP.nook[k]));
  const roll = rnd(); if (main.length + nook.length < 2 || roll >= OP.chance) return;   // (the stream is spent the same either way)
  // which areas join, and in what order
  let chain;
  const whole = rnd() < OP.wholeChainChance;
  if (main.length >= 3 && whole) { const ord = pickW(OP.orders.filter((o) => o.of.every((k) => main.includes(k)))); chain = ord.of.slice(); }
  else if (main.length >= 2) { const pr = pickW(OP.pairs.filter((p) => p.of.every((k) => main.includes(k)))); chain = pr.of.slice(); }
  else chain = [main[0]];   // living alone with its nook
  if (rnd() < 0.5) chain.reverse();
  for (const n of nook) { const host = OP.nook[n]; if (chain.includes(host) && rnd() < OP.nookChance) chain.splice(chain.indexOf(host) + 1, 0, n); }
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
  out.openPlan = { layout, ...(turn === null ? {} : { turn }), chain, seams, behind, say };
  for (const id of chain) out.areas[id].say = describe(id, out.areas[id]) + ` | open plan: ${out.areas[id].open.ends.length ? 'at the ' + out.areas[id].open.ends.join(' and ') + ' of the chain' : 'in the middle of the chain'}`;
}
function pickWeights(obj, rnd) { const e = Object.entries(obj), tot = e.reduce((a, [, w]) => a + w, 0); let q = rnd() * tot; for (const [k, w] of e) { q -= w; if (q < 0) return k; } return e[e.length - 1][0]; }
