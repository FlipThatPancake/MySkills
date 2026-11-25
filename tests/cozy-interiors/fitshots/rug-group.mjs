// Fixture (round-3 ledger L1): a sofa group on a rug over 3 m wide must find a tour camera. Run: node rug-group.mjs   (exits 1 and prints the fitshots line when no camera is found)
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
const scene = join(dirname(fileURLToPath(import.meta.url)), '../../../skills/cozy-interiors/scene');
const { Home } = await import(join(scene, 'compose.mjs'));
const H = new Home({ seed: 21, floor: 'boards' });
const v = H.area('living', 'Living room', { rect: [0, 0, 8000, 4400] });
const back = v.back(8000, [{ kind: 'window', style: 'picture', x: 2400, width: 2100, height: 1400, sill: 650 }]);
back.place('sofa', 'sofa', 4800, { group: 'sofa', hero: true, params: { seats: 3, chaise: 'none', d: 900, backH: 800, back: 'tight' } });
v.put('rug', 'rug', [4800, 1500], 0, { group: 'sofa', params: { w: 3600, d: 2800 } });   // wider than 3 m: the group (sofa plus rug) is about 3.6 m
v.put('coffee', 'coffeeTable', [4800, 1700], 0, { group: 'sofa', params: { w: 1000, d: 600 } });
v.put('side', 'sideTable', [3200, 700], 0, { group: 'sofa' });
v.put('lamp', 'floorLamp', [6700, 500], 0, { group: 'lamp' });
v.put('pouf', 'pouf', [6200, 2300], 0, { group: 'sofa' });
v.shot('sofa', [1400, 1100, 4200], [4800, 500, 900], 36, 'sofa');
v.view({ target: [4000, 700, 1700], az: -20, el: 20 });
const d = mkdtempSync(join(tmpdir(), 'cozy-rug-')), json = join(d, 'rug.json');
H.write(json, fs);
const out = execSync(`node ${join(scene, 'fitshots.mjs')} ${json} --json=${join(d, 'cams.json')}`, { encoding: 'utf8' });
const line = out.split('\n').find((l) => l.startsWith('living "sofa"')) || out;
console.log(line.slice(0, 300));
if (!/→ \[/.test(line)) { console.log('FAIL: no camera for a sofa group on a rug over 3 m'); process.exit(1); }
// check-home must accept that very camera (the two measure alike)
const S = JSON.parse(fs.readFileSync(json, 'utf8')), cam = JSON.parse(fs.readFileSync(join(d, 'cams.json'), 'utf8')).living.sofa, sh = S.areas[0].camera.shots[0];
[sh.from, sh.look, sh.fov] = cam; fs.writeFileSync(json, JSON.stringify(S));
let rep = ''; try { rep = execSync(`node ${join(scene, 'check-home.mjs')} ${json} --quick --all`, { encoding: 'utf8' }); } catch (e) { rep = String(e.stdout || ''); }
const mine = rep.split('\n').filter((l) => /^\[shot\] living shot "sofa"/.test(l));
if (mine.length) { console.log('FAIL: check-home rejects the camera fitshots found:\n' + mine.join('\n')); process.exit(1); }
console.log('ok: a camera was found and check-home accepts it');
