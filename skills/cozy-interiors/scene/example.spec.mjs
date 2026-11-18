// A worked spec: one kitchen area with an L run, a table set and a seating group, clean through check-home and fitshots.
//   node example.spec.mjs [out.json]  →  node check-home.mjs out.json --quick  →  node fitshots.mjs out.json  (fitshots writes out.cameras.json; run the spec again and the shots below take those numbers)
// The roll: example.roll.json came from `node roll.mjs 12 kitchen`. H.roll keeps it, and check-home compares every dealt thing with the scene: present, or a.skip(thing, 'why').
// Every coordinate is millimetres in the area's frame: x along the back wall from its left end, z out into the room.
import fs from 'node:fs';
import { Home } from './compose.mjs';
import { cameras } from './cameras.mjs';
const out = process.argv[2] || 'example.json', C = cameras(out.replace(/\.json$/, '.cameras.json'));   // the fitted shots from the last fitshots run, in the area's own frame
const H = new Home({ seed: 12, floor: 'boards' });
H.roll(JSON.parse(fs.readFileSync(new URL('./example.roll.json', import.meta.url), 'utf8')));   // the home's accent comes from the roll
const a = H.area('kitchen', 'Kitchen', { rect: [0, 0, 6600, 4400] });
const back = a.back(6600, [{ kind: 'window', x: 4700, width: 1300, height: 1200, sill: 1000 }]);
const left = a.left(4400, [{ kind: 'window', x: 2300, width: 1000, height: 1100, sill: 1000, sash: 'fixed' }]);
// The L: run A stands on the back wall; its `joins` says run B stands at A's start and reaches 2200 mm out from A's front.
// A builds the L-shaped worktop for both; B (on the left wall) is built with ownsTop: false and starts 1200 mm along the wall,
// where A's front ends (A's depth 600 + B's width 600). A { kind: 'blind' } module is the corner cabinet over B's dead end.
const R = a.run(back, 'run', 0, [{ w: 900, kind: 'blind', dead: 'l' }, { w: 600, kind: 'drawers', n: 3, ajar: 0.3 }, { w: 900, kind: 'hob' }, { w: 900, kind: 'doors' }], { group: 'run', hero: true, joins: { side: 'start', length: 2200 } });
R.on('hob', 'hob', { group: 'cook' }); R.on('hob', 'hood', { group: 'cook' }); R.on('hob', 'pan', { group: 'cook' });
R.on('drawers', 'cuttingBoard', { group: 'cook' }); R.on('doors', 'fruitBowl', { group: 'cook', dx: -170 }); R.on('doors', 'plant', { group: 'cook', dx: 190 });
const B = a.run(left, 'lrun', 1200, [{ w: 600, kind: 'drawers', n: 3 }, { w: 900, kind: 'sink' }, { w: 400, kind: 'door', hinge: 'r' }], { group: 'run', ownsTop: false });
B.on('door', 'kettle', { group: 'sink' });
back.place('wc1', 'wallRun', 2900, { group: 'cook', params: { modules: [{ w: 500, kind: 'door' }] } });
left.place('shelf', 'openShelf', 800, { group: 'sink' });
// A table set: a round table with two chairs and a rug, standing in open floor within reach of the cooking.
const T = a.table('bt', { at: [3200, 2600], r: 520, chairs: 2, group: 'breakfast', cloth: 'accent' });   // the roll's accent (rust) is on the tablecloth
T.on('jug', { y: 757, dx: -180 }); T.on('herbs', { y: 757, dx: 260 });   // the roll's table still life: herbs and a jug
// A seating group: an armchair, a side table and a floor lamp, in the free corner by the window.
a.put('chair', 'armchair', [5700, 2300], -35, { group: 'nook' });
a.put('side', 'sideTable', [5700, 3150], 0, { group: 'nook' });
a.skip('hanging', 'no hanging-plant asset yet: the plant stands on the sill and the worktop instead');
a.skip('utensilCrock', 'the hob has no room beside it for a crock: pans hang on the rail instead');   // a thing the roll dealt and the scene leaves out says why
a.skip('hero by the window', 'the breakfast table stands in the middle of the floor, near the cooking');
a.put('side-jug', 'jug', [5700, 3150], 0, { group: 'nook', y: a.topOf('side'), mount: 'on' });   // a side table carries something (the check 'bare'): y from the real top
// Shots: a.shot(name, from, look, fov, group). fitshots.mjs finds the cameras; its numbers go in here.
a.shot('cook', ...C('kitchen', 'cook', [[2600, 1100, 4800], [1705, 1300, 393], 36]), 'cook');   // C(area, name, fallback): the fitted camera, or the fallback on the first run
a.shot('table', ...C('kitchen', 'table', [[6200, 2100, 6900], [2737, 681, 2923], 36]), 'breakfast');
a.shot('nook', ...C('kitchen', 'nook', [[3800, 850, 6000], [5222, 700, 2273], 32]), 'nook');
a.view({ target: [3300, 700, 1800], az: 20, el: 16 });
H.write(out, fs);
