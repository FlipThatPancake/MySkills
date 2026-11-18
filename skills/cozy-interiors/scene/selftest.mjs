#!/usr/bin/env node
// node selftest.mjs [asset ...] [--variants=3] → lays out every asset (or the named ones) in a few dealt variants on a bare floor and asks the geometry core (geom/parts.mjs, Node only, no page) which assets have a part passing right through another (20 mm)
// (a magazine through the sling of its rack, a book through a shelf board). Each finding names the asset and the parts; fix the asset, never one home.
import fs from 'node:fs';
import os from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Home } from './compose.mjs';
import { ASSETS } from './src/library/meta.js';
import { picture } from './src/library/variants.js';
// Picture art stays inside its frame: draw every form at wide, tall and square sizes against a recording kit, and look at every line point.
{
  const rec = []; const node = () => new Proxy(function () {}, { get: (_, k) => (k === 'then' ? undefined : node()), apply: () => node() });
  const kit = new Proxy({}, { get: (_, k) => (k === 'lines' ? (pts) => { rec.push(...pts); return node(); } : k === 'merge' ? () => node() : () => node()) });
  let bad = 0, n = 0;
  for (const [w, h] of [[1100, 500], [1400, 450], [800, 600], [600, 800], [500, 500], [300, 400], [400, 1200]]) for (const form of [0, 1, 2, 3]) for (const seed of [2, 9]) {
    rec.length = 0; picture(kit, { form, w, h, seed }); n++;
    const out = rec.filter(([x, y]) => Math.abs(x) > w / 2 - 28 + 0.5 || y < 28 - 0.5 || y > h - 28 + 0.5);
    if (out.length) { bad++; console.log(`[art] picture form ${form} ${w}x${h} seed ${seed}: ${out.length} line point(s) outside the frame, first at x ${Math.round(out[0][0])} y ${Math.round(out[0][1])}`); }
  }
  console.log(`${bad} picture variant(s) with lines outside the frame, of ${n} checked`);
}
import { createKit } from './src/kitchen3d.js';
import { REGISTRY } from './src/library/index.js';
// Two runs in line share one worktop: the end where they meet draws no outline (no seam mark). A run with abutEnd has no outline segment on its end plane; without the flag it has one.
{
  const kit = createKit(), mods = [{ w: 600, kind: 'doors' }, { w: 600, kind: 'doors' }], ends = (abutEnd) => {
    const g = REGISTRY.baseRun(kit, { modules: mods, abutEnd }); let n = 0;
    g.traverse((o) => { if (o.userData.kitLine && o.geometry?.attributes?.instanceStart ) { const A = o.geometry.attributes.instanceStart, B = o.geometry.attributes.instanceEnd; for (let k = 0; k < A.count; k++) if (Math.abs(A.getX(k) - 1200) < 0.5 && Math.abs(B.getX(k) - 1200) < 0.5 && Math.min(A.getY(k), B.getY(k)) > 880) n++; } });
    return n;
  };
  const on = ends(false), off = ends(true);
  console.log(off < on && off === 0 ? `worktop seam: ok (${on} end-outline segments without the flag, ${off} with it)` : `[seam] a run with abutEnd still draws its worktop end outline (${off} segments, ${on} without the flag)`);
}
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
const { checkParts } = await import('./geom/parts.mjs');
const found = await checkParts(json);
console.log(found.map((f) => `[parts] ${f.text}`).join('\n') || 'no part passes 20 mm into another'); console.log(`${found.length} asset variant(s) with parts through each other, of ${i} checked`);
