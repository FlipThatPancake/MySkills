#!/usr/bin/env node
// node rollstats.mjs --stages [count] [--jobs=4] → does every seed's roll, plan and dealt slots build a home that is green through stage 4? (rollstages.mjs)
// node rollstats.mjs [count = 200] [kinds...] → rolls `count` seeds and prints how often each pick and each pair of picks comes up, so a lopsided table shows.
if (process.argv.includes('--stages')) { const { rollStages } = await import('./rollstages.mjs'); const r = await rollStages(process.argv.slice(2).filter((a) => a !== '--stages')); process.exit(r.green === r.seeds ? 0 : 1); }   // item F: the stages 2 to 4 proved over seeds (rollstages.mjs)
import { roll } from './roll.mjs';
import { FURNITURE } from './openplan.mjs';
const args = process.argv.slice(2), N = /^\d+$/.test(args[0] || '') ? Number(args.shift()) : 200, kinds = args.length ? args : ['kitchen', 'dining', 'living'];
const tally = {}, bump = (k, v) => { (tally[k] ||= {})[v] = (tally[k][v] || 0) + 1; };
for (let seed = 1; seed <= N; seed++) {
  let r; try { r = roll(seed, kinds); } catch (e) { bump('plan: homes without a plan', e.message.slice(0, 60)); continue; }   // a roll that finds no floor plan is counted
  bump('floor', r.floor);
  { const P = r.plan, deg = {}; bump('plan: areas per room', Math.max(...Object.values(P.areas).map((a) => a.room)) + 1 + ' rooms'); bump('plan: rooms per home', new Set(Object.values(P.areas).map((a) => a.room)).size);
    for (const l of P.links) { bump('plan: links by kind', l.kind); bump('plan: link on wall', l.kind === 'open' ? 'open' : `${l.aWall}/${l.bWall}`); deg[l.a] = (deg[l.a] || 0) + 1; deg[l.b] = (deg[l.b] || 0) + 1; }
    for (const id of Object.keys(P.areas)) bump('plan: links per area', deg[id] || 0);
    bump('plan: homes with a loop', P.links.some((l) => !l.tree) ? 'yes' : 'no');
    const adj = {}; for (const l of P.links) { (adj[l.a] ||= []).push(l.b); (adj[l.b] ||= []).push(l.a); } const seen = new Set([P.root]), q = [P.root]; while (q.length) for (const n of adj[q.pop()] || []) if (!seen.has(n)) { seen.add(n); q.push(n); } if (seen.size !== Object.keys(P.areas).length) bump('plan: UNREACHABLE area', 'BAD');
    const world = (id) => P.areas[id].az - P.world[id].pose.psi; for (const l of P.links) { const d = Math.abs((((world(l.b) - world(l.a)) % 360) + 540) % 360 - 180); const bk = d < 30 ? '0-30' : d < 60 ? '30-60' : d < 100 ? '60-100' : d < 150 ? '100-150' : '150-180'; bump('plan: camera turn per move (degrees)', bk); bump(l.kind === 'open' ? 'plan: camera turn inside an open room (degrees)' : 'plan: camera turn through a door or arch (degrees)', bk); } }
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
