// The Dining batch, close up: PART=table|big|wall node dining-batch.spec.mjs; snap.mjs dining-batch.json out.png sheet 1500 800.
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
const PART = process.env.PART || 'table', W = 5200;
const H = new Home({ seed: 3, floor: 'plain' }), a = H.area('sheet', 'Sheet', { O: [0, 0], rect: [0, 0, W, 3600] });
a.wall('back', [0, 0], 0, W, []);
const put = (id, asset, x, z, params, o = {}) => a.put(id, asset, [x, z], 0, { group: 'row', params, y: 0, ...o });
if (PART === 'table') {
  put('cs', 'candlesticks', 600, 1400, { form: 'turned' }); put('cs2', 'candlesticks', 1300, 1400, { form: 'stem', n: 3, seed: 9 }); put('cs3', 'candlesticks', 2000, 1400, { form: 'tapered' });
  put('jg', 'jug', 2700, 1400, {}); put('jg2', 'jug', 3100, 1400, { form: 'straight', band: 'banded', handle: 'none' });
  put('bk', 'breadBasket', 3700, 1400, { bread: 'loaf' }); put('bk2', 'breadBasket', 4200, 1400, { bread: 'baguette' });
  put('ps', 'placeSetting', 900, 2500, { glass: 'yes', napkin: 'yes' }); put('ps2', 'placeSetting', 2200, 2500, { glass: 'no', napkin: 'no', r: 120 }); put('bc', 'benchCushion', 3800, 2500, { stripes: 'check' });
} else if (PART === 'big') { put('gc', 'glazedCabinet', 1200, 1600, {}); put('gc2', 'glazedCabinet', 2700, 1600, { w: 800, doors: 2, shelves: 2, seed: 8 }); put('pf', 'pendantForm', 4300, 1800, { form: 'rattan', rim: 1100 }); }
else { a.put('wp', 'wallPlates', [1100, 100], 0, { mount: 'wall', y: 900, group: 'row', params: { layout: 'cluster' } }); a.put('wp2', 'wallPlates', [2700, 100], 0, { mount: 'wall', y: 900, group: 'row', params: { layout: 'ring', n: 6 } }); a.put('wp3', 'wallPlates', [4100, 100], 0, { mount: 'wall', y: 1300, group: 'row', params: { layout: 'row', n: 4 } }); }
a.top = 2400; const tx = PART === 'table' ? 2300 : PART === 'big' ? 2600 : 2600, dd = PART === 'table' ? 4600 : PART === 'big' ? 5800 : 4600;
a.view({ target: [tx, PART === 'table' ? 150 : 800, PART === 'table' ? 2000 : 800], az: 4, el: PART === 'table' ? 26 : 10, dist: dd, fit: 'none' });
H.write(new URL('./dining-batch.json', import.meta.url).pathname, fs);
