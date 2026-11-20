#!/usr/bin/env node
// node frames.mjs <scene.json> <outdir> → one 1200 x 900 png per tour shot of every area, named after the shot.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = join(dirname(fileURLToPath(import.meta.url)), '../../../skills/cozy-interiors/scene'), scene = resolve(process.argv[2]), out = resolve(process.argv[3]);
mkdirSync(out, { recursive: true });
execSync(`node ${join(here, 'build.mjs')} ${scene}`, { stdio: 'ignore' });
const { chromium } = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
await page.goto('file://' + scene.replace(/\.json$/, '.html')); await page.waitForFunction(() => window.cozyScene && window.cozyBaked, null, { timeout: 280000 });
const list = await page.evaluate(() => window.cozyScene.areaIds.map((id) => [id, (window.cozyScene.areas[id].camera.shots || []).map((s) => s.name)]));
for (const [id, names] of list) for (let i = 0; i < names.length; i++) {
  await page.evaluate(([id, i]) => { const c = window.cozyScene, s = c.areas[id].camera.shots[i]; c.setArea(id, true); c.controls.minDistance = 10; c.at(s.from, s.look); c.camera.fov = s.fov || 30; c.camera.updateProjectionMatrix(); }, [id, i]);
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(out, names[i].replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.png') });
}
await browser.close();
