// seed 28 (node roll.mjs 28 hallway living home-office): floor boards.
//  hallway: wide-angle, hero console with a mirror, arch first + window second, accents plant, rug, basket, 3 plants, pieces coatHooks, bench, console, mirror, rug
//  living: corner-left, hero two armchairs and a side table, window first + arch (on the other wall), accents cushion, cat, side table, floor lamp, vase, 1 plant, piece curtain at the window
//  home-office: wide-angle, hero desk under a window, window first + door second, accents picture, mirror, floor lamp, 3 plants, pieces desk, desk chair, shelf, rug
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
const H = new Home({ seed: 28, floor: 'boards' });

{ // ---------- hallway
  const a = H.area('hallway', 'Hallway', { rect: [0, 0, 4200, 3600] });
  const back = a.back(4200, [{ kind: 'arch', x: 1200, width: 1200, to: 'living', beyond: false, depth: 200 }]);
  back.place('console', 'console', 2650, { group: 'console', hero: true });                       // a console by the arch, with a mirror
  back.place('mirror', 'mirror', 2650, { y: 1150, group: 'console', shadow: false, params: { w: 700, h: 1000, shape: 'round' } });
  back.place('console-plant', 'plant', 3000, { y: 800, mount: 'on', group: 'console', off: 165 });
  const right = a.right(3600, [{ kind: 'window', x: 2900, width: 1000, height: 1200, sill: 1000, sash: 'fixed' }], 120);
  right.place('bench', 'bench', 1000, { group: 'bench wall', params: { w: 1000 } });                                     // a bench with coats above it, on the side wall facing across the hall
  right.place('hooks', 'coatHooks', 1000, { group: 'bench wall', shadow: false });
  right.place('bench-plant', 'plant', 700, { y: 450, mount: 'on', group: 'bench wall', off: 190 });
  right.place('cat', 'cat', 1350, { y: 450, mount: 'on', group: 'bench wall', off: 190, params: { scale: 0.65 } });
  a.put('rug', 'rug', [1350, 1900], 0, { group: 'runner', params: { w: 1000, d: 3300 } });  // a runner from the front of the view to the arch
  right.place('shoes', 'shoes', 1000, { group: 'bench wall', off: 560 });
  right.place('hall-basket', 'basket', 1900, { group: 'bench wall', params: { form: 2 } });
  a.put('hall-plant', 'floorPlant', [480, 3000], 0, { group: 'runner' });
  back.place('umbrellas', 'umbrellaStand', 3700, { group: 'console' });
  a.view({ target: [2100, 1450, 1500], az: 12, el: 5 });
  a.shot('console', [4100, 1400, 4500], [3587, 900, 11], 38, 'console');
  a.shot('bench wall', [200, 1700, 3600], [4350, 700, 794], 34, 'bench wall');
}
{ // ---------- living
  const a = H.area('living', 'Living room', { rect: [0, 0, 5400, 4200] });
  const back = a.back(5400, [{ kind: 'window', x: 3600, width: 1500, height: 1300, sill: 800, sash: 'fixed' }]);
  const left = a.left(4200, [{ kind: 'arch', x: 3300, width: 1200, to: 'hallway', beyond: false, depth: 200 }]);
  back.place('curtain', 'curtain', 3600, { group: 'window' });
  a.put('rug', 'rug', [1950, 2300], 0, { group: 'seating', params: { w: 2800, d: 1800 } });
  a.put('armchair-l', 'armchair', [1200, 2100], 25, { y: 7, lift: 7, group: 'seating', hero: true });
  a.put('armchair-r', 'armchair', [2700, 2100], -25, { y: 7, lift: 7, group: 'seating' });
  a.put('side-table', 'sideTable', [1950, 1900], 0, { y: 7, lift: 7, group: 'seating' });
  a.put('vase', 'vase', [1950, 1900], 0, { y: 527, mount: 'on', group: 'seating' });
  a.put('cushion', 'cushion', [1150, 2050], 25, { y: 470, mount: 'on', group: 'seating', params: { w: 380, h: 340, lean: 18 } });
  a.put('cat', 'cat', [1950, 2900], 160, { y: 7, lift: 7, group: 'seating' });
  back.place('lamp', 'floorLamp', 2500, { group: 'window' });
  a.put('floor-plant', 'floorPlant', [3650, 2000], 0, { group: 'corner' });
  a.put('pouf', 'pouf', [3550, 2750], 0, { group: 'corner' });
  a.view({ target: [2800, 800, 1600], az: 14, el: 16 });
  a.shot('armchairs', [3200, 1100, 6600], [1448, 300, 2446], 40, 'seating');
  a.shot('window corner', [4700, 2100, 6000], [3992, 1200, 51], 36, 'window');
}
{ // ---------- home office
  const a = H.area('office', 'Home office', { rect: [0, 0, 5400, 3600] });
  const back = a.back(5400, [{ kind: 'window', x: 2700, width: 1400, height: 1100, sill: 1000, sash: 'fixed' }]);
  const right = a.right(3600, [{ kind: 'door', x: 1200, width: 900, hinge: 'r', open: 22 }], 120);
  back.place('desk', 'desk', 2700, { group: 'desk', hero: true });
  back.place('desk-plant', 'plant', 2200, { y: 740, mount: 'on', group: 'desk', off: 160 });
  a.put('chair', 'deskChair', [2700, 1250], 180, { y: 7, lift: 7, group: 'desk' });
  a.put('rug', 'rug', [2700, 1350], 0, { group: 'desk', params: { w: 2200, d: 1500 } });
  back.place('picture', 'picture', 1500, { y: 1400, group: 'wall', shadow: false });
  a.put('rug-2', 'rug', [1500, 2100], 0, { group: 'reading', params: { w: 1900, d: 1500 } });
  a.put('reading-chair', 'readingChair', [1500, 2100], 200, { y: 7, lift: 7, group: 'reading' });
  a.put('lamp', 'floorLamp', [380, 1700], 0, { group: 'reading' });
  right.place('mirror', 'mirror', 2800, { y: 800, group: 'wall', shadow: false, params: { w: 600, h: 1200, shape: 'pill' } });
  back.place('shelf', 'shelf', 4300, { group: 'shelf' });
  back.place('shelf-plant', 'plant', 4300, { y: a.topOf('shelf'), mount: 'on', group: 'shelf', off: 160 });
  back.place('floor-plant', 'floorPlant', 5050, { group: 'shelf' });
  a.put('floor-plant-3', 'floorPlant', [300, 2900], 0, { group: 'reading' });
  a.put('bin', 'wasteBin', [3650, 450], 0, { group: 'desk' });
  a.put('file-box', 'fileBox', [4300, 700], 0, { group: 'shelf' });
  a.view({ target: [2700, 1350, 1400], az: 14, el: 5 });
  a.shot('desk', [6800, 1250, 2700], [2874, 300, 616], 36, 'desk');
  a.shot('shelf', [2000, 1700, 5400], [4049, 900, 180], 36, 'shelf');
}
H.write(new URL('./seed-28.json', import.meta.url).pathname, fs);
console.log('wrote seed-28.json');
