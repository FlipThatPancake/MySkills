// A close-up row of the soft things: coat and bag on hooks, shoes, pouf. node softs.spec.mjs; snap.mjs softs.json out.png sheet 1400 800
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
const H = new Home({ seed: 3, floor: 'plain' }), a = H.area('sheet', 'Sheet', { O: [0, 0], rect: [0, 0, 5200, 1800] });
a.wall('back', [0, 0], 0, 5200, []);
a.put('hooks', 'coatHooks', [900, 100], 0, { mount: 'wall', y: 1500, group: 'row' });
a.put('shoes', 'shoes', [2200, 900], 0, { group: 'row', params: { pairs: 2, kind: 'sneaker' } });
a.put('boots', 'shoes', [2900, 900], 0, { group: 'row', params: { pairs: 1, kind: 'boot' } });
a.put('pouf', 'pouf', [3200, 800], 0, { group: 'row' });
a.put('pouf2', 'pouf', [4200, 800], 0, { group: 'row', params: { r: 220, h: 300 } });
const [tx, ty, dd, el] = (process.argv[2] || '2600,900,7800,12').split(',').map(Number); a.top = 2000; a.view({ target: [tx, dd < 2000 ? 60 : dd < 3000 ? 1050 : 600, ty], az: Number(process.argv[3] || 0), el, dist: dd, fit: 'none' });
H.write(new URL('./softs.json', import.meta.url).pathname, fs);
