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
  const left = a.left(3600, [{ kind: 'window', x: 1800, width: 1000, height: 1200, sill: 1000, sash: 'fixed' }], 120);
  back.place('console', 'console', 3300, { group: 'console', hero: true });
  back.place('mirror', 'mirror', 3300, { y: 1150, group: 'console', shadow: false, params: { w: 700, h: 1000, shape: 'round' } });
  back.place('console-plant', 'plant', 3700, { y: 800, mount: 'on', group: 'console', off: 165 });
  back.place('hooks', 'coatHooks', 4700, { group: 'coat corner', shadow: false });
  back.place('bench', 'bench', 4700, { group: 'coat corner' });
  a.put('cat', 'cat', [4950, 190], 0, { y: 450, mount: 'on', group: 'coat corner', params: { pose: 'curl', scale: 0.65 } });
  back.place('floor-plant', 'floorPlant', 2300, { group: 'console', off: 240 });
  a.put('rug', 'rug', [3300, 1500], 0, { group: 'console', params: { w: 2600, d: 1100 } });
  a.put('basket', 'basket', [2200, 1400], 0, { group: 'coat corner' });
  a.put('bench-plant', 'plant', [4350, 190], 0, { y: 450, mount: 'on', group: 'coat corner' });
  a.view({ target: [2800, 900, 1400], az: 12, el: 14 });
  a.shot('console', [2130, 1585, 4980], [3300, 1000, 300], 60, 'console');
  a.shot('coat corner', [1710, 1515, 4590], [4700, 800, 300], 60, 'coat corner');
}
{ // ---------- living
  const a = H.area('living', 'Living room', { rect: [0, 0, 5400, 4200] });
  const back = a.back(5400, [{ kind: 'window', x: 3600, width: 1500, height: 1300, sill: 800, sash: 'fixed' }]);
  const left = a.left(4200, [{ kind: 'arch', x: 3300, width: 1200, to: 'hallway', beyond: false, depth: 200 }]);
  back.place('curtain', 'curtain', 3600, { group: 'seating' });
  a.put('rug', 'rug', [2950, 2000], 0, { group: 'seating', params: { w: 3200, d: 2100 } });
  a.put('armchair-l', 'armchair', [2200, 1700], 25, { y: 7, lift: 7, group: 'seating', hero: true });
  a.put('armchair-r', 'armchair', [3700, 1700], -25, { y: 7, lift: 7, group: 'seating' });
  a.put('side-table', 'sideTable', [2950, 1500], 0, { y: 7, lift: 7, group: 'seating' });
  a.put('vase', 'vase', [2950, 1500], 0, { y: 527, mount: 'on', group: 'seating' });
  a.put('cushion', 'cushion', [2150, 1650], 25, { y: 470, mount: 'on', group: 'seating', params: { w: 380, h: 340 } });
  a.put('cat', 'cat', [2950, 2650], 160, { y: 7, lift: 7, group: 'seating', params: { pose: 'sit' } });
  back.place('lamp', 'floorLamp', 700, { group: 'seating' });
  back.place('floor-plant', 'floorPlant', 5050, { group: 'seating', off: 240 });
  a.view({ target: [2800, 800, 1600], az: 14, el: 16 });
  a.shot('armchairs', [3800, 1870, 7100], [2900, 700, 1700], 54, 'seating');
  a.shot('window corner', [-720, 1720, 6420], [3600, 1000, 300], 54, 'seating');
}
{ // ---------- home office
  const a = H.area('office', 'Home office', { rect: [0, 0, 5400, 3600] });
  const back = a.back(5400, [{ kind: 'window', x: 2700, width: 1400, height: 1100, sill: 1000, sash: 'fixed' }]);
  const right = a.right(3600, [{ kind: 'door', x: 1200, width: 900, hinge: 'r', open: 22 }], 120);
  back.place('desk', 'desk', 2700, { group: 'desk', hero: true });
  back.place('desk-plant', 'plant', 2200, { y: 740, mount: 'on', group: 'desk', off: 160 });
  a.put('chair', 'deskChair', [2700, 1100], 180, { y: 7, lift: 7, group: 'desk' });
  a.put('rug', 'rug', [2700, 1300], 0, { group: 'desk', params: { w: 2200, d: 1500 } });
  back.place('lamp', 'floorLamp', 900, { group: 'desk' });
  back.place('picture', 'picture', 1300, { y: 1400, group: 'wall', shadow: false });
  back.place('shelf', 'shelf', 4300, { group: 'shelf' });
  back.place('shelf-plant', 'plant', 4300, { y: 1800, mount: 'on', group: 'shelf', off: 160 });
  back.place('floor-plant', 'floorPlant', 5050, { group: 'shelf', off: 240 });
  right.place('mirror', 'mirror', 2800, { y: 800, group: 'wall', shadow: false, params: { w: 600, h: 1200, shape: 'pill' } });
  a.view({ target: [2700, 800, 1400], az: 14, el: 15 });
  a.shot('desk', [3870, 1515, 4720], [2700, 800, 300], 60, 'desk');
  a.shot('shelf', [2200, 1400, 3600], [4300, 1000, 300], 54, 'shelf');
}
H.write(new URL('./seed-28.json', import.meta.url).pathname, fs);
console.log('wrote seed-28.json');
