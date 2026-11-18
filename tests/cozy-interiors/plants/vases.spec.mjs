// node plants/vases.spec.mjs → plants/vases.json: each vase form alone (far from its neighbours), for close-ups. Then: node plants/sheet.mjs plants/vases.json <outdir>
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
const H = new Home({ seed: 0, floor: 'plain' }), D = 3400, seed = Number(process.env.SEED || 3);
const a = H.area('sheet', 'Sheet', { O: [0, 0], rect: [0, 0, 4 * D, 4000] });
a.wall('back', [0, 0], 0, 4 * D, []);
for (let f = 0; f < 4; f++) a.put(`v${f}`, 'vase', [1500 + f * D, 2000], 0, { group: 'row', mount: 'floor', params: { form: f, seed } });
a.view({ target: [3000, 400, 2000], az: 0, el: 10, dist: 9000 });
H.write(new URL('./vases.json', import.meta.url).pathname, fs);
