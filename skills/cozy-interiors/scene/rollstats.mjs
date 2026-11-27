#!/usr/bin/env node
// node rollstats.mjs --stages [count] [--jobs=4] → does every seed's roll, plan and dealt slots build a home that is green through stage 4? (rollstages.mjs)
// node rollstats.mjs [count = 200] [kinds...] → rolls `count` seeds and prints how often each pick and each pair of picks comes up, so a lopsided table shows.
if (process.argv.includes('--stages')) { const { rollStages } = await import('./rollstages.mjs'); const r = await rollStages(process.argv.slice(2).filter((a) => a !== '--stages')); process.exit(r.green === r.seeds ? 0 : 1); }   // item F: the stages 2 to 4 proved over seeds (rollstages.mjs)
import { roll } from './roll.mjs';
import { FURNITURE } from './openplan.mjs';
import { privateGate, likes, ZONE, wallLoad, planAspect, SPREAD_MAX } from './plan.mjs';
const args = process.argv.slice(2), N = /^\d+$/.test(args[0] || '') ? Number(args.shift()) : 200, kinds = args.length ? args : ['kitchen', 'dining', 'living'];
const tally = {}, bump = (k, v) => { (tally[k] ||= {})[v] = (tally[k][v] || 0) + 1; };
for (let seed = 1; seed <= N; seed++) {
  let r; try { r = roll(seed, kinds); } catch (e) { bump('plan: homes without a plan', e.message.slice(0, 60)); continue; }   // a roll that finds no floor plan is counted
  bump('floor', r.floor);
  { const P = r.plan, deg = {}; bump('plan: areas per room', Math.max(...Object.values(P.areas).map((a) => a.room)) + 1 + ' rooms'); bump('plan: rooms per home', new Set(Object.values(P.areas).map((a) => a.room)).size);
    for (const l of P.links) { bump('plan: links by kind', l.kind); bump('plan: link on wall', l.kind === 'open' ? 'open' : `${l.aWall}/${l.bWall}`); deg[l.a] = (deg[l.a] || 0) + 1; deg[l.b] = (deg[l.b] || 0) + 1; }
    for (const id of Object.keys(P.areas)) { bump('plan: links per area', deg[id] || 0); const { fit, need } = P.areas[id], k = Math.min(fit[0] / need.w, fit[1] / need.d); bump('plan: cell vs the deal needs', k < 0.999 ? 'SMALLER than the deal needs' : k < 1.1 ? 'up to 10% over' : k < 1.3 ? '10 to 30% over' : 'over 30% over'); }
    for (const id of Object.keys(P.areas)) { const a = r.areas[id], k = id.replace(/\d+$/, ''), bk = a.backing, second = { 'corner-left': 'left', 'corner-right': 'right', 'wide-angle': 'right' }[bk], fit = P.areas[id].fit;   // a wall is long enough for the groups dealt to it, its dealt windows and outside doors, and the ways through (the bare-stretch rule of a.slots())
      for (const [wall, len] of [['back', fit[0]], ...(second ? [[second, fit[1]]] : [])]) { const ways = P.links.filter((l) => l.kind !== 'open' && ((l.a === id && l.aWall === wall) || (l.b === id && l.bWall === wall))).length; bump('plan: a wall holds its groups, windows and ways through', wallLoad(a, k, wall, ways) <= len + 1 ? 'yes' : `NO (${wall} wall ${Math.round(wallLoad(a, k, wall, ways) - len)} mm short)`.replace(/\d+/, (m) => (+m < 300 ? '<300' : +m < 1000 ? '300-1000' : '>1000'))); } }
    { const ids = Object.keys(P.areas), kind = (i) => i.replace(/\d+$/, ''); bump('plan: front door area', kind(P.entry)); if (ids.length >= 4) bump('plan: a home of 4+ areas has a loop (a second way round)', P.links.some((l) => !l.tree && l.kind !== 'open') ? 'yes' : 'no'); bump('plan: dislikes linked (bedroom-kitchen, office-kitchen)', P.dislikesMet.length ? 'yes' : 'no'); bump('plan: liked pairs linked per home', P.likesMet.length);
      if (privateGate(ids, P.links.map((l) => [l.a, l.b]), P.entry).length) bump('plan: private room is the only way to a shared one', 'BAD');
      const pairs = ids.flatMap((a, i) => ids.slice(i + 1).filter((b) => likes(a, b)).map((b) => [a, b])); for (const [a, b] of pairs) bump('plan: a liked pair present is linked', P.links.some((l) => (l.a === a && l.b === b) || (l.a === b && l.b === a)) ? 'linked' : 'not linked'); }
    if (Object.keys(P.areas).length >= 4) { const a = planAspect(Object.values(P.world).map((q) => q.foot)); bump('plan: footprint long side / short side (4+ areas; check-home fails over 1.9)', a < 1.3 ? '1.0-1.3' : a < 1.7 ? '1.3-1.7' : a <= SPREAD_MAX ? '1.7-1.9' : 'OVER 1.9'); }   // round 6: not a strip
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
