// A sofa with a throw and an armchair with a jacket-sized cloth, to see the cloth drop. node drape.spec.mjs; snap.mjs drape.json out.png sheet 1400 800
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
const H = new Home({ seed: 5, floor: 'boards' }), a = H.area('sheet', 'Sheet', { O: [0, 0], rect: [0, 0, 5200, 3000] });
a.wall('back', [0, 0], 0, 5200, []);
a.put('sofa', 'sofa', [1500, 1000], 0, { group: 'seat', params: { seatN: 3 } });
a.put('chair', 'armchair', [3800, 1000], 0, { group: 'seat' });
a.put('bed', 'sideTable', [4700, 1000], 0, { group: 'seat' });
a.drapeOver('throw', 'sofa', { group: 'seat', w: 1300, d: 900, at: [1200, 800], spin: 15 });
a.drapeOver('jacket', 'chair', { group: 'seat', w: 700, d: 900, at: [3800, 900], spin: -20, tone: 'mid' });
a.top = 2000; a.view({ target: [2400, 500, 1000], az: 15, el: 20, dist: 6800, fit: 'none' });
H.write(new URL('./drape.json', import.meta.url).pathname, fs);
