// Living cat test home: a living area (sofa, armchair, rug), a bedroom (bed) and a reading corner, each with a rolled cat. node motion-cat.spec.mjs → motion-cat.json
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
const H = new Home({ seed: Number(process.env.SEED) || 7, floor: 'boards' });
{
  const a = H.area('living', 'Living', { rect: [0, 0, 6000, 4400] });
  const back = a.back(6000, [{ kind: 'window', x: 4600, width: 1300, height: 1300, sill: 900 }]);
  back.place('sofa', 'sofa', 2400, { group: 'sofa', hero: true, y: 7, lift: 7 });
  a.put('rug', 'rug', [2600, 2300], 0, { group: 'sofa', params: { w: 3000, d: 2000 } });
  a.put('arm', 'armchair', [4900, 2600], -35, { group: 'nook', y: 7, lift: 7 });
  a.put('side', 'sideTable', [5600, 3300], 0, { group: 'nook' });
  back.place('curtain', 'curtain', 4600, { group: 'nook' });
  a.alive([{ kind: 'cat' }, { kind: 'paw' }]);
  a.view({ target: [3000, 600, 1800], az: 15, el: 14 });
}
{
  const a = H.area('bedroom', 'Bedroom', { rect: [0, 0, 5900, 4600] });
  const back = a.back(5900, [{ kind: 'window', x: 2800, width: 1400, height: 1100, sill: 1000 }]);
  back.place('bed', 'bed', 2800, { group: 'bed', hero: true, params: { head: 550, duvet: 'unmade', frame: 'box' } });
  back.place('bedside-l', 'bedsideTable', 1550, { group: 'bed' }); back.place('bedside-r', 'bedsideTable', 4050, { group: 'bed' });
  a.put('rug', 'rug', [2800, 2300], 0, { group: 'foot', params: { w: 3200, d: 2000 } });
  a.alive([{ kind: 'cat' }]);
  a.view({ target: [2800, 1000, 1800], az: 12, el: 10 });
}
H.write(new URL('./motion-cat.json', import.meta.url).pathname, fs);
