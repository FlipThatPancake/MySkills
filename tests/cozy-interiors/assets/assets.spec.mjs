// node assets/assets.spec.mjs → assets/assets.json: the round-6 asset changes in one row each, far enough apart that a frame holds one. Then: node assets/sheet.mjs assets/assets.json <outdir>
// Rows: paintings (every form), shoes (neat, dropped, mixed), task lamps (every pose, both forms) on a table, standing photos on a chest, the hallway pendant, a window seat.
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
import { PAINTINGS } from '../../../skills/cozy-interiors/scene/src/library/paintings.js';
const H = new Home({ seed: 4, floor: 'plain' }), D = 1500;
const a = H.area('sheet', 'Sheet', { O: [0, 0], rect: [0, 0, 14 * D, 9000] });
a.wall('back', [0, 0], 0, 14 * D, []);
const only = (process.env.ONLY || '').split(',').filter(Boolean), keep = (id) => !only.length || only.some((q) => id.startsWith(q)) || /^(tt|ch)-/.test(id);   // ONLY=pic4,shoe keeps just those rows (a smaller page bakes faster)
const put = a.put.bind(a); a.put = (id, ...r) => (keep(id) ? put(id, ...r) : undefined);
let i = 0;
for (let f = 0; f < 4 + PAINTINGS.length; f++, i++) { a.put(`pic${f}`, 'picture', [1000 + i * D, 40], 0, { mount: 'wall', y: 900, group: 'row', params: { form: f, w: 600, h: 800 } }); }
const shoes = ['neat', 'dropped', 'mixed'];
shoes.forEach((s, k) => a.put(`shoe-${s}`, 'shoes', [1000 + k * D, 3000], 0, { mount: 'floor', group: 'row2', params: { arrange: s, kind: k === 1 ? 'boot' : 'sneaker' } }));
let n = 0;
for (const form of ['arm', 'gooseneck']) for (const pose of ['upright', 'lean', 'reach']) { const x = 1000 + (n++) * D; a.put(`tt-${n}`, 'table', [x, 5500], 0, { group: 'row3', params: { w: 1100, d: 700, h: 750, form: 'legs' } }); a.put(`lamp-${form}-${pose}`, 'taskLamp', [x, 5500], 0, { y: 750, mount: 'on', group: 'row3', params: { form, pose, shade: n % 2 ? 'cone' : 'dome' } }); }
for (let f = 0; f < 3; f++) { const x = 1000 + (7 + f) * D + 400; a.put(`ch-${f}`, 'console', [x, 5500], 0, { group: 'row3' }); a.put(`photo-${f}`, 'photoFrame', [x, 5500], 0, { y: 800, mount: 'on', group: 'row3', params: { form: f, w: [160, 200, 240][f], h: [220, 260, 180][f], tilt: [10, 12, 14][f] } }); }
a.put('hpend', 'pendantLamp', [1000, 7800], 0, { mount: 'ceiling', group: 'row4', params: { rim: 1650 } });
for (const f of ['dome', 'globe', 'cone', 'rattan']) a.put(`pf-${f}`, 'pendantForm', [1000 + (1 + ['dome', 'globe', 'cone', 'rattan'].indexOf(f)) * D, 7800], 0, { mount: 'ceiling', group: 'row4', params: { form: f, rim: 1650 } });
a.put('wseat', 'windowSeat', [1000 + 6 * D, 7800], 0, { group: 'row4', params: { w: 1100 } });
a.view({ target: [7000, 600, 4000], az: 0, el: 10, dist: 14000 });
H.write(new URL('./assets.json', import.meta.url).pathname, fs);
