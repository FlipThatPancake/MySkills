// The Bedroom batch on one sheet: node bedroom-batch.spec.mjs; snap.mjs bedroom-batch.json out.png sheet 1500 800  (TX, DD env: view target x and distance)
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
const PART = process.env.PART || 'beds';
const H = new Home({ seed: 3, floor: 'plain' }), a = H.area('sheet', 'Sheet', { O: [0, 0], rect: [0, 0, PART === 'beds' ? 10400 : 13400, PART === 'beds' ? 3200 : 5600] });
a.wall('back', [0, 0], 0, PART === 'beds' ? 10400 : 13400, []);
let x = 1100; if (PART === 'beds') for (const [i, f] of ['box', 'legs', 'upholstered', 'platform'].entries()) { a.put('bed' + i, 'bed', [x, 1400], 0, { group: 'row', params: { frame: f, w: 1500, duvet: i % 2 ? 'unmade' : 'made', head: 900, seed: i + 3 } }); x += 2500; }
if (PART !== 'beds') {
  const put = (id, asset, params, x, z, o = {}) => a.put(id, asset, [x, z], o.turn || 0, { group: 'row', params, ...o.m });
  put('rail', 'clothesRail', {}, 1300, 2700); put('rail2', 'clothesRail', { mix: 'dresses', feet: 'wheels', w: 900, seed: 7 }, 3200, 2700);
  put('cc', 'clothesChair', {}, 4700, 2700); put('h1', 'hamper', {}, 5900, 2700); put('h2', 'hamper', { form: 'square', r: 190 }, 6800, 2700);
  put('ch', 'chestOfDrawers', { w: 760, h: 900, rows: 3, pull: 'bar', legs: 'block' }, 8000, 2700);
  put('bt', 'bedsideTable', {}, 9300, 2700); a.put('lamp', 'bedsideLamp', [9200, 2700], 0, { y: 520, group: 'row', params: { base: 'stack', shade: 'cone' } }); a.put('clk', 'alarmClock', [9420, 2760], 20, { y: 520, group: 'row' }); a.put('gb', 'glassesBook', [9350, 2640], 340, { y: 520, group: 'row' });
  put('lm', 'leaningMirror', { foot: 'block' }, 10600, 2400); put('lm2', 'leaningMirror', { shape: 'pill', foot: 'rail', lean: 11 }, 11500, 2400);
  a.put('sc', 'wallSconce', [10600, 100], 0, { mount: 'wall', y: 1500, group: 'row' });
  put('l2', 'bedsideLamp', { base: 'tripod', shade: 'globe' }, 12500, 2700);
}
a.top = 2200; const tx = +(process.env.TX || 7200), dd = +(process.env.DD || 16000); a.view({ target: [tx, +(process.env.TY || 500), PART === 'beds' ? 1500 : 2700], az: 8, el: 14, dist: dd, fit: 'none' });
H.write(new URL('./bedroom-batch.json', import.meta.url).pathname, fs);
