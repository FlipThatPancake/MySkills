// A sheet of the small assets laid in rows on a bare floor, for looking at them close up: node scenes/assets.spec.mjs, then node snap.mjs scenes/assets.json out.png <row>
import fs from 'node:fs';
import { Home } from '../compose.mjs';
const H = new Home({ seed: 0, floor: 'plain' });
const rows = {
  small: [['jars', 'jars'], ['kettle', 'kettle'], ['herbs', 'herbs'], ['stool', 'stool'], ['cat1', 'cat', { pose: 'sit' }], ['cat2', 'cat', { pose: 'curl' }], ['cat3', 'cat', { pose: 'loaf' }], ['vase', 'vase'], ['books', 'bookStack'], ['trolley', 'trolley']],
  rooms: [['bed', 'bed'], ['bedside', 'bedsideTable'], ['wardrobe', 'wardrobe'], ['desk', 'desk'], ['dchair', 'deskChair'], ['daybed', 'daybed'], ['rchair', 'readingChair'], ['fstool', 'footstool'], ['console', 'console']],
};
const a = H.area('sheet', 'Sheet', { O: [0, 0], rect: [0, 0, 9000, 3000] });
a.wall('back', [0, 0], 0, 9000, []);
let x = 600;
for (const [k, list] of Object.entries(rows)) { x = 600; for (const [id, asset, params] of list) { a.put(`${k}-${id}`, asset, [x, k === 'small' ? 2400 : 900], 0, { group: 'row', params }); x += 900; } }
a.put('mirror', 'mirror', [8000, 100], 0, { mount: 'wall', y: 800, group: 'row' });
a.put('hooks', 'coatHooks', [8600, 100], 0, { mount: 'wall', y: 1500, group: 'row' });
a.put('towel', 'teaTowel', [7400, 100], 0, { mount: 'wall', y: 1400, group: 'row' });
a.view({ target: [4500, 600, 1200], az: 0, el: 12, dist: 9000 });
H.write(new URL('./assets.json', import.meta.url).pathname, fs);
