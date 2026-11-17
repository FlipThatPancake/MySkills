// node plants/plants.spec.mjs → plants/plants.json: every floorPlant form (back row) and plant form (front row), each far from its neighbours so a frame holds one, and the original kitchen plant (plant form 0) beside each at the same scale.
// ONLY=fp0,p3 keeps just those; SEED=n changes the seed. Then: node plants/sheet.mjs plants/plants.json <outdir>
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
const H = new Home({ seed: 0, floor: 'plain' });
const only = (process.env.ONLY || '').split(',').filter(Boolean), ok = (id) => !only.length || only.includes(id), seed = Number(process.env.SEED || 6), D = 3400;
const a = H.area('sheet', 'Sheet', { O: [0, 0], rect: [0, 0, 6 * D, 9000] });
a.wall('back', [0, 0], 0, 6 * D, []);
for (let f = 0; f < 5; f++) if (ok(`fp${f}`)) { a.put(`fp${f}`, 'floorPlant', [1500 + f * D, 2000], 0, { group: 'row', params: { form: f, seed } }); a.put(`ref-fp${f}`, 'plant', [1500 + f * D + 650, 2000], 0, { mount: 'floor', group: 'row', params: { form: 0 } }); }
for (let f = 0; f < 6; f++) if (ok(`p${f}`)) { a.put(`p${f}`, 'plant', [1500 + f * D, 6500], 0, { mount: 'floor', group: 'row', params: { form: f, seed } }); if (f) a.put(`ref-p${f}`, 'plant', [1500 + f * D + 320, 6500], 0, { mount: 'floor', group: 'row', params: { form: 0 } }); }
a.view({ target: [3000, 400, 4000], az: 0, el: 10, dist: 9000 });
H.write(new URL('./plants.json', import.meta.url).pathname, fs);
