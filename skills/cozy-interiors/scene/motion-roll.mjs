// motion-roll.mjs — the roll of living, moving things (roll.mjs calls dealMotion; compose.mjs calls checkAlive).
// Each area gets 2 or 3 kinds from tables.json `motion` (never the same kind twice, so one butterfly, one wind-moved plant, one cat ...), drawn from the kinds whose needs the area meets:
//   openWindow: the area has a window or glass door that opens, rendered open (rules.js `openable`);  plant: the area deals a plant.
// Anything that flies in needs `openWindow`, so a closed or fixed window can never have a visitor. It uses its own random stream, so no older pick moves.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openable, hasOpenWindow, VISITOR_OPEN } from './src/motion/rules.js';
const T = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'tables.json'), 'utf8')).motion;
export const MOTION = T;
export function dealMotion(out, seed, say) {
  let s = (seed ^ 0x1b873593) >>> 0;
  const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  for (const [id, a] of Object.entries(out.areas)) {
    const has = { openWindow: a.openings.some(openable), plant: (a.plantAt || []).length > 0, curtain: /curtain/.test(JSON.stringify(a)) };
    const pool = Object.entries(T.kinds).filter(([, k]) => k.in.includes(id) && k.needs.every((n) => has[n])).map(([kind, k]) => ({ kind, k }));
    const want = T.count[0] + Math.floor(rnd() * (T.count[1] - T.count[0] + 1)), picked = [];
    while (picked.length < want && pool.length) {
      let q = rnd() * pool.reduce((t, x) => t + x.k.weight, 0), i = 0;
      for (; i < pool.length - 1; i++) { q -= pool[i].k.weight; if (q < 0) break; }
      picked.push(pool.splice(i, 1)[0]);
    }
    a.motion = picked.map(({ kind, k }) => ({ kind, needs: k.needs, say: k.say }));
    if (picked.some((x) => x.kind === 'cat') && (a.accents || []).includes('cat')) { a.accents = a.accents.filter((x) => x !== 'cat'); a.say = a.say.replace(/accents: cat, /, 'accents: ').replace(/(accents: [^;]*?), cat(?=[,;])/, '$1'); }   // the sleeping cat replaces the static one: a home never shows two
    if (a.motion.length) a.say += `; living: ${a.motion.map((m) => m.say).join('; ')}`;
  }
  out.use += ' motion: a.alive(roll.areas[id].motion) in the spec; see src/motion/index.js.';
}
// compose.mjs: the area's walls ({ openings }) must meet each entry's needs
export function checkAlive(areaId, walls, entries) {
  const seen = new Set();
  for (const e of entries) {
    if (!T.kinds[e.kind]) throw new Error(`alive('${areaId}'): unknown kind "${e.kind}"; known: ${Object.keys(T.kinds).join(', ')}`);
    if (seen.has(e.kind)) throw new Error(`alive('${areaId}'): "${e.kind}" twice (one of each kind per area)`);
    seen.add(e.kind);
    if (T.kinds[e.kind].needs.includes('openWindow') && !hasOpenWindow(walls)) throw new Error(`alive('${areaId}'): "${e.kind}" needs a window that is rendered open (a sash window, a tall pair or glass doors, without sash: 'fixed' and not open: 0); this area has none`);
  }
  if (entries.length > 3) throw new Error(`alive('${areaId}'): ${entries.length} living things; 3 at most`);
}
// the opening a visitor comes through: a window before a glass door, the first in wall order. Returns [wall id, index in the wall's openings] and opens it to VISITOR_OPEN at least.
export function pickVia(walls, flies) {
  let best = null;
  for (const w of walls) (w.openings || []).forEach((op, i) => { if (openable(op) && (!best || (op.kind === 'window' && best.op.kind !== 'window'))) best = { w, op, i }; });
  if (!best) return null;
  if (flies && (best.op.open ?? 0) < VISITOR_OPEN) best.op.open = VISITOR_OPEN;
  return [best.w.id, best.i];
}
