// seed 41 (node roll.mjs 41 kitchen dining bedroom): floor plain.
//  kitchen: corner-right, U, hero open shelves and a dresser, window + door on the back wall, accents wall shelf with jars, kettle, fruit bowl, stool, oven glove, cookbook stand, 3 plants, signs fallen leaf + tablecloth
//  dining: corner-left, hero long table under a pendant, window first + arch second, accents floor lamp, basket, book stack, wall shelf, vase of branches, cushion pad on a bench, jug, 2 plants, signs height chart + scuffed floor
//  bedroom: one wall, hero bed under a window with a bedside table each side, window first, accents bench at the foot, cat, floor lamp, chest of drawers, 3 plants, signs unmade bed + folded throw
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
const H = new Home({ seed: 41, floor: 'plain' });

{ // ---------- kitchen
  const a = H.area('kitchen', 'Kitchen', { rect: [0, 0, 6000, 4800] });
  const back = a.back(5800, [{ kind: 'window', x: 2950, width: 1200, height: 1100, sill: 1000, sash: 'fixed' }, { kind: 'door', x: 650, width: 900, hinge: 'l', open: 22 }]);
  const right = a.right(4800);
  const R = a.run(back, 'run', 1500, [{ w: 600, kind: 'doors' }, { w: 600, kind: 'drawers' }, { w: 800, kind: 'sink' }, { w: 600, kind: 'doors' }, { w: 900, kind: 'hob' }, { w: 800, kind: 'drawers' }], { group: 'cooking', hero: true });
  R.on('hob', 'hob', { group: 'stove' }); R.on('hob', 'hood', { group: 'stove' }); R.on('hob', 'pan', { group: 'stove' });
  R.on('doors', 'kettle', { id: 'kettle', nth: 1, group: 'stove' }); R.on('drawers', 'jars', { id: 'jars', nth: 0 }); R.on('drawers', 'fruitBowl', { id: 'fruit', nth: 1, y: 900 });
  R.on('sink', 'dishRack', { id: 'rack', dx: 190 });
  R.on('doors', 'cookbookStand', { id: 'cookbook', nth: 0 });
  back.place('glove', 'ovenGlove', 5350, { y: 1300, group: 'stove', shadow: false });
  a.put('legR', 'baseRun', [5164, 600], -90, { group: 'cooking', params: { modules: [{ w: 600, kind: 'doors' }, { w: 600, kind: 'drawers', n: 3 }, { w: 600, kind: 'doors' }, { w: 600, kind: 'drawers' }] } });
  a.put('legL', 'baseRun', [2100, 3000], 90, { group: 'larder', params: { modules: [{ w: 600, kind: 'doors' }, { w: 600, kind: 'drawers', n: 3 }, { w: 600, kind: 'doors' }, { w: 600, kind: 'drawers' }] } });
  a.put('scuff', 'scuff', [900, 1500], 0, { group: 'larder', mount: 'lines' });
  right.place('dresser', 'sideboard', 3900, { group: 'dresser', params: { w: 1400, h: 850 } });
  right.place('open-shelf', 'openShelf', 3900, { group: 'dresser', params: { w: 1100 }, shadow: false });
  right.place('dresser-jars', 'jars', 3550, { y: a.topOf('dresser'), mount: 'on', group: 'dresser', off: 160 });
  right.place('dresser-plant', 'plant', 4300, { y: a.topOf('dresser'), mount: 'on', group: 'dresser', off: 170, params: { form: 0 } });
  right.place('wall-shelf', 'wallShelf', 1800, { y: 1500, group: 'cooking', shadow: false, params: { w: 600 } });
  const T = a.table('table', { at: [3632, 3750], w: 800, d: 700, chairs: 2, rug: false, group: 'table set', hero: false }); a.put('rug', 'rug', [3632, 3750], 0, { group: 'table light', params: { w: 1900, d: 1400 } }); T.over('pendantForm', { group: 'table light', params: { form: 'globe', rim: 1750 } });
  a.put('cloth', 'tablecloth', [3632, 3750], 0, { y: 757, mount: 'on', group: 'table set', params: { w: 800, d: 700, drop: 180 } });
  a.put('crate', 'crate', [1500, 4300], 12, { group: 'table light' });
  a.put('stool', 'stool', [1000, 2400], 20, { group: 'larder', params: { form: 1 } });
  R.on('drawers', 'plant', { id: 'sill-plant', nth: 0, dx: -120, params: { form: 1 } });
  right.place('shelf-plant', 'plant', 1550, { y: 1500 + 280, mount: 'on', group: 'cooking', off: 190, params: { form: 3 } });
  a.put('leaf', 'leaf', [5400, 4350], 0, { group: 'dresser', mount: 'lines', params: { turn: 1.4 } });
  a.view({ target: [3000, 900, 1700], az: 10, el: 14 });
  a.shot('stove', [4100, 1100, 4800], [4112, 1300, 298], 36, 'stove');
}
{ // ---------- dining
  const a = H.area('dining', 'Dining', { rect: [0, 0, 5600, 4800] });
  const back = a.back(5600, [{ kind: 'window', x: 3900, width: 1300, height: 1200, sill: 900 }]);
  const left = a.left(4800, [{ kind: 'arch', x: 700, width: 1200, to: 'kitchen', beyond: false, depth: 200 }]);
  const T = a.table('dining', { at: [3000, 2300], w: 1800, d: 900, chairs: 4, rug: false, group: 'table set', hero: true }); a.put('rug', 'rug', [3000, 2300], 0, { group: 'table light', params: { w: 2400, d: 2200 } });
  T.over('pendantForm', { group: 'table light', params: { form: 'rattan', rim: 1750 } }); T.on('vase', { dx: -300 }); T.on('breadBasket', { dx: 350 }); T.on('jug', { dx: 0, dz: 150 }); 
  back.place('bench', 'bench', 1400, { group: 'wall', params: { w: 1300 } });
  back.place('bench-cushion', 'benchCushion', 1400, { y: 450, mount: 'on', group: 'wall' });
  back.place('wall-shelf', 'wallShelf', 1400, { y: 1450, group: 'wall', shadow: false, params: { w: 800 } });
  back.place('books', 'bookStack', 1100, { y: 450, mount: 'on', group: 'wall', off: 160 });
  back.place('shelf-plant', 'plant', 1800, { y: 450, mount: 'on', group: 'wall', off: 160 });
  back.place('lamp', 'floorLamp', 5200, { group: 'table light' });
  a.put('basket', 'basket', [4950, 3700], 0, { group: 'table light' });
  back.place('floor-plant', 'floorPlant', 2500, { group: 'wall' });
  a.put('stool', 'stool', [400, 450], 20, { group: 'wall' });
  left.put('chart', 'heightChart', 1600, 2, { group: 'arch side', mount: 'lines' });
  a.put('scuff', 'scuff', [400, 3500], 90, { group: 'arch side', mount: 'lines' });
  a.view({ target: [3000, 900, 2000], az: 10, el: 14 });
  a.shot('table', [3500, 1100, 6900], [3479, 300, 2248], 36, 'table set');
  a.shot('bench wall', [2300, 1900, 5100], [1932, 300, 259], 34, 'wall');
}
{ // ---------- bedroom
  const a = H.area('bedroom', 'Bedroom', { rect: [0, 0, 5900, 4600] });
  const back = a.back(5900, [{ kind: 'window', x: 2800, width: 1400, height: 1100, sill: 1000 }]);
  back.place('bed', 'bed', 2800, { group: 'bed', hero: true, params: { head: 550, duvet: 'unmade', frame: 'box' } });
  back.place('bedside-l', 'bedsideTable', 1550, { group: 'bed' }); back.place('bedside-r', 'bedsideTable', 4050, { group: 'bed' });
  back.place('lamp-l', 'bedsideLamp', 1550, { y: 520, mount: 'on', group: 'bed', off: 190 });
  back.place('clock', 'alarmClock', 4050, { y: 520, mount: 'on', group: 'bed', off: 200 });
  a.bandOn('throw', 'bed', { group: 'bed', w: 1500, d: 420, dz: 760, layers: 3 });
  a.put('bench', 'bench', [2800, 3100], 0, { group: 'foot', params: { w: 1200 } });
  a.put('cat', 'cat', [3150, 3100], 190, { y: 457, mount: 'on', group: 'foot', params: { scale: 0.65 } });
  a.put('rug', 'rug', [2800, 2300], 0, { group: 'foot', params: { w: 3200, d: 2000 } });
  back.place('wardrobe', 'wardrobe', 700, { group: 'wardrobe', params: { w: 1000 } });
  back.place('floor-lamp', 'floorLamp', 5600, { group: 'chest' });
  back.place('chest', 'chestOfDrawers', 4900, { group: 'chest', params: { w: 760, h: 900, rows: 3, pull: 'bar', legs: 'block' } });
  back.place('chest-picture', 'picture', 4900, { y: 1350, group: 'chest', shadow: false, params: { w: 520, h: 700 } });
  a.put('bench-plant', 'pot', [2350, 3100], 0, { y: 457, mount: 'on', group: 'foot', params: { r: 90, tall: 1.4, profile: 'tulip', plant: 'bush', seed: 7 } });
  back.place('picture', 'picture', 1550, { y: 1350, group: 'bed', shadow: false, params: { w: 520, h: 700 } });
  back.place('bedside-plant', 'pot', 4150, { y: 520, mount: 'on', group: 'bed', off: 200, params: { r: 70, tall: 1.2, profile: 'belly', plant: 'sprig', seed: 11 } });
  a.put('corner-plant', 'floorPlant', [300, 2300], 0, { group: 'wardrobe' });
  a.put('slippers', 'shoes', [850, 1700], 30, { group: 'bed', params: { pairs: 1, kind: 'sneaker' } });
  a.view({ target: [2800, 1000, 1800], az: 12, el: 10 });
  a.shot('bed', [1400, 1100, 6000], [1895, 500, 941], 40, 'bed');
  a.shot('wardrobe', [4400, 1700, 6000], [1155, 900, 851], 36, 'wardrobe');
}
H.write(new URL('./seed-41.json', import.meta.url).pathname, fs);
console.log('wrote seed-41.json');
