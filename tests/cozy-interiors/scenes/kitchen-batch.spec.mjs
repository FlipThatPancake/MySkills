// The Kitchen batch on one sheet: PART=top|wall node kitchen-batch.spec.mjs; snap.mjs kitchen-batch.json out.png sheet 1500 800 (TX, DD env: view target x and distance)
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
const PART = process.env.PART || 'top', W = 8400;
const H = new Home({ seed: 3, floor: 'plain' }), a = H.area('sheet', 'Sheet', { O: [0, 0], rect: [0, 0, W, 3200] });
a.wall('back', [0, 0], 0, W, []);
const put = (id, asset, x, z, params, o = {}) => a.put(id, asset, [x, z], 0, { group: 'row', params, y: 0, ...o });
if (PART === 'top') {
  put('dr', 'dishRack', 700, 2200, {}, { y: 0 }); put('dr2', 'dishRack', 1500, 2200, { form: 'cups' }, { y: 0 });
  put('cr', 'utensilCrock', 2300, 2200, {}); put('cr2', 'utensilCrock', 2700, 2200, { n: 7, r: 80, seed: 40 });
  put('bb', 'breadBin', 3500, 2200, {}); put('bb2', 'breadBin', 4300, 2200, { form: 'lid' });
  put('ts', 'toaster', 5100, 2200, {}); put('ts2', 'toaster', 5700, 2200, { form: 'retro' });
  put('mp', 'mokaPot', 6300, 2200, {}); put('mp2', 'mokaPot', 6700, 2200, { r: 52, h: 180 });
  put('cb', 'cookbookStand', 7400, 2200, {});
} else {
  a.put('pr', 'potRail', [1500, 100], 0, { mount: 'wall', y: 1050, group: 'row' });
  a.put('os', 'openShelf', [3500, 100], 0, { mount: 'wall', y: 1300, group: 'row' });
  a.put('sp', 'spiceRack', [5200, 100], 0, { mount: 'wall', y: 1250, group: 'row' });
  a.put('og', 'ovenGlove', [6200, 100], 0, { mount: 'wall', y: 1500, group: 'row' }); a.put('og2', 'ovenGlove', [6500, 100], 0, { mount: 'wall', y: 1500, group: 'row', params: { hand: 'right' } });
  a.put('wc', 'wallClock', [7100, 100], 0, { mount: 'wall', y: 1700, group: 'row' }); a.put('wc2', 'wallClock', [7700, 100], 0, { mount: 'wall', y: 1700, group: 'row', params: { form: 'square', r: 150 } });
}
a.top = 2200; const tx = +(process.env.TX || 4200), dd = +(process.env.DD || 7000); a.view({ target: [tx, PART === 'top' ? 100 : 1300, 1500], az: 6, el: PART === 'top' ? 24 : 6, dist: dd, fit: 'none' });
H.write(new URL('./kitchen-batch.json', import.meta.url).pathname, fs);
