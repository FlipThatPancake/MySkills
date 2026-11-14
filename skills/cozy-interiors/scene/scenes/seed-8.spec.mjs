// seed 8 (node roll.mjs 8): floor tiles; kitchen corner-left U with a tall pantry wall, fixed window on the left wall, arch on the back wall;
// dining one wall, round table on a rug, window; living one wall, shelf wall with an armchair, window and arch.
import fs from 'node:fs';
import { Home, facing } from '../compose.mjs';
const H = new Home({ seed: 8, floor: 'tiles' });

// ---------- kitchen: U (left leg C, back run A, peninsula D), pantry bank at the right, arch to the dining
{
  const a = H.area('kitchen', 'Kitchen', { O: [0, 0], rect: [0, 0, 7800, 4200] });
  const back = a.wall('back', [0, 0], 0, 7800, [{ kind: 'arch', x: 6100, width: 1200, to: 'dining', beyond: false, depth: 200 }]);
  const left = a.wall('left', [0, 3400], -90, 3400, [{ kind: 'window', x: 1000, width: 1100, height: 1100, sill: 1000, sash: 'fixed' }]);
  a.put('run-a', 'baseRun', [0, 600], 0, { group: 'run', params: { joins: { side: 'start', length: 2400 }, modules: [{ w: 900, kind: 'blind', dead: 'l' }, { w: 600, kind: 'drawers' }, { w: 900, kind: 'hob' }, { w: 1000, kind: 'blind', dead: 'r' }] } });
  a.put('run-c', 'baseRun', [600, 3000], 90, { group: 'run', params: { ownsTop: false, modules: [{ w: 600, kind: 'drawers', n: 3 }, { w: 800, kind: 'sink' }, { w: 600, kind: 'doors' }, { w: 400, kind: 'filler' }] } });
  a.put('run-d', 'baseRun', [2800, 780], -90, { group: 'run', params: { finishedBack: true, backOverhang: 300, endPanels: ['end'], modules: [{ w: 600, kind: 'open' }, { w: 600, kind: 'drawers', n: 3 }, { w: 600, kind: 'doors' }, { w: 600, kind: 'drawers', n: 3 }] } });
  back.put('fridge', 'fridge', 3400, 700, { group: 'pantry', hero: true });
  back.put('pantry', 'baseRun', 4310, 600, { group: 'pantry', params: { modules: [{ w: 550, kind: 'tall', h: 2250, hinge: 'r' }, { w: 550, kind: 'tall', h: 2250, hinge: 'r' }] } });
  back.put('hob', 'hob', 1900 + 450, 600, { y: 900, mount: 'on', group: 'run' });
  back.put('hood', 'hood', 1900 + 450, 600, { mount: 'wall', group: 'run' });
  back.put('pan', 'pan', 1900 + 700, 440, { y: 940, mount: 'on', group: 'run', turn: -40 });
  back.put('wall-run', 'wallRun', 700, 320, { mount: 'wall', group: 'run', params: { length: 800 } });
  back.put('cutting-board', 'cuttingBoard', 1500, 330, { y: 904, mount: 'on', group: 'run' });
  back.put('switch', 'lightSwitch', 6950, 0, { y: 1150, mount: 'wall', group: 'pantry', shadow: false });
  a.put('plant', 'plant', [250, 800], 0, { y: 900, mount: 'on', group: 'run' });
  a.put('fruit-bowl', 'fruitBowl', [3100, 1500], 0, { y: 900, mount: 'on', group: 'peninsula' });
  a.put('vase', 'vase', [3100, 2300], 0, { y: 900, mount: 'on', group: 'peninsula', params: { h: 260 } });
  for (const [i, z] of [1000, 1700, 2400].entries()) a.put(`stool-${i + 1}`, 'stool', [3950, z], 0, { group: 'peninsula' });
  a.put('pendant', 'pendantLamp', [4000, 2300], 0, { mount: 'ceiling', group: 'peninsula' });
  left.put('shelf', 'wallShelf', 2150, 0, { y: 1400, mount: 'wall', group: 'run', shadow: false, params: { w: 700 } });
  back.put('basket', 'basket', 7150, 330, { group: 'pantry' });
  a.put('floor-plant', 'plant', [7550, 330], 0, { group: 'pantry' });
  a.view({ target: [3300, 950, 1500], az: 20, el: 15 });
  a.shot('down the peninsula', [4800, 1350, 3600], [2800, 1000, 900], 34);
  a.shot('sink and window', [2400, 1400, 2900], [0, 1250, 2400], 30);
  a.shot('the pantry', [4300, 1450, 3000], [4600, 1100, 300], 32);
}

// ---------- dining: one wall, round table on a rug under a pendant, sideboard under the window
{
  const a = H.area('dining', 'Dining', { O: [9700, 0], rect: [0, 0, 5600, 5000] });
  const back = a.wall('back', [0, 0], 0, 5600, [{ kind: 'window', x: 2800, width: 1400, height: 1200, sill: 900, sash: 'fixed' }]);
  const T = [2800, 2800];
  a.put('rug', 'rug', T, 0, { group: 'table set', params: { w: 2600, d: 2600 } });
  a.put('table', 'roundTable', T, 0, { y: 7, lift: 7, group: 'table set', hero: true });
  for (const [i, ang] of [0, 90, 180, 270].entries()) { const p = [T[0] + Math.sin(ang * Math.PI / 180) * 880, T[1] + Math.cos(ang * Math.PI / 180) * 880]; a.put(`chair-${i + 1}`, 'chair', p, facing(p, T), { y: 7, lift: 7, group: 'table set' }); }
  back.put('sideboard', 'sideboard', 2800, 210, { group: 'sideboard', params: { w: 1600, d: 420, doors: 3 } });
  back.put('vase', 'vase', 2250, 210, { y: 800, mount: 'on', group: 'sideboard', params: { h: 300, seed: 7 } });
  back.put('books', 'bookStack', 3350, 210, { y: 800, mount: 'on', group: 'sideboard' });
  back.put('mirror', 'mirror', 700, 0, { y: 800, mount: 'wall', group: 'sideboard', shadow: false, params: { w: 600, h: 1300, shape: 'arch' } });
  back.put('floor-lamp', 'floorLamp', 4900, 300, { group: 'corner' });
  back.put('plant', 'plant', 5250, 300, { group: 'corner' });
  a.view({ target: [2800, 950, 2000], az: 12, el: 15 });
  a.shot('table and sideboard', [800, 1250, 4600], [2800, 800, 1800], 32);
  a.shot('window and sideboard', [2000, 1350, 3600], [2800, 950, 0], 30);
  a.shot('the corner', [3800, 1400, 3600], [5000, 900, 200], 32);
}

// ---------- living: one wall, sofa and shelf wall with an armchair, window and arch
{
  const a = H.area('living', 'Living', { O: [18700, 0], rect: [0, 0, 6200, 5000] });
  const back = a.wall('back', [0, 0], 0, 6200, [{ kind: 'window', x: 1700, width: 1400, height: 1200, sill: 900 }, { kind: 'arch', x: 5200, width: 1200, to: 'dining', beyond: false, depth: 200 }]);
  back.put('sofa', 'sofa', 1700, 450, { y: 7, lift: 7, group: 'seating', params: { seats: 2 } });
  a.put('rug', 'rug', [1900, 1900], 0, { group: 'seating', params: { w: 2600, d: 1800 } });
  a.put('coffee', 'coffeeTable', [1900, 1900], 0, { y: 7, lift: 7, group: 'seating', params: { w: 900, d: 520 } });
  a.put('armchair', 'armchair', [3350, 1650], -45, { y: 0, group: 'seating' });
  a.put('cushion-1', 'cushion', [1250, 385], 0, { y: 437, mount: 'on', group: 'seating', params: { tone: 'lo' } });
  a.put('cushion-2', 'cushion', [2150, 385], 8, { y: 437, mount: 'on', group: 'seating' });
  a.put('cat', 'cat', [2300, 2600], 20, { y: 7, mount: 'floor', group: 'seating', lift: 7, params: { pose: 'loaf' } });
  back.put('shelf-1', 'shelf', 3300, 160, { group: 'shelf wall', hero: true });
  back.put('shelf-2', 'shelf', 4100, 160, { group: 'shelf wall', params: { seed: 9 } });
  back.put('wall-shelf', 'wallShelf', 3700, 0, { y: 2000, mount: 'wall', group: 'shelf wall', shadow: false, params: { w: 1400 } });
  back.put('mirror', 'mirror', 500, 0, { y: 800, mount: 'wall', group: 'seating', shadow: false, params: { w: 600, h: 1200, shape: 'pill' } });
  a.put('basket', 'basket', [480, 560], 0, { group: 'seating' });
  back.put('plant', 'plant', 6000, 300, { group: 'shelf wall' });
  a.view({ target: [3100, 900, 1700], az: 16, el: 15 });
  a.shot('sofa and rug', [800, 1250, 4200], [2000, 700, 600], 32);
  a.shot('shelves and armchair', [2200, 1400, 3600], [3900, 1000, 300], 32);
  a.shot('window and mirror', [2800, 1400, 3400], [1100, 1100, 0], 30);
}
H.write(new URL('./seed-8.json', import.meta.url).pathname, fs);
console.log('wrote seed-8.json');
