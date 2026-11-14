// seed 4 (node roll.mjs 4): floor plain; kitchen one wall, galley with an island and stools, fixed window; dining corner-left, sideboard with a big mirror, door and window, turned to face the other way;
// living wide angle (two walls at 120 degrees), shelf wall with an armchair, window and arch.
import fs from 'node:fs';
import { Home, facing } from '../compose.mjs';
const H = new Home({ seed: 4, floor: 'plain' });

// ---------- kitchen: galley, a run on the wall and an island facing it, the fridge at the right end
{
  const a = H.area('kitchen', 'Kitchen', { O: [0, 0], rect: [0, 0, 6600, 4200] });
  const back = a.wall('back', [0, 0], 0, 6600, [{ kind: 'window', x: 2600, width: 1400, height: 1100, sill: 1000, sash: 'fixed' }]);
  back.put('run', 'baseRun', 700, 600, { group: 'run', params: { modules: [{ w: 600, kind: 'drawers' }, { w: 900, kind: 'doors' }, { w: 800, kind: 'sink' }, { w: 600, kind: 'drawers' }, { w: 900, kind: 'hob' }, { w: 600, kind: 'door', hinge: 'l' }] } });
  back.put('fridge', 'fridge', 5100, 700, { group: 'run' });
  back.put('hob', 'hob', 4050, 600, { y: 900, mount: 'on', group: 'run' });
  back.put('hood', 'hood', 4050, 600, { mount: 'wall', group: 'run' });
  back.put('pan', 'pan', 4300, 440, { y: 940, mount: 'on', group: 'run', turn: -30 });
  back.put('wall-run', 'wallRun', 700, 320, { mount: 'wall', group: 'run', params: { length: 1200 } });
  back.put('plant-1', 'plant', 3300, 330, { y: 900, mount: 'on', group: 'run' });
  back.put('mirror', 'mirror', 330, 0, { y: 900, mount: 'wall', group: 'corner', shadow: false, params: { w: 500, h: 1100, shape: 'pill' } });
  back.put('pouf', 'pouf', 330, 330, { group: 'corner' });
  back.put('plant-2', 'plant', 6350, 300, { group: 'run' });
  a.put('island', 'baseRun', [4200, 1750], 180, { group: 'island', hero: true, params: { finishedBack: true, backOverhang: 300, endPanels: ['start', 'end'], modules: [{ w: 600, kind: 'doors' }, { w: 600, kind: 'drawers', n: 3 }, { w: 900, kind: 'doors' }, { w: 600, kind: 'drawers', n: 3 }, { w: 500, kind: 'doors' }] } });
  a.put('fruit-bowl', 'fruitBowl', [2700, 2050], 0, { y: 900, mount: 'on', group: 'island' });
  a.put('books', 'bookStack', [1500, 2050], 15, { y: 900, mount: 'on', group: 'island', params: { n: 3 } });
  for (const [i, x] of [1500, 2400, 3300].entries()) a.put(`stool-${i + 1}`, 'stool', [x, 2950], 0, { group: 'island' });
  back.put('plant-3', 'plant', 1000, 330, { y: 900, mount: 'on', group: 'run' });
  a.view({ target: [3300, 900, 1500], az: 18, el: 16 });
  a.shot('the island', [5200, 1350, 3700], [2400, 900, 2000], 34);
  a.shot('sink and window', [2800, 1450, 2800], [2600, 1250, 0], 30);
  a.shot('hob and fridge', [4300, 1500, 3100], [4800, 1000, 300], 32);
}

// ---------- dining: turned to face the other way (psi -90), a corner on the left, sideboard with a big round mirror, table on a rug
{
  const a = H.area('dining', 'Dining', { O: [9000, 5600], psi: -90, rect: [0, 0, 5600, 4600] });
  const back = a.wall('back', [0, 0], 0, 5600, [{ kind: 'window', x: 4300, width: 1400, height: 1200, sill: 900, sash: 'fixed' }]);
  const left = a.wall('left', [0, 4600], -90, 4600, [{ kind: 'door', x: 1500, width: 900, hinge: 'r', open: 22 }]);
  back.put('sideboard', 'sideboard', 1700, 210, { group: 'sideboard', hero: true, params: { w: 1800, d: 420, doors: 3 } });
  back.put('mirror', 'mirror', 1700, 0, { y: 1150, mount: 'wall', group: 'sideboard', shadow: false, params: { w: 1000, shape: 'round' } });
  back.put('plant-1', 'plant', 2350, 210, { y: 800, mount: 'on', group: 'sideboard' });
  back.put('vase', 'vase', 1050, 210, { y: 800, mount: 'on', group: 'sideboard', params: { seed: 4, h: 320 } });
  const T = [3200, 2900];
  a.put('rug', 'rug', T, 0, { group: 'table set', params: { w: 3000, d: 2200 } });
  a.put('table', 'table', T, 0, { y: 7, lift: 7, group: 'table set', params: { w: 1700, d: 900 } });
  const seat = (id, p, to) => a.put(id, 'chair', p, facing(p, to), { y: 7, lift: 7, group: 'table set' });
  seat('chair-1', [T[0] - 420, T[1] - 760], [T[0] - 420, T[1]]); seat('chair-2', [T[0] + 420, T[1] - 760], [T[0] + 420, T[1]]);
  seat('chair-3', [T[0] - 420, T[1] + 760], [T[0] - 420, T[1]]); seat('chair-4', [T[0] + 420, T[1] + 760], [T[0] + 420, T[1]]);
  a.put('cushion', 'cushion', [T[0] - 420, T[1] + 760], 180, { y: 458, mount: 'on', group: 'table set', params: { w: 380, h: 300 } });
  left.put('wall-shelf', 'wallShelf', 3300, 0, { y: 1450, mount: 'wall', group: 'corner', shadow: false, params: { w: 1000 } });
  a.put('basket', 'basket', [500, 600], 0, { group: 'corner' });
  a.put('cat', 'cat', [1000, 800], 150, { group: 'corner', params: { pose: 'sit' } });
  back.put('plant-2', 'plant', 3500, 300, { group: 'window side' });
  back.put('plant-3', 'plant', 5300, 300, { group: 'window side' });
  a.view({ target: [3000, 900, 2000], az: 14, el: 15 });
  a.shot('table and sideboard', [800, 1250, 4600], [3200, 800, 1800], 32);
  a.shot('the door', [3400, 1350, 3800], [0, 1000, 3000], 30);
  a.shot('window and plants', [3000, 1400, 3600], [4300, 1000, 0], 30);
}

// ---------- living: wide angle (120 degrees), shelf wall on one wall, sofa and window on the other, an arch to the dining
{
  const a = H.area('living', 'Living', { O: [16200, 0], rect: [0, 0, 6900, 4800] });
  const back = a.wall('back', [0, 0], 0, 4300, [{ kind: 'arch', x: 1300, width: 1200, to: 'dining', beyond: false, depth: 200 }]);
  const side = a.wall('side', [4300, 0], 60, 4300, [{ kind: 'window', x: 3000, width: 1400, height: 1200, sill: 900 }]);
  back.put('shelf-1', 'shelf', 2800, 160, { group: 'shelf wall' });
  back.put('shelf-2', 'shelf', 3600, 160, { group: 'shelf wall', hero: true, params: { seed: 9 } });
  back.put('books', 'bookStack', 2800, 160, { y: 1800, mount: 'on', group: 'shelf wall', params: { n: 3 } });
  side.put('sofa', 'sofa', 1500, 450, { y: 7, lift: 7, group: 'seating', params: { seats: 2 } });
  side.put('cushion-1', 'cushion', 1000, 385, { y: 437, mount: 'on', group: 'seating', params: { tone: 'lo' } });
  side.put('cushion-2', 'cushion', 1950, 385, { y: 437, mount: 'on', group: 'seating' });
  side.put('wall-shelf', 'wallShelf', 1500, 0, { y: 1450, mount: 'wall', group: 'seating', shadow: false, params: { w: 1200 } });
  const C = side.at(1500, 1750);
  a.put('rug', 'rug', C, -60, { group: 'seating', params: { w: 2600, d: 1700 } });
  a.put('coffee', 'coffeeTable', C, -60, { y: 7, lift: 7, group: 'seating', params: { w: 900, d: 520 } });
  a.put('coffee-books', 'bookStack', C, 20, { y: 387, mount: 'on', group: 'seating', params: { n: 2 } });
  a.put('armchair', 'armchair', [2500, 1250], facing([2500, 1250], C), { group: 'seating' });
  a.put('pouf', 'pouf', [1800, 2500], 0, { group: 'seating' });
  a.put('cat', 'cat', side.at(2300, 1500), 120, { y: 7, lift: 7, group: 'seating', params: { pose: 'loaf' } });
  a.put('basket', 'basket', side.at(2700, 450), 0, { group: 'seating' });
  a.put('plant', 'plant', side.at(4000, 330), 0, { group: 'shelf wall' });
  a.view({ target: [3600, 900, 1700], az: -24, el: 15 });
  a.shot('sofa and rug', [2600, 1250, 4400], [4700, 700, 1300], 32);
  a.shot('shelf wall', [3400, 1400, 3600], [3200, 1000, 200], 32);
  a.shot('the corner', [3000, 1500, 3000], [4300, 1000, 0], 34);
}
H.write(new URL('./seed-4.json', import.meta.url).pathname, fs);
console.log('wrote seed-4.json');
