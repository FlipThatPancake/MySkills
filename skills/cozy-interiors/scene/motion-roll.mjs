// motion-roll.mjs — the roll of living, moving things (roll.mjs calls dealMotion; compose.mjs calls checkAlive).
// Each area gets 2 or 3 kinds from tables.json `motion` (never the same kind twice, so one butterfly, one wind-moved plant, one cat ...), drawn from the kinds whose needs the area meets:
//   openWindow: the area has a window or glass door that opens, rendered open (rules.js `openable`);  plant: the area deals a plant;  plantNear: a plant stands on a window sill (wind needs a leafy plant within 1.5 m of the open window);  noGlass: no glass wall or glass door; curtain: the area deals a curtain and has a window with a sill, at least 1340 mm wide, to hang it at (a cat's paw needs both, and compose widens the panel to 300 mm or more).
// Anything that flies in needs `openWay` (an open window or glass door, an arch, or a door open 60 degrees or more), so a closed or fixed window can never have a visitor; `flies` may be a number: the narrowest window in mm the visitor can use (a bird). It uses its own random stream, so no older pick moves.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openable, flyable, clearWidth, hasOpenWindow, hasOpenWay, VISITOR_OPEN } from './src/motion/rules.js';
const T = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'tables.json'), 'utf8')).motion;
export const MOTION = T;
export function dealMotion(out, seed, say) {
  let s = (seed ^ 0x1b873593) >>> 0;
  const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  // 1. what each area could host (its openings and pieces), 2. every area gets one living thing first, the scarcest areas first (ties by the seed), within the home caps, 3. the rest of the 2 or 3 per area are drawn in a seeded order
  const used = {}, cap = (kind, k) => (kind === 'cat' ? T.caps?.cat : k.flies ? T.caps?.flier : undefined) ?? 99;   // home caps (tables.json motion.caps): a home has one cat, and each flier kind shows in two areas at most
  const poolOf = (id, a) => {
    const has = { openWindow: a.openings.some(openable), openWay: a.openings.some(flyable), plant: (a.plantAt || []).length > 0, plantNear: (a.plantAt || []).includes('sill'), noGlass: !a.openings.some((o) => o.style === 'wall' || o.style === 'slider' || o.style === 'french'), curtain: /curtain/.test(JSON.stringify(a)) && a.openings.some((o) => o.style !== 'wall' && o.style !== 'slider' && o.style !== 'french' && (o.kind === 'window' || o.sill > 0) && (o.width || 1000) >= 1340) }, widest = Math.max(0, ...a.openings.filter(flyable).map(clearWidth));
    return Object.entries(T.kinds).filter(([, k]) => k.in.includes(id) && k.needs.every((n) => has[n]) && (typeof k.flies !== 'number' || widest >= k.flies)).map(([kind, k]) => ({ kind, k }));
  };
  const rows = Object.entries(out.areas).map(([id, a]) => ({ id, a, pool: poolOf(id, a), picked: [], want: T.count[0] + Math.floor(rnd() * (T.count[1] - T.count[0] + 1)), tie: rnd() }));
  const draw = (r) => {   // one weighted pick from the area's pool, within the caps
    const open = r.pool.filter((x) => (used[x.kind] || 0) < cap(x.kind, x.k)); if (!open.length) return false;
    let q = rnd() * open.reduce((t, x) => t + x.k.weight, 0), i = 0;
    for (; i < open.length - 1; i++) { q -= open[i].k.weight; if (q < 0) break; }
    const x = open[i]; r.pool.splice(r.pool.indexOf(x), 1); r.picked.push(x); used[x.kind] = (used[x.kind] || 0) + 1; return true;
  };
  const free = (r) => r.pool.filter((x) => x.kind !== 'cat').length;   // the cat fits anywhere, so it does not make an area easy
  for (const r of [...rows].sort((x, y) => free(x) - free(y) || x.tie - y.tie)) draw(r);
  for (const r of [...rows].sort((x, y) => x.tie - y.tie)) while (r.picked.length < r.want && draw(r));
  // a kind the caps used up is taken from an area that has another living thing, or that can draw a different one instead
  const trySwap = (r) => { for (const x of [...r.pool]) {
    if ((used[x.kind] || 0) < cap(x.kind, x.k)) { draw(r); break; }
    for (const o of rows) {
      if (o === r || !o.picked.some((y) => y.kind === x.kind)) continue;
      const at = o.picked.findIndex((y) => y.kind === x.kind), taken = o.picked.splice(at, 1)[0]; used[x.kind]--;
      if (!o.picked.length && !draw(o)) { o.picked.splice(at, 0, taken); used[x.kind]++; continue; }   // the other area would be left bare: put it back
      r.pool.splice(r.pool.indexOf(x), 1); r.picked.push(x); used[x.kind]++; break;
    }
    if (r.picked.length) break;
  } };
  for (const r of rows.filter((x) => !x.picked.length)) trySwap(r);
  // 4. an area still without one (a fixed picture window or a closed door, and the home's cat elsewhere): its way in is made to open: a picture, bay or window-wall window becomes a plain sash window, else a plain door stands open 70 degrees
  for (const r of rows.filter((x) => !x.picked.length)) {
    const w = r.a.openings.find((o) => o.kind === 'window' && o.style && o.sash !== 'fixed' && o.sash !== 'out'), d = r.a.openings.find((o) => o.kind === 'door' && !o.style);
    if (w) { const phrase = { picture: 'picture window', bay: 'bay window', wall: 'window wall', pair: 'tall pair of casements' }[w.style]; delete w.style; if (phrase) r.a.say = r.a.say.replace(phrase, 'sash window'); }
    else if (d) { d.open = 70; r.a.say = r.a.say.replace(/\bdoor on /, 'door standing open 70 degrees (open: 70) on '); }
    else continue;
    r.pool = poolOf(r.id, r.a); if (!draw(r)) trySwap(r); if (r.picked.length) r.a.say += '; its way in was made to open so something living can come in';
  }
  for (const { id, a, picked } of rows) {
    a.motion = picked.map(({ kind, k }) => ({ kind, needs: k.needs, say: k.say }));
    if (!a.motion.length) { (out.motionGaps ||= []).push(id); a.say += '; living: none (no way in, no plant by a window, no curtain at a sill, and the home\'s one cat lives elsewhere)'; say?.(`${id}: no living thing fits`); }
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
    if (T.kinds[e.kind].needs.includes('openWay') && !hasOpenWay(walls)) throw new Error(`alive('${areaId}'): "${e.kind}" needs a way in: a window that is rendered open (a sash window, a tall pair or glass doors, without sash: 'fixed' and not open: 0), an arch or a door open 60 degrees or more; this area has none`);
    if (T.kinds[e.kind].needs.includes('openWindow') && !hasOpenWindow(walls)) throw new Error(`alive('${areaId}'): "${e.kind}" needs a window that is rendered open (a sash window, a tall pair or glass doors, without sash: 'fixed' and not open: 0); this area has none`);
    const wide = T.kinds[e.kind].flies;
    if (typeof wide === 'number' && !walls.some((w) => (w.openings || []).some((op) => flyable(op) && clearWidth(op) >= wide))) throw new Error(`alive('${areaId}'): "${e.kind}" needs an open window at least ${wide} mm wide; this area has none`);
  }
  if (entries.length > 3) throw new Error(`alive('${areaId}'): ${entries.length} living things; 3 at most`);
}
// the opening a visitor comes through: a window before a glass door, the first in wall order. Returns [wall id, index in the wall's openings] and opens it to VISITOR_OPEN at least.
export function pickVia(walls, flies) {   // `flies` may be a number: only openings at least that wide (mm) count
  let best = null;
  const min = typeof flies === 'number' ? flies : 0;
  const rank = (op) => (op.kind === 'window' ? 3 : openable(op) ? 2 : 1);   // a window, then a glass door, then a passage (an arch or an open door)
  for (const w of walls) (w.openings || []).forEach((op, i) => { if (flyable(op) && clearWidth(op) >= min && (!best || rank(op) > rank(best.op))) best = { w, op, i }; });
  if (!best) return null;
  if (flies && openable(best.op) && (best.op.open ?? 0) < VISITOR_OPEN) best.op.open = VISITOR_OPEN;
  return [best.w.id, best.i];
}
