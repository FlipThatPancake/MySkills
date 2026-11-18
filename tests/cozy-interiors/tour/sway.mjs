// Fixture (round-4 H2): the idle tour's sway never pushes a piece that is inside the home view's frame out of it. Drives the page's own tour for 12 s of sway on every area of the example (or of the scene given) and projects every object each step.
//   node sway.mjs [scene.json]
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const scene = join(dirname(fileURLToPath(import.meta.url)), '../../../skills/cozy-interiors/scene');
let json = process.argv[2] && resolve(process.argv[2]);
if (!json) { const d = mkdtempSync(join(tmpdir(), 'cozy-sway-')); json = join(d, 'example.json'); execSync(`node ${join(scene, 'example.spec.mjs')} ${json}`, { stdio: 'ignore' }); }
execSync(`node ${join(scene, 'build.mjs')} ${json}`, { stdio: 'ignore' });
const { chromium } = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 750 } });
await page.goto('file://' + json.replace(/\.json$/, '.html') + '?check'); await page.waitForFunction(() => window.cozyScene && window.cozyBaked, null, { timeout: 120000 });
const res = await page.evaluate(() => {
  const c = window.cozyScene, T = c.kit.THREE, out = [], cam = c.camera;
  c.loop(false);
  for (const id of c.areaIds) {
    c.setArea(id, true); c.controls.update(); c.home.group.updateMatrixWorld(true); cam.updateMatrixWorld(true);
    const boxes = Object.values(c.home.objects).filter((g) => { const s = g.userData.scene; return s && s.area === id && !['rug', 'scratches', 'socket', 'lightSwitch', 'scuff', 'leaf', 'heightChart'].includes(s.asset); }).map((g) => [g.userData.scene.id || g.name, new T.Box3().setFromObject(g)]);
    const spread = (b) => { let o = 0; const p = new T.Vector3(); for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) { p.set(x, y, z).project(cam); o = Math.max(o, Math.abs(p.x), Math.abs(p.y)); } return o; };
    const keep = boxes.filter(([, b]) => spread(b) <= 1), worst = { v: 0, at: 0, id: '' }; let swing = 0;
    const t0 = 1000; c.tour.update(t0, 13000);   // idle: the sway starts
    for (let t = 0; t <= 11; t += 0.25) { c.tour.update(t0 + t * 1000, 13000 + t * 1000); c.controls.update(); cam.updateMatrixWorld(true); for (const [n, b] of keep) { const o = spread(b); if (o > worst.v) { worst.v = o; worst.at = t; worst.id = n; } } swing = Math.max(swing, Math.abs(c.tour.state === 'sway' ? 1 : 0)); }
    out.push({ id, kept: keep.length, worst: +worst.v.toFixed(3), at: worst.at, piece: worst.id, state: c.tour.state });
  }
  return out;
});
await browser.close();
let bad = 0; for (const r of res) { const ok = r.worst <= 1.005 && r.state === 'sway'; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${r.id}: ${r.kept} pieces in the frame; the worst reaches ${r.worst} (1 is the frame edge) at ${r.at} s (${r.piece}); tour state ${r.state}`); }
process.exit(bad ? 1 : 0);
