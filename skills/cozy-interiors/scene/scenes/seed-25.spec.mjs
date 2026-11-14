// seed 25 (node roll.mjs 25 kitchen reading-corner bedroom): floor boards.
//  kitchen: corner-right, peninsula, hero window over the sink, window first + door second, accents kettle, tea towel, jars, 1 plant
//  reading-corner: one wall, hero reading chair + footstool + floor lamp, window first + arch first, accents picture, book stack, side table, 2 plants (+ rug)
//  bedroom: corner-left, hero bed under a window with a bedside table each side, window first + door first, accents picture, book stack, cushion, mirror, cat, 2 plants (pieces bed, bedside tables, wardrobe, rug)
import fs from 'node:fs';
import { Home } from '../compose.mjs';
const H = new Home({ seed: 25, floor: 'boards' });

{ // ---------- kitchen
  const a = H.area('kitchen', 'Kitchen', { rect: [0, 0, 6200, 4200] });
  const back = a.back(6200, [{ kind: 'window', x: 1910, width: 1300, height: 1100, sill: 1000, sash: 'fixed' }]);
  const right = a.right(4200, [{ kind: 'door', x: 3400, width: 900, hinge: 'l', open: 22 }]);
  back.place('fridge', 'fridge', 455, { group: 'sink wall' });
  const A = a.run(back, 'run', 910, [{ w: 600, kind: 'door', hinge: 'r' }, { w: 800, kind: 'sink' }, { w: 600, kind: 'drawers' }, { w: 900, kind: 'hob' }, { w: 600, kind: 'doors' }], { group: 'sink wall', hero: true });
  A.on('hob', 'hob'); A.on('hob', 'hood'); A.on('hob', 'pan');
  A.on('doors', 'kettle', { id: 'kettle' }); A.on('drawers', 'jars', { id: 'jars' });
  back.place('towel', 'teaTowel', 3350, { y: 1250, group: 'sink wall', shadow: false });
  A.on('door', 'plant', { id: 'plant', dx: -60 });
  // peninsula: a run reaching out from the right end of the back run, stools on its far side
  a.put('peninsula', 'baseRun', [4150, 640], -90, { group: 'peninsula', params: { finishedBack: true, backOverhang: 300, modules: [{ w: 600, kind: 'open' }, { w: 600, kind: 'drawers', n: 3 }, { w: 600, kind: 'doors' }] } });
  for (const [i, z] of [1000, 1650].entries()) a.put(`stool-${i + 1}`, 'stool', [5300, z], 0, { group: 'peninsula' });
  a.view({ target: [3000, 900, 1500], az: -20, el: 16 });
  a.shot('sink wall', [3510, 1388, 5245], [1900, 1100, 300], 60, 'sink wall');
  a.shot('peninsula', [6360, 1590, 3915], [3600, 900, 1500], 60, 'peninsula');
}
{ // ---------- reading corner
  const a = H.area('reading', 'Reading corner', { rect: [0, 0, 5400, 4000] });
  const back = a.back(5400, [{ kind: 'window', x: 1500, width: 1400, height: 1200, sill: 900, sash: 'fixed' }, { kind: 'arch', x: 4200, width: 1200, to: 'bedroom', beyond: false, depth: 200 }]);
  a.put('rug', 'rug', [1900, 1500], 0, { group: 'reading group', params: { w: 2400, d: 1800 } });
  a.put('chair', 'readingChair', [1600, 1250], 20, { y: 7, lift: 7, group: 'reading group', hero: true });
  a.put('footstool', 'footstool', [1950, 2150], 25, { y: 7, lift: 7, group: 'reading group' });
  a.put('lamp', 'floorLamp', [900, 1950], 0, { group: 'reading group' });
  a.put('side-table', 'sideTable', [2750, 1250], 0, { group: 'reading group' });
  a.put('books', 'bookStack', [2750, 1250], 20, { y: 520, mount: 'on', group: 'reading group' });
  back.place('shelf', 'shelf', 3000, { group: 'shelf', params: { w: 800 } });
  back.place('shelf-plant', 'plant', 3000, { y: 1800, mount: 'on', group: 'shelf', off: 160 });
  back.place('picture', 'picture', 3000, { y: 1950, group: 'shelf', shadow: false, params: { w: 600, h: 400 } });
  back.place('floor-plant', 'floorPlant', 5050, { group: 'shelf', off: 240 });
  a.view({ target: [2300, 900, 1400], az: 16, el: 15 });
  a.shot('reading chair', [4550, 1550, 4900], [1700, 800, 1300], 54, 'reading group');
  a.shot('shelf and picture', [1275, 1445, 3995], [3000, 1100, 200], 60, 'shelf');
}
{ // ---------- bedroom
  const a = H.area('bedroom', 'Bedroom', { rect: [0, 0, 6000, 4800] });
  const back = a.back(6000, [{ kind: 'window', x: 3000, width: 1400, height: 1000, sill: 1300, sash: 'fixed' }, { kind: 'door', x: 5400, width: 900, hinge: 'r', open: 20 }]);
  const left = a.left(4800);
  back.place('bed', 'bed', 3000, { group: 'bed', hero: true });
  back.place('bedside-l', 'bedsideTable', 1900, { group: 'bed' }); back.place('bedside-r', 'bedsideTable', 4100, { group: 'bed' });
  back.place('bedside-books', 'bookStack', 1900, { y: 520, mount: 'on', group: 'bed', off: 190, params: { n: 3 } });
  back.place('bedside-plant', 'plant', 4100, { y: 520, mount: 'on', group: 'bed', off: 190 });
  a.put('cushion', 'cushion', [3300, 520], 0, { y: 600, mount: 'on', group: 'bed', params: { w: 400, h: 340 } });
  a.put('rug', 'rug', [3000, 2300], 0, { group: 'bed', params: { w: 2600, d: 1700 } });
  a.put('cat', 'cat', [2300, 2400], 40, { y: 7, lift: 7, group: 'bed', params: { pose: 'curl' } });
  left.place('wardrobe', 'wardrobe', 1500, { group: 'wardrobe wall' });
  left.place('mirror', 'mirror', 3300, { y: 800, group: 'wardrobe wall', shadow: false, params: { w: 600, h: 1300, shape: 'pill' } });
  back.place('picture', 'picture', 1000, { y: 1350, group: 'bed', shadow: false, params: { w: 520, h: 700 } });
  back.place('floor-plant', 'floorPlant', 600, { group: 'bed', off: 240 });
  a.view({ target: [3200, 900, 1700], az: 20, el: 15 });
  a.shot('bed', [5400, 1625, 6150], [3000, 800, 900], 54, 'bed');
  a.shot('wardrobe wall', [4110, 1460, 3575], [200, 1000, 3000], 60, 'wardrobe wall');
}
H.write(new URL('./seed-25.json', import.meta.url).pathname, fs);
console.log('wrote seed-25.json');
