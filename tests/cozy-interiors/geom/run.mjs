#!/usr/bin/env node
// node tests/cozy-interiors/geom/run.mjs → the exact fixtures through the geometry core (acceptance test 1). Exit 1 on any failure.
import { FIX } from './fixtures.mjs';
import { loadScene } from '../../../skills/cozy-interiors/scene/geom/load.mjs';
import { queryWorld, contacts, pairs } from '../../../skills/cozy-interiors/scene/geom/world.mjs';
import { checkScene } from '../../../skills/cozy-interiors/scene/geom/index.mjs';
let bad = 0; const say = (ok, name, msg) => { if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(22)} ${msg}`); };
for (const [name, make] of Object.entries(FIX)) {
  const F = make(); const r = await checkScene(F.scene);
  if (F.pair) { const Q = queryWorld(await loadScene(F.scene)), C = contacts(Q, { within: 20 }), p = [...pairs(C.list).values()].find((c) => [c.a.owner, c.b.owner].sort().join() === [...F.pair].sort().join()); const d = p ? p.d : null; say(d !== null && Math.abs(d - F.dist) < 0.01, name, `distance ${d === null ? 'none' : d.toFixed(3)} mm, expected ${F.dist}`); }
  if (F.moves) say(r.findings.some((f) => f.rule === 'moves' && f.id === F.moves), name, `${F.moves} moves: ${r.findings.filter((f) => f.id === F.moves).map((f) => f.rule).join(',') || 'nothing'}`);
  if (F.stays) say(!r.findings.some((f) => f.rule === 'moves' && f.id === F.stays), name, `${F.stays} stays in the settle test (the overhang rule may still speak): ${r.findings.map((f) => f.rule).join(',') || 'no findings'}`);
  if (F.floats) say(r.findings.some((f) => f.rule === 'floating' && f.id === F.floats) && r.findings.some((f) => f.rule === 'moves' && f.id === F.falls), name, `${F.floats} floats and falls: ${r.findings.map((f) => f.rule).join(',')}`);
}
console.log(bad ? `${bad} failed` : 'all fixtures pass'); process.exitCode = bad ? 1 : 0;
