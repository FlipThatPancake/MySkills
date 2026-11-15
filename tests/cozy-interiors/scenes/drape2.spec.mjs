// A dining table with a cloth, a table with a runner, and a bed with an unmade duvet, to see the hung cloth. node drape2.spec.mjs; snap.mjs drape2.json out.png sheet 1400 800
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
const H = new Home({ seed: 5, floor: 'boards' }), a = H.area('sheet', 'Sheet', { O: [0, 0], rect: [0, 0, 8200, 3600] });
a.wall('back', [0, 0], 0, 8200, []);
a.put('t1', 'table', [1300, 1500], 0, { group: 'dine', params: { w: 1600, d: 900, h: 750 } });
a.put('cloth1', 'tablecloth', [1300, 1500], 0, { group: 'dine', y: 750, mount: 'on', params: { w: 1600, d: 900, seed: 3 } });
a.put('t2', 'table', [3700, 1500], 0, { group: 'dine', params: { w: 1600, d: 900, h: 750 } });
a.put('run', 'tableRunner', [3700, 1500], 0, { group: 'dine', y: 750, mount: 'on', params: { w: 1600, d: 900 } });
a.put('bed', 'bed', [6500, 1400], 0, { group: 'sleep', params: { w: 1600, l: 2100, duvet: 'unmade', seed: 3 } });
a.top = 2000; a.view({ target: [4000, 500, 1500], az: 18, el: 24, dist: 9600, fit: 'none' });
H.write(new URL('./drape2.json', import.meta.url).pathname, fs);
