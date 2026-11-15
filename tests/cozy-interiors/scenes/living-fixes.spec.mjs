// The Living fixes on one sheet: node living-fixes.spec.mjs; snap.mjs living-fixes.json out.png sheet 1500 800
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
const H = new Home({ seed: 3, floor: 'plain' }), a = H.area('sheet', 'Sheet', { O: [0, 0], rect: [0, 0, 15600, 3600] });
a.wall('back', [0, 0], 0, 15600, []);
let x = 700; const put = (id, asset, params, w) => { a.put(id, asset, [x, 2700], 0, { group: 'row', params }); x += w; };
put('logs', 'logBasket', {}, 1000); put('logs2', 'logBasket', { seed: 21, r: 300, logs: 8 }, 1000); put('stove', 'woodStove', {}, 1300); put('stove2', 'woodStove', { door: 'round', legs: 'pedestal', w: 480 }, 1300); put('rec', 'recordPlayer', {}, 1300); put('rec2', 'recordPlayer', { lid: 'half', legs: 'block', records: 12 }, 1300); put('rec3', 'recordPlayer', { lid: 'closed' }, 1300); put('blk', 'coffeeTable', { shape: 'block' }, 1300); put('blk2', 'coffeeTable', { shape: 'block', w: 900, d: 560, h: 400 }, 1300);
a.put('gal', 'galleryWall', [2500, 100], 0, { mount: 'wall', y: 700, group: 'row', params: { seed: 4, align: 'centre', frame: 'thick' } });
a.put('gal2', 'galleryWall', [5200, 100], 0, { mount: 'wall', y: 700, group: 'row', params: { seed: 9, w: 1300, h: 1000, n: 5 } });
a.put('gal3', 'galleryWall', [7800, 100], 0, { mount: 'wall', y: 700, group: 'row', params: { seed: 14 } });
a.top = 2200; const tx = +(process.env.TX || 4800), dd = +(process.env.DD || 12500); a.view({ target: [tx, 500, 1500], az: 8, el: 18, dist: dd, fit: 'none' });
H.write(new URL('./living-fixes.json', import.meta.url).pathname, fs);
