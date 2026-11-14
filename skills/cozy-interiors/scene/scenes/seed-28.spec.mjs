// seed 28 (node roll.mjs 28 hallway living home-office): floor boards.
//  hallway: wide-angle, hero console with a mirror, arch first + window second, accents plant, rug, basket, 3 plants, pieces coatHooks, bench, console, mirror, rug
//  living: corner-left, hero two armchairs and a side table, window first + arch (on the other wall), accents cushion, cat, side table, floor lamp, vase, 1 plant, piece curtain at the window
//  home-office: wide-angle, hero desk under a window, window first + door second, accents picture, mirror, floor lamp, 3 plants, pieces desk, desk chair, shelf, rug
import fs from 'node:fs';
import { Home } from '../compose.mjs';
const H = new Home({ seed: 28, floor: 'boards' });

{ // ---------- hallway
  const a = H.area('hallway', 'Hallway', { rect: [0, 0, 5400, 3600] });
  const back = a.back(5400, [{ kind: 'arch', x: 1200, width: 1200, to: 'living', beyond: false, depth: 200 }]);
  const left = a.left(3600, [{ kind: 'window', x: 2500, width: 1000, height: 1200, sill: 1000, sash: 'fixed' }], 120);
  back.place('console', 'console', 2850, { group: 'console', hero: true });                       // a console by the arch, with a mirror
  back.place('mirror', 'mirror', 2850, { y: 1150, group: 'console', shadow: false, params: { w: 700, h: 1000, shape: 'round' } });
  back.place('console-plant', 'plant', 3200, { y: 800, mount: 'on', group: 'console', off: 165 });
  back.place('bench', 'bench', 4250, { group: 'bench wall', params: { w: 1000 } });                                     // a bench with coats above it
  back.place('hooks', 'coatHooks', 4250, { group: 'bench wall', shadow: false });
  a.put('bench-plant', 'plant', [3950, 190], 0, { y: 450, mount: 'on', group: 'bench wall' });
  a.put('cat', 'cat', [4550, 190], -15, { y: 450, mount: 'on', group: 'bench wall', params: { pose: 'curl', scale: 0.65 } });
  a.put('rug', 'rug', [3300, 1050], 0, { group: 'bench wall', params: { w: 3800, d: 1000 } });  // a runner in front of the wall pieces, leading to the arch
  a.put('basket', 'basket', [4250, 1050], 0, { group: 'bench wall' });
  back.place('floor-plant', 'floorPlant', 5050, { group: 'bench wall' });
  a.put('stool', 'stool', [1700, 2300], 0, { group: 'window corner' });
  left.place('floor-plant-2', 'floorPlant', 1300, { group: 'window corner' });
  a.view({ target: [2800, 900, 1500], az: 12, el: 11 });
  a.shot('console', [1700, 1250, 4500], [2371, 900, 38], 38, 'console');
  a.shot('bench wall', [500, 1400, 5400], [3877, 300, 1107], 40, 'bench wall');
}
{ // ---------- living
  const a = H.area('living', 'Living room', { rect: [0, 0, 5400, 4200] });
  const back = a.back(5400, [{ kind: 'window', x: 3600, width: 1500, height: 1300, sill: 800, sash: 'fixed' }]);
  const left = a.left(4200, [{ kind: 'arch', x: 3300, width: 1200, to: 'hallway', beyond: false, depth: 200 }]);
  back.place('curtain', 'curtain', 3600, { group: 'window' });
  a.put('rug', 'rug', [2950, 2000], 0, { group: 'seating', params: { w: 2800, d: 1800 } });
  a.put('armchair-l', 'armchair', [2200, 1700], 25, { y: 7, lift: 7, group: 'seating', hero: true });
  a.put('armchair-r', 'armchair', [3700, 1700], -25, { y: 7, lift: 7, group: 'seating' });
  a.put('side-table', 'sideTable', [2950, 1500], 0, { y: 7, lift: 7, group: 'seating' });
  a.put('vase', 'vase', [2950, 1500], 0, { y: 527, mount: 'on', group: 'seating' });
  a.put('cushion', 'cushion', [2150, 1650], 25, { y: 470, mount: 'on', group: 'seating', params: { w: 380, h: 340 } });
  a.put('cat', 'cat', [2950, 2650], 160, { y: 7, lift: 7, group: 'seating', params: { pose: 'sit' } });
  back.place('lamp', 'floorLamp', 450, { group: 'window' });
  back.place('floor-plant', 'floorPlant', 5050, { group: 'corner' });
  a.put('pouf', 'pouf', [4950, 2600], 0, { group: 'corner' });
  a.view({ target: [2800, 800, 1600], az: 14, el: 16 });
  a.shot('armchairs', [4100, 1400, 6300], [3456, 300, 1865], 40, 'seating');
  a.shot('window corner', [800, 1100, 5700], [1554, 1100, -37], 40, 'window');
}
{ // ---------- home office
  const a = H.area('office', 'Home office', { rect: [0, 0, 5400, 3600] });
  const back = a.back(5400, [{ kind: 'window', x: 2700, width: 1400, height: 1100, sill: 1000, sash: 'fixed' }]);
  const right = a.right(3600, [{ kind: 'door', x: 1200, width: 900, hinge: 'r', open: 22 }], 120);
  back.place('desk', 'desk', 2700, { group: 'desk', hero: true });
  back.place('desk-plant', 'plant', 2200, { y: 740, mount: 'on', group: 'desk', off: 160 });
  a.put('chair', 'deskChair', [2700, 1250], 180, { y: 7, lift: 7, group: 'desk' });
  a.put('rug', 'rug', [2700, 1350], 0, { group: 'desk', params: { w: 2200, d: 1500 } });
  back.place('lamp', 'floorLamp', 450, { group: 'wall' });
  back.place('picture', 'picture', 1500, { y: 1400, group: 'wall', shadow: false });
  right.place('mirror', 'mirror', 2800, { y: 800, group: 'wall', shadow: false, params: { w: 600, h: 1200, shape: 'pill' } });
  back.place('shelf', 'shelf', 4300, { group: 'shelf' });
  back.place('shelf-plant', 'plant', 4300, { y: 1800, mount: 'on', group: 'shelf', off: 160 });
  back.place('floor-plant', 'floorPlant', 5050, { group: 'shelf' });
  a.put('basket', 'basket', [1750, 700], 0, { group: 'desk' });
  a.put('stool', 'stool', [4700, 2300], 0, { group: 'shelf' });
  a.view({ target: [2700, 800, 1400], az: 14, el: 11 });
  a.shot('desk', [3500, 1400, 5400], [3096, 300, 966], 34, 'desk');
  a.shot('shelf', [500, 1100, 4200], [4249, 900, 766], 40, 'shelf');
}
H.write(new URL('./seed-28.json', import.meta.url).pathname, fs);
console.log('wrote seed-28.json');
