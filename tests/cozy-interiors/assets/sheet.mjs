// node assets/sheet.mjs <assets.json> <outdir> → close-up PNGs per object (front and a low angle; paintings from two cameras a few degrees apart, to show they do not flicker). Needs Playwright and esbuild (global).
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url)), scene = resolve(process.argv[2]), out = resolve(process.argv[3]), only = (process.env.ONLY || '').split(',').filter(Boolean);
mkdirSync(out, { recursive: true });
execSync(`node ${join(here, '../../../skills/cozy-interiors/scene/build.mjs')} ${scene}`, { stdio: 'ignore' });
const { chromium } = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 700, height: 700 } });
page.on('pageerror', (e) => console.log('PAGE ERROR', String(e)));
await page.goto('file://' + scene.replace(/\.json$/, '.html'));
await page.waitForFunction(() => window.cozyScene && window.cozyBaked, null, { timeout: 280000 });
await page.evaluate(() => window.cozyScene.setArea('sheet', true));
const S = JSON.parse(readFileSync(scene, 'utf8')), cells = [];
for (const o of S.home.objects) {
  const key = o.id.replace(/^sheet-/, ''); if (!/^(pic|shoe|lamp|photo|hpend|pf|wseat)/.test(key) || (only.length && !only.some((q) => key.startsWith(q)))) continue;
  const [x, y0, z] = o.at, wall = o.mount === 'wall';
  const t = wall ? [x, y0 + 400, z] : o.asset === 'taskLamp' ? [x, y0 + 220, z] : o.asset === 'photoFrame' ? [x, y0 + 130, z] : o.asset === 'shoes' ? [x, 60, z] : o.asset === 'windowSeat' ? [x, 300, z] : [x, o.mount === 'ceiling' ? 1750 : 200, z];
  const d = o.mount === 'ceiling' ? 1300 : wall ? 1900 : o.asset === 'photoFrame' ? 750 : o.asset === 'taskLamp' ? 1300 : o.asset === 'shoes' ? 1000 : o.asset === 'windowSeat' ? 3000 : 1800;
  const views = wall ? [['a', 0, 8], ['b', 6, 8]] : o.asset === 'photoFrame' ? [['front', 8, 6], ['low', 70, 3]] : o.asset === 'taskLamp' ? [['side', 90, 6], ['front', 18, 10]] : o.mount === 'ceiling' ? [['up', 8, -22], ['under', 8, -50]] : [['front', 10, 14], ['low', 60, 8]];
  for (const [name, az, el] of views) {
    await page.evaluate(([d, az, el, t]) => { const C = window.cozyScene.controls; C.minDistance = 10; C.minAzimuthAngle = -Infinity; C.maxAzimuthAngle = Infinity; C.minPolarAngle = 0; C.maxPolarAngle = Math.PI; window.cozyScene.look(d, az, el, t); const c = window.cozyScene.camera; c.fov = 28; c.updateProjectionMatrix(); }, [d, az, el, t]);
    await page.waitForTimeout(1200);
    const f = join(out, key + '-' + name + '.png'); await page.screenshot({ path: f, timeout: 120000 }); cells.push({ id: key, asset: o.asset, view: name, file: f });
  }
}
writeFileSync(join(out, 'cells.json'), JSON.stringify(cells, null, 1)); await browser.close(); console.log(cells.length, 'cells');
