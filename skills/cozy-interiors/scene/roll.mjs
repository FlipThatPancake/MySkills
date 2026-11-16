#!/usr/bin/env node
// node roll.mjs [seed] [area kinds...] → rolls the choices for a new home from tables.json (one table, edit it to widen the variety) and prints them with the seed; the same seed gives the same picks.
// Kinds: kitchen, dining, living, bedroom, reading-corner, hallway, home-office (default: kitchen dining living). Example: node roll.mjs 12 kitchen reading-corner.
// A kitchen's shape is picked first (uniformly), then a backing that suits it (an L or a U needs a square corner); kitchen.shapeNotes in tables.json says what each shape is.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const T = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'tables.json'), 'utf8'));
export const KINDS = Object.keys(T).filter((k) => T[k]?.hero);
export function roll(seed, kinds = ['kitchen', 'dining', 'living']) {
  let s = seed >>> 0;
  const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  let s2 = (seed ^ 0x9e3779b9) >>> 0;   // a second stream deals the `more` extras, so the older picks stay the same when a table gains phrases
  const rnd2 = () => { s2 = (s2 + 0x6d2b79f5) >>> 0; let t = s2; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const some2 = (a, n) => { const c = a.slice(), out = []; while (out.length < n && c.length) out.push(c.splice(Math.floor(rnd2() * c.length), 1)[0]); return out; };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const some = (a, n) => { const c = a.slice(), out = []; while (out.length < n && c.length) out.push(c.splice(Math.floor(rnd() * c.length), 1)[0]); return out; };
  const out = { seed, floor: pick(T.floor), areas: {} }, used = new Set(), usedAcc = new Set(), ONE = ['basket', 'pouf', 'trolley'];   // signs dealt so far: none repeats in a home; a basket, pouf or trolley appears in one area of a home at most (check-home's variety rule)
  for (const id of kinds) {
    if (!KINDS.includes(id)) throw new Error(`unknown area kind "${id}"; known: ${KINDS.join(', ')}`);
    const t = T[id], shape = id === 'kitchen' ? pick(t.shape) : null;
    const W = T.backingWeights[shape === 'L' || shape === 'U' ? 'cornerShapes' : 'freeShapes'], bag = T.backing.flatMap((x) => Array(W[x.id] || 0).fill(x)), b = pick(bag);   // weighted so the backings come up evenly overall
    const a = { backing: b.id, hero: pick(t.hero), openings: pick(t.openings.filter((o) => b.walls === 2 || o.every((x) => x.on === 'first'))).map((o) => ({ ...o, on: b.walls === 1 ? 'first' : o.on })), accents: some(t.accents, 3 + Math.floor(rnd() * 3)), plants: pick(T.plants) };
    a.accents = a.accents.map((x) => { if (!(ONE.includes(x) && usedAcc.has(x))) return x; const spare = t.accents.filter((y) => !a.accents.includes(y) && !(ONE.includes(y) && usedAcc.has(y))); return spare.length ? spare[Math.floor(rnd2() * spare.length)] : x; });   // a basket, pouf or trolley already dealt to another area is swapped for a spare accent (second stream, so other picks stay)
    a.accents.forEach((x) => { if (ONE.includes(x)) usedAcc.add(x); });
    a.more = some2(t.more || [], 1 + Math.floor(rnd2() * 2));
    a.signs = some(T.signs.filter((x) => x.in.includes(id) && !used.has(x.id)), 2 + Math.floor(rnd() * 2)); a.signs.forEach((x) => used.add(x.id)); a.signs = a.signs.map((x) => x.id);
    if (t.pieces) a.pieces = t.pieces;
    if (shape) { a.shape = shape; a.shapeNote = t.shapeNotes[shape]; }
    const wall = (on) => (on === 'second' ? `the ${b.second} wall` : 'the back wall'), shape2 = b.walls === 1 ? 'one backing wall' : `two backing walls at ${b.angle} degrees, the second wall on the ${b.second}`;
    a.say = `${id}: ${a.hero}; ${shape2}; ${a.openings.map((o) => `${o.kind} on ${wall(o.on)}`).join(', ')}; accents: ${a.accents.join(', ')}${a.more.length ? `, ${a.more.join(', ')}` : ''}; ${a.plants} plants in all (pots, floor plants or a plant on a shelf); pieces: ${(a.pieces || []).join(', ') || 'as the hero needs'}; signs of life: ${a.signs.join(', ')}`;   // the choices in plain words
    out.areas[id] = a;
  }
  return out;
}
if (process.argv[1] && process.argv[1].endsWith('roll.mjs')) {
  const args = process.argv.slice(2), seed = /^\d+$/.test(args[0] || '') ? Number(args.shift()) : Math.floor(Math.random() * 1e6);
  try { console.log(JSON.stringify(roll(seed, args.length ? args : undefined), null, 1)); } catch (e) { console.error(e.message); process.exit(1); }
}
