// node rollstats.mjs [seeds=150] → rolls many homes and counts the deals that break a check or contradict themselves. Exit 1 when any case is found.
// Cases: a still life with more than two things on one top; the same thing on two tops of one area; two lamps in one area; a named asset the library lacks; the cutting board dealt twice; a plant corner without a floor plant place; an area behind a passage that has no arch or door of its own.
import { roll } from '../../../skills/cozy-interiors/scene/roll.mjs';
import { ASSETS } from '../../../skills/cozy-interiors/scene/src/library/meta.js';
const N = Number(process.argv[2] || 150), sets = [['kitchen', 'dining', 'living'], ['kitchen', 'reading-corner', 'bedroom'], ['home-office', 'hallway', 'kitchen'], ['dining', 'living', 'kitchen']];
const asset = (x) => (x.match(/\(([A-Za-z]+)\)\s*$/) || [])[1], count = {}, first = {};
const bad = (k, seed, kinds, id, extra = '') => { count[k] = (count[k] || 0) + 1; first[k] ||= `seed ${seed} ${kinds.join(',')} ${id} ${extra}`; };
for (let seed = 1; seed <= N; seed++) for (const kinds of sets) {
  const R = roll(seed, kinds);
  for (const [id, a] of Object.entries(R.areas)) {
    const seen = new Set();
    for (const st of a.still || []) { if (st.things.length > 2) bad('top>2', seed, kinds, id, st.top); for (const x of st.things) { const n = asset(x); if (n && !ASSETS[n]) bad('missing-asset', seed, kinds, id, n); if (n && seen.has(n)) bad('same-thing-twice', seed, kinds, id, n); seen.add(n); } }
    const txt = JSON.stringify(a), lamps = (a.light && /pendant|floor lamp|table lamp|desk lamp/.test(a.light) ? 1 : 0) + (seen.has('readingLamp') ? 1 : 0) + ((a.groups || []).filter((g) => /\blamp\b/.test(g)).length);
    if (lamps > 1 && !(lamps === 2 && (a.groups || []).some((g) => /\blamp\b/.test(g)) && /lamp/.test(a.light) )) bad('two-lamps', seed, kinds, id, `${a.light} + ${[...seen].filter((q) => q === 'readingLamp')} + ${(a.groups || []).filter((g) => /\blamp\b/.test(g)).length} group(s)`);
    if (a.board && seen.has('cuttingBoard')) bad('board-twice', seed, kinds, id);
    if ((a.groups || []).some((g) => /floor plant/.test(g)) && !a.plantAt.includes('floor')) bad('plant-corner-without-floor-place', seed, kinds, id);
    if (a.plants !== a.plantAt.length) bad('plants-count', seed, kinds, id);
  }
  for (const b of R.openPlan?.behind || []) if (!(R.areas[b]?.passages || []).length) bad('behind-without-passage', seed, kinds, b);
}
console.log(Object.keys(count).length ? Object.entries(count).map(([k, n]) => `${k}: ${n} (first: ${first[k]})`).join('\n') : `rollstats: ${N * sets.length} homes, no case found`);
process.exit(Object.keys(count).length ? 1 : 0);
