// node plants/sheet.mjs <plants.json> <outdir> → one close-up PNG per plant (cells.json lists them) for the asset sheet. Needs Playwright and esbuild (global).
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url)), scene = resolve(process.argv[2]), out = resolve(process.argv[3]);
mkdirSync(out, { recursive: true });
execSync(`node ${join(here, '../../../skills/cozy-interiors/scene/build.mjs')} ${scene}`, { stdio: 'ignore' });
const { chromium } = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 700, height: 700 } });
page.on('pageerror', (e) => console.log('PAGE ERROR', String(e)));
await page.goto('file://' + scene.replace(/\.json$/, '.html'));
await page.waitForFunction(() => window.cozyScene && window.cozyBaked, null, { timeout: 280000 });
await page.evaluate(() => window.cozyScene.setArea('sheet', true));
const S = JSON.parse((await import('node:fs')).readFileSync(scene, 'utf8')), cells = [];
for (const o of S.home.objects) {
  if (!/^(fp|p)\d/.test(o.id.replace(/^sheet-/, ''))) continue;
  const big = o.asset === 'floorPlant', [x, , z] = o.at, key = o.id.replace(/^sheet-/, '');
  const views = big ? [['whole', 3200, [x + 300, 500, z]], ['crown', 1300, [x + 200, 720, z]]] : [['whole', 1100, [x + 110, 130, z]]];
  for (const [name, d, t] of views) {
    await page.evaluate(([d, t]) => { window.cozyScene.controls.minDistance = 10; window.cozyScene.look(d, 12, 8, t); }, [d, t]);
    await page.waitForTimeout(500);
    const f = join(out, key + '-' + name + '.png'); await page.screenshot({ path: f, timeout: 120000 }); cells.push({ id: key, asset: o.asset, form: o.params.form, view: name, file: f });
  }
}
writeFileSync(join(out, 'cells.json'), JSON.stringify(cells, null, 1)); await browser.close(); console.log(cells.length, 'cells');
