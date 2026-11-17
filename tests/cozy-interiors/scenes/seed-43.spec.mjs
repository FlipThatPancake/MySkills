// seed 43 (node roll.mjs 43 home-office kitchen living): floor plain.
//  home-office: one wall, hero trestle desk with a pinboard above, window first, accents binders, book stack, floor lamp, wall clock, 3 plants, signs book face down + drawer ajar (a side table), pieces desk, desk chair, shelf, rug
//  kitchen: one wall, island, hero open shelves and a dresser, window first (fixed), accents stool, herbs, wall shelf with jars, cutting board, utensil crock, 1 plant, signs fallen leaf + table runner + scuffed floor
//  living: wide-angle, hero two armchairs and a side table, window first + window second, accents book stack, mirror, vase of branches, cushion, floor lamp, record player, gallery wall, 3 plants, piece curtain, signs glasses on book + shoes askew + cloth dropped
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
const H = new Home({ seed: 43, floor: 'plain' });

{ // ---------- home office
  const a = H.area('office', 'Home office', { rect: [0, 0, 6000, 3400] });
  const back = a.back(6000, [{ kind: 'window', x: 1700, width: 1400, height: 1100, sill: 1000 }]);
  back.place('desk', 'desk', 3800, { group: 'desk', hero: true, params: { form: 'trestle', w: 1500, d: 700 } });
  back.place('pinboard', 'pinboard', 3800, { y: 1150, group: 'desk', shadow: false, params: { w: 1000, h: 520, notes: 7 } });
  a.put('chair', 'deskChair', [3800, 1400], 180, { y: 7, lift: 7, group: 'desk' });
  a.put('rug', 'rug', [3800, 1450], 0, { group: 'desk', params: { w: 1700, d: 1400 } });
  back.place('task-lamp', 'taskLamp', 3250, { y: a.topOf('desk'), mount: 'on', group: 'desk', off: 200 });
  back.place('organiser', 'deskOrganiser', 4450, { y: a.topOf('desk'), mount: 'on', group: 'desk', off: 200 });
  a.put('notebook', 'notebook', [3700, 560], 10, { y: a.topOf('desk'), mount: 'on', group: 'desk' });
  a.put('open-book', 'openBook', [4100, 540], 25, { y: a.topOf('desk'), mount: 'on', group: 'desk' });
  a.put('desk-books', 'bookStack', [3150, 540], 0, { y: a.topOf('desk'), mount: 'on', group: 'desk', params: { n: 3 } });
  back.place('clock', 'wallClock', 2750, { y: 1750, group: 'window', shadow: false, params: { r: 150 } });
  back.place('shelf', 'shelf', 5500, { group: 'shelf', params: { w: 800, h: 1450 } });
  back.place('binders', 'binders', 5500, { y: a.topOf('shelf'), mount: 'on', group: 'shelf', off: 160, params: { n: 5, form: 'row' } });
  back.place('shelf-plant', 'plant', 5200, { y: a.topOf('shelf'), mount: 'on', group: 'shelf', off: 190, params: { form: 0 } });
  back.place('lamp', 'floorLamp', 400, { group: 'window' });
  back.place('side', 'sideTable', 4800, { group: 'shelf', params: { top: 'square', drawer: 'knob', ajar: 60, r: 220 } });
  back.place('side-plant', 'plant', 4800, { y: a.topOf('side'), mount: 'on', group: 'shelf', off: 200, params: { form: 2 } });
  a.put('file-box', 'fileBox', [5500, 1900], 0, { group: 'shelf' });
  a.put('pot-floor', 'pot', [900, 700], 0, { mount: 'floor', group: 'window', params: { r: 130, tall: 1.3, profile: 'belly', plant: 'bush', seed: 5 } });
  a.view({ target: [3000, 800, 1300], az: 10, el: 10 });
  a.shot('desk', [3800, 1100, 5700], [4310, 700, 1075], 38, 'desk');
  a.shot('shelf', [2000, 1700, 4800], [5734, 1100, 1475], 36, 'shelf');
}
{ // ---------- kitchen
  const a = H.area('kitchen', 'Kitchen', { rect: [0, 0, 6000, 4800] });
  const back = a.back(6000, [{ kind: 'window', x: 2300, width: 1300, height: 1100, sill: 1000, sash: 'fixed' }]);
  back.place('fridge', 'fridge', 455, { group: 'larder', params: { form: 1 } });
  const R = a.run(back, 'run', 1000, [{ w: 600, kind: 'doors' }, { w: 800, kind: 'sink' }, { w: 800, kind: 'drawers' }, { w: 900, kind: 'hob' }, { w: 600, kind: 'doors' }], { group: 'cooking', hero: true });
  R.on('hob', 'hob', { group: 'stove' }); R.on('hob', 'hood', { group: 'stove' }); R.on('hob', 'pan', { group: 'stove' });
  R.on('drawers', 'herbs', { id: 'herbs', dx: -130 }); R.on('drawers', 'jars', { id: 'jars', dx: 190 }); R.on('doors', 'utensilCrock', { id: 'crock', nth: 0 }); R.on('doors', 'cuttingBoard', { id: 'board', nth: 1, group: 'stove' });
  back.place('wall-shelf', 'wallShelf', 1150, { y: 1500, group: 'cooking', shadow: false, params: { w: 500 } });
  back.place('open-shelf', 'openShelf', 4600, { y: 1300, group: 'dresser', shadow: false, params: { w: 600 } });
  back.place('dresser', 'glazedCabinet', 5450, { group: 'dresser', params: { w: 900 } });
  back.place('dresser-plant', 'plant', 5450, { y: a.topOf('dresser'), mount: 'on', group: 'dresser', off: 150, params: { form: 1 } });
  a.put('island', 'baseRun', [4600, 2500], 180, { group: 'island', params: { finishedBack: true, backOverhang: 300, modules: [{ w: 600, kind: 'doors' }, { w: 600, kind: 'drawers', n: 3 }, { w: 900, kind: 'doors' }] } });
  a.put('table-runner', 'tableRunner', [3550, 2550], 0, { y: 900, mount: 'on', group: 'island', params: { w: 2100, d: 900, rw: 380, drop: 230 } });
  for (const [i, x] of [3000, 3900].entries()) a.put(`stool-${i + 1}`, 'stool', [x, 3750], 0, { group: 'island', params: { form: 0 } });
  a.put('floor-runner', 'runner', [3000, 1500], 90, { group: 'cooking', params: { form: 'stripe', w: 700, l: 2400, fringe: 'no' } });
  a.put('crate', 'crate', [500, 1500], 10, { group: 'larder' });
  a.put('leaf', 'leaf', [5200, 750], 0, { group: 'dresser', mount: 'lines', params: { turn: 0.7 } });
  a.put('scuff', 'scuff', [3200, 1800], 0, { group: 'larder', mount: 'lines' });
  a.view({ target: [3000, 900, 1700], az: 10, el: 14 });
  a.shot('stove', [3200, 1100, 4800], [4415, 1100, 427], 36, 'stove');
  a.shot('island', [200, 1900, 6300], [3228, 900, 2816], 34, 'island');
}
{ // ---------- living
  const a = H.area('living', 'Living room', { rect: [0, 0, 5400, 4200] });
  const back = a.back(5400, [{ kind: 'window', x: 1700, width: 1300, height: 1200, sill: 800 }]);
  const right = a.right(3600, [{ kind: 'window', x: 2300, width: 1200, height: 1200, sill: 900, sash: 'fixed' }], 120);
  back.place('curtain', 'curtain', 1700, { group: 'room edge' });
  a.put('rug', 'rug', [2800, 2300], 0, { group: 'seating rug', params: { w: 3000, d: 1900 } });
  a.put('armchair-l', 'armchair', [1900, 2300], 25, { y: 7, lift: 7, group: 'seating', hero: true });
  a.put('armchair-r', 'armchair', [3900, 2300], -25, { y: 7, lift: 7, group: 'seating' });
  a.put('side-table', 'sideTable', [2900, 2150], 0, { y: 7, lift: 7, group: 'seating' });
  a.put('glasses', 'glassesBook', [2950, 2150], 20, { y: a.topOf('side-table'), mount: 'on', group: 'seating' });
  a.put('vase', 'vase', [2800, 2200], 0, { y: a.topOf('side-table'), mount: 'on', group: 'seating' });
  a.put('cushion', 'cushion', [1900, 2350], 25, { y: 470, mount: 'on', group: 'seating', params: { w: 400, h: 360, lean: 20 } });
  a.drapeOver('cloth', 'armchair-r', { group: 'seating', w: 1000, d: 1100, dz: 60, spin: -25, tone: 'mid', wave: 0 });
  a.put('shoes', 'shoes', [1000, 3150], 150, { group: 'edge', params: { pairs: 1, kind: 'sneaker' } });
  a.put('floor-plant-2', 'floorPlant', [900, 2150], 0, { group: 'edge' });
  a.put('lamp', 'floorLamp', [450, 1100], 0, { group: 'edge' });
  a.put('side-2', 'sideTable', [4950, 2300], 0, { y: 7, lift: 7, group: 'edge', params: { top: 'round', drawer: 'none' } });
  a.put('books', 'bookStack', [4900, 2300], 0, { y: a.topOf('side-2'), mount: 'on', group: 'edge' });
  a.put('side-plant', 'plant', [5030, 2260], 0, { y: a.topOf('side-2'), mount: 'on', group: 'edge', params: { form: 3 } });
  a.put('floor-plant', 'floorPlant', [4950, 700], 0, { group: 'edge' });
  back.place('record-player', 'recordPlayer', 3500, { group: 'music wall', params: { w: 760, records: 8, lid: 'half' } });
  back.place('gallery', 'galleryWall', 3500, { y: 1000, group: 'music wall', shadow: false, params: { w: 1200, h: 1000, n: 5 } });
  right.place('mirror', 'mirror', 800, { y: 800, group: 'room edge', shadow: false, params: { w: 600, h: 1200, shape: 'pill' } });
  a.view({ target: [2800, 800, 1700], az: 12, el: 12 });
  a.shot('armchairs', [6500, 1100, 5100], [3229, 700, 1901], 36, 'seating');
}
H.write(new URL('./seed-43.json', import.meta.url).pathname, fs);
console.log('wrote seed-43.json');
