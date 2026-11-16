// seed 42 (node roll.mjs 42 living reading-corner hallway): floor boards.
//  living: corner-left, hero two armchairs and a side table, window first + window second, accents pouf, book stack, mirror, gallery wall, 3 plants, piece curtain, signs scuffed floor + sofa scratches (on an armchair)
//  reading-corner: wide-angle, hero reading chair + footstool + floor lamp, window first, accents vase of branches, wall shelf, cushion, basket, wall sconce, plant stand, 3 plants, signs folded throw + mug
//  hallway: one wall, hero coat hooks over a bench, door first, accents stool, bag on a hook, picture, hat on a hook, key bowl, wall sconce, wall clock, 3 plants, signs height chart + fallen leaf
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
const H = new Home({ seed: 42, floor: 'boards' });

{ // ---------- living
  const a = H.area('living', 'Living room', { rect: [0, 0, 5600, 4400] });
  const back = a.back(5600, [{ kind: 'window', x: 3800, width: 1400, height: 1300, sill: 800 }]);
  const left = a.left(4400, [{ kind: 'window', x: 2400, width: 1200, height: 1200, sill: 900, sash: 'fixed' }]);
  back.place('curtain', 'curtain', 3800, { group: 'room edge' });
  back.place('mirror', 'mirror', 1500, { y: 1250, group: 'room edge', shadow: false, params: { w: 700, h: 900, shape: 'pill' } });
  a.put('rug', 'rug', [2800, 2750], 0, { group: 'seating rug', params: { w: 2900, d: 1900 } });
  a.put('armchair-l', 'armchair', [1900, 2700], 25, { y: 7, lift: 7, group: 'seating', hero: true });
  a.put('armchair-r', 'armchair', [3700, 2700], -25, { y: 7, lift: 7, group: 'seating' });
  a.put('side-table', 'sideTable', [2800, 2550], 0, { y: 7, lift: 7, group: 'seating' });
  a.put('books', 'bookStack', [2700, 2550], 20, { y: a.topOf('side-table'), mount: 'on', group: 'seating' });
  a.put('cushion', 'cushion', [3700, 2750], -25, { y: 470, mount: 'on', group: 'seating', params: { w: 400, h: 360, lean: 20 } });
  a.put('scratches', 'scratches', [1470, 2700], 270, { mount: 'lines', y: 520, group: 'room edge' });
  left.place('gallery', 'galleryWall', 700, { y: 900, group: 'room edge', shadow: false, params: { w: 1200, h: 1000, n: 5 } });
  a.put('pouf', 'pouf', [4500, 4020], 0, { group: 'room edge' });
  a.put('floor-plant', 'floorPlant', [4650, 1850], 0, { group: 'seating' });
  a.put('side-plant', 'plant', [2950, 2550], 0, { y: a.topOf('side-table'), mount: 'on', group: 'seating', params: { form: 3 } });
  a.put('floor-plant-2', 'floorPlant', [700, 3050], 0, { group: 'room edge' });
  a.put('scuff', 'scuff', [900, 3500], 90, { group: 'room edge', mount: 'lines' });
  a.view({ target: [2800, 800, 1700], az: 12, el: 12 });
  a.shot('armchairs', [800, 1400, 6600], [2589, 900, 2195], 40, 'seating');
}
{ // ---------- reading corner
  const a = H.area('reading', 'Reading corner', { rect: [0, 0, 5400, 4200] });
  const back = a.back(5400, [{ kind: 'window', x: 2000, width: 1500, height: 1200, sill: 1000, sash: 'fixed' }]);
  const right = a.right(3600, [], 120);
  back.place('window-seat', 'windowSeat', 2000, { group: 'window seat', params: { w: 1500, d: 500, h: 440, form: 'storage', cushion: 'striped', pillows: 2, throwOn: 'yes' } });
  back.place('sconce', 'wallSconce', 3250, { y: 1500, group: 'reading group', shadow: false });
  back.place('read-shelf', 'readShelf', 4300, { y: 1500, group: 'shelf', shadow: false, params: { w: 900, form: 'floating' } });
  a.put('rug', 'rug', [3600, 1800], 0, { group: 'reading group', params: { w: 2200, d: 1600 } });
  a.put('chair', 'readingChair', [3600, 1500], -20, { y: 7, lift: 7, group: 'reading group', hero: true });
  a.put('footstool', 'footstool', [3250, 2250], 20, { y: 7, lift: 7, group: 'reading group' });
  a.put('lamp', 'readingLamp', [4950, 650], 180, { group: 'reading group', params: { form: 'arc', shade: 'drum', h: 1700 } });
  a.put('cushion', 'cushion', [3600, 1400], -20, { y: 480, mount: 'on', group: 'reading group', params: { w: 400, h: 360, lean: 22 } });
  a.put('side-table', 'sideTable', [4450, 1500], 0, { group: 'chair side' });
  a.put('tea', 'teaSet', [4450, 1500], 0, { y: a.topOf('side-table'), mount: 'on', group: 'chair side', params: { form: 'pot', saucer: 'yes', biscuit: 'yes', steam: 'yes' } });
  a.put('mug', 'mug', [4350, 1450], 0, { y: a.topOf('side-table'), mount: 'on', group: 'chair side' });
  a.put('floor-books', 'floorBooks', [4350, 2150], 15, { group: 'chair side', params: { n: 6, form: 'stack', topper: 'glasses' } });
  a.put('basket', 'basket', [900, 2400], 0, { group: 'window seat', params: { form: 0 } });
  right.place('shelf', 'shelf', 1700, { group: 'shelf', params: { w: 800, h: 1800 } });
  right.place('vase', 'vase', 1700, { y: a.topOf('shelf'), mount: 'on', group: 'shelf', off: 150 });
  right.place('shelf-plant', 'plant', 1300, { y: a.topOf('shelf'), mount: 'on', group: 'shelf', off: 190, params: { form: 0 } });
  back.place('floor-plant', 'floorPlant', 600, { group: 'window seat' });
  a.put('plant-stand', 'plantStand', [1300, 1900], 0, { group: 'shelf', params: { h: 560, r: 190, tiers: 2, plant: 'bush', seed: 4 } });
  a.view({ target: [3000, 800, 1500], az: 12, el: 12 });
  a.shot('reading chair', [2300, 1100, 6000], [3115, 700, 1081], 40, 'reading group');
  a.shot('window seat', [2600, 1900, 6000], [2030, 300, 1208], 34, 'window seat');
}
{ // ---------- hallway
  const a = H.area('hallway', 'Hallway', { rect: [0, 0, 6200, 3800] });
  const back = a.back(6200, [{ kind: 'door', x: 5300, width: 900, hinge: 'r', open: 20 }]);
  back.place('bench', 'bench', 2100, { group: 'hooks', hero: true, params: { w: 1000 } });
  back.place('hooks', 'coatHooks', 2100, { group: 'hooks', shadow: false });
  back.place('hat', 'hungHat', 3000, { group: 'hooks', shadow: false, params: { form: 'brim' } });
  back.place('shoes', 'shoeRack', 900, { group: 'rack', params: { form: 'cubby', tiers: 2, w: 760, fill: 'most' } });
  back.place('console', 'console', 3900, { group: 'console' });
  back.place('mirror', 'mirror', 3900, { y: 1150, group: 'console', shadow: false, params: { w: 700, h: 1000, shape: 'arch' } });
  back.place('picture', 'picture', 900, { y: 1500, group: 'rack', shadow: false, params: { w: 520, h: 700 } });
  back.place('bag', 'hungBag', 4500, { group: 'hooks', shadow: false, params: { form: 'tote' } });
  back.place('sconce', 'wallSconce', 1450, { y: 1500, group: 'rack', shadow: false });
  back.place('clock', 'wallClock', 2100, { y: 1950, group: 'hooks', shadow: false, params: { r: 160 } });
  back.place('key-bowl', 'keyBowl', 3600, { y: a.topOf('console'), mount: 'on', group: 'console', off: 165, params: { form: 'dish', keys: 3, fob: 'tag' } });
  back.place('console-plant', 'plant', 4200, { y: a.topOf('console'), mount: 'on', group: 'console', off: 165, params: { form: 1 } });
  back.put('chart', 'heightChart', 5830, 2, { group: 'runner', mount: 'lines' });
  a.put('runner', 'runner', [5000, 2000], 0, { group: 'runner', params: { form: 'bands', w: 760, l: 2400 } });
  a.put('boots', 'boots', [1500, 1000], 0, { group: 'rack', params: { kind: 'ankle' } });
  a.put('stool', 'stool', [3000, 800], 20, { group: 'hooks', params: { form: 1 } });
  a.put('floor-plant', 'floorPlant', [5900, 3000], 0, { group: 'runner' });
  a.put('leaf', 'leaf', [5500, 3200], 0, { group: 'runner', mount: 'lines', params: { turn: 2 } });
  a.view({ target: [3100, 900, 1500], az: 12, el: 10 });
  a.shot('hooks', [4700, 1100, 5400], [3836, 1100, 279], 40, 'hooks');
  a.shot('console', [3800, 1700, 5700], [4479, 1075, 176], 36, 'console');
}
H.write(new URL('./seed-42.json', import.meta.url).pathname, fs);
console.log('wrote seed-42.json');
