// Ten assets whose parts used to pass through each other, laid on a bare floor for a close look: node fixed-ten.spec.mjs fixed-ten.json, then node ../../../skills/cozy-interiors/scene/snap.mjs fixed-ten.json out.png sheet
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
const H = new Home({ seed: 0, floor: 'plain' });
const a = H.area('sheet', 'Sheet', { O: [0, 0], rect: [0, 0, 7000, 2400] });
a.wall('back', [0, 0], 0, 7000, []);
const rows = [
  [['logBasket', 'logBasket'], ['crock', 'utensilCrock', { r: 80, h: 180, n: 6 }], ['binLid', 'breadBin', { form: 'lid' }], ['baguette', 'breadBasket', { bread: 'baguette' }], ['rolls', 'breadBasket', { bread: 'rolls' }]],
  [['rack', 'dishRack', { form: 'plates' }], ['mixed', 'dishRack', { form: 'mixed' }], ['cab', 'glazedCabinet'], ['ledge', 'readShelf', { form: 'ledge' }], ['shoes', 'shoeRack']],
];
rows.forEach((row, r) => row.forEach(([id, asset, params], i) => a.put(`${r}-${id}`, asset, [700 + i * 1400, r ? 1500 : 600], 0, { group: 'row', params, y: asset === 'readShelf' ? 900 : 0, mount: asset === 'readShelf' ? 'wall' : undefined })));
a.view({ target: [3500, 500, 800], az: 0, el: 20, dist: 8800 });
H.write(process.argv[2] || 'fixed-ten.json', fs);
