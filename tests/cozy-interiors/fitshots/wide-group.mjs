// Fixture (round-4 H1): a group too wide for any camera is framed by its core, fitshots names what it left out, and check-home accepts the camera when the shot names the core. Run: node wide-group.mjs
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
const scene = join(dirname(fileURLToPath(import.meta.url)), '../../../skills/cozy-interiors/scene');
const { Home } = await import(join(scene, 'compose.mjs'));
const H = new Home({ seed: 21, floor: 'boards' });
const v = H.area('living', 'Living room', { rect: [0, 0, 9000, 4400] });
const back = v.back(9000, [{ kind: 'window', style: 'picture', x: 2400, width: 2100, height: 1400, sill: 650 }]);
back.place('sofa', 'sofa', 4500, { group: 'sofa', hero: true, params: { seats: 3, chaise: 'none', d: 900, backH: 800, back: 'tight' } });
v.put('coffee', 'coffeeTable', [4500, 1700], 0, { group: 'sofa', params: { w: 1000, d: 600 } });
v.put('side', 'sideTable', [2600, 700], 0, { group: 'sofa' });
v.put('chair', 'armchair', [7700, 1900], 30, { group: 'sofa' });   // the group runs over 6 m wide
v.put('lamp', 'floorLamp', [1500, 500], 0, { group: 'sofa' });
v.put('pouf', 'pouf', [6600, 2500], 0, { group: 'sofa' });
v.shot('sofa', [1400, 1100, 4200], [4500, 500, 900], 36, 'sofa');
v.view({ target: [4500, 700, 1700], az: -20, el: 20 });
const d = mkdtempSync(join(tmpdir(), 'cozy-wide-')), json = join(d, 'wide.json');
H.write(json, fs);
const out = execSync(`node ${join(scene, 'fitshots.mjs')} ${json} --json=${join(d, 'cams.json')}`, { encoding: 'utf8' });
console.log(out.split('\n').filter((l) => /^living|FRAMED/.test(l)).join('\n').slice(0, 700));
if (!/→ \[/.test(out) || !/FRAMED WITHOUT/.test(out)) { console.log('FAIL: want a camera for the core and a "FRAMED WITHOUT" line'); process.exit(1); }
const cams = JSON.parse(fs.readFileSync(join(d, 'cams.json'), 'utf8')), cam = cams.living.sofa, core = cams._core?.living?.sofa;
if (!core?.length) { console.log('FAIL: cameras.json holds no _core for the shot'); process.exit(1); }
const S = JSON.parse(fs.readFileSync(json, 'utf8')), sh = S.areas[0].camera.shots[0]; [sh.from, sh.look, sh.fov] = cam; sh.core = core; fs.writeFileSync(json, JSON.stringify(S));
let rep = ''; try { rep = execSync(`node ${join(scene, 'check-home.mjs')} ${json} --quick --all`, { encoding: 'utf8' }); } catch (e) { rep = String(e.stdout || ''); }
const mine = rep.split('\n').filter((l) => /^\[shot\] living shot "sofa"/.test(l));
if (mine.length) { console.log('FAIL: check-home rejects the core camera:\n' + mine.join('\n')); process.exit(1); }
console.log('ok: core framed, left-out pieces named, check-home accepts the shot');
