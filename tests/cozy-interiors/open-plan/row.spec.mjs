// open plan, row layout: kitchen | dining | living on one long back wall (node roll.mjs 87 kitchen dining living)
//   seam 1 (kitchen | dining): an island facing the dining area, 750 mm shared; seam 2 (dining | living): the back of a sofa, 500 mm shared.
import fs from 'node:fs';
import { Home, facing } from '../../../skills/cozy-interiors/scene/compose.mjs';
const H = new Home({ seed: 87, floor: 'tiles', accent: '#d1a53c' });
let k, d, l;
{ // ---------- kitchen (the start of the chain: a left wall, no right wall)
  const a = k = H.area('kitchen', 'Kitchen', { rect: [0, 0, 4800, 4000] });
  const back = a.back(4800, [{ kind: 'window', x: 1450, width: 1000, height: 1100, sill: 1000, sash: 'fixed' }]);
  const left = a.left(4000);
  const R = a.run(back, 'run', 800, [{ w: 800, kind: 'sink' }, { w: 600, kind: 'drawers', n: 3 }, { w: 900, kind: 'hob' }], { group: 'cooking', hero: true });
  R.on('hob', 'hob', { group: 'stove' }); R.on('hob', 'hood', { group: 'stove' }); R.on('hob', 'pan', { group: 'stove' });
  R.on('drawers', 'kettle', { id: 'kettle', group: 'stove', dx: -170 }); R.on('drawers', 'fruitBowl', { id: 'fruit', group: 'stove', dx: 150 });
  back.place('fridge', 'fridge', 340, { group: 'cooking', params: { form: 1 } });
  back.place('wc', 'wallRun', 3650, { group: 'stove', params: { modules: [{ w: 500, kind: 'door' }, { w: 500, kind: 'door' }] } });
  a.put('runner', 'rug', [2100, 1300], 0, { group: 'cooking', params: { form: 'runner', w: 2200, d: 700, fringe: 'ends', border: 120 } });
  // the island, the separator: its front faces the dining area, stools on that side
  a.put('island', 'baseRun', [4100, 1200], -90, { group: 'island', hero: false, sep: 'island', params: { depth: 600, finishedBack: true, modules: [{ w: 600, kind: 'doors' }, { w: 600, kind: 'drawers', n: 3 }, { w: 800, kind: 'doors' }] } });
  a.put('stool1', 'stool', [5030, 1900], 0, { group: 'island', params: { form: 1 } }); a.put('stool2', 'stool', [5030, 2600], 0, { group: 'island', params: { form: 2 } });
  a.put('kplant', 'floorPlant', [4250, 500], 0, { group: 'stove' });
  a.put('iplant', 'plant', [4400, 2300], 0, { y: a.topOf('island'), mount: 'on', group: 'island', params: { form: 1 } });
  back.place('kclock', 'wallClock', 2800, { y: 1800, group: 'stove', shadow: false });

  a.across('across the island', [2200, 1400, 5700], [4050, 750, 1750], 36, 'island', 'dining');
  a.view({ target: [2400, 800, 1800], az: 6, el: 13 });
  a.shot('stove', [4600, 1700, 4600], [2300, 1300, 600], 34, 'stove'); a.shot('cook', [2600, 1700, 6300], [2338, 700, 696], 36, 'cooking');
}
{ // ---------- dining (the middle: no side wall)
  const a = d = H.area('dining', 'Dining', { rect: [0, 0, 5600, 4800] }); H.join(k, d, { layout: 'row', share: 750, separators: ['island', 'floorChange'] });
  const back = a.back(5600, [{ kind: 'window', x: 1600, width: 1400, height: 1200, sill: 900 }]);
  a.put('rug', 'rug', [2800, 2800], 0, { group: 'dining rug', params: { w: 2900, d: 2900, form: 'round', fringe: 'ends', border: 40 } });
  const T = a.table('dining', { at: [2800, 2800], r: 600, chairs: 3, rug: false, group: 'table set', hero: true });
  T.over('pendantLamp', { group: 'table set', params: { rim: 1582 } }); T.on('jug', { dx: -120 }); T.on('breadBasket', { dx: 220 });
  // what the roll dealt this dining area (seed 87): a bench with a cushion and a basket on the back wall's right third, an armchair with a floor lamp and a side table on its left third
  back.place('bench', 'bench', 1600, { group: 'bench' });
  a.onTop('bench', [{ id: 'bench-books', asset: 'bookStack' }], { at: 'back', group: 'bench' });
  a.put('fplant', 'floorPlant', [2500, 650], 0, { group: 'bench' });
  a.put('arm', 'armchair', [4500, 900], facing([4500, 900], [3300, 2600]), { group: 'reading', y: 8, lift: 8 });
  a.put('sidet', 'sideTable', [5300, 800], 0, { group: 'reading' }); back.place('apic', 'picture', 4500, { y: 1400, group: 'reading', shadow: false, params: { w: 1000, h: 600 } });
  a.put('basket', 'basket', [4500, 4250], 10, { group: 'corner' }); a.put('cst', 'footstool', [1200, 4350], 0, { group: 'corner' });
  a.view({ target: [2800, 800, 2000], az: 7, el: 14 });
  a.shot('table', [3950, 1000, 6600], [2471, 300, 2808], 34, 'table set'); a.shot('reading', [50, 1400, 1800], [4693, 700, 255], 36, 'reading'); a.shot('bench', [-250, 2100, 3300], [1526, 700, 610], 30, 'bench');
}
{ // ---------- living (the end: a right wall is allowed, the roll dealt none)
  const a = l = H.area('living', 'Living', { rect: [0, 0, 5400, 4800] }); H.join(d, l, { layout: 'row', share: 500, separators: ['sofaBack'] });
  const back = a.back(5400, [{ kind: 'window', x: 2500, width: 1500, height: 1400, sill: 700 }]);
  // the sofa, the separator: its back to the dining area, its front toward the room
  a.put('sofa', 'sofa', [650, 2400], 90, { group: 'seating', hero: true, sep: 'sofaBack', y: 8, lift: 8, params: { seats: 3 } });
  a.seatSoft('sofa', { cushions: 1, throw: 'drape', tone: 'accent', group: 'seating' });
  a.put('rug', 'rug', [2500, 2400], 0, { group: 'living rug', params: { w: 2800, d: 2400, form: 'striped', fringe: 'none', border: 90, w: 3000, d: 2200 } });
  a.put('coffee', 'coffeeTable', [2600, 2400], 90, { group: 'coffee set', y: 7, lift: 7 });
  a.put('arm', 'armchair', [4000, 1900], facing([4000, 1900], [2200, 2400]), { group: 'coffee set', y: 8, lift: 8 });
  back.place('shelf', 'sideboard', 4800, { group: 'shelves', params: { w: 1100, h: 800 } });
  a.onTop('shelf', [{ id: 'shelf-vase', asset: 'jug' }, { id: 'shelf-books', asset: 'bookStack' }], { at: 'back', group: 'shelves' });
  back.place('spic', 'picture', 4800, { y: 1200, group: 'shelves', shadow: false, params: { w: 800, h: 600 } });
  a.put('flamp', 'floorLamp', [700, 950], 0, { group: 'window' });
  a.put('lplant', 'floorPlant', [650, 4300], 0, { group: 'window' });
  a.put('pouf', 'pouf', [1500, 3050], 0, { group: 'seating', y: 8, lift: 8 });
  a.put('foot', 'footstool', [3000, 3150], 0, { group: 'coffee set', y: 8, lift: 8 });
  a.put('mug', 'mug', [2600, 2300], 0, { group: 'coffee set', y: a.topOf('coffee'), mount: 'on' });
  a.view({ target: [2400, 800, 2000], az: 6, el: 14 });
  a.shot('shelves', [5200, 1300, 5400], [4800, 700, 450], 34, 'shelves'); a.shot('sofa', [3300, 1100, 6300], [637, 700, 2706], 36, 'seating'); a.shot('coffee', [1500, 1700, 6900], [2494, 441, 2095], 34, 'coffee set');
}
H.floorZones({ kitchen: 'tiles', dining: 'boards', living: 'boards' });
H.write(new URL('./row.json', import.meta.url).pathname, fs);
console.log('wrote row.json');
