// The Home office batch, close up: PART=desks|lamps|screens|small|files|wall node office-batch.spec.mjs; snap.mjs office-batch.json out.png sheet 1500 800 (TX, DD, TY env: view target x, distance, height).
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
const PART = process.env.PART || 'desks', W = 5200;
const H = new Home({ seed: 3, floor: 'plain' }), a = H.area('sheet', 'Sheet', { O: [0, 0], rect: [0, 0, W, 3200] });
a.wall('back', [0, 0], 0, W, []);
const put = (id, asset, x, z, params, o = {}) => a.put(id, asset, [x, z], o.turn || 0, { group: 'row', params, y: 0, ...o.m });
const wall = (id, asset, x, y, params) => a.put(id, asset, [x, 100], 0, { mount: 'wall', y, group: 'row', params });
let tx = 2600, ty = 500, tz = 1500, dd = 5400, el = 14;
if (PART === 'desks') { put('d1', 'desk', 1000, 1500, { form: 'pedestal', w: 1300 }); put('d2', 'desk', 2700, 1500, { form: 'trestle', w: 1300, d: 650, seed: 4 }); put('d3', 'desk', 4300, 1500, { form: 'writing', w: 1300, d: 640, legs: 'tapered', seed: 7 }); ty = 400; dd = 5600; }
else if (PART === 'lamps') { put('l1', 'taskLamp', 700, 1500, { form: 'arm', shade: 'cone' }); put('l2', 'taskLamp', 1500, 1500, { form: 'arm', shade: 'dome', a1: 70, a2: -20, seed: 4 }); put('l3', 'taskLamp', 2300, 1500, { form: 'gooseneck', shade: 'cone', seed: 5 }); put('g1', 'globe', 3300, 1500, { r: 130, stand: 'cradle' }); put('g2', 'globe', 4300, 1500, { r: 105, seed: 6, stand: 'tripod' }); ty = 250; dd = 3200; }
else if (PART === 'screens') { put('m1', 'monitor', 900, 1300, { w: 560, stand: 'foot' }); put('m2', 'monitor', 2200, 1300, { w: 640, stand: 'bar', kb: 'no', seed: 4 }); put('m3', 'monitor', 3500, 1300, { w: 520, stand: 'arm', seed: 6 }); put('p1', 'printer', 4600, 1500, { form: 'inkjet' }); ty = 250; dd = 4400; }
else if (PART === 'small') { put('n1', 'notebook', 600, 1500, { form: 'closed', pens: 2 }); put('n2', 'notebook', 1300, 1500, { form: 'open', pens: 1, seed: 4 }); put('n3', 'notebook', 2200, 1500, { form: 'spiral', pens: 0, seed: 5 }); put('o1', 'deskOrganiser', 3000, 1500, { form: 'cups' }); put('o2', 'deskOrganiser', 3700, 1500, { form: 'pots', seed: 4 }); put('o3', 'deskOrganiser', 4400, 1500, { form: 'tiered', seed: 5 }); ty = 100; dd = 2400; el = 28; }
else if (PART === 'files') { put('b1', 'binders', 900, 1500, { n: 6, form: 'row' }); put('b2', 'binders', 1900, 1500, { n: 4, form: 'stack', seed: 3 }); put('b3', 'binders', 2900, 1500, { n: 4, h: 310, form: 'row', seed: 8 }); put('p2', 'printer', 3900, 1500, { form: 'laser', w: 460, seed: 5 }); ty = 200; dd = 3400; el = 18; }
else { wall('pb1', 'pinboard', 1200, 800, { w: 900, h: 600, notes: 7 }); wall('pb2', 'pinboard', 2800, 800, { w: 700, h: 500, notes: 5, frame: 'none', seed: 6 }); wall('c1', 'wallCalendar', 3900, 800, { form: 'grid' }); wall('c2', 'wallCalendar', 4500, 800, { form: 'photo', seed: 4, hook: 'ribbon' }); ty = 1100; dd = 4200; tz = 600; el = 6; }
if (process.env.TX) tx = +process.env.TX; if (process.env.DD) dd = +process.env.DD;
a.top = 2400;
a.view({ target: [tx, ty, tz], az: 4, el, dist: dd, fit: 'none' });
H.write(new URL('./office-batch.json', import.meta.url).pathname, fs);
