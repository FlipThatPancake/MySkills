// The Hallway batch, close up: PART=floor|small|wall|runner node hallway-batch.spec.mjs; snap.mjs hallway-batch.json out.png sheet 1500 800.
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
const PART = process.env.PART || 'floor', W = 5200;
const H = new Home({ seed: 3, floor: 'plain' }), a = H.area('sheet', 'Sheet', { O: [0, 0], rect: [0, 0, W, PART === 'runner' ? 3600 : 3200] });
a.wall('back', [0, 0], 0, W, []);
const put = (id, asset, x, z, params, o = {}) => a.put(id, asset, [x, z], o.turn || 0, { group: 'row', params, y: 0, ...o.m });
let tx = 2600, ty = 600, tz = 1500, dd = 5200, el = 12;
if (PART.startsWith('rack')) { const f = ['slat', 'cubby', 'rods'][+PART[4] - 1]; put('sr', 'shoeRack', 2600, 1500, { form: f, tiers: 3, w: f === 'cubby' ? 980 : 760, seed: 3 }); ty = 400; dd = 2600; }
else if (PART === 'floor') {
  put('sr1', 'shoeRack', 900, 1500, { form: 'slat', tiers: 3, w: 760 }); put('sr2', 'shoeRack', 2200, 1500, { form: 'cubby', tiers: 2, w: 980, seed: 5 }); put('sr3', 'shoeRack', 3500, 1500, { form: 'rods', tiers: 3, w: 700, seed: 9 });
  ty = 800; dd = 5600;
} else if (PART === 'stands') {
  put('cs1', 'coatStand', 1000, 1500, { form: 'pole' }); put('cs2', 'coatStand', 2200, 1500, { form: 'tree', items: 'hat', seed: 4 }); put('cs3', 'coatStand', 3400, 1500, { form: 'tree', items: 'coat', seed: 5 });
  put('b1', 'boots', 700, 2600, { kind: 'wellington' }); put('b2', 'boots', 1700, 2600, { kind: 'ankle', seed: 4 }); put('b3', 'boots', 2700, 2600, { kind: 'hiker', seed: 6 });
  ty = 800; dd = 5600;
} else if (PART === 'small') {
  put('kb1', 'keyBowl', 700, 1500, { form: 'bowl', keys: 3 }); put('kb2', 'keyBowl', 1500, 1500, { form: 'dish', keys: 2, fob: 'ring', seed: 4 }); put('kb3', 'keyBowl', 2300, 1500, { form: 'tray', keys: 4, fob: 'none', seed: 8 });
  put('lt1', 'letterTray', 3200, 1500, { form: 'tray' }); put('lt2', 'letterTray', 4300, 1500, { form: 'caddy', seed: 5 });
  ty = 100; dd = 3000; el = 30; tx = 2500;
} else if (PART === 'wall') {
  const wall = (id, asset, x, params) => a.put(id, asset, [x, 100], 0, { mount: 'wall', y: 1500, group: 'row', params });
  wall('h1', 'hungHat', 700, { form: 'brim' }); wall('h2', 'hungHat', 1500, { form: 'beanie', seed: 4 }); wall('g1', 'hungBag', 2400, { form: 'satchel' }); wall('g2', 'hungBag', 3300, { form: 'tote' }); wall('g3', 'hungBag', 4300, { form: 'basket', seed: 5 });
  ty = 1000; dd = 5000; tz = 800;
} else {
  put('r1', 'runner', 900, 1800, { form: 'stripe', w: 700, l: 2400 }); put('r2', 'runner', 2200, 1800, { form: 'bands', w: 760, l: 2000, seed: 4 }); put('r3', 'runner', 3500, 1800, { form: 'check', w: 620, l: 2800, seed: 6, fold: 'no' }); put('r4', 'runner', 4600, 1800, { form: 'lines', w: 560, l: 2200, seed: 8 });
  ty = 0; dd = 6000; el = 45; tz = 1800;
}
if (process.env.TX) tx = +process.env.TX; if (process.env.DD) dd = +process.env.DD;
a.top = 2400;
a.view({ target: [tx, ty, tz], az: 4, el, dist: dd, fit: 'none' });
H.write(new URL('./hallway-batch.json', import.meta.url).pathname, fs);
