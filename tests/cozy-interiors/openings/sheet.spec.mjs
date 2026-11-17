// Asset sheet of every window and passage kind, one shot per form at eye level, 25 degrees off square.
//   node sheet.spec.mjs out.json && node frames.mjs out.json outdir   (one png per form, 1200 x 900)
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
const H = new Home({ seed: 3, floor: 'boards' });
const eye = (a, x, y, name, side = 1, d = 3300, fov = 38) => a.shot(name, [x + side * d * Math.sin(0.436), 1600, d * Math.cos(0.436)], [x, y, 0], fov);
const w = H.area('windows', 'Windows', { rect: [0, 0, 21000, 5200] });
const WIN = [[1500, 'sash window (kitchen kind)', { kind: 'window', width: 1200, height: 1100, sill: 1000 }, 1150], [4600, 'picture window', { kind: 'window', style: 'picture' }, 1350], [7500, 'tall pair', { kind: 'window', style: 'pair' }, 1350],
  [10600, 'window wall', { kind: 'window', style: 'wall' }, 1250], [14300, 'bay window', { kind: 'window', style: 'bay' }, 1200], [17500, 'french glass doors', { kind: 'door', style: 'french' }, 1100], [20000, 'sliding glass doors', { kind: 'door', style: 'slider', width: 1900 }, 1100]];
w.back(21000, WIN.map(([x, , o]) => ({ ...o, x })));
WIN.forEach(([x, n, , y], i) => eye(w, x, y, n, i % 2 ? -1 : 1, n === 'window wall' ? 6500 : n === 'bay window' ? 4300 : 3300));
w.view({ target: [10000, 1000, 1500], az: 0, el: 10 });
const p = H.area('passages', 'Passages', { rect: [30000, 0, 46000, 5200] });
const PAS = [[1400, 'round arch', {}, 1100], [4000, 'cased opening', { style: 'cased' }, 1100], [6700, 'pass-through', { style: 'pass' }, 1450], [9600, 'wide pass-through', { style: 'widepass' }, 1450], [12800, 'portal', { style: 'portal' }, 1100], [15000, 'pocket door', { style: 'pocket' }, 1100]];
p.back(16000, PAS.map(([x, , o]) => ({ kind: 'arch', x, ...o })));
PAS.forEach(([x, n, , y], i) => eye(p, x, y, n, i % 2 ? -1 : 1, 2600, 42));
p.view({ target: [8000, 1000, 1500], az: 0, el: 10 });
H.write(process.argv[2] || 'sheet.json', fs);
