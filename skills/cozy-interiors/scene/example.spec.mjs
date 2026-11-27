// A worked spec: one kitchen area with an L run, a table set and a seating group, clean through check-home and fitshots.
//   node example.spec.mjs [out.json]  →  node check-home.mjs out.json --quick  →  node fitshots.mjs out.json  (fitshots writes out.cameras.json; run the spec again and the shots below take those numbers)
// The roll: example.roll.json came from `node roll.mjs 4 kitchen`. H.roll keeps it, and check-home compares every dealt thing with the scene: present, or a.skip(thing, 'why').
// Every coordinate is millimetres in the area's frame: x along the back wall from its left end, z out into the room.
import fs from 'node:fs';
import { Home } from './compose.mjs';
import { cameras } from './cameras.mjs';
const out = process.argv[2] || 'example.json', C = cameras(out.replace(/\.json$/, '.cameras.json'));   // the fitted shots from the last fitshots run, in the area's own frame
const H = new Home({ seed: 12, floor: 'boards' });
H.roll(JSON.parse(fs.readFileSync(new URL('./example.roll.json', import.meta.url), 'utf8')));
const a = H.area('kitchen', 'Kitchen', { rect: [0, 0, 5200, 5200] });
const back = a.back(5200, [{ kind: 'window', x: 4300, width: 1100, height: 1200, sill: 1000 }]);
const left = a.left(5200);
// One run on the back wall: a sink, drawers, the hob and a cupboard. (A corner kitchen takes a second run: a.run(wall, id, at, modules, { joins, ownsTop: false }); its group is whole in the cook shot, so give the room the depth the shot needs.)
const R = a.run(back, 'run', 0, [{ w: 900, kind: 'sink' }, { w: 600, kind: 'drawers', n: 3, ajar: 0.3 }, { w: 900, kind: 'hob' }, { w: 600, kind: 'doors' }], { group: 'cook', hero: true });
R.on('hob', 'hob', { group: 'cook' }); R.on('hob', 'hood', { group: 'cook' }); R.on('hob', 'pan', { group: 'cook' });
R.on('drawers', 'herbs', { group: 'cook' }); R.on('doors', 'fruitBowl', { group: 'cook' });   // the roll's herbs stand on the worktop
back.place('wc1', 'wallRun', 2700, { group: 'cook', params: { modules: [{ w: 500, kind: 'door' }] } });
back.place('shelf', 'openShelf', 450, { group: 'cook', y: 1520 });
a.put('runner', 'runner', [1900, 1250], 90, { group: 'cook', params: { w: 700, l: 2400, form: 'stripe' } });   // a runner in front of the cooking
left.place('dresser', 'sideboard', 3000, { group: 'dresser', params: { w: 1000 } }); left.place('dpic', 'picture', 3000, { group: 'dresser', y: 1000, params: { w: 600, h: 450, colour: 'keep' } }); a.onTop('dresser', [{ id: 'dplant', asset: 'plant' }, { id: 'djug', asset: 'bookStack' }], { group: 'dresser' });   // the roll's dresser group: a sideboard with a still life under a picture
left.place('shelves', 'openShelf', 600, { group: 'shelves', params: { w: 900 } }); // the roll's shelves group: open shelves with jars and a plant
a.put('bsk', 'basket', [1000, 4500], 0, { group: 'shelves' });
a.put('bench', 'chair', [330, 3450], 90, { group: 'bench' }); a.put('bench2', 'chair', [330, 4050], 90, { group: 'bench' });   // two spare chairs by the left wall
// A table set: a round table with two chairs and a rug, standing in open floor within reach of the cooking.
const T = a.table('bt', { at: [3300, 3200], r: 520, chairs: 2, group: 'breakfast', cloth: true });   // a cloth on the table
T.on('mug', { y: 757, dx: -180 }); T.on('saltPepper', { y: 757, dx: 260 });   // the roll's table still life: a mug and salt and pepper
// The roll's foreground piece, a trolley with fruit and a plant on it, stands against the wall at the end of the run.
a.put('stool', 'trolley', [3400, 230], 0, { group: 'cook' }); a.onTop('stool', [{ id: 'tfb', asset: 'mug' }, { id: 'tjg', asset: 'jug' }], { group: 'cook' });
a.skip('hanging', 'no hanging-plant asset yet: the plant stands on the sill and the worktop instead');
a.skip('mokaPot', 'the hob carries a pan under the hood: a moka pot would stand in its place');
a.skip('utensilCrock', 'the hob has no room beside it for a crock: pans hang on the rail instead');   // a thing the roll dealt and the scene leaves out says why
// Shots: a.shot(name, from, look, fov, group). fitshots.mjs finds the cameras; its numbers go in here.
a.shot('cook', ...C('kitchen', 'cook', [[1700, 1100, 6000], [1212, 500, 371], 40]), 'cook');   // C(area, name, fallback): the fitted camera, or the fallback on the first run
a.shot('table', ...C('kitchen', 'table', [[500, 1700, 6150], [3080, 300, 2627], 36]), 'breakfast');
a.shot('cook2', ...C('kitchen', 'cook2', [[200, 1000, 6000], [1035, 700, 144], 40]), 'cook');
a.view({ target: [2800, 700, 2200], el: 20 });   // az comes from the plan
H.write(out, fs);
