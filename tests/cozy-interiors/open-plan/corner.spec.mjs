// open plan, corner layout: the dining area on the long back wall, then the chain turns 90 degrees and the kitchen runs down the wall to the right (node roll.mjs 47 kitchen dining living; living stays behind a passage and is not built here)
//   the seam (the corner): an open shelf unit seen from both sides and an island facing the dining area, 0 mm shared.
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
const H = new Home({ seed: 47, floor: 'boards', accent: '#d9a85c' });
let d, k;
{ // ---------- dining (the start of the chain: a left wall is allowed, the roll dealt none; its right wall is the stretch beside the kitchen)
  const a = d = H.area('dining', 'Dining', { rect: [0, 0, 5400, 4800] });
  const back = a.back(5400, [{ kind: 'door', x: 700, width: 900, hinge: 'r', open: 20 }, { kind: 'window', x: 3600, width: 1300, height: 1200, sill: 900 }]);
  a.put('rug', 'rug', [2900, 2800], 0, { group: 'dining rug', params: { w: 2200, d: 2200, form: 'round', fringe: 'ends', border: 40 } });
  const T = a.table('dining', { at: [2900, 2800], r: 650, chairs: 4, rug: false, group: 'table set', hero: true });
  T.over('pendantLamp', { group: 'table set', params: { rim: 1582 } }); T.on('jug', { dx: -120 }); T.on('bookStack', { dx: 220 });
  // what the roll dealt this dining area (seed 47): a glazed cabinet with a plant on the back wall between the door and the window, a bar cart on its right third
  back.place('cab', 'glazedCabinet', 2100, { group: 'cabinet' });
  a.onTop('cab', [{ id: 'cab-plant', asset: 'plant', params: { form: 2 } }], { at: 'back', group: 'cabinet' });
  a.put('cart', 'trolley', [4800, 450], 0, { group: 'cart' });
  a.put('cm1', 'mug', [4700, 440], 0, { y: a.topOf('cart'), mount: 'on', group: 'cart' }); a.put('cj', 'jug', [4880, 470], 0, { y: a.topOf('cart'), mount: 'on', group: 'cart' });
  a.put('basket', 'basket', [4250, 3300], 10, { group: 'table set' });
  a.view({ target: [2900, 800, 2300], az: 52, el: 14, dist: 7700, fit: 'fixed' });
   a.shot('cart', [2900, 2100, 4800], [4275, 700, 221], 32, 'cart'); a.shot('cabinet', [5150, 850, 3600], [2492, 900, -154], 40, 'cabinet');
}
{ // ---------- kitchen (the end: the chain turns; its back wall runs on from the dining area's right wall; a right wall is allowed)
  const a = k = H.area('kitchen', 'Kitchen', { rect: [0, 0, 5400, 4200] }); H.join(d, k, { layout: 'corner', share: 0, separators: ['openShelf', 'island'] });
  const back = a.back(5400, [{ kind: 'window', x: 1500, width: 1000, height: 1100, sill: 1000, sash: 'fixed' }]);
  const right = a.right(4200, [{ kind: 'window', x: 2300, width: 1000, height: 1100, sill: 1000 }]);
  const R = a.run(back, 'run', 1100, [{ w: 800, kind: 'sink' }, { w: 600, kind: 'drawers', n: 3 }, { w: 900, kind: 'hob' }], { group: 'cooking', hero: true });
  R.on('hob', 'hob', { group: 'stove' }); R.on('hob', 'hood', { group: 'stove' }); R.on('hob', 'pan', { group: 'stove' });
  R.on('drawers', 'kettle', { id: 'kettle', group: 'stove', dx: -170 }); R.on('drawers', 'fruitBowl', { id: 'fruit', group: 'stove', dx: 150 });
  back.place('fridge', 'fridge', 4750, { group: 'trolley', params: { form: 1 } });
  back.place('kshelf', 'openShelf', 3900, { y: 1350, group: 'stove', shadow: false, params: { w: 700 } });
  // the island, a separator: its back faces the dining area, stools on that side
  a.put('island', 'baseRun', [2100, 1700], 180, { group: 'island', sep: 'island', params: { depth: 600, finishedBack: true, modules: [{ w: 600, kind: 'doors' }, { w: 600, kind: 'drawers', n: 3 }, { w: 600, kind: 'doors' }] } });
  a.put('stool1', 'stool', [800, 2600], 0, { group: 'island', params: { form: 1 } }); a.put('stool2', 'stool', [1600, 2600], 0, { group: 'island', params: { form: 2 } });
  a.put('iplant', 'plant', [900, 2000], 0, { y: a.topOf('island'), mount: 'on', group: 'island', params: { form: 1 } });
  // the open shelf unit, the other separator: seen from both sides, standing on the seam's end
  a.put('shelfunit', 'shelf', [200, 3700], 90, { group: 'shelfwall', sep: 'openShelf', params: { w: 900, h: 1800 } });
  a.put('trolley', 'trolley', [4100, 650], 0, { group: 'trolley' });
  a.put('tm1', 'mug', [4030, 630], 0, { y: a.topOf('trolley'), mount: 'on', group: 'trolley' }); a.put('tm2', 'mug', [4190, 680], 0, { y: a.topOf('trolley'), mount: 'on', group: 'trolley' });
  a.put('runner', 'rug', [2400, 1200], 0, { group: 'cooking rug', params: { form: 'runner', w: 2200, d: 700, fringe: 'ends', border: 120 } });
  right.place('rshelf', 'wallShelf', 3500, { y: 1500, group: 'shelfwall', shadow: false, params: { w: 800 } });
  a.across('across the island', [5400, 1250, 4000], [1526, 1100, 1454], 36, 'island', 'dining');
  a.view({ target: [2500, 800, 1500], az: 8, el: 13, dist: 5600 });
  a.shot('island', [6000, 1900, 1900], [1165, 1100, 1709], 36, 'island'); a.shot('trolley', [1350, 850, 3850], [4071, 925, 125], 40, 'trolley');
}
{ // the dining area's right wall is the stretch beside the kitchen, built by H.join(d, k, { layout: 'corner' }): hang things on it after the join
  d.cornerWall.place('rshelf2', 'wallShelf', 3900, { y: 1500, group: 'rwall', shadow: false, params: { w: 900 } });
  d.cornerWall.place('rpic', 'picture', 2400, { y: 1200, group: 'rwall', shadow: false, params: { w: 800, h: 600 } });
  d.cornerWall.place('rshelf', 'wallShelf', 1550, { y: 1500, group: 'rwall', shadow: false, params: { w: 700 } });
}
H.write(new URL('./corner.json', import.meta.url).pathname, fs);
console.log('wrote corner.json');
