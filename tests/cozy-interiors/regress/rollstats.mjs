// node rollstats.mjs [seeds=150] → rolls many homes and counts the deals that break a check or contradict themselves. Exit 1 when any case is found.
// Cases: a still life with more than two things on one top; the same thing on two tops of one area; two lamps in one area; a named asset the library lacks; the cutting board dealt twice; a plant corner without a floor plant place; an area behind a passage that has no arch or door of its own.
import { roll } from '../../../skills/cozy-interiors/scene/roll.mjs';
import fs from 'node:fs';
import { ASSETS } from '../../../skills/cozy-interiors/scene/src/library/meta.js';
const NAMES = JSON.parse(fs.readFileSync(new URL('../../../skills/cozy-interiors/scene/tables.json', import.meta.url), 'utf8')).names, UNNAMED = /^(drawer ajar|pillow creased|cloth dropped|unmade bed|tablecloth|runner|cloth|cushion|teaTowel|duvetCloth|floorCushion|foldedThrow|benchCushion|tableRunner|hungBag|binders|hungHat|boots)$/;   // a sign that is a state of another piece (a drawer ajar) has no asset to look for
const N = Number(process.argv[2] || 150), sets = [['kitchen', 'dining', 'living'], ['kitchen', 'reading-corner', 'bedroom'], ['home-office', 'hallway', 'kitchen'], ['dining', 'living', 'kitchen']];
const asset = (x) => (x.match(/\(([A-Za-z]+)\)\s*$/) || [])[1], count = {}, first = {};
const bad = (k, seed, kinds, id, extra = '') => { count[k] = (count[k] || 0) + 1; first[k] ||= `seed ${seed} ${kinds.join(',')} ${id} ${extra}`; };
for (let seed = 1; seed <= N; seed++) for (const kinds of sets) {
  const R = roll(seed, kinds);
  const homeOnce = {};
  for (const [id, a] of Object.entries(R.areas)) {
    for (const w of [...(a.still || []).flatMap((st) => st.things.map(asset)).filter((w) => w !== 'picture'), /\(picture\)/.test(a.wallArr || '') ? 'picture' : null]) if (w && /^(vase|candlesticks|picture)$/.test(w)) { if (homeOnce[w] && homeOnce[w] !== id) bad('decor-repeat-in-home', seed, kinds, id, `${w} also in ${homeOnce[w]}`); homeOnce[w] = id; }
    const seen = new Set();
    for (const st of a.still || []) { if (st.things.length > 2) bad('top>2', seed, kinds, id, st.top); for (const x of st.things) { const n = asset(x); if (n && !ASSETS[n]) bad('missing-asset', seed, kinds, id, n); if (n && seen.has(n)) bad('same-thing-twice', seed, kinds, id, n); seen.add(n); } }
    const txt = JSON.stringify(a), lamps = (a.light && /pendant|floor lamp|table lamp|desk lamp/.test(a.light) ? 1 : 0) + (seen.has('readingLamp') ? 1 : 0) + ((a.groups || []).filter((g) => /\blamp\b/.test(g)).length);
    if (lamps > 1 && !(lamps === 2 && (a.groups || []).some((g) => /\blamp\b/.test(g)) && /lamp/.test(a.light) )) bad('two-lamps', seed, kinds, id, `${a.light} + ${[...seen].filter((q) => q === 'readingLamp')} + ${(a.groups || []).filter((g) => /\blamp\b/.test(g)).length} group(s)`);
    if (id === 'kitchen' && /\(mirror\)|mirror over|leaning mirror/.test(JSON.stringify([a.still, a.wallArr, a.accents, a.more, a.foreground, a.groups]))) bad('kitchen-mirror', seed, kinds, id, 'a mirror in a kitchen');   // the check 'variety' keeps mirrors out of kitchens (a vase and a picture are fine there)
    if (a.board && seen.has('cuttingBoard')) bad('board-twice', seed, kinds, id);
    if ((a.groups || []).some((g) => /floor plant/.test(g)) && !a.plantAt.includes('floor')) bad('plant-corner-without-floor-place', seed, kinds, id);
    { const stripG = (g) => g.replace(/ \(the hero group.*\)$/, '').replace(/, on the [^,]*(, [a-z ]*third)?$/, '');
      const unnamed = [...(a.accents || []), ...(a.foreground ? [a.foreground] : []), ...(a.pieces || []), ...(a.signs || [])].filter((t) => !NAMES.things[t] && !UNNAMED.test(t) && !/\([A-Za-z, ]+\)\s*$/.test(t)).concat((a.groups || []).slice(1).map(stripG).filter((t) => !NAMES.groups[t]), a.hero && !NAMES.hero[a.hero] ? [a.hero] : [], a.accentOn && !NAMES.things[a.accentOn] ? [a.accentOn] : []);
      for (const t of unnamed) bad('roll-phrase-without-asset-names', seed, kinds, id, `"${t}" (add it to tables.json names)`); }
    if (seen.has('bedsideLamp') && /wallSconce/.test(JSON.stringify([a.wallArr, a.groups, a.more, a.accents]))) bad('sconce-and-bedside-lamp', seed, kinds, id, 'a wall sconce and a bedside lamp dealt together (two light sources a side)');   // round 4 G4
    if (a.plantAt.includes('sill') && !a.openings.some((o) => o.kind === 'window' && !['wall', 'bay'].includes(o.style))) bad('sill-plant-without-a-ledge', seed, kinds, id, 'a sill plant and no window with a ledge');   // round 4 G6
    if ((a.motion || []).length < 1 && a.openings.some((o) => o.kind === 'window' && o.sash !== 'fixed' && (!o.style || o.style === 'sash' || o.style === 'pair'))) bad('no-mover', seed, kinds, id, `${(a.motion || []).map((m) => m.kind).join(',') || 'none'} (an area with a window that opens deals one living thing at least)`);   // round 4 G6
    if (/bedroom/.test(id) && a.openings.some((o) => o.kind === 'window') && !(a.pieces || []).some((p) => /curtain|blind/.test(p))) bad('bedroom-window-uncovered', seed, kinds, id, 'a bedroom window dealt no curtain or blind');   // round 4 U11
    if (a.plants !== a.plantAt.length) bad('plants-count', seed, kinds, id);
  }
  for (const b of R.openPlan?.behind || []) if (!(R.areas[b]?.passages || []).length) bad('behind-without-passage', seed, kinds, b);
  for (const p of R.openPlan?.passages || []) if (!(R.areas[p.from]?.passages || []).length || !(R.areas[p.to]?.passages || []).length) bad('passage-one-ended', seed, kinds, p.to, 'a passage with an arch on one area only');   // round 4 G5
  for (const b of R.openPlan?.behind || []) if (!(R.openPlan.passages || []).some((p) => p.to === b)) bad('passage-one-ended', seed, kinds, b, 'the area behind a passage has no passage record naming both ends');
}
console.log(Object.keys(count).length ? Object.entries(count).map(([k, n]) => `${k}: ${n} (first: ${first[k]})`).join('\n') : `rollstats: ${N * sets.length} homes, no case found`);
process.exit(Object.keys(count).length ? 1 : 0);
