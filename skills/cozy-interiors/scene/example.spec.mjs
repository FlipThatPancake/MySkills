// A worked spec: one kitchen area with an L run, a table set and a seating group, clean through check-home and fitshots.
//   node example.spec.mjs [out.json]  →  node check-home.mjs out.json --quick  →  node fitshots.mjs out.json  (fitshots writes out.cameras.json; run the spec again and the shots below take those numbers)
// The roll: example.roll.json came from `node roll.mjs 4 kitchen`. H.roll keeps it, and check-home compares every dealt thing with the scene: present, or a.skip(thing, 'why').
// Every coordinate is millimetres in the area's frame: x along the back wall from its left end, z out into the room.
import fs from 'node:fs';
import { Home } from './compose.mjs';
import { cameras } from './cameras.mjs';
const out = process.argv[2] || 'example.json', C = cameras(out.replace(/\.json$/, '.cameras.json'));   // the fitted shots from the last fitshots run, in the area's own frame
const H = new Home({ seed: 12, floor: 'boards' });
H.roll(JSON.parse(fs.readFileSync(new URL('./example.roll.json', import.meta.url), 'utf8')));   // the home's accent comes from the roll
const a = H.area('kitchen', 'Kitchen', { rect: [0, 0, 6600, 5200] });
const back = a.back(6600, [{ kind: 'window', x: 4700, width: 1300, height: 1200, sill: 1000 }]);
const left = a.left(5200);
// One run on the back wall: a sink, drawers, the hob and a cupboard. (A corner kitchen takes a second run: a.run(wall, id, at, modules, { joins, ownsTop: false }); its group is whole in the cook shot, so give the room the depth the shot needs.)
const R = a.run(back, 'run', 0, [{ w: 900, kind: 'sink' }, { w: 600, kind: 'drawers', n: 3, ajar: 0.3 }, { w: 900, kind: 'hob' }, { w: 600, kind: 'doors' }], { group: 'cook', hero: true });
R.on('hob', 'hob', { group: 'cook' }); R.on('hob', 'hood', { group: 'cook' }); R.on('hob', 'pan', { group: 'cook' });
R.on('drawers', 'cuttingBoard', { group: 'cook' }); R.on('doors', 'fruitBowl', { group: 'cook', dx: -170 }); R.on('doors', 'plant', { group: 'cook', dx: 150 });
back.place('wc1', 'wallRun', 2700, { group: 'cook', params: { modules: [{ w: 500, kind: 'door' }] } });
back.place('shelf', 'openShelf', 450, { group: 'cook' });
a.put('runner', 'rug', [1500, 1250], 0, { group: 'runner', params: { w: 2400, d: 700, form: 'plain', fringe: 'ends', border: 40 } });   // a runner in front of the cooking
left.place('pic', 'picture', 1600, { group: 'bench' }); left.place('shelf2', 'openShelf', 3700, { group: 'bench' });   // a picture and a shelf keep the left wall from standing bare
a.put('bench', 'bench', [330, 2300], 90, { group: 'bench' });   // a bench under the left window
// A seating group: an armchair and a floor lamp in the free corner by the left wall.
a.put('chair', 'armchair', [2000, 4300], 70, { group: 'nook' });
a.put('lamp', 'floorLamp', [1300, 4750], 0, { group: 'nook' });
// A table set: a round table with two chairs and a rug, standing in open floor within reach of the cooking.
const T = a.table('bt', { at: [4800, 2800], r: 520, chairs: 2, group: 'breakfast', cloth: 'accent' });   // the roll's accent (rust) is on the tablecloth (it names the runner; any textile of the area may carry it)
T.on('mug', { y: 757, dx: -180 }); T.on('saltPepper', { y: 757, dx: 260 });   // the roll's table still life: a mug and salt and pepper
// The roll's foreground piece, a step stool, stands at the front corner of the table group.
a.put('stool', 'stepStool', [4150, 3350], 25, { group: 'breakfast' });
a.skip('hanging', 'no hanging-plant asset yet: the plant stands on the sill and the worktop instead');
a.skip('mokaPot', 'the hob carries a pan under the hood: a moka pot would stand in its place');
a.skip('utensilCrock', 'the hob has no room beside it for a crock: pans hang on the rail instead');   // a thing the roll dealt and the scene leaves out says why
// Shots: a.shot(name, from, look, fov, group). fitshots.mjs finds the cameras; its numbers go in here.
a.shot('cook', ...C('kitchen', 'cook', [[500, 1400, 5700], [571, 1100, 215], 40]), 'cook');   // C(area, name, fallback): the fitted camera, or the fallback on the first run
a.shot('table', ...C('kitchen', 'table', [[6350, 1700, 6150], [4116, 300, 3027], 34]), 'breakfast');
a.shot('cook2', ...C('kitchen', 'cook2', [[3800, 1000, 5550], [2474, 1100, -44], 40]), 'cook');
a.view({ target: [3000, 700, 2300], az: 10, el: 18 });
H.write(out, fs);
