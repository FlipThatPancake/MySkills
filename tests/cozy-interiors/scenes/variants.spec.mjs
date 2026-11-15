// An asset sheet: 8 dealt variants of one base asset on a bare floor, 4 by 2, for looking at close up.
//   node variants.spec.mjs armchair [seed]  → variants-armchair.json;  node ../../../skills/cozy-interiors/scene/snap.mjs variants-armchair.json out.png sheet 1400 800
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
import { ASSETS } from '../../../skills/cozy-interiors/scene/src/library/meta.js';
const [asset, seed = '7', extra = '{}'] = process.argv.slice(2), m = ASSETS[asset];
if (!m?.space) { console.log('usage: node variants.spec.mjs <asset with a space> [seed] [json params]; assets: ' + Object.keys(ASSETS).filter((k) => ASSETS[k].space).join(', ')); process.exit(1); }
const H = new Home({ seed: Number(seed), floor: 'plain' }), small = m.size[0] < 600, step = small ? 650 : Math.max(m.size[0], 700) + 500, rowZ = small ? 700 : Math.max(m.size[1], 500) + (m.size[2] > 1200 ? 1500 : 700);
const a = H.area('sheet', 'Sheet', { O: [0, 0], rect: [0, 0, step * 4, rowZ * 2 + 600] });
a.wall('back', [0, 0], 0, step * 4, []);
for (let i = 0; i < 8; i++) a.put(`v${i}`, asset, [step * (i % 4 + 0.5), 500 + rowZ * (1 - Math.floor(i / 4))], 0, { group: 'row', mount: m.mount === 'on' ? 'floor' : m.mount, params: JSON.parse(extra) });
a.view({ target: [step * 2, 400, rowZ], az: 0, el: 24, dist: step * 3.4 });
H.write(new URL(`./variants-${asset}.json`, import.meta.url).pathname, fs);
const used = H.S.home.objects.map((o) => `${o.id}: ${JSON.stringify(o.params)}`); console.log(used.join('\n'));
