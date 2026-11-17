#!/usr/bin/env node
// node roll.mjs [seed] [area kinds...] → rolls the choices for a new home from tables.json (one table, edit it to widen the variety) and prints them with the seed; the same seed gives the same picks.
// Kinds: kitchen, dining, living, bedroom, reading-corner, hallway, home-office (default: kitchen dining living). Example: node roll.mjs 12 kitchen reading-corner.
// A kitchen's shape is picked first (uniformly), then a backing that suits it (an L or a U needs a square corner); kitchen.shapeNotes in tables.json says what each shape is.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dealOpenPlan } from './openplan.mjs';
import { dealMotion } from './motion-roll.mjs';
const T = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'tables.json'), 'utf8'));
export const KINDS = Object.keys(T).filter((k) => T[k]?.hero);
export function roll(seed, kinds = ['kitchen', 'dining', 'living']) {
  let s = seed >>> 0;
  const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  let s2 = (seed ^ 0x9e3779b9) >>> 0;   // a second stream deals the `more` extras, so the older picks stay the same when a table gains phrases
  const rnd2 = () => { s2 = (s2 + 0x6d2b79f5) >>> 0; let t = s2; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const some2 = (a, n) => { const c = a.slice(), out = []; while (out.length < n && c.length) out.push(c.splice(Math.floor(rnd2() * c.length), 1)[0]); return out; };
  let s3 = (seed ^ 0x85ebca6b) >>> 0;   // a third stream deals plant places, the foreground piece and the accent textile, so the older picks stay the same
  const rnd3 = () => { s3 = (s3 + 0x6d2b79f5) >>> 0; let t = s3; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick3 = (a) => a[Math.floor(rnd3() * a.length)], some3 = (a, n) => { const c = a.slice(), o = []; while (o.length < n && c.length) o.push(c.splice(Math.floor(rnd3() * c.length), 1)[0]); return o; };
  let s4 = (seed ^ 0xc2b2ae35) >>> 0;   // a fourth stream deals each area's light, so no older pick moves
  const rnd4 = () => { s4 = (s4 + 0x6d2b79f5) >>> 0; let t = s4; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const light = (kind) => { const l = T.lights[kind] || T.lights.living, tot = l.reduce((a, x) => a + x.w, 0); let q = rnd4() * tot; for (const x of l) { q -= x.w; if (q < 0) return x.id; } return l[0].id; };
  let s5 = (seed ^ 0x27d4eb2f) >>> 0;   // a fifth stream deals each window's style, so no older pick moves
  const rnd5 = () => { s5 = (s5 + 0x6d2b79f5) >>> 0; let t = s5; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  let s6 = (seed ^ 0x165667b1) >>> 0;   // a sixth stream deals the still lifes and wall arrangements, so no older pick moves
  const rnd6 = () => { s6 = (s6 + 0x6d2b79f5) >>> 0; let t = s6; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick6 = (a) => a[Math.floor(rnd6() * a.length)], some6 = (a, n) => { const c = a.slice(), o = []; while (o.length < n && c.length) o.push(c.splice(Math.floor(rnd6() * c.length), 1)[0]); return o; };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const winStyle = (kind, special) => { let pool = T.windows.filter((x) => special || ['sash', 'picture', 'pair'].includes(x.style)); const fresh = pool.filter((x) => x.style === 'sash' || !usedWin.has(x.style)); if (fresh.length) pool = fresh; const l = pool.map((x) => ({ x, w: x.weight[kind] ?? x.weight.default })); let q = rnd5() * l.reduce((a, y) => a + y.w, 0); for (const y of l) { q -= y.w; if (q < 0) return y.x; } return l[0].x; };
  const some = (a, n) => { const c = a.slice(), out = []; while (out.length < n && c.length) out.push(c.splice(Math.floor(rnd() * c.length), 1)[0]); return out; };
  const out = { seed, floor: pick(T.floor), accent: null, use: 'plantAt: place each plant at those places (one floor plant at most). foreground: the near-camera piece of the shots. accent: new Home({ accent: hex }); accentOn: put params { tone: \'accent\' } on that textile. Soft things: a.seatSoft(id, { tone }), a.table(id, { cloth: true }). still: put each thing on its top with a.onTop; wallArr: hang it on the longest bare wall stretch. side: the hero group sits on that side of the home view. See compose.mjs.', areas: {} }, used = new Set(), usedAcc = new Set(), ONE = ['basket', 'pouf', 'trolley'], usedBack = new Set(), usedWin = new Set(); let sideNow = rnd6() < 0.5 ? 'left' : 'right';   // signs dealt so far: none repeats in a home; a basket, pouf or trolley appears in one area of a home at most (check-home's variety rule)
  const acc = T.accentTones[(Math.imul(seed >>> 0, 2654435761) >>> 0) % T.accentTones.length]; out.accent = { name: acc.id, hex: acc.hex };   // one warm accent for the whole home (from the seed itself, so no other pick moves)
  const describe = (id, a) => {   // the choices of one area in plain words
    const b = T.backing.find((x) => x.id === a.backing);
    const wall = (on) => (on === 'second' ? `the ${b.second} wall` : 'the back wall'), shape2 = b.walls === 1 ? 'one backing wall' : `two backing walls at ${b.angle} degrees, the second wall on the ${b.second}`;
    return `${id}: ${a.hero}; ${shape2}; ${a.openings.map((o) => `${o.kind === 'arch' ? 'arch ' + (a.passages[a.openings.filter((q) => q.kind === 'arch').indexOf(o)] || 'round') : o.style ? ({ picture: 'picture window', pair: 'tall pair of casements', bay: 'bay window', wall: 'window wall', french: 'french glass doors', slider: 'sliding glass doors' }[o.style]) : o.kind} on ${wall(o.on)}`).join(', ')}; accents: ${a.accents.join(', ')}${a.more.length ? `, ${a.more.join(', ')}` : ''}; plants: ${a.plantAt.map((x) => T.plantPlaces.find((p) => p.id === x).say).join('; ')}; ${a.still ? 'still life: ' + a.still.map((x) => x.say + ' holds ' + x.things.join(' and ')).join('; ') + '; wall arrangement: ' + a.wallArr + '; ' : ''}hero group on the ${a.side} of the home view; foreground piece: ${a.foreground}; light: ${a.light}; ${a.board ? 'cutting board: ' + T.boardPlaces.find((p) => p.id === a.board).say + '; ' : ''}${a.above ? 'above the run: ' + a.above + '; ' : ''}accent (${out.accent.name}) on the ${a.accentOn}; pieces: ${(a.pieces || []).join(', ') || 'as the hero needs'}; signs of life: ${a.signs.join(', ')}`;   // the choices in plain words
  };
  for (const id of kinds) {
    if (!KINDS.includes(id)) throw new Error(`unknown area kind "${id}"; known: ${KINDS.join(', ')}`);
    const t = T[id], shape = id === 'kitchen' ? pick(t.shape) : null;
    const W = T.backingWeights[shape === 'L' || shape === 'U' ? 'cornerShapes' : 'freeShapes'], bag = T.backing.flatMap((x) => Array(W[x.id] || 0).fill(x)); let b0 = pick(bag); { const fresh = bag.filter((x) => !usedBack.has(x.id)); if (usedBack.has(b0.id) && fresh.length) b0 = fresh[Math.floor(rnd6() * fresh.length)]; } const b = b0; usedBack.add(b.id);   // weighted so the backings come up evenly overall; a backing already used in this home is swapped for a fresh one (own stream, so no other pick moves)
    const a = { backing: b.id, hero: pick(t.hero), openings: pick(t.openings.filter((o) => b.walls === 2 || o.every((x) => x.on === 'first'))).map((o) => ({ ...o, on: b.walls === 1 ? 'first' : o.on })), accents: some(t.accents, 3 + Math.floor(rnd() * 3)), plants: pick(T.plants) };
    { let special = false; a.openings = a.openings.map((o) => { if (o.kind !== 'window') return o; const fixed = o.sash === 'fixed' || /sink/.test(a.hero); if (fixed) return o; const st = winStyle(id, !special); if (st.style === 'sash') return o; usedWin.add(st.style); if (st.style === 'picture' || st.style === 'pair') return { ...o, style: st.style }; special = true; const { sash, ...rest } = o; return { ...rest, ...(st.kind ? { kind: st.kind } : {}), style: st.style }; }); }   // a window wall or glass door is the area's one big opening: the other openings stay plain
    a.accents = a.accents.map((x) => { if (!(ONE.includes(x) && usedAcc.has(x))) return x; const spare = t.accents.filter((y) => !a.accents.includes(y) && !(ONE.includes(y) && usedAcc.has(y))); return spare.length ? spare[Math.floor(rnd2() * spare.length)] : x; });   // a basket, pouf or trolley already dealt to another area is swapped for a spare accent (from the seed itself, so no other pick moves)
    a.accents.forEach((x) => { if (ONE.includes(x)) usedAcc.add(x); });
    a.more = some2(t.more || [], 1 + Math.floor(rnd2() * 2));
    a.plantAt = some3(T.plantPlaces.filter((x) => x.in.includes(id)), a.plants).map((x) => x.id); a.plants = a.plantAt.length;   // where each plant lives: distinct places, so at most one floor plant
    a.passages = a.openings.filter((o) => o.kind === 'arch').map(() => { return pick3(T.passages).style; });   // each arch's style (a counter style, pass or widepass, is a hatch with a ledge: put the counter or worktop under it)
    if (id === 'kitchen') a.board = pick3(T.boardPlaces).id;
    if (id === 'kitchen') { a.above = pick6(t.above); a.produce = pick6(t.produce); a.accents = a.accents.map((x) => x === 'basket of vegetables' ? a.produce : x); if (a.foreground === 'basket of vegetables') a.foreground = a.produce; if (!a.accents.concat(a.foreground).some((x) => /vegetables|crate/.test(x))) a.produce = null; }   // the run always gets something above it, and a produce basket or crate is named by form   // where the cutting board is
    { const SL = T.stillLife[id]; if (SL) { a.still = SL.tops.map((tp) => ({ top: tp.id, say: tp.say, things: some6(tp.things, 2 + Math.floor(rnd6() * 2)) })); a.wallArr = pick6(SL.wall); } }   // 2 or 3 things for each waist-high top and one wall arrangement (the bare-top and bare-wall checks want them)
    a.side = sideNow; sideNow = sideNow === 'left' ? 'right' : 'left';   // the side of the home view the hero group sits on: it alternates from area to area, so a home is not all one-sided
    a.light = light(id);   // the area's one light (a pendant over the table, island or chair in most kitchens, dining areas and reading corners)
    a.accentOn = pick3(t.accentOn);   // the textile in this area that carries the home's accent
    a.foreground = pick3(t.foreground);   // the near-camera piece comes from the area's own use
    a.signs = some(T.signs.filter((x) => x.in.includes(id) && !used.has(x.id)), 2 + Math.floor(rnd() * 2)); a.signs.forEach((x) => used.add(x.id)); a.signs = a.signs.map((x) => x.id);
    if (t.pieces) a.pieces = t.pieces;
    if (shape) { a.shape = shape; a.shapeNote = t.shapeNotes[shape]; }
    a.say = describe(id, a);
    out.areas[id] = a;
  }
  dealMotion(out, seed);   // living things (motion-roll.mjs): 2 or 3 kinds per area, from tables.json motion; its own random stream, so no older pick moves
  dealOpenPlan(out, seed, kinds, describe);   // open plan (openplan.mjs): about 2 homes in 5 with two joinable areas; its own random stream, so no older pick moves
  return out;
}
if (process.argv[1] && process.argv[1].endsWith('roll.mjs')) {
  const args = process.argv.slice(2), seed = /^\d+$/.test(args[0] || '') ? Number(args.shift()) : Math.floor(Math.random() * 1e6);
  try { console.log(JSON.stringify(roll(seed, args.length ? args : undefined), null, 1)); } catch (e) { console.error(e.message); process.exit(1); }
}
