// seed 6 (node roll.mjs 6): floor boards; kitchen corner-right, one straight run with an island and stools, fixed window on the right wall, arch on the back wall;
// dining wide angle (two walls at 120 degrees), round table on a rug, bench with a cushion, mirror, window; living corner-left (turned to face the other way), sofa with rug and coffee table, windows on both walls.
import fs from 'node:fs';
import { Home, facing } from '../compose.mjs';
const H = new Home({ seed: 6, floor: 'boards' });

// ---------- kitchen: straight run, island, bench under the window on the right wall
{
  const a = H.area('kitchen', 'Kitchen', { O: [0, 0], rect: [0, 0, 6000, 4200] });
  const back = a.wall('back', [0, 0], 0, 6000, [{ kind: 'arch', x: 800, width: 1200, to: 'dining', beyond: false, depth: 200 }]);
  const right = a.wall('right', [6000, 0], 90, 4200, [{ kind: 'window', x: 2200, width: 1300, height: 1200, sill: 1000, sash: 'fixed' }, { kind: 'lightSwitch' }].slice(0, 1));
  back.put('run', 'baseRun', 1650, 600, { group: 'run', params: { modules: [{ w: 600, kind: 'drawers' }, { w: 800, kind: 'sink' }, { w: 600, kind: 'drawers' }, { w: 900, kind: 'hob' }, { w: 350, kind: 'door', hinge: 'l' }] } });
  back.put('fridge', 'fridge', 4900, 700, { group: 'run' });
  back.put('hob', 'hob', 1650 + 2000 + 450, 600, { y: 0, mount: 'on', group: 'run' });
  back.put('hood', 'hood', 1650 + 2000 + 450, 600, { mount: 'wall', group: 'run' });
  back.put('pan', 'pan', 1650 + 2000 + 700, 440, { y: 940, mount: 'on', group: 'run', turn: -25 });
  back.put('wall-run', 'wallRun', 1650, 320, { mount: 'wall', group: 'run', params: { length: 1400 } });
  back.put('plant', 'plant', 2250, 330, { y: 900, mount: 'on', group: 'run' });
  back.put('socket', 'socket', 3350, 0, { y: 1100, mount: 'wall', group: 'run', shadow: false });
  a.put('island', 'baseRun', [4950, 1750], 180, { group: 'island', hero: true, params: { finishedBack: true, backOverhang: 300, modules: [{ w: 600, kind: 'doors' }, { w: 600, kind: 'drawers', n: 3 }, { w: 900, kind: 'doors' }, { w: 600, kind: 'drawers', n: 3 }, { w: 300, kind: 'door', hinge: 'r' }] } });
  a.put('fruit-bowl', 'fruitBowl', [3300, 2050], 0, { y: 900, mount: 'on', group: 'island' });
  for (const [i, x] of [2500, 3400, 4300].entries()) a.put(`stool-${i + 1}`, 'stool', [x, 2950], 0, { group: 'island' });
  right.put('bench', 'bench', 2200, 190, { group: 'window side', params: { w: 1300 } });
  right.put('basket', 'basket', 3300, 330, { group: 'window side' });
  right.put('shelf', 'wallShelf', 3600, 0, { y: 1300, mount: 'wall', group: 'window side', shadow: false, params: { w: 700 } });
  back.put('jars', 'jars', 1900, 330, { y: 900, mount: 'on', group: 'run' });
  back.put('kettle', 'kettle', 4750, 330, { y: 900, mount: 'on', group: 'run' });
  back.put('towel', 'teaTowel', 2650, 0, { y: 1350, mount: 'wall', group: 'run', shadow: false });
  a.view({ target: [3200, 900, 1500], az: -20, el: 16 });
  a.shot('the island', [1400, 1350, 3800], [3800, 900, 2000], 34);
  a.shot('hob and hood', [3400, 1500, 3000], [3400, 1200, 300], 30);
  a.shot('window and bench', [3700, 1500, 3700], [6000, 800, 2200], 40);
}

// ---------- dining: a wide angle, round table on a rug, bench and mirror on the angled wall
{
  const a = H.area('dining', 'Dining', { O: [9000, 0], rect: [0, 0, 6300, 4900] });
  const back = a.wall('back', [0, 0], 0, 4000, [{ kind: 'window', x: 2000, width: 1400, height: 1200, sill: 900 }]);
  const side = a.wall('side', [4000, 0], 60, 4200);
  const T = [2950, 2800];
  a.put('rug', 'rug', T, 0, { group: 'table set', params: { w: 2900, d: 2900 } });
  a.put('table', 'roundTable', T, 0, { y: 7, lift: 7, group: 'table set', hero: true, params: { r: 800 } });
  for (const [i, [dx, dz]] of [[0, -1050], [1050, 0], [0, 1050], [-1050, 0]].entries()) { const p = [T[0] + dx, T[1] + dz]; a.put(`chair-${i + 1}`, 'chair', p, facing(p, T), { y: 7, lift: 7, group: 'table set' }); }
  side.put('bench', 'bench', 1900, 190, { group: 'bench wall', params: { w: 1400 } });
  side.put('cushion', 'cushion', 1500, 190, { y: 450, mount: 'on', group: 'bench wall', params: { w: 400, h: 340 } });
  side.put('mirror', 'mirror', 1900, 0, { y: 800, mount: 'wall', group: 'bench wall', shadow: false, params: { w: 600, h: 1250, shape: 'pill' } });
  side.put('basket', 'basket', 3100, 330, { group: 'bench wall' });
  back.put('plant-1', 'plant', 700, 300, { group: 'window side' });
  back.put('plant-2', 'plant', 3500, 300, { group: 'window side' });
  a.view({ target: [3000, 900, 1800], az: -24, el: 16 });
  a.shot('table and bench', [800, 1300, 4300], [3300, 800, 1800], 32);
  a.shot('window and plants', [2300, 1500, 3900], [2300, 1000, 0], 46);
  a.shot('the mirror', [1500, 1400, 3800], [4950, 1000, 1600], 36);
}

// ---------- living: corner on the left, turned to face the other way (psi -90): sofa under the window, rug, coffee table, armchair, lamp
{
  const a = H.area('living', 'Living', { O: [17800, 5400], psi: -90, rect: [0, 0, 5400, 4600] });
  const back = a.wall('back', [0, 0], 0, 5400, [{ kind: 'window', x: 3200, width: 1400, height: 1200, sill: 900 }]);
  const left = a.wall('left', [0, 4200], -90, 4200, [{ kind: 'window', x: 1900, width: 1300, height: 1200, sill: 900 }]);
  back.put('sofa', 'sofa', 3200, 450, { y: 7, lift: 7, group: 'seating', hero: true, params: { seats: 3 } });
  a.put('rug', 'rug', [3200, 1950], 0, { group: 'seating', params: { w: 2800, d: 1900 } });
  a.put('coffee', 'coffeeTable', [3200, 1950], 0, { y: 7, lift: 7, group: 'seating', params: { w: 1000, d: 560 } });
  a.put('coffee-books', 'bookStack', [3100, 1950], 10, { y: 387, mount: 'on', group: 'seating', params: { n: 3 } });
  a.put('armchair', 'armchair', [1500, 2150], facing([1500, 2150], [3200, 1950]) - 20, { group: 'seating' });
  back.put('side-table', 'sideTable', 1700, 260, { group: 'seating' });
  back.put('side-plant', 'plant', 1700, 260, { y: 520, mount: 'on', group: 'seating' });
  back.put('floor-lamp', 'floorLamp', 4750, 300, { group: 'seating' });
  left.put('wall-shelf', 'wallShelf', 3300, 0, { y: 1450, mount: 'wall', group: 'seating', shadow: false, params: { w: 1000 } });
  a.put('pouf', 'pouf', [4600, 2500], 0, { group: 'seating' });
  back.put('plant-1', 'plant', 380, 300, { group: 'corner' });
  back.put('plant-2', 'plant', 5150, 300, { group: 'corner' });
  a.view({ target: [3000, 900, 1700], az: 28, el: 15 });
  a.shot('sofa and window', [4600, 1250, 4200], [3200, 800, 400], 32);
  a.shot('the corner', [3400, 1450, 3400], [300, 1000, 300], 34);
  a.shot('armchair and shelf', [3600, 1300, 3600], [1000, 900, 2000], 32);
}
H.write(new URL('./seed-6.json', import.meta.url).pathname, fs);
console.log('wrote seed-6.json');
