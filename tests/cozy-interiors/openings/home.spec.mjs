// A furnished home using the new window and passage kinds: the seed-43 home with its openings changed (tall pair, bay window, glass doors, a cased opening). node home.spec.mjs [out.json]
//  home-office: one wall, hero trestle desk with a pinboard above, window first, accents binders, book stack, floor lamp, wall clock, 3 plants, signs book face down + drawer ajar (a side table), pieces desk, desk chair, shelf, rug
//  kitchen: one wall, island, hero open shelves and a dresser, window first (fixed), accents stool, herbs, wall shelf with jars, cutting board, utensil crock, 1 plant, signs fallen leaf + table runner + scuffed floor
//  living: wide-angle, hero two armchairs and a side table, window first + window second, accents book stack, mirror, vase of branches, cushion, floor lamp, record player, gallery wall, 3 plants, piece curtain, signs glasses on book + shoes askew + cloth dropped
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
const H = new Home({ seed: 43, floor: 'plain' });

{ // ---------- home office
  const a = H.area('office', 'Home office', { rect: [0, 0, 6000, 3400] });
  const back = a.back(6000, [{ kind: 'window', x: 1700, style: 'pair' }]);
  back.place('desk', 'desk', 3800, { y: 7, lift: 7, group: 'desk', hero: true, params: { form: 'trestle', w: 1500, d: 700 } });
  back.place('pinboard', 'pinboard', 3800, { y: 1150, group: 'desk', shadow: false, params: { w: 1000, h: 520, notes: 7 } });
  a.put('chair', 'deskChair', [3800, 1050], 180, { y: 7, lift: 7, group: 'desk' });
  a.put('rug', 'rug', [3800, 1250], 0, { group: 'desk', params: { w: 1500, d: 1000 } });
  a.put('reading', 'armchair', [2700, 2500], -10, { y: 7, lift: 7, group: 'nook' });
  a.put('nook-rug', 'rug', [2700, 2500], 0, { group: 'nook', params: { w: 1400, d: 1100 } });
  back.place('task-lamp', 'taskLamp', 3180, { y: a.topOf('desk'), mount: 'on', group: 'desk', off: 200 });
  back.place('organiser', 'deskOrganiser', 4250, { y: a.topOf('desk'), mount: 'on', group: 'desk', off: 200 });
  a.put('notebook', 'notebook', [3700, 420], 10, { y: a.topOf('desk'), mount: 'on', group: 'desk' });
  a.put('open-book', 'openBook', [4000, 540], 25, { y: a.topOf('desk'), mount: 'on', group: 'desk' });
  a.put('desk-books', 'bookStack', [3480, 540], 0, { y: a.topOf('desk'), mount: 'on', group: 'desk', params: { n: 3 } });
  back.place('clock', 'wallClock', 2750, { y: 1750, group: 'window', shadow: false, params: { r: 150 } });
  back.place('shelf', 'shelf', 5500, { group: 'shelf', params: { w: 800, h: 1450 } });
  back.place('binders', 'binders', 5500, { y: a.topOf('shelf'), mount: 'on', group: 'shelf', off: 160, params: { n: 5, form: 'row' } });
  back.place('shelf-plant', 'plant', 5200, { y: a.topOf('shelf'), mount: 'on', group: 'shelf', off: 190, params: { form: 0 } });
  back.place('lamp', 'floorLamp', 400, { group: 'window' });
  back.place('side', 'sideTable', 4800, { group: 'shelf', params: { top: 'square', drawer: 'knob', ajar: 60, r: 220 } });
  back.place('side-plant', 'plant', 4800, { y: a.topOf('side'), mount: 'on', group: 'shelf', off: 200, params: { form: 2 } });
  a.put('file-box', 'fileBox', [5500, 1900], 0, { group: 'shelf' });
  a.put('pot-floor', 'pot', [900, 700], 0, { mount: 'floor', group: 'window', params: { r: 130, tall: 1.3, profile: 'belly', plant: 'bush', seed: 5 } });
  a.view({ target: [3000, 800, 1300], az: 10, el: 10 });
  a.shot('desk', [3800, 1100, 5700], [4310, 700, 1075], 38, 'desk');
  a.shot('shelf', [2000, 1700, 4800], [5734, 1100, 1475], 36, 'shelf');
}
{ // ---------- living
  const a = H.area('living', 'Living room', { rect: [0, 0, 5400, 4200] });
  const back = a.back(5400, [{ kind: 'door', x: 4300, style: 'french' }]);
  const right = a.right(3600, [{ kind: 'window', x: 2300, style: 'bay' }], 120);
  a.put('rug', 'rug', [2800, 2300], 0, { group: 'seating rug', params: { w: 3000, d: 1900, form: 'plain' } });
  a.put('armchair-l', 'armchair', [1900, 2300], 25, { y: 7, lift: 7, group: 'seating', hero: true });
  a.put('armchair-r', 'armchair', [3900, 2300], -25, { y: 7, lift: 7, group: 'seating' });
  a.put('side-table', 'sideTable', [2900, 2150], 0, { y: 7, lift: 7, group: 'seating' });
  a.put('glasses', 'glassesBook', [2950, 2150], 20, { y: a.topOf('side-table'), mount: 'on', group: 'seating' });
  a.put('vase', 'vase', [2800, 2200], 0, { y: a.topOf('side-table'), mount: 'on', group: 'seating' });
  a.put('cushion', 'cushion', [1900, 2350], 25, { y: 470, mount: 'on', group: 'seating', params: { w: 400, h: 360, lean: 20 } });
  a.drapeOver('cloth', 'armchair-r', { group: 'seating', w: 1000, d: 1100, dz: 60, spin: -25, tone: 'mid', wave: 0 });
  a.put('shoes', 'shoes', [1000, 3150], 150, { group: 'edge', params: { pairs: 1, kind: 'sneaker' } });
  a.put('floor-plant-2', 'floorPlant', [500, 2800], 0, { group: 'edge' });
  a.put('lamp', 'floorLamp', [450, 1100], 0, { group: 'edge' });
  a.put('side-2', 'sideTable', [4900, 3300], 0, { y: 7, lift: 7, group: 'edge', params: { top: 'round', drawer: 'none', r: 330 } });
  a.onTop('side-2', [{ id: 'books', asset: 'bookStack' }, { id: 'side-plant', asset: 'plant', params: { form: 3 } }], { group: 'edge' });
  a.put('floor-plant', 'floorPlant', [2500, 500], 0, { group: 'edge' });
  back.place('record-player', 'recordPlayer', 1400, { group: 'music wall', params: { w: 760, records: 8, lid: 'half' } });
  back.place('gallery', 'galleryWall', 1400, { y: 1000, group: 'music wall', shadow: false, params: { w: 1200, h: 1000, n: 5 } });
  back.place('mirror', 'mirror', 2800, { y: 800, group: 'music wall', shadow: false, params: { w: 600, h: 1200, shape: 'pill' } });
  a.view({ target: [3600, 800, 1700], az: -25, el: 12 });
  a.shot('armchairs', [6500, 1100, 5100], [3229, 700, 1901], 44, 'seating');
}
H.write(process.argv[2] || 'home.json', fs);
