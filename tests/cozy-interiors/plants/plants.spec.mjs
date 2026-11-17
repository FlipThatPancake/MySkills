// node plants/plants.spec.mjs → plants/plants.json: every floorPlant form (row back) and plant form (row front) on a bare floor, for looking close up. Then: node ../../skills/cozy-interiors/scene/snap.mjs plants/plants.json out.png sheet
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
const H = new Home({ seed: 0, floor: 'plain' });
const a = H.area('sheet', 'Sheet', { O: [0, 0], rect: [0, 0, 6000, 2400] });
a.wall('back', [0, 0], 0, 6000, []);
const seed = Number(process.env.SEED || 6);
const only = (process.env.ONLY || '').split(',').filter(Boolean), ok = (id) => !only.length || only.includes(id);
for (let f = 0; f < 5; f++) if (ok(`fp${f}`)) a.put(`fp${f}`, 'floorPlant', [600 + f * 1100, 1500], 0, { group: 'row', params: { form: f, seed } });
for (let f = 0; f < 6; f++) if (ok(`p${f}`)) a.put(`p${f}`, 'plant', [700 + f * 900, 500], 0, { mount: 'floor', group: 'row', params: { form: f, seed } });
a.view({ target: [3000, 400, 1000], az: 0, el: 10, dist: 7000 });
H.write(new URL('./plants.json', import.meta.url).pathname, fs);
