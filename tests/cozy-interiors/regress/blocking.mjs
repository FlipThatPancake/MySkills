#!/usr/bin/env node
// a.blocking (round 6, framework item 2): node blocking.mjs [seeds = 3,5,8,12,21,34]
//   1. rollback: building 3 layouts and keeping layout 0 (pick: 0) writes exactly the scene that plain a.group calls write (no residue of the layouts tried and rolled back: objects, form counters, reserved floor, wall stretches).
//   2. never worse: the kept layout scores no worse than layout 0 on [physical, blocking, stage 1-4, left out], compared in that order.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const scene = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../skills/cozy-interiors/scene');
const { Home } = await import(path.join(scene, 'compose.mjs')), { roll, KINDS } = await import(path.join(scene, 'roll.mjs')), { buildSeed } = await import(path.join(scene, 'rollstages.mjs'));
const seeds = (process.argv[2] || '3,5,8,12,21,34').split(',').map(Number), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'blocking-'));
let bad = 0;
for (const seed of seeds) {
  const plain = await buildSeed(seed, path.join(dir), { Home, roll, KINDS, tries: 1 }), plainJson = plain.json && fs.readFileSync(plain.json, 'utf8');
  const kept0 = await buildSeed(seed, path.join(dir), { Home, roll, KINDS, tries: 3, pick: 0 }), keptJson = kept0.json && fs.readFileSync(kept0.json, 'utf8');
  const same = plainJson === keptJson, best = await buildSeed(seed, path.join(dir), { Home, roll, KINDS, tries: 3 });
  const worse = (best.layouts || []).flatMap((area, i) => { const b = area[best.chosen[i]].tuple, z = area[0].tuple; for (let k = 0; k < 4; k++) { if (b[k] < z[k]) return []; if (b[k] > z[k]) return [`area ${i}: kept ${JSON.stringify(b)} is worse than layout 0 ${JSON.stringify(z)}`]; } return []; });
  const ok = same && !worse.length; if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} seed ${seed}: pick 0 ${same ? 'equals' : 'DIFFERS from'} the plain build${worse.length ? '; ' + worse.join('; ') : ''}; kept layouts ${JSON.stringify(best.chosen)}`);
}
fs.rmSync(dir, { recursive: true, force: true }); process.exitCode = bad ? 1 : 0;
