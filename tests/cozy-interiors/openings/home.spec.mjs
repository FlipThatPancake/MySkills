// A furnished home using the new window and passage kinds: the seed-43 home with its openings changed (tall pair, bay window, glass doors, a cased opening). node home.spec.mjs [out.json]
//  home-office: one wall, hero trestle desk with a pinboard above, window first, accents binders, book stack, floor lamp, wall clock, 3 plants, signs book face down + drawer ajar (a side table), pieces desk, desk chair, shelf, rug
//  kitchen: one wall, island, hero open shelves and a dresser, window first (fixed), accents stool, herbs, wall shelf with jars, cutting board, utensil crock, 1 plant, signs fallen leaf + table runner + scuffed floor
//  living: wide-angle, hero two armchairs and a side table, window first + window second, accents book stack, mirror, vase of branches, cushion, floor lamp, record player, gallery wall, 3 plants, piece curtain, signs glasses on book + shoes askew + cloth dropped
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
const H = new Home({ seed: 43, floor: 'plain' });

{ // ---------- home office
  const a = H.area('office', 'Home office', { rect: [0, 0, 6000, 4200] });
  const back = a.back(6000, [{ kind: 'window', x: 1900, style: 'pair' }]);
  back.place('desk', 'desk', 3800, { y: 7, lift: 7, group: 'desk', hero: true, params: { form: 'trestle', w: 1500, d: 700 } });
  back.place('pinboard', 'pinboard', 3800, { y: 1150, group: 'desk', shadow: false, params: { w: 1000, h: 520, notes: 7 } });
  a.put('chair', 'deskChair', [3800, 1050], 180, { y: 7, lift: 7, group: 'desk' });
  a.put('rug', 'rug', [3800, 1250], 0, { group: 'desk', params: { w: 1500, d: 1000, form: 'striped', border: 110, fringe: 'ends' } });
  a.put('reading', 'armchair', [1900, 3100], -10, { y: 7, lift: 7, group: 'nook' });
  a.put('nook-rug', 'rug', [1900, 3100], 0, { group: 'nook', params: { w: 1500, d: 1200, form: 'borderless' } });
  back.place('task-lamp', 'taskLamp', 3180, { y: a.topOf('desk'), mount: 'on', group: 'desk', off: 200 });
  back.place('organiser', 'deskOrganiser', 4250, { y: a.topOf('desk'), mount: 'on', group: 'desk', off: 200 });
  a.put('notebook', 'notebook', [3700, 420], 10, { y: a.topOf('desk'), mount: 'on', group: 'desk' });
  a.put('open-book', 'openBook', [4000, 540], 25, { y: a.topOf('desk'), mount: 'on', group: 'desk' });
  a.put('desk-books', 'bookStack', [3480, 540], 0, { y: a.topOf('desk'), mount: 'on', group: 'desk', params: { n: 3 } });
  back.place('clock', 'wallClock', 3000, { y: 1750, group: 'window', shadow: false, params: { r: 150 } });
  back.place('shelf', 'shelf', 5500, { group: 'shelf', params: { w: 800, h: 1450 } });
  back.place('binders', 'binders', 5500, { y: a.topOf('shelf'), mount: 'on', group: 'shelf', off: 160, params: { n: 5, form: 'row' } });
  back.place('shelf-plant', 'plant', 5200, { y: a.topOf('shelf'), mount: 'on', group: 'shelf', off: 190, params: { form: 0 } });
  back.place('lamp', 'floorLamp', 600, { group: 'window' });
  back.place('side', 'sideTable', 4800, { group: 'corner', params: { top: 'square', drawer: 'knob', ajar: 60, r: 220 } });
  back.place('side-plant', 'plant', 4800, { y: a.topOf('side'), mount: 'on', group: 'corner', off: 200, params: { form: 2 } });
  a.put('file-box', 'fileBox', [5500, 1900], 0, { group: 'corner' });
  a.put('pot-floor', 'pot', [1150, 700], 0, { mount: 'floor', group: 'window', params: { r: 130, tall: 1.3, profile: 'belly', plant: 'bush', seed: 5 } });
  a.view({ target: [3000, 800, 1300], az: 10, el: 10 });
  a.shot('desk', [3800, 1100, 5400], [3301, 700, 875], 38, 'desk');
  a.shot('shelf', [3200, 1900, 4500], [5066, 885, -75], 34, 'shelf');
}
{ // ---------- living
  const a = H.area('living', 'Living room', { rect: [0, 0, 5400, 4200] });
  const back = a.back(5400, [{ kind: 'door', x: 4300, style: 'french' }]);
  const right = a.right(3600, [{ kind: 'window', x: 2300, style: 'bay' }], 120);
  a.put('rug', 'rug', [2800, 2300], 0, { group: 'seating rug', params: { w: 2400, d: 2400, form: 'round' } });
  a.put('armchair-l', 'armchair', [1500, 2300], 25, { y: 7, lift: 7, group: 'seating', hero: true });
  a.put('armchair-r', 'armchair', [3400, 2650], -25, { y: 7, lift: 7, group: 'seating' });
  a.put('side-table', 'sideTable', [2600, 2150], 0, { y: 7, lift: 7, group: 'seating' });
  a.put('glasses', 'glassesBook', [2650, 2150], 20, { y: a.topOf('side-table'), mount: 'on', group: 'seating' });
  a.put('vase', 'vase', [2500, 2200], 0, { y: a.topOf('side-table'), mount: 'on', group: 'seating' });
  a.put('cushion', 'cushion', [1500, 2350], 25, { y: 470, mount: 'on', group: 'seating', params: { w: 400, h: 360, lean: 20 } });
  a.drapeOver('cloth', 'armchair-r', { group: 'seating', w: 1000, d: 1100, dz: 60, spin: -25, tone: 'mid', wave: 0 });
  a.put('shoes', 'shoes', [1300, 3500], 150, { group: 'edge', params: { pairs: 1, kind: 'sneaker' } });
  a.put('floor-plant-2', 'floorPlant', [550, 2700], 0, { group: 'edge' });
  a.put('lamp', 'floorLamp', [450, 3850], 0, { group: 'edge' });
  a.put('side-2', 'sideTable', [4750, 3700], 0, { y: 7, lift: 7, group: 'edge', params: { top: 'round', drawer: 'none', r: 330 } });
  a.onTop('side-2', [{ id: 'books', asset: 'bookStack' }, { id: 'side-plant', asset: 'plant', params: { form: 3 } }], { group: 'edge' });
  a.put('floor-plant', 'floorPlant', [2500, 500], 0, { group: 'edge' });
  back.place('record-player', 'recordPlayer', 1400, { group: 'music wall', params: { w: 760, records: 8, lid: 'half' } });
  back.place('gallery', 'galleryWall', 1400, { y: 1000, group: 'music wall', shadow: false, params: { w: 1200, h: 1000, n: 5 } });
  back.place('mirror', 'mirror', 2800, { y: 800, group: 'music wall', shadow: false, params: { w: 600, h: 1200, shape: 'pill' } });
  a.view({ target: [4000, 800, 1700], az: -15, el: 30 });
  a.shot('armchairs', [4100, 1400, 6600], [3056, 700, 2219], 40, 'seating');
}
H.write(process.argv[2] || 'home.json', fs);
