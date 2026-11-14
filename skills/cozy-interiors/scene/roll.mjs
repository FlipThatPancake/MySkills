#!/usr/bin/env node
// node roll.mjs [seed] [area kinds...] → rolls the choices for a new home from tables.json (one table, edit it to widen the variety) and prints them with the seed; the same seed gives the same picks.
// Kinds: kitchen, dining, living, bedroom, reading-corner, hallway, home-office (default: kitchen dining living). Example: node roll.mjs 12 kitchen reading-corner.
// Lay the home out by these picks: the backing walls, the kitchen's run shape, the openings, each area's hero piece, the floor, accent objects, plants.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const T = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'tables.json'), 'utf8'));
const args = process.argv.slice(2), seed = /^\d+$/.test(args[0] || '') ? Number(args.shift()) : Math.floor(Math.random() * 1e6), kinds = args.length ? args : ['kitchen', 'dining', 'living'];
for (const k of kinds) if (!T[k] || typeof T[k] !== 'object' || !T[k].hero) { console.error(`unknown area kind "${k}"; known: ${Object.keys(T).filter((x) => T[x]?.hero).join(', ')}`); process.exit(1); }
let s = seed >>> 0;
const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const some = (a, n) => { const c = a.slice(), out = []; while (out.length < n && c.length) out.push(c.splice(Math.floor(rnd() * c.length), 1)[0]); return out; };
const out = { seed, floor: pick(T.floor), areas: {} };
for (const id of kinds) {
  const t = T[id], shape = id === 'kitchen' ? pick(t.shape) : null;
  const b = pick(T.backing.filter((x) => !(shape === 'L' || shape === 'U') || x.walls === 2 && x.angle === 90));   // an L or a U needs a square corner to fill
  const a = { backing: b.id, hero: pick(t.hero), openings: pick(t.openings).map((o) => ({ ...o, on: b.walls === 1 ? 'first' : o.on })), accents: some(t.accents, 3 + Math.floor(rnd() * 3)), plants: pick(T.plants) };
  if (t.pieces) a.pieces = t.pieces;
  if (shape) a.shape = shape;
  out.areas[id] = a;
}
console.log(JSON.stringify(out, null, 1));
