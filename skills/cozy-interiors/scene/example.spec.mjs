// A worked spec: one kitchen area with an L run, a table set and a seating group, clean through check-home and fitshots.
//   node example.spec.mjs [out.json]  →  node check-home.mjs out.json --quick  →  node fitshots.mjs out.json
// Every coordinate is millimetres in the area's frame: x along the back wall from its left end, z out into the room.
import fs from 'node:fs';
import { Home } from './compose.mjs';
const H = new Home({ seed: 12, floor: 'boards' });
const a = H.area('kitchen', 'Kitchen', { rect: [0, 0, 6600, 4400] });
const back = a.back(6600, [{ kind: 'window', x: 4700, width: 1300, height: 1200, sill: 1000, sash: 'fixed' }]);
const left = a.left(4400, [{ kind: 'window', x: 2300, width: 1000, height: 1100, sill: 1000, sash: 'fixed' }]);
// The L: run A stands on the back wall; its `joins` says run B stands at A's start and reaches 2200 mm out from A's front.
// A builds the L-shaped worktop for both; B (on the left wall) is built with ownsTop: false and starts 1200 mm along the wall,
// where A's front ends (A's depth 600 + B's width 600). A { kind: 'blind' } module is the corner cabinet over B's dead end.
const R = a.run(back, 'run', 0, [{ w: 900, kind: 'blind', dead: 'l' }, { w: 600, kind: 'drawers', n: 3, ajar: 0.3 }, { w: 900, kind: 'hob' }, { w: 600, kind: 'doors' }], { group: 'run', hero: true, joins: { side: 'start', length: 2200 } });
R.on('hob', 'hob', { group: 'cook' }); R.on('hob', 'hood', { group: 'cook' }); R.on('hob', 'pan', { group: 'cook' });
R.on('drawers', 'cuttingBoard', { group: 'cook' }); R.on('doors', 'fruitBowl', { group: 'cook' }); R.on('doors', 'plant', { group: 'cook', dx: 150 });
const B = a.run(left, 'lrun', 1200, [{ w: 600, kind: 'drawers', n: 3 }, { w: 900, kind: 'sink' }, { w: 400, kind: 'door', hinge: 'r' }], { group: 'run', ownsTop: false });
B.on('sink', 'kettle', { group: 'sink' }); B.on('door', 'herbs', { group: 'sink' });
back.place('wc1', 'wallRun', 2900, { group: 'cook', params: { modules: [{ w: 500, kind: 'door' }] } });
left.place('shelf', 'openShelf', 800, { group: 'sink' });
// A table set: a round table with two chairs and a rug, standing in open floor within reach of the cooking.
const T = a.table('bt', { at: [3200, 2600], r: 520, chairs: 2, group: 'breakfast' });
T.on('jug', { y: 757, dx: -180 }); T.on('candlesticks', { y: 757, dx: 260 });
// A seating group: an armchair, a side table and a floor lamp, in the free corner by the window.
a.put('chair', 'armchair', [5700, 2300], -35, { group: 'nook', y: 7, lift: 7 });
a.put('side', 'sideTable', [5700, 3150], 0, { group: 'nook' });
// Shots: a.shot(name, from, look, fov, group). fitshots.mjs finds the cameras; its numbers go in here.
a.shot('cook', [2600, 1100, 4800], [1710, 1300, 393], 36, 'cook');
a.shot('table', [6200, 2100, 6900], [2737, 681, 2923], 36, 'breakfast');
a.view({ target: [3300, 700, 1800], az: 20, el: 16 });
H.write(process.argv[2] || 'example.json', fs);
