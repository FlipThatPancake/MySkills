// The Reading corner batch, close up: PART=seats|seats2|lamps|small|shelf node reading-batch.spec.mjs; snap.mjs reading-batch.json out.png sheet 1500 800 (TX, DD env: view target x, distance).
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
const PART = process.env.PART || 'seats', W = 5200;
const H = new Home({ seed: 3, floor: 'plain' }), a = H.area('sheet', 'Sheet', { O: [0, 0], rect: [0, 0, W, 3200] });
a.wall('back', [0, 0], 0, W, []);
const put = (id, asset, x, z, params, o = {}) => a.put(id, asset, [x, z], o.turn || 0, { group: 'row', params, y: 0, ...o.m });
const wall = (id, asset, x, y, params) => a.put(id, asset, [x, 100], 0, { mount: 'wall', y, group: 'row', params });
let tx = 2600, ty = 400, tz = 1000, dd = 4600, el = 14;
if (PART === 'seats') { put('s1', 'windowSeat', 1500, 400, { form: 'storage', w: 1700, cushion: 'striped', pillows: 2 }); put('s2', 'windowSeat', 3700, 400, { form: 'open', w: 1500, cushion: 'plain', pillows: 1, throwOn: 'no', seed: 4 }); tx = 2600; dd = 4800; }
else if (PART === 'seats2') { put('s3', 'windowSeat', 1500, 400, { form: 'legs', w: 1400, cushion: 'tufted', pillows: 3, seed: 6 }); put('s4', 'windowSeat', 3700, 400, { form: 'storage', w: 1200, d: 480, cushion: 'plain', pillows: 0, throwOn: 'yes', seed: 9 }); tx = 2600; dd = 4400; }
else if (PART === 'lamps') { put('l1', 'readingLamp', 700, 1200, { form: 'arc', shade: 'drum' }); put('l2', 'readingLamp', 2300, 1200, { form: 'tripod', shade: 'cone', seed: 4 }); put('l3', 'readingLamp', 3600, 1200, { form: 'pharmacy', shade: 'dome', seed: 5 }); ty = 800; dd = 4400; tx = 2300; }
else if (PART === 'small') { put('b1', 'floorBooks', 800, 1500, { n: 6, form: 'stack', topper: 'cup' }); put('b2', 'floorBooks', 1700, 1500, { n: 7, form: 'tower', seed: 4 }); put('b3', 'floorBooks', 2700, 1500, { n: 6, form: 'pair', topper: 'glasses', seed: 6 }); put('t1', 'teaSet', 3700, 1500, { form: 'cup' }); put('t2', 'teaSet', 4500, 1500, { form: 'pot', seed: 5 }); ty = 100; dd = 2800; el = 24; tx = 2650; }
else { wall('r1', 'readShelf', 1000, 900, { form: 'ledge', w: 900 }); wall('r2', 'readShelf', 2600, 1000, { form: 'floating', w: 800, seed: 4 }); wall('r3', 'readShelf', 4200, 900, { form: 'bracket', w: 900, seed: 6 }); ty = 900; dd = 3800; tz = 500; el = 8; }
if (process.env.TZV) tz = +process.env.TZV; if (process.env.TX) tx = +process.env.TX; if (process.env.DD) dd = +process.env.DD;
a.top = 2400;
a.view({ target: [tx, ty, tz], az: 4, el, dist: dd, fit: 'none' });
H.write(new URL('./reading-batch.json', import.meta.url).pathname, fs);
