// seed 25 (node roll.mjs 25 kitchen reading-corner bedroom): floor boards.
//  kitchen: corner-right, peninsula, hero window over the sink, window first + door second, accents kettle, tea towel, jars, 1 plant
//  reading-corner: one wall, hero reading chair + footstool + floor lamp, window first + arch first, accents picture, book stack, side table, 2 plants (+ rug)
//  bedroom: corner-left, hero bed under a window with a bedside table each side, window first + door first, accents picture, book stack, cushion, mirror, cat, 2 plants (pieces bed, bedside tables, wardrobe, rug)
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
const H = new Home({ seed: 25, floor: 'boards' });

{ // ---------- kitchen
  const a = H.area('kitchen', 'Kitchen', { rect: [0, 0, 6200, 4200] });
  const back = a.back(6200, [{ kind: 'window', x: 1910, width: 1300, height: 1100, sill: 1000, sash: 'fixed' }]);
  const right = a.right(4200, [{ kind: 'door', x: 3400, width: 900, hinge: 'l', open: 22 }]);
  back.place('fridge', 'fridge', 455, { group: 'larder' });
  const A = a.run(back, 'run', 910, [{ w: 600, kind: 'door', hinge: 'r' }, { w: 800, kind: 'sink' }, { w: 600, kind: 'drawers' }, { w: 900, kind: 'hob' }, { w: 600, kind: 'doors' }], { group: 'cooking', hero: true });
  A.on('hob', 'hob'); A.on('hob', 'hood'); A.on('hob', 'pan');
  A.on('doors', 'kettle', { id: 'kettle' }); A.on('drawers', 'jars', { id: 'jars' });
  A.on('door', 'plant', { id: 'plant', dx: -60 });
  // peninsula: a run reaching out from the right end of the back run, stools on its far side
  a.put('peninsula', 'baseRun', [4150, 640], -90, { group: 'peninsula', params: { finishedBack: true, backOverhang: 300, legEnds: ['end'], endPanels: ['start'], modules: [{ w: 600, kind: 'doors' }, { w: 600, kind: 'drawers', n: 3 }, { w: 600, kind: 'doors' }] } });
  for (const [i, z] of [1000, 1650].entries()) a.put(`stool-${i + 1}`, 'stool', [5300, z], 0, { group: 'peninsula', params: { form: 0 } });
  back.place('wall-units', 'wallRun', 4110, { group: 'cooking', params: { modules: [{ w: 600, kind: 'door', hinge: 'r' }] } });
  a.put('fruit-bowl', 'fruitBowl', [4450, 1500], 0, { y: 900, mount: 'on', group: 'peninsula' });
  a.put('trolley', 'trolley', [455, 1750], 8, { group: 'larder' });
  back.place('towel', 'teaTowel', 4650, { y: 1350, group: 'shelf corner', shadow: false });
  back.place('wall-shelf', 'wallShelf', 5550, { group: 'shelf corner', shadow: false });
  a.put('crate', 'crate', [1250, 2400], 10, { group: 'larder' });
  a.view({ target: [3000, 900, 1500], az: -20, el: 11 });
  a.shot('cooking', [2900, 1100, 5700], [3283, 1100, 320], 40, 'cooking');
  a.shot('peninsula', [1100, 1700, 4800], [4224, 900, 880], 34, 'peninsula');
}
{ // ---------- reading corner
  const a = H.area('reading', 'Reading corner', { rect: [0, 0, 5400, 4000] });
  const back = a.back(5400, [{ kind: 'window', x: 1500, width: 1400, height: 1200, sill: 900, sash: 'fixed' }, { kind: 'arch', x: 4200, width: 1200, to: 'bedroom', beyond: false, depth: 200 }]);
  a.put('rug', 'rug', [1900, 1500], 0, { group: 'reading group', params: { w: 2100, d: 1600 } });
  a.put('chair', 'readingChair', [1600, 1250], 20, { y: 7, lift: 7, group: 'reading group', hero: true });
  a.put('footstool', 'footstool', [1950, 2000], 25, { y: 7, lift: 7, group: 'reading group' });
  a.put('lamp', 'floorLamp', [650, 1650], 0, { group: 'reading group' });
  a.put('side-table', 'sideTable', [2650, 1250], 0, { group: 'chair side' });
  a.put('books', 'bookStack', [2750, 1250], 20, { y: a.topOf('side-table'), mount: 'on', group: 'chair side' });
  a.put('basket', 'basket', [700, 2500], 0, { group: 'chair side' });
  back.place('shelf', 'shelf', 3000, { group: 'shelf', params: { w: 800, h: 1800 } });
  back.place('shelf-plant', 'plant', 3000, { y: a.topOf('shelf'), mount: 'on', group: 'shelf', off: 160 });
  back.place('picture', 'picture', 3000, { y: 1950, group: 'shelf', shadow: false, params: { w: 600, h: 400 } });
  back.place('floor-plant', 'floorPlant', 5050, { group: 'shelf' });
  a.view({ target: [2300, 900, 1400], az: 16, el: 15 });
  a.shot('reading chair', [2000, 1100, 6000], [2203, 700, 1461], 38, 'reading group');
  a.shot('shelf and picture', [3500, 1700, 6300], [3003, 900, 187], 36, 'shelf');
}
{ // ---------- bedroom
  const a = H.area('bedroom', 'Bedroom', { rect: [0, 0, 6000, 4800] });
  const back = a.back(6000, [{ kind: 'window', x: 3000, width: 1400, height: 1100, sill: 1000, sash: 'fixed' }, { kind: 'door', x: 5400, width: 900, hinge: 'r', open: 20 }]);
  const left = a.left(4800);
  back.place('bed', 'bed', 3000, { group: 'bed', hero: true, params: { head: 550 } });
  back.place('bedside-l', 'bedsideTable', 1550, { group: 'bed' }); back.place('bedside-r', 'bedsideTable', 4450, { group: 'bed' });
  back.place('bedside-books', 'bookStack', 1550, { y: 520, mount: 'on', group: 'bed', off: 190, params: { n: 3 } });
  back.place('bedside-plant', 'plant', 4450, { y: 520, mount: 'on', group: 'bed', off: 190 });
  a.drapeOver('throw', 'bed', { group: 'bed', w: 1700, d: 900, dz: 650, spin: 6 });
  a.put('cushion', 'cushion', [3300, 520], 0, { y: 600, mount: 'on', group: 'bed', params: { w: 400, h: 340, lean: 20 } });
  a.put('rug', 'rug', [3000, 2300], 0, { group: 'rug area', params: { w: 3200, d: 1700 } });
  a.put('cat', 'cat', [1700, 2700], 40, { y: 7, lift: 7, group: 'rug area', params: {} });
  left.place('wardrobe', 'wardrobe', 1500, { group: 'wardrobe wall' });
  left.place('mirror', 'mirror', 3300, { y: 800, group: 'wardrobe wall', shadow: false, params: { w: 600, h: 1300, shape: 'pill' } });
  back.place('picture', 'picture', 1000, { y: 1350, group: 'corner', shadow: false, params: { w: 520, h: 700 } });
  back.place('floor-plant', 'floorPlant', 600, { group: 'corner' });
  a.put('bench', 'bench', [3000, 2450], 0, { y: 7, lift: 7, group: 'bed' });
  a.view({ target: [3200, 1450, 1700], az: 20, el: 5 });
  a.shot('bed', [2600, 1400, 5700], [2534, 700, 1277], 36, 'bed');
  a.shot('wardrobe wall', [5600, 2100, 1800], [227, 1050, 1989], 36, 'wardrobe wall');
}
H.write(new URL('./seed-25.json', import.meta.url).pathname, fs);
console.log('wrote seed-25.json');
