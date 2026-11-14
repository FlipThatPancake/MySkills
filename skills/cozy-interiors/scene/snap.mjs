#!/usr/bin/env node
// node snap.mjs <scene.json> <out.png> [areaId|all] [width height] → builds the page and saves a screenshot of an area's home view (all: one image per area, out-<id>.png). Needs Playwright (global) and esbuild (global).
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url)), [scene, out, which = 'all', W = 1200, H = 750] = [resolve(process.argv[2]), process.argv[3], process.argv[4], Number(process.argv[5]) || 1200, Number(process.argv[6]) || 750];
if (process.argv[2] === undefined || !out) { console.log('usage: node snap.mjs <scene.json> <out.png> [areaId|all] [w h]'); process.exit(1); }
execSync(`node ${join(here, 'build.mjs')} ${scene}`, { stdio: 'ignore' });
const { chromium } = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('pageerror', (e) => console.log('PAGE ERROR', String(e)));
await page.goto('file://' + scene.replace(/\.json$/, '.html'));
await page.waitForFunction(() => window.cozyScene);
const ids = which === 'all' ? await page.evaluate(() => window.cozyScene.areaIds) : [which];
for (const id of ids) {
  await page.evaluate((i) => { window.cozyScene.setArea(i, true); }, id);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: ids.length > 1 ? out.replace(/\.png$/, `-${id}.png`) : out });
}
await browser.close();
