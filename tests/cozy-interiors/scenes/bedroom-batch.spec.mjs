// The Bedroom batch on one sheet: node bedroom-batch.spec.mjs; snap.mjs bedroom-batch.json out.png sheet 1500 800  (TX, DD env: view target x and distance)
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
const PART = process.env.PART || 'beds';
const H = new Home({ seed: 3, floor: 'plain' }), a = H.area('sheet', 'Sheet', { O: [0, 0], rect: [0, 0, PART === 'beds' ? 10400 : 11400, PART === 'beds' ? 3200 : 5600] });
a.wall('back', [0, 0], 0, PART === 'beds' ? 10400 : 11400, []);
let x = 1100; if (PART === 'beds') for (const [i, f] of ['box', 'legs', 'upholstered', 'platform'].entries()) { a.put('bed' + i, 'bed', [x, 1400], 0, { group: 'row', params: { frame: f, w: 1500, duvet: i % 2 ? 'unmade' : 'made', head: 900, seed: i + 3 } }); x += 2500; }
if (PART !== 'beds') {
x = 900; const Z0 = 2700; const put = (id, asset, params, w, y, z = Z0, o = {}) => { a.put(id, asset, [x, z], 0, { group: 'row', params, ...(y !== undefined ? { y } : {}), ...o }); x += w; };
put('ch', 'chestOfDrawers', {}, 1200); put('ch2', 'chestOfDrawers', { w: 760, h: 900, rows: 3, pull: 'bar', legs: 'block' }, 1200);
put('bt', 'bedsideTable', {}, 0); a.put('lamp', 'bedsideLamp', [x - 100, Z0], 0, { y: 520, group: 'row' }); a.put('clk', 'alarmClock', [x + 110, Z0 + 60], 20, { y: 520, group: 'row' }); a.put('gb', 'glassesBook', [x + 90, Z0 - 60], 340, { y: 520, group: 'row', mount: 'on' }); x += 800;
put('bt2', 'bedsideTable', { w: 520 }, 0); a.put('lamp2', 'bedsideLamp', [x, Z0], 0, { y: 520, group: 'row', params: { shade: 'globe' } }); x += 800; put('rail', 'clothesRail', {}, 1500); put('cc', 'clothesChair', {}, 900); put('h1', 'hamper', {}, 800); put('h2', 'hamper', { form: 'square', lid: 'none', r: 190 }, 800);
a.put('lm', 'leaningMirror', [x + 300, Z0 - 300], 0, { group: 'row' }); a.put('sc', 'wallSconce', [x + 1500, 100], 0, { mount: 'wall', y: 1500, group: 'row' }); a.put('sc2', 'wallSconce', [x + 2000, 100], 0, { mount: 'wall', y: 1500, group: 'row', params: { arm: 'short', shade: 'globe' } });
}
a.top = 2200; const tx = +(process.env.TX || 7200), dd = +(process.env.DD || 16000); a.view({ target: [tx, 500, 1500], az: 8, el: 22, dist: dd, fit: 'none' });
H.write(new URL('./bedroom-batch.json', import.meta.url).pathname, fs);
