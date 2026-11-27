// The Living batch on one sheet: node living-batch.spec.mjs; snap.mjs living-batch.json out.png sheet 1500 800
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
const H = new Home({ seed: 3, floor: 'plain' }), a = H.area('sheet', 'Sheet', { O: [0, 0], rect: [0, 0, 10200, 3600] });
a.wall('back', [0, 0], 0, 10200, []);
const row = (z, list) => { let x = 600; for (const [id, asset, params, w = 900, o = {}] of list) { a.put(id, asset, [x, z], 0, { group: 'row', params, ...o }); x += w; } };
row(2700, [['cush', 'floorCushion', {}, 1000], ['logs', 'logBasket', {}, 1000], ['stove', 'woodStove', {}, 1100], ['rec', 'recordPlayer', {}, 1200], ['mag', 'magazineBox', {}, 900], ['stand', 'plantStand', {}, 900], ['stand2', 'plantStand', { tiers: 2, plant: 'sprig' }, 900]]);
a.put('sofaL', 'sofa', [8800, 2500], 0, { group: 'row', params: { chaise: 'left', seats: 3 } });
a.put('gal', 'galleryWall', [3000, 100], 0, { mount: 'wall', y: 700, group: 'row', params: { seed: 4 } });
a.put('gal2', 'galleryWall', [6000, 100], 0, { mount: 'wall', y: 700, group: 'row', params: { seed: 9, w: 1300, h: 1000, n: 5 } });
a.put('scr', 'scratches', [7747, 2750], 270, { mount: 'lines', y: 520, group: 'row' });
a.top = 2200; a.view({ target: [5100, 500, 1500], az: 8, el: 18, dist: 13500, fit: 'none' });
H.write(new URL('./living-batch.json', import.meta.url).pathname, fs);
