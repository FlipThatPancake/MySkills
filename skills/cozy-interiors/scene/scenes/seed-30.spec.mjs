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
  back.place('fridge', 'fridge', 455, { group: 'run' });
  const R = a.run(back, 'run', 910, [{ w: 600, kind: 'door', hinge: 'r' }, { w: 800, kind: 'sink' }, { w: 600, kind: 'drawers' }, { w: 900, kind: 'hob' }, { w: 600, kind: 'doors' }], { group: 'run', hero: true });
  R.on('hob', 'hob'); R.on('hob', 'hood'); R.on('hob', 'pan');
  R.on('doors', 'kettle', { id: 'kettle' }); R.on('drawers', 'plant', { id: 'plant', dx: -100 });
  back.place('towel', 'teaTowel', 3650, { y: 1250, group: 'run', shadow: false });
  back.place('wall-shelf', 'wallShelf', 5400, { group: 'run', shadow: false });
  a.put('island', 'baseRun', [3800, 2500], 180, { group: 'island', params: { finishedBack: true, backOverhang: 300, modules: [{ w: 600, kind: 'doors' }, { w: 600, kind: 'drawers', n: 3 }, { w: 900, kind: 'doors' }, { w: 600, kind: 'drawers', n: 3 }] } });
  a.put('island-plant', 'plant', [1400, 2800], 0, { y: 900, mount: 'on', group: 'island' });
  for (const [i, x] of [1700, 2600, 3500].entries()) a.put(`stool-${i + 1}`, 'stool', [x, 3750], 0, { group: 'island' });
  a.put('basket', 'basket', [5200, 1000], 0, { group: 'run' });
  back.place('floor-plant', 'floorPlant', 5900, { group: 'run', off: 240 });
  a.view({ target: [3200, 900, 1600], az: 14, el: 16 });
  a.shot('range hood', [3330, 1555, 7060], [3200, 1100, 300], 60, 'run');
  a.shot('island', [5420, 1590, 5620], [2200, 900, 2400], 54, 'island');
}
{ // ---------- dining
  const a = H.area('dining', 'Dining', { rect: [0, 0, 5400, 4800] });
  const back = a.back(5400, [{ kind: 'window', x: 4400, width: 1300, height: 1200, sill: 900, sash: 'fixed' }]);
  const left = a.left(4800, [{ kind: 'door', x: 2000, width: 900, hinge: 'l', open: 20 }]);
  back.place('sideboard', 'sideboard', 1700, { group: 'sideboard', hero: true });
  back.place('big-mirror', 'mirror', 1700, { y: 1050, group: 'sideboard', shadow: false, params: { w: 900, h: 1300, shape: 'arch' } });
  back.place('sideboard-plant', 'plant', 2300, { y: 800, mount: 'on', group: 'sideboard', off: 200 });
  const T = a.table('dining', { at: [2900, 2800], w: 1700, d: 900, chairs: 4, rug: true, group: 'table set', hero: false });
  T.over('pendantLamp'); T.on('vase');
  back.place('lamp', 'floorLamp', 450, { group: 'sideboard' });
  back.place('wall-shelf', 'wallShelf', 3300, { y: 1500, group: 'sideboard', shadow: false });
  a.put('basket', 'basket', [4800, 1000], 0, { group: 'table set' });
  a.view({ target: [2800, 900, 2000], az: 14, el: 16 });
  a.shot('sideboard', [600, 1450, 4200], [1700, 1000, 300], 60, 'sideboard');
  a.shot('table', [5960, 2060, 6760], [2900, 800, 2800], 60, 'table set');
}
{ // ---------- living
  const a = H.area('living', 'Living room', { rect: [0, 0, 5400, 4200] });
  const back = a.back(5400, [{ kind: 'window', x: 1500, width: 1400, height: 1300, sill: 800, sash: 'fixed' }]);
  const right = a.right(3600, [{ kind: 'arch', x: 1800, width: 1200, to: 'dining', beyond: false, depth: 200 }], 120);
  back.place('curtain', 'curtain', 1500, { group: 'sofa' });
  back.place('sofa', 'sofa', 3600, { y: 7, lift: 7, group: 'sofa', hero: true, params: { seats: 3 } });
  back.place('mirror', 'mirror', 3600, { y: 1250, group: 'sofa', shadow: false, params: { w: 800, h: 800, shape: 'round' } });
  a.put('rug', 'rug', [3600, 1700], 0, { group: 'sofa', params: { w: 3000, d: 2000 } });
  a.put('coffee', 'coffeeTable', [3600, 1750], 0, { y: 7, lift: 7, group: 'sofa' });
  a.put('books', 'bookStack', [3600, 1750], 15, { y: 387, mount: 'on', group: 'sofa' });
  a.put('cat', 'cat', [2700, 2300], 150, { y: 7, lift: 7, group: 'sofa', params: { pose: 'sit' } });
  back.place('side-table', 'sideTable', 5100, { group: 'sofa' });
  a.put('basket', 'basket', [800, 1800], 0, { group: 'sofa' });
  back.place('floor-plant', 'floorPlant', 2250, { group: 'sofa', off: 240 });
  a.view({ target: [2800, 800, 1500], az: 14, el: 16 });
  a.shot('sofa', [3200, 1675, 6750], [3500, 700, 1200], 60, 'sofa');
  a.shot('window', [4200, 1720, 6960], [1500, 1000, 300], 60, 'sofa');
}
H.write(new URL('./seed-30.json', import.meta.url).pathname, fs);
console.log('wrote seed-30.json');
