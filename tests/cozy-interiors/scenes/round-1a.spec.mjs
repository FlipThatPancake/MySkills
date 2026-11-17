// round-1 tester spec. Seed 845071 came from `node roll.mjs` with no seed (floor boards); kinds kitchen dining living.
// round-1 tester home (kitchen, dining, living). node round-1a.spec.mjs writes round-1a.json
import fs from 'node:fs';
import { Home, facing } from '../../../skills/cozy-interiors/scene/compose.mjs';
const H = new Home({ seed: 845071, floor: 'boards' });

// ================= KITCHEN: L, corner-left backing, hood over the hob, window (fixed) on the left wall, arch on the back wall
{
  const a = H.area('kitchen', 'Kitchen', { rect: [0, 0, 6800, 4000] });
  const back = a.back(6800, [{ kind: 'arch', x: 4600, width: 1000, height: 2100 }]);
  const left = a.left(4000, [{ kind: 'window', x: 2250, width: 1100, height: 1100, sill: 1000, sash: 'fixed' }], 90);
  const R = a.run(back, 'run', 0, [{ w: 900, kind: 'blind', dead: 'l' }, { w: 600, kind: 'drawers', n: 3, ajar: 0.3 }, { w: 900, kind: 'hob' }, { w: 600, kind: 'doors' }, { w: 500, kind: 'door', hinge: 'r' }], { group: 'run', hero: true, joins: { side: 'start', length: 2200 } });
  R.on('hob', 'hob', { group: 'cook' }); R.on('hob', 'hood', { group: 'cook' }); R.on('hob', 'pan', { group: 'cook' });
  R.on('drawers', 'cuttingBoard', { group: 'cook' }); R.on('doors', 'fruitBowl', { group: 'cook' }); R.on('door', 'plant', { group: 'cook' });
  const L = a.run(left, 'lrun', 1200, [{ w: 600, kind: 'drawers', n: 3 }, { w: 900, kind: 'sink' }, { w: 400, kind: 'door', hinge: 'r' }, { w: 300, kind: 'filler' }], { group: 'run', ownsTop: false });
  L.on('drawers', 'kettle', { group: 'sink' }); L.on('door', 'herbs', { group: 'sink' });
  left.place('fridge', 'fridge', 900, { group: 'sink', params: { form: 1 } });
  back.place('wc1', 'wallRun', 950, { group: 'cook', params: { modules: [{ w: 500, kind: 'door' }, { w: 500, kind: 'door' }] } });
  back.place('wc2', 'wallRun', 2900, { group: 'cook', params: { modules: [{ w: 450, kind: 'door', hinge: 'r' }, { w: 450, kind: 'door', hinge: 'r' }] } });
  back.place('towel', 'teaTowel', 3250, { group: 'cook', y: 1400 });
  left.place('jars', 'wallRun', 3300, { group: 'sink', params: { modules: [{ w: 600, kind: 'open' }], form: 1 } });
  a.put('crate', 'crate', [3800, 420], 0, { group: 'cook' });
  // breakfast table in the open floor: round, rug, cloth, a plant, two chairs
  a.put('bt-rug', 'rug', [5600, 2700], 0, { group: 'floor', params: { w: 2340, d: 2340 } });
  a.put('bt-scuff', 'scuff', [4500, 3300], 0, { group: 'floor', mount: 'lines' });
  const T = a.table('bt', { at: [5600, 2700], r: 520, chairs: 2, rug: false, group: 'breakfast' });
  a.put('cloth', 'tablecloth', [5600, 2700], 0, { y: 757, mount: 'on', group: 'breakfast', params: { w: 1040, d: 1040 } });
  T.on('plant', { y: 757 });
  // by the arch: tall plant and the height chart on the jamb
  a.put('fp', 'floorPlant', [5500, 420], 0, { group: 'arch', params: { form: 1 } });
  back.put('hc', 'heightChart', 5230, 6, { group: 'arch' });
  a.view({ target: [2700, 700, 1500], az: 20, el: 16 });
  a.shot('cook', [5900,1100,4800], [2903,1100,-182], 40, 'cook');
  a.shot('table', [800,1700,4800], [5453,1100,1753], 34, 'breakfast');
  a.shot('sink', [5600,1000,6000], [740,900,1385], 34, 'sink');
  a.shot('arch', [4400,1100,3600], [5975,300,493], 30, 'arch');
}

// ================= DINING: wide-angle backing (120), long table under a pendant, door on the right wall, window on the back wall
{
  const a = H.area('dining', 'Dining', { rect: [0, 0, 5600, 4200] });
  const back = a.back(5600, [{ kind: 'window', x: 1700, width: 1300, height: 1200, sill: 950 }]);
  const right = a.right(3800, [{ kind: 'door', x: 2300, width: 900, height: 2100, hinge: 'r' }], 120);
  a.put('rug', 'rug', [3500, 2700], 0, { group: 'floor', params: { w: 3300, d: 2200 } });
  const T = a.table('dt', { at: [3500, 2700], w: 1800, d: 900, chairs: 4, rug: false, group: 'table set' });
  T.over('pendantLamp', { group: 'floor' });
  T.on('breadBasket', { dx: -150 });
  T.on('mug', { dx: 650, dz: 150, y: 757 });
  back.place('bench', 'bench', 1700, { group: 'window', y: 0 });
  back.put('benchCushion', 'benchCushion', 1700, 190, { group: 'window', y: 450, mount: 'on' });
  back.place('basket', 'basket', 2750, { group: 'window', params: { form: 0 } });
  back.place('side', 'sideboard', 4300, { group: 'sideboard' });
  back.place('mirror', 'mirror', 4300, { group: 'sideboard', y: 1150, params: { shape: 'round', w: 800, h: 800 } });
  back.place('pot', 'plant', 3700, { group: 'sideboard', y: 800 });
  a.put('fp1', 'floorPlant', [1300, 3700], 0, { group: 'floor', params: { form: 2 } });
  right.place('pic', 'picture', 700, { group: 'corner', y: 1300 });
  a.put('fp2', 'floorPlant', [5400, 520], 0, { group: 'corner', params: { form: 2 } });
  a.put('scuff', 'scuff', [3500, 1500], 0, { group: 'floor', mount: 'lines' });
  const V = JSON.parse(process.env.DV || '{"az":8,"el":22,"t":[3300,600,1600]}');
  a.view({ target: V.t, az: V.az, el: V.el });
  a.shot('table', [1400,1250,6600], [3088,900,2478], 36, 'table set');
  a.shot('window', [2900,2100,4800], [1301,249,369], 34, 'window');
  a.shot('sideboard', [5600,700,5400], [3792,975,337], 34, 'sideboard');
  a.shot('tight', [1100,1100,6300], [3188,700,2492], 30, 'table set');
}

// ================= LIVING: wide-angle backing (120), sofa + armchair + rug + coffee table, window and arch on the back wall, wood stove
{
  const a = H.area('living', 'Living', { rect: [0, 0, 6400, 4200] });
  const back = a.back(6400, [{ kind: 'window', x: 1500, width: 1400, height: 1300, sill: 900 }, { kind: 'arch', x: 5300, width: 1000, height: 2100 }]);
  const right = a.right(3800, [], 120);
  a.put('rug', 'rug', [3500, 2300], 0, { group: 'extra', params: { w: 2800, d: 1900 } });
  back.place('sofa', 'sofa', 3500, { group: 'sofa', hero: true, y: 7, lift: 7, params: { seats: 3 } });
  a.put('arm', 'armchair', [1500, 2100], facing([1500, 2100], [3500, 2400]), { group: 'window', y: 7, lift: 7 });
  a.put('coffee', 'coffeeTable', [3500, 2450], 0, { group: 'coffee group', y: 7, lift: 7 });
  a.put('vase', 'vase', [3400, 2450], 0, { group: 'coffee group', y: 387, mount: 'on' });
  back.put('c1', 'cushion', 2800, 300, { group: 'sofa', y: 420, mount: 'on', params: { lean: 20 } });
  back.put('c2', 'cushion', 4200, 300, { group: 'sofa', y: 420, mount: 'on', params: { lean: 20 } });
  a.bandOn('throw', 'sofa', { w: 800, dx: 450, dz: 0, group: 'sofa' });
  back.place('mirror', 'mirror', 3500, { group: 'sofa', y: 1150, params: { shape: 'arch', w: 700, h: 1000 } });
  back.place('curtain', 'curtain', 1500, { group: 'window', params: { w: 1900 } });
  right.place('stove', 'woodStove', 1700, { group: 'stove', off: 435 });
  right.place('logs', 'logBasket', 2550, { group: 'stove', off: 280 });
  a.put('fp1', 'floorPlant', [1900, 3350], 0, { group: 'extra', params: { form: 0 } });
  a.put('fp2', 'floorPlant', [6150, 450], 0, { group: 'stove', params: { form: 0 } });
  a.put('leaf', 'leaf', [2050, 3250], 0, { group: 'extra', mount: 'lines' });
  a.put('scr', 'scratches', [2447, 600], -90, { group: 'sofa', y: 330, mount: 'lines' });
  a.view({ target: [3300, 600, 1500], az: 20, el: 16 });
  a.shot('sofa', [3200,1100,5400], [2922,900,415], 40, 'sofa');
  a.shot('stove', [1400,1700,4200], [6548,500,925], 34, 'stove');
  a.shot('window', [5900,700,6300], [2108,1100,802], 34, 'window');
  a.shot('coffee', [1700,1100,5400], [3199,300,2266], 28, 'coffee group');
}

H.write(new URL('./round-1a.json', import.meta.url).pathname, fs);
