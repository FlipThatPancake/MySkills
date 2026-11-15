// node floorsheet.mjs <scene-dir with build.mjs> <scene.json> <areaId> <out.png> → two screenshots of one area (eye level, high) side by side, for judging the floor lines. Needs Playwright and esbuild (global).
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { join, resolve } from 'node:path';
const [dir, scene, id, out] = [resolve(process.argv[2]), resolve(process.argv[3]), process.argv[4], process.argv[5]];
execSync(`node ${join(dir, 'build.mjs')} ${scene}`, { stdio: 'ignore' });
const { chromium } = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1000, height: 640 } });
page.on('pageerror', (e) => console.log('PAGE ERROR', String(e)));
await page.goto('file://' + scene.replace(/\.json$/, '.html'));
await page.waitForFunction(() => window.cozyScene);
await page.evaluate((i) => window.cozyScene.setArea(i, true), id);
await page.waitForTimeout(800);
const home = await page.evaluate(() => { const c = window.cozyScene, t = c.controls.target, p = c.camera.position; return { d: p.distanceTo(t), az: Math.atan2(p.x - t.x, p.z - t.z) * 180 / Math.PI, t: [t.x, t.y, t.z] }; });
const base = out.replace(/\.png$/, '');
for (const [name, el] of [['eye', 7], ['high', 55]]) {
  await page.evaluate(([d, az, e, t]) => window.cozyScene.look(d, az, e, t), [home.d, home.az, el, [home.t[0], 300, home.t[2]]]);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${base}-${name}.png` });
}
await browser.close();
