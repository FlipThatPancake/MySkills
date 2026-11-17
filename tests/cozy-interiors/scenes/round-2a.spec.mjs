// Round-2 blind home: kitchen + home office + reading corner. seed 7316 (node roll.mjs 7316 kitchen home-office reading-corner)
import fs from 'node:fs';
import { Home, facing } from '/home/user/MySkills/skills/cozy-interiors/scene/compose.mjs';
const H = new Home({ seed: 7316, floor: 'plain', accent: '#b5603f' });
const rad = (d) => d * Math.PI / 180;
const loc = ([x, z], th, lx, lz) => [x + lx * Math.cos(rad(th)) + lz * Math.sin(rad(th)), z - lx * Math.sin(rad(th)) + lz * Math.cos(rad(th))];   // a point in an object's own frame (turn th) → area frame
const obj = (a, id) => H.S.home.objects.find((o) => o.id === `${a.id}-${id}`);

// ================= KITCHEN: one straight run on the back wall, breakfast table by the window; second wall at 120 on the right
{
  const a = H.area('kitchen', 'Kitchen', { rect: [0, 0, 7300, 4400] });
  const back = a.back(6000, [{ kind: 'window', x: 4700, width: 1400, height: 1200, sill: 1000, sash: 'fixed' }]);
  const right = a.right(3600, [], 120);
  back.place('fridge', 'fridge', 450, { group: 'run', params: { form: 1 } });
  const R = a.run(back, 'run', 1000, [{ w: 600, kind: 'doors' }, { w: 900, kind: 'hob' }, { w: 600, kind: 'drawers', n: 3, ajar: 0.3 }, { w: 600, kind: 'sink' }], { group: 'run', hero: true });
  R.on('hob', 'hob', { group: 'cook' }); R.on('hob', 'hood', { group: 'cook' }); R.on('hob', 'pan', { group: 'cook' });
  R.on('doors', 'toaster', { group: 'cook' });
  R.on('doors', 'plant', { group: 'cook' });
  R.on('sink', 'kettle', { group: 'cook' });
  back.place('towel', 'teaTowel', 3320, { group: 'cook', y: 1100, params: { tone: 'accent' } });
  right.place('trolley', 'trolley', 1900, { group: 'trolley', off: 600 });
  right.place('pots', 'potRail', 2900, { group: 'trolley' });
  right.place('plates', 'openShelf', 1000, { group: 'trolley' });
  const T = a.table('bt', { at: [4400, 2100], w: 1400, d: 850, chairs: 4, rug: true, cloth: 'accent', group: 'breakfast' });
  T.on('jug', { group: 'breakfast', dx: -250 }); T.on('mug', { group: 'breakfast', dx: 350 });
  a.put('veg', 'basket', [3470, 3450], 25, { group: 'breakfast' });
  a.put('scuff', 'scuff', [3000, 1700], 0, { group: 'cook' });
  a.shot('cook', [1100, 1100, 6000], [3005, 1100, 1002], 40, 'cook');
  a.shot('table', [200, 1700, 4800], [4043, 300, 1805], 34, 'breakfast');
  a.view({ target: [3300, 700, 1800], az: 20, el: 16 });
}

// ================= HOME OFFICE: desk under the window on the right wall, an arch on the back wall
{
  const a = H.area('home-office', 'Home office', { rect: [0, 0, 5200, 4000] });
  const back = a.back(5000, [{ kind: 'arch', x: 800, width: 1000, height: 2200, sill: 0 }]);
  const right = a.right(3600, [{ kind: 'window', x: 1800, width: 1400, height: 1200, sill: 1000, sash: 'fixed' }], 120);
  right.place('desk', 'desk', 1800, { group: 'desk', hero: true, params: { form: 'pedestal' } });
  const D = obj(a, 'desk'), dd = D.params.d, top = a.topOf('desk');
  right.put('chair', 'deskChair', 1800, dd + 420, { group: 'desk', y: 0, turn: 120 });
  right.put('rug', 'rug', 1800, dd + 600, { group: 'desk', params: { w: 1300, d: 900 } });
  right.put('monitor', 'monitor', 1650, dd * 0.55, { group: 'desk', y: top, mount: 'on', params: { stand: 'foot' } });
  back.place('lamp', 'taskLamp', 3450, { group: 'storage', y: 800, off: 200 });
  right.put('notebook', 'notebook', 1800 - D.params.w / 2 + 520, dd * 0.7, { group: 'desk', y: top, mount: 'on' });
  right.put('org', 'deskOrganiser', 1800 + D.params.w / 2 - 200, dd * 0.35, { group: 'desk', y: top, mount: 'on' });
  right.put('sillplant', 'plant', 1800 + D.params.w / 2 - 480, dd * 0.4, { group: 'desk', y: top, mount: 'on' });
  right.place('pin', 'pinboard', 3150, { group: 'wall', params: { w: 600 } });
  right.place('cal', 'wallCalendar', 450, { group: 'wall' });
  back.place('shelf', 'shelf', 2200, { group: 'storage', params: { w: 800 } });
  back.place('console', 'console', 3400, { group: 'storage' });
  back.place('printer', 'printer', 3000, { group: 'storage', y: 800, off: 180 });
  back.place('binders', 'binders', 3850, { group: 'storage', y: 800, off: 180, params: { tone: 'accent' } });
  back.place('mirror', 'mirror', 3400, { group: 'storage' });
  a.put('floorplant', 'floorPlant', [4600, 450], 0, { group: 'wall' });
  right.put('stool', 'stool', 1800 - D.params.w / 2 - 330, 450, { group: 'desk', params: { form: 1 } });
  right.put('book', 'openBook', 2400, dd * 0.5, { group: 'desk', y: top, mount: 'on' });
  a.put('leaf', 'leaf', [4300, 900], 20, { group: 'storage' });
  a.shot('desk', [4400, 1250, 6300], [4513, 900, 1801], 36, 'desk');
  a.shot('storage', [5900, 2100, 5100], [3669, 700, 71], 36, 'storage');
  a.view({ target: [3000, 700, 1500], az: 20, el: 16 });
}

// ================= READING CORNER: window seat under the back window, reading chair on a rug
{
  const a = H.area('reading-corner', 'Reading corner', { rect: [0, 0, 5200, 4000] });
  const back = a.back(4800, [{ kind: 'window', x: 2400, width: 1800, height: 1200, sill: 1000, sash: 'fixed' }]);
  const right = a.right(3600, [], 120);
  back.place('seat', 'windowSeat', 2400, { group: 'seat', hero: true, params: { pillows: 2, h: 400 } });
  a.put('cat', 'cat', [2000, 350], 0, { group: 'seat', y: 440, mount: 'on', params: { scale: 0.65 } });
  back.place('shelf', 'shelf', 4100, { group: 'shelf', params: { w: 800 } });
  a.put('rug', 'rug', [3250, 1980], 0, { group: 'shelf', params: { w: 2700, d: 1800 } });
  const cp = [3300, 2000], ct = facing(cp, [1700, 2700]);
  a.put('chair', 'readingChair', cp, ct, { group: 'chair', y: 7, lift: 7 });
  a.seatSoft('chair', { cushions: 0, throw: 'drape', group: 'chair' });
  a.put('cush', 'cushion', loc(cp, ct, 0, -230), ct, { group: 'chair', y: 440, mount: 'on', params: { tone: 'accent', lean: 18, w: 400, h: 320 } });
  a.put('stool', 'footstool', loc(cp, ct, -60, 950), ct + 15, { group: 'chair', y: 7, lift: 7 });
  a.put('lamp', 'readingLamp', [4350, 1500], ct, { group: 'shelf', y: 7, lift: 7, params: { form: 'tripod' } });
  a.put('side', 'sideTable', loc(cp, ct, 690, -80), 0, { group: 'chair' });
  a.put('tea', 'teaSet', loc(cp, ct, 690, -80), 0, { group: 'chair', y: a.topOf('side'), mount: 'on' });
  right.place('picture', 'picture', 1700, { group: 'shelf', y: 1250 });
  right.place('rshelf', 'readShelf', 2700, { group: 'shelf' });
  a.put('floorplant', 'floorPlant', [4600, 800], 0, { group: 'shelf' });
  a.put('wside', 'sideTable', [900, 420], 0, { group: 'seat', params: { r: 200, h: 480 } });
  a.put('sillplant', 'plant', [900, 420], 0, { group: 'seat', y: a.topOf('wside'), mount: 'on' });
  a.put('mag', 'magazineRack', [1800, 2950], 0, { group: 'chair' });
  a.shot('seat', [500, 1250, 4500], [2371, 700, 461], 36, 'seat');
  a.shot('chair', [3800, 2100, 6300], [2315, 700, 2380], 34, 'chair');
  a.view({ target: [2800, 700, 1500], az: 20, el: 16 });
}
H.write(process.argv[2] || 'home.json', fs);
