#!/usr/bin/env node
// node selftest.mjs [asset ...] [--variants=3] → lays out every asset (or the named ones) in a few dealt variants on a bare floor, builds the page and runs physics.mjs --parts: reports assets whose own parts pass deep (20 mm) into each other
// (a magazine through the sling of its rack, a book through a shelf board). Each finding names the asset and the parts; fix the asset, never one home.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Home } from './compose.mjs';
import { ASSETS } from './src/library/meta.js';
const here = dirname(fileURLToPath(import.meta.url)), args = process.argv.slice(2), K = Number((args.find((a) => a.startsWith('--variants=')) || '--variants=3').split('=')[1]), named = args.filter((a) => !a.startsWith('--'));
const list = (named.length ? named : Object.keys(ASSETS)).filter((a) => ASSETS[a] && !['baseRun', 'wallRun', 'pendantLamp'].includes(a));
const H = new Home({ seed: 11, floor: 'plain' }), area = H.area('t', 'T', { rect: [0, 0, 60000, 60000] });
let i = 0; const where = {};
for (const a of list) for (let k = 0; k < K; k++) {
  const id = `${a}-${k}`, col = i % 12, row = Math.floor(i / 12); i++;
  try { area.put(id, a, [2000 + col * 3000, 2000 + row * 3000], 0, { group: 'g', y: ASSETS[a].y === 'top' ? 800 : 0, mount: ASSETS[a].mount === 'on' ? 'floor' : ASSETS[a].mount === 'wall' || ASSETS[a].mount === 'ceiling' || ASSETS[a].mount === 'lines' ? 'floor' : undefined }); } catch (e) { console.log(`skipped ${id}: ${e.message.slice(0, 80)}`); }
}
const dir = fs.mkdtempSync(join(os.tmpdir(), 'selftest-')), json = join(dir, 'sheet.json');
H.write(json, fs);
execSync(`node ${join(here, 'build.mjs')} ${json}`, { stdio: 'ignore' });
const out = execSync(`node ${join(here, 'physics.mjs')} ${join(dir, 'sheet.html')} --parts`, { encoding: 'utf8', maxBuffer: 1 << 26, timeout: 590000 });
if (process.env.SELF_DEBUG) console.log(out.split("\n").slice(0, 3).join("\n"));
const hits = out.split('\n').filter((l) => l.startsWith('[parts]'));
console.log(hits.join('\n') || 'no part passes 20 mm into another'); console.log(`${hits.length} asset variant(s) with parts through each other, of ${i} checked`);
