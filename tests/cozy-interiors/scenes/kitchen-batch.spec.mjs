// The Kitchen batch, close up: PART=top|wall|wall2 node kitchen-batch.spec.mjs; snap.mjs kitchen-batch.json out.png sheet 1500 800. top: two rows of worktop pieces; wall, wall2: wall pieces.
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
const PART = process.env.PART || 'top', W = 4200;
const H = new Home({ seed: 3, floor: 'plain' }), a = H.area('sheet', 'Sheet', { O: [0, 0], rect: [0, 0, W, 3200] });
a.wall('back', [0, 0], 0, W, []);
const put = (id, asset, x, z, params, o = {}) => a.put(id, asset, [x, z], 0, { group: 'row', params, y: 0, ...o });
const wp = (id, asset, x, y, params) => a.put(id, asset, [x, 100], 0, { mount: 'wall', y, group: 'row', params });
if (PART === 'top') {
  put('dr', 'dishRack', 600, 1500, { form: 'plates' }); put('dr2', 'dishRack', 1250, 1500, { form: 'cups' }); put('cr', 'utensilCrock', 1850, 1500, {}); put('cr2', 'utensilCrock', 2250, 1500, { n: 7, r: 80, seed: 40, mix: 'whisks' });
  put('bb', 'breadBin', 2850, 1500, { form: 'lid' }); put('bb2', 'breadBin', 3500, 1500, { form: 'roll' });
  put('ts', 'toaster', 700, 2500, { slots: 2 }); put('ts2', 'toaster', 1300, 2500, { form: 'retro', slots: 4 }); put('mp', 'mokaPot', 1900, 2500, {}); put('mp2', 'mokaPot', 2300, 2500, { sides: 6, handle: 'wood' }); put('cb', 'cookbookStand', 3000, 2500, {});
} else if (PART === 'wall') { wp('pr', 'potRail', 1100, 1050, {}); wp('os', 'openShelf', 2600, 1300, {}); }
else { wp('sp', 'spiceRack', 900, 1250, {}); wp('og', 'ovenGlove', 1500, 1500, {}); wp('og2', 'ovenGlove', 1850, 1500, { hand: 'right' }); wp('wc', 'wallClock', 2500, 1500, {}); wp('wc2', 'wallClock', 3100, 1500, { form: 'square', r: 150, face: 'dots' }); }
a.top = 2200; const tx = PART === 'top' ? 2100 : PART === 'wall' ? 1850 : 1950, dd = PART === 'top' ? 3600 : PART === 'wall' ? 3000 : 2600;
a.view({ target: [tx, PART === 'top' ? 150 : 1400, PART === 'top' ? 2000 : 200], az: 4, el: PART === 'top' ? 26 : 4, dist: dd, fit: 'none' });
H.write(new URL('./kitchen-batch.json', import.meta.url).pathname, fs);
