// Asset sheet of every window and passage kind: node sheet.spec.mjs out.json, then node ../../../skills/cozy-interiors/scene/shots.mjs out.json sheet.png
import fs from 'node:fs';
import { Home } from '../../../skills/cozy-interiors/scene/compose.mjs';
const H = new Home({ seed: 3, floor: 'boards' });
const w = H.area('windows', 'Windows', { rect: [0, 0, 16000, 5200] });
const wb = w.back(16000, [
  { kind: 'window', x: 1500, width: 1200, height: 1100, sill: 1000 },
  { kind: 'window', x: 4400, style: 'picture' },
  { kind: 'window', x: 8600, style: 'wall' },
  { kind: 'door', x: 12600, style: 'french' },
  { kind: 'door', x: 15000, style: 'slider', width: 1900 },
]);
const shotsW = [[1500, 'sash window (the kitchen kind)'], [4400, 'picture window'], [8600, 'window wall'], [12600, 'french glass doors'], [15000, 'sliding glass doors']];
shotsW.forEach(([x, n]) => w.shot(n, [x, 1500, 4300], [x, 1250, 0], 34));
w.view({ target: [8000, 1000, 1500], az: 0, el: 10 });
const p = H.area('passages', 'Passages', { rect: [20000, 0, 36000, 5200] });
const pb = p.back(16000, [
  { kind: 'arch', x: 1400 }, { kind: 'arch', x: 4000, style: 'cased' }, { kind: 'arch', x: 6600, style: 'pass' }, { kind: 'arch', x: 9400, style: 'widepass' },
  { kind: 'arch', x: 12700, style: 'portal' }, { kind: 'arch', x: 15000, style: 'pocket' },
]);
[[1400, 'round arch'], [4000, 'cased opening'], [6600, 'pass-through'], [9400, 'wide pass-through'], [12700, 'portal'], [15000, 'pocket door']].forEach(([x, n]) => p.shot(n, [x, 1500, 4300], [x, 1150, 0], 34));
p.view({ target: [8000, 1000, 1500], az: 0, el: 10 });
H.write(process.argv[2] || 'sheet.json', fs);
