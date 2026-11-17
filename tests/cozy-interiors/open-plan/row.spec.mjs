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
  left.place('shelf', 'openShelf', 1500, { y: 1350, group: 'stove', shadow: false, params: { w: 900 } });
  a.put('iplant', 'plant', [4400, 2300], 0, { y: a.topOf('island'), mount: 'on', group: 'island', params: { form: 1 } });
  back.place('kclock', 'wallClock', 4450, { y: 1800, group: 'stove', shadow: false });

  a.view({ target: [2400, 800, 1800], az: 6, el: 13 });
}
{ // ---------- dining (the middle: no side wall)
  const a = d = H.area('dining', 'Dining', { rect: [0, 0, 4400, 4800] }); H.join(k, d, { layout: 'row', share: 750, separators: ['island', 'floorChange'] });
  const back = a.back(4400, [{ kind: 'window', x: 3500, width: 1200, height: 1200, sill: 900 }]);
  a.put('rug', 'rug', [2700, 2600], 0, { group: 'table set', params: { w: 2500, d: 2500, form: 'round', fringe: 'ends', border: 40 } });
  const T = a.table('dining', { at: [2700, 2600], r: 700, chairs: 4, rug: false, group: 'table set', hero: true });
  T.over('pendantLamp', { group: 'table light' }); T.on('jug', { dx: -120 }); T.on('breadBasket', { dx: 220 });
  back.place('side', 'sideboard', 750, { group: 'wall', params: { w: 1400, h: 800 } });
  a.onTop('side', [{ id: 'side-vase', asset: 'jug' }, { id: 'side-books', asset: 'bookStack' }], { at: 'back', group: 'wall' });
  back.place('pic', 'picture', 750, { y: 1550, group: 'wall', shadow: false, params: { w: 700, h: 500 } });
  a.put('fplant', 'floorPlant', [4150, 800], 0, { group: 'wall' });
  a.put('basket', 'basket', [4200, 4000], 10, { group: 'table light' });
  a.view({ target: [2300, 800, 2000], az: 7, el: 14 });
}
{ // ---------- living (the end: a right wall is allowed, the roll dealt none)
  const a = l = H.area('living', 'Living', { rect: [0, 0, 5400, 4800] }); H.join(d, l, { layout: 'row', share: 500, separators: ['sofaBack'] });
  const back = a.back(5400, [{ kind: 'window', x: 2500, width: 1500, height: 1300, sill: 700, sash: 'fixed' }]);
  // the sofa, the separator: its back to the dining area, its front toward the room
  a.put('sofa', 'sofa', [650, 2400], 90, { group: 'seating', hero: true, sep: 'sofaBack', y: 7, lift: 7, params: { seats: 3 } });
  a.seatSoft('sofa', { cushions: 1, throw: 'band', tone: 'accent', group: 'seating' });
  a.put('rug', 'rug', [2500, 2400], 0, { group: 'seating', params: { w: 2800, d: 2400, form: 'striped', fringe: 'none', border: 90, w: 3000, d: 2200 } });
  a.put('coffee', 'coffeeTable', [2200, 2400], 90, { group: 'seating', y: 7, lift: 7 });
  a.put('arm', 'armchair', [3650, 1700], facing([3650, 1700], [2200, 2400]), { group: 'seating', y: 7, lift: 7 });
  back.place('shelf', 'sideboard', 4800, { group: 'shelves', params: { w: 1100, h: 800 } });
  a.onTop('shelf', [{ id: 'shelf-vase', asset: 'jug' }, { id: 'shelf-books', asset: 'bookStack' }], { at: 'back', group: 'shelves' });
  back.place('spic', 'picture', 4800, { y: 1350, group: 'shelves', shadow: false, params: { w: 800, h: 600 } });
  back.place('flamp', 'floorLamp', 1450, { group: 'window' });
  a.put('lplant', 'floorPlant', [650, 700], 0, { group: 'window' });
  a.put('mug', 'mug', [2200, 2300], 0, { group: 'seating', y: a.topOf('coffee'), mount: 'on' });
  a.view({ target: [2400, 800, 2000], az: 14, el: 14 });
}
H.floorZones({ kitchen: 'tiles', dining: 'boards', living: 'boards' });
H.write(new URL('./row.json', import.meta.url).pathname, fs);
console.log('wrote row.json');
