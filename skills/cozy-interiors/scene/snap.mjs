#!/usr/bin/env node
// node snap.mjs <scene.json> <out.png> [areaId|all|glide:<from>:<to>|orbit:<area>:<az>:<el>] [width height] → (glide:a:b: four frames of the move from a to b at k = 0, 0.33, 0.66, 1, out-k0.png ...) builds the page and saves a screenshot of an area's home view (all: one image per area, out-<id>.png). Needs Playwright (global) and esbuild (global).
import { createRequire } from 'node:module';
import { globalPkg, buildPage } from './needs.mjs';
import { execSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url)), [scene, out, which = 'all', W = 1200, H = 750] = [resolve(process.argv[2]), process.argv[3], process.argv[4], Number(process.argv[5]) || 1200, Number(process.argv[6]) || 750];
if (process.argv[2] === undefined || !out) { console.log('usage: node snap.mjs <scene.json> <out.png> [areaId|all] [w h]'); process.exit(1); }
buildPage(here, scene);
const { chromium } = globalPkg('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('pageerror', (e) => console.log('PAGE ERROR', String(e)));
await page.goto('file://' + scene.replace(/\.json$/, '.html'));
await page.waitForFunction(() => window.cozyScene && window.cozyBaked, null, { timeout: 280000 });
if (which.startsWith('orbit:')) { const [, a, az, el] = which.split(':'); await page.evaluate(([a, az, el]) => { const c = window.cozyScene; c.setArea(a, true); const t = c.controls.target.clone(), o = c.camera.position.clone().sub(t), d = o.length(); c.look(d, Math.atan2(o.x, o.z) * 180 / Math.PI + Number(az), Number(el), t.toArray()); }, [a, az, el]); await page.waitForTimeout(2500); await page.screenshot({ path: out }); await browser.close(); process.exit(0); }
if (which.startsWith('glide:')) { const [, a, b] = which.split(':'); await page.evaluate(([a, b]) => { const c = window.cozyScene; c.setArea(a, true); c.startGlide(b, true); }, [a, b]); console.log('glide seconds', await page.evaluate(() => window.cozyScene.glide?.secs)); for (const k of (process.env.SNAP_K ? process.env.SNAP_K.split(',').map(Number) : [0, 0.33, 0.66, 1])) { await page.evaluate((k) => { const c = window.cozyScene; c.glideAt(k); c.home.update(c.camera, c.controls.target); }, k); await page.waitForTimeout(2000); await page.screenshot({ path: out.replace(/\.png$/, `-k${k}.png`) }); } await browser.close(); process.exit(0); }
const ids = which === 'all' ? await page.evaluate(() => window.cozyScene.areaIds) : [which];
for (const id of ids) {
  await page.evaluate((i) => { window.cozyScene.setArea(i, true); }, id);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: ids.length > 1 ? out.replace(/\.png$/, `-${id}.png`) : out });
}
await browser.close();
