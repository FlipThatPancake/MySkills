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
  const big = o.asset === 'floorPlant', h = big ? 950 : 260, [x, , z] = o.at;
  await page.evaluate(([d, t]) => { window.cozyScene.controls.minDistance = 10; window.cozyScene.look(d, 12, 8, t); }, [big ? 3200 : 950, [x, big ? 520 : 130, z]]);
  await page.waitForTimeout(500);
  const f = join(out, o.id.replace(/^sheet-/, '') + '.png'); await page.screenshot({ path: f, timeout: 120000 }); cells.push({ id: o.id, asset: o.asset, form: o.params.form, file: f });
}
writeFileSync(join(out, 'cells.json'), JSON.stringify(cells, null, 1)); await browser.close(); console.log(cells.length, 'cells');
