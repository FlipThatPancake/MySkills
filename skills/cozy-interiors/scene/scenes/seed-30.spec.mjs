// seed 30 (node roll.mjs 30 kitchen dining living): floor plain.
//  kitchen: corner-left, island with stools, hero range hood over the hob, window first (fixed), accents basket, kettle, wall shelf, pan, 3 plants
//  dining: corner-left, hero sideboard with a big mirror, door second + window first, accents floor lamp, wall shelf, basket, mirror, vase, 1 plant, pieces table, chairs, rug
//  living: wide-angle, hero sofa with rug and coffee table, window first + arch (other wall), accents cat, mirror, side table, basket, 1 plant, piece curtain at a window
import fs from 'node:fs';
import { Home } from '../compose.mjs';
const H = new Home({ seed: 30, floor: 'plain' });

{ // ---------- kitchen
  const a = H.area('kitchen', 'Kitchen', { rect: [0, 0, 6200, 4600] });
  const back = a.back(6200, [{ kind: 'window', x: 2400, width: 1300, height: 1100, sill: 1000, sash: 'fixed' }]);
  const left = a.left(4600);
  back.place('fridge', 'fridge', 455, { group: 'cooking' });
  const R = a.run(back, 'run', 910, [{ w: 600, kind: 'door', hinge: 'r' }, { w: 800, kind: 'sink' }, { w: 600, kind: 'drawers' }, { w: 900, kind: 'hob' }, { w: 600, kind: 'doors' }], { group: 'cooking', hero: true });
  R.on('hob', 'hob'); R.on('hob', 'hood'); R.on('hob', 'pan');
  R.on('doors', 'kettle', { id: 'kettle' }); R.on('drawers', 'plant', { id: 'plant', dx: -100 });
  back.place('towel', 'teaTowel', 3650, { y: 1250, group: 'cooking', shadow: false });
  back.place('wall-shelf', 'wallShelf', 5400, { group: 'shelf corner', shadow: false });
  a.put('island', 'baseRun', [3800, 2500], 180, { group: 'island', params: { finishedBack: true, backOverhang: 300, modules: [{ w: 600, kind: 'doors' }, { w: 600, kind: 'drawers', n: 3 }, { w: 900, kind: 'doors' }, { w: 600, kind: 'drawers', n: 3 }] } });
  a.put('island-plant', 'plant', [1400, 2800], 0, { y: 900, mount: 'on', group: 'island' });
  for (const [i, x] of [1700, 2600, 3500].entries()) a.put(`stool-${i + 1}`, 'stool', [x, 3750], 0, { group: 'island' });
  a.put('basket', 'basket', [5000, 3300], 0, { group: 'front' });
  a.put('trolley', 'trolley', [600, 3950], 12, { group: 'front' });
  back.place('floor-plant', 'floorPlant', 5900, { group: 'shelf corner' });
  a.view({ target: [3200, 900, 1600], az: 14, el: 11 });
  a.shot('cooking', [5600, 1100, 5400], [3378, 1100, -426], 40, 'cooking');
  a.shot('island', [5900, 1250, 6000], [2892, 500, 2655], 36, 'island');
}
{ // ---------- dining
  const a = H.area('dining', 'Dining', { rect: [0, 0, 5400, 4800] });
  const back = a.back(5400, [{ kind: 'window', x: 4400, width: 1300, height: 1200, sill: 900, sash: 'fixed' }]);
  const left = a.left(4800, [{ kind: 'door', x: 2000, width: 900, hinge: 'l', open: 20 }]);
  back.place('sideboard', 'sideboard', 1350, { group: 'sideboard', hero: true });
  back.place('big-mirror', 'mirror', 1350, { y: 1050, group: 'sideboard', shadow: false, params: { w: 900, h: 1300, shape: 'arch' } });
  back.place('sideboard-plant', 'plant', 1950, { y: 800, mount: 'on', group: 'sideboard', off: 200 });
  const T = a.table('dining', { at: [2900, 3000], w: 1700, d: 900, chairs: 4, rug: false, group: 'table set', hero: false });
  a.put('rug', 'rug', [2900, 3000], 0, { group: 'table light', params: { w: 2500, d: 1700 } });
  T.over('pendantLamp', { params: { rim: 1700 }, group: 'table light' }); T.on('vase');
  back.place('wall-shelf', 'wallShelf', 3300, { y: 1500, group: 'sideboard', shadow: false });
  a.put('basket', 'basket', [800, 4500], 0, { group: 'front' });
  a.put('pouf', 'pouf', [4700, 4450], 0, { group: 'front' });
  a.view({ target: [2800, 900, 2000], az: 14, el: 15 });
  a.shot('sideboard', [5000, 1100, 4500], [1650, 1100, 542], 40, 'sideboard');
  a.shot('table', [4400, 1250, 7200], [3314, 500, 2852], 34, 'table set');
}
{ // ---------- living
  const a = H.area('living', 'Living room', { rect: [0, 0, 5400, 4200] });
  const back = a.back(5400, [{ kind: 'window', x: 1500, width: 1400, height: 1300, sill: 800, sash: 'fixed' }]);
  const right = a.right(3600, [{ kind: 'arch', x: 1800, width: 1200, to: 'dining', beyond: false, depth: 200 }], 120);
  back.place('curtain', 'curtain', 1500, { group: 'window' });
  back.place('sofa', 'sofa', 3600, { y: 7, lift: 7, group: 'sofa', hero: true, params: { seats: 3 } });
  back.place('mirror', 'mirror', 3600, { y: 1250, group: 'sofa', shadow: false, params: { w: 800, h: 800, shape: 'round' } });
  a.put('rug', 'rug', [3600, 1700], 0, { group: 'sofa', params: { w: 3000, d: 2000 } });
  a.put('coffee', 'coffeeTable', [3600, 1750], 0, { y: 7, lift: 7, group: 'sofa' });
  a.put('books', 'bookStack', [3600, 1750], 15, { y: 387, mount: 'on', group: 'sofa' });
  a.put('cat', 'cat', [2700, 2300], 150, { y: 7, lift: 7, group: 'sofa', params: { pose: 'sit' } });
  back.place('side-table', 'sideTable', 5100, { group: 'sofa' });
  a.put('basket', 'basket', [900, 3300], 0, { group: 'front' });
  a.put('pouf', 'pouf', [4800, 3400], 0, { group: 'front' });
  back.place('floor-plant', 'floorPlant', 2250, { group: 'window' });
  a.view({ target: [2800, 800, 1500], az: 14, el: 11 });
  a.shot('sofa', [2600, 1250, 6600], [3103, 300, 1220], 40, 'sofa');
  a.shot('window', [800, 1100, 5700], [942, 1100, 247], 40, 'window');
}
H.write(new URL('./seed-30.json', import.meta.url).pathname, fs);
console.log('wrote seed-30.json');
