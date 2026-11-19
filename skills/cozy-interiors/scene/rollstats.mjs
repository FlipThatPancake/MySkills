#!/usr/bin/env node
// node rollstats.mjs [count = 200] [kinds...] → rolls `count` seeds and prints how often each pick and each pair of picks comes up, so a lopsided table shows.
import { roll } from './roll.mjs';
import { FURNITURE } from './openplan.mjs';
const args = process.argv.slice(2), N = /^\d+$/.test(args[0] || '') ? Number(args.shift()) : 200, kinds = args.length ? args : ['kitchen', 'dining', 'living'];
const tally = {}, bump = (k, v) => { (tally[k] ||= {})[v] = (tally[k][v] || 0) + 1; };
for (let seed = 1; seed <= N; seed++) {
  const r = roll(seed, kinds); bump('floor', r.floor);
  bump('open plan', r.openPlan ? 'yes' : 'no');
  if (r.openPlan) { const o = r.openPlan; bump('open plan layout', o.layout); bump('open plan chain', o.chain.join(' - ')); bump('open plan areas joined', o.chain.length); for (const q of o.seams) { bump('open plan separators', q.separators.join(' + ')); bump('open plan overlap mm', q.overlap); if (!q.separators.some((k) => FURNITURE.includes(k))) bump('open plan seams WITHOUT furniture', 'BAD'); } }
  const per = {}; for (const a of Object.values(r.areas)) for (const m of a.motion || []) per[m.kind] = (per[m.kind] || 0) + 1;   // living things per home (caps: one cat, two of a flier kind)
  for (const [kind, n] of Object.entries(per)) bump(`living: ${kind} per home`, n);
  for (const [k, a] of Object.entries(r.areas)) { bump('living: areas with no mover, by area kind', `${k}: ${(a.motion || []).length ? 'has one' : 'NONE'}`); if (/made to open/.test(a.say)) bump('living: areas whose way in was made to open', k); }
  for (const [k, a] of Object.entries(r.areas)) {
    bump(`${k} backing`, a.backing); bump(`${k} hero`, a.hero); bump(`${k} openings`, a.openings.map((o) => `${o.kind}/${o.on}`).join(' + ')); bump(`${k} plants`, a.plants);
    for (const x of a.accents) bump(`${k} accent`, x);
    if (a.shape) { bump(`${k} shape`, a.shape); bump(`${k} shape x backing`, `${a.shape} x ${a.backing}`); bump(`${k} shape x hero`, `${a.shape} x ${a.hero}`); }
    bump(`${k} backing x hero`, `${a.backing} x ${a.hero}`);
  }
}
for (const [k, c] of Object.entries(tally)) {
  const e = Object.entries(c).sort((a, b) => b[1] - a[1]), tot = e.reduce((s, x) => s + x[1], 0);
  console.log(`\n${k}  (${e.length} values; most ${e[0][1]}, least ${e[e.length - 1][1]} of ${tot})`);
  for (const [v, n] of e) console.log(`  ${String(n).padStart(4)}  ${(100 * n / tot).toFixed(1).padStart(5)}%  ${v}`);
}
