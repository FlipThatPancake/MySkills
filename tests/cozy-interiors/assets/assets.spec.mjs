// node assets/assets.spec.mjs → assets/assets.json: the round-6 asset changes in one row each, far enough apart that a frame holds one. Then: node assets/sheet.mjs assets/assets.json <outdir>
// Rows: paintings (every form), shoes (neat, dropped, mixed), task lamps (every pose, both forms) on a table, standing photos on a chest, the hallway pendant, a window seat.
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
import { PAINTINGS } from '../../../skills/cozy-interiors/scene/src/library/paintings.js';
const H = new Home({ seed: 4, floor: 'plain' }), D = 1500;
const a = H.area('sheet', 'Sheet', { O: [0, 0], rect: [0, 0, 14 * D, 9000] });
a.wall('back', [0, 0], 0, 16 * D, []);
const only = (process.env.ONLY || '').split(',').filter(Boolean), keep = (id) => !only.length || only.some((q) => id.startsWith(q)) || /^(tt|ch)-/.test(id);   // ONLY=pic4,shoe keeps just those rows (a smaller page bakes faster)
const put = a.put.bind(a); a.put = (id, ...r) => (keep(id) ? put(id, ...r) : undefined);
let i = 0;
for (let f = 4; f < 4 + PAINTINGS.length; f++) for (const mode of ['default', 'keep', 'soft', 'ink']) { a.put(`pic${f}-${mode}`, 'picture', [1000 + (i++) * D, 40], 0, { mount: 'wall', y: 900, group: 'row', params: { form: f, w: 600, h: 800, ...(mode === 'default' ? {} : { colour: mode }) } }); }   // every painting x colour mode; 'default' sets no colour (round 6: very soft colour, never grey)
const shoes = ['neat', 'dropped', 'mixed'];
shoes.forEach((s, k) => a.put(`shoe-${s}`, 'shoes', [1000 + k * D, 3000], 0, { mount: 'floor', group: 'row2', params: { arrange: s, kind: k === 1 ? 'boot' : 'sneaker' } }));
let n = 0;
for (const form of ['arm', 'gooseneck']) for (const pose of ['upright', 'lean', 'reach']) { const x = 1000 + (n++) * D; a.put(`tt-${n}`, 'table', [x, 5500], 0, { group: 'row3', params: { w: 1100, d: 700, h: 750, form: 'legs' } }); a.put(`lamp-${form}-${pose}`, 'taskLamp', [x, 5500], 0, { y: 750, mount: 'on', group: 'row3', params: { form, pose, shade: n % 2 ? 'cone' : 'dome' } }); }
for (let f = 0; f < 3; f++) { const x = 1000 + (7 + f) * D + 400; a.put(`ch-${f}`, 'console', [x, 5500], 0, { group: 'row3' }); a.put(`photo-${f}`, 'photoFrame', [x, 5500], 0, { y: 800, mount: 'on', group: 'row3', params: { form: f, w: [160, 200, 240][f], h: [220, 260, 180][f], tilt: [10, 12, 14][f] } }); }
a.put('hpend', 'pendantLamp', [1000, 7800], 0, { mount: 'ceiling', group: 'row4', params: { rim: 1650 } });
for (const f of ['dome', 'globe', 'cone', 'rattan']) a.put(`pf-${f}`, 'pendantForm', [1000 + (1 + ['dome', 'globe', 'cone', 'rattan'].indexOf(f)) * D, 7800], 0, { mount: 'ceiling', group: 'row4', params: { form: f, rim: 1650 } });
a.put('wseat', 'windowSeat', [1000 + 6 * D, 7800], 0, { group: 'row4', params: { w: 1100 } });
// E-items: one close-up row each (floor and table things, hung and wall things)
a.put('logs', 'logBasket', [1000, 1500], 0, { mount: 'floor', group: 'row5', params: { seed: 3 } });
a.put('jug', 'jug', [1000 + D, 1500], 0, { mount: 'floor', group: 'row5' });
a.put('tt-clk', 'table', [1000 + 2 * D, 1500], 0, { group: 'row5', params: { w: 1100, d: 700, h: 750, form: 'legs' } }); a.put('clock-d', 'alarmClock', [1000 + 2 * D, 1500], 0, { mount: 'on', y: 750, group: 'row5', params: { kind: 'digital' } });
a.put('tt-bks', 'table', [1000 + 3 * D, 1500], 0, { group: 'row5', params: { w: 1100, d: 700, h: 750, form: 'legs' } }); a.put('bookS', 'bookStack', [1000 + 3 * D, 1500], 0, { mount: 'on', y: 750, group: 'row5', params: { n: 4, seed: 11 } });
a.put('hat', 'hungHat', [1000 + 4 * D, 40], 0, { mount: 'wall', y: 1650, group: 'row5' });
a.put('hang', 'hangingPlant', [1000 + 5 * D, 40], 0, { mount: 'wall', y: 950, group: 'row5' });
a.put('tt-run', 'table', [1000 + 6 * D, 1500], 0, { group: 'row5', params: { w: 1600, d: 900, h: 750, form: 'legs' } }); a.put('tableRunner', 'tableRunner', [1000 + 6 * D, 1500], 0, { mount: 'on', y: 750, group: 'row5' });
// round 6 rows: a fridge of each form (magnets, notes, photo on every one), unmade and made beds (the duvet)
for (let f = 0; f < 3; f++) a.put(`fr-${f}`, 'fridge', [1000 + f * D, 4300], 0, { mount: 'floor', group: 'row6', params: { form: f } });
for (const [k, p] of [['bedU1', { duvet: 'unmade', seed: 29 }], ['bedU2', { duvet: 'unmade', seed: 3 }], ['bedM', { duvet: 'made' }]]) a.put(k, 'bed', [1000 + (3 + ['bedU1', 'bedU2', 'bedM'].indexOf(k)) * 2 * D, 4300], 0, { mount: 'floor', group: 'row6', params: { w: 1400, frame: 'box', head: 860, ...p } });
a.put('bk-0', 'basket', [1000, 6200], 0, { mount: 'floor', group: 'row6' });   // the laundry basket (round 6, Nov 26): soft garments resting on each other
a.view({ target: [7000, 600, 4000], az: 0, el: 10, dist: 14000 });
H.write(new URL('./assets.json', import.meta.url).pathname, fs);
