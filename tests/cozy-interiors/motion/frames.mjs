#!/usr/bin/env node
// node frames.mjs <scene.html> <out-dir> <label> [area,area] → for each area with living things, in the area's home view at 1200 x 750 (the page paused, `?check`, things stepped by hand in 1/30 s):
//   <label>-<area>-fliers.png: a frame with a flier on show (the first, and 5 s later), <label>-<area>-wind.png: the moment its plants lean most; stats.json: pixel sizes and lean in mm.
// Used for before/after pairs of motion fixes. Playwright is global.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
const [html, out0, label = 'x', only] = process.argv.slice(2), out = resolve(out0); mkdirSync(out, { recursive: true });
const { chromium } = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const open = async (area) => {
  const page = await browser.newPage({ viewport: { width: 1200, height: 750 } });
  page.on('pageerror', (e) => console.log('PAGE ERROR', String(e).slice(0, 200)));
  await page.goto('file://' + resolve(html) + '?check'); await page.waitForFunction(() => window.cozyScene, null, { timeout: 280000 });
  await page.evaluate((a) => { window.cozyScene.setArea(a, true); window.cozyScene.controls.update(); }, area);
  return page;
};
const stepper = () => {   // runs inside the page: step this area's things by dt, report what is on show
  window.__lean = () => { let m = 0; for (const th of window.cozyScene.motion.things) if (th.kind === 'wind' && th.plants) for (const p of th.plants) for (const q of p.parts || []) for (let i = q.off; i + 2 < q.orig.length; i += q.stride) { const d = Math.abs(q.arr[i] - q.orig[i]) + Math.abs(q.arr[i + 2] - q.orig[i + 2]); if (d > m) m = d; } return m; };
  window.__step = (area, dt) => { const { motion } = window.cozyScene; for (const th of motion.things) if (th.area === area && th.update) { th.update(dt); if (th.group) th.group.visible = th.shown !== false; } };
};
const meta = await (async () => { const p = await browser.newPage(); await p.goto('file://' + resolve(html) + '?check'); await p.waitForFunction(() => window.cozyScene, null, { timeout: 280000 }); const r = await p.evaluate(() => window.cozyScene.motion.things.map((t) => [t.area, t.kind, t.error || null])); await p.close(); return r; })();
const areas = [...new Set(meta.map((m) => m[0]))].filter((a) => !only || only.split(',').includes(a)), stats = { errors: meta.filter((m) => m[2]) };
for (const area of areas) {
  const kinds = meta.filter((m) => m[0] === area).map((m) => m[1]); stats[area] = { kinds };
  // pass 1: when does the wind peak, when does a flier first show
  let page = await open(area); await page.evaluate(stepper);
  const scan = await page.evaluate((area) => { let peak = 0, tPeak = 0, first = null; window.__lean(); for (let t = 0; t < 50; t += 1 / 30) { window.__step(area, 1 / 30); const l = window.__lean(); if (l > peak) { peak = l; tPeak = t; } if (first === null && window.cozyScene.motion.things.some((x) => x.area === area && x.R && x.shown)) first = t; } return { peak, tPeak, first }; }, area);
  await page.close(); stats[area].scan = scan;
  // pass 2: capture
  page = await open(area); await page.evaluate(stepper);
  const shot = async (name, t0, t1) => {
    await page.evaluate(([area, a, b]) => { for (let t = a; t < b; t += 1 / 30) window.__step(area, 1 / 30); }, [area, t0, t1]);
    await page.waitForTimeout(250); await page.screenshot({ path: join(out, `${label}-${area}-${name}.png`) });
    return page.evaluate((area) => { const { motion, camera, kit } = window.cozyScene, v = new kit.THREE.Vector3(), r = {}; for (const th of motion.things) if (th.area === area && th.R && th.shown && th.pos) { const d = th.pos.distanceTo(camera.position), f = 750 / (2 * Math.tan(camera.fov * Math.PI / 360)); r[th.kind] = { px: Math.round(2 * th.R * f / d), at: th.pos.toArray().map(Math.round) }; } return r; }, area);
  };
  let t = 0;
  const jobs = [];
  if (scan.first !== null) jobs.push(['fliers', scan.first + 1.5], ['fliers2', scan.first + 6.5]);
  if (scan.peak > 3) jobs.push(['wind', scan.tPeak]);
  jobs.sort((a, b) => a[1] - b[1]);
  for (const [name, at] of jobs) { stats[area][name] = await shot(name, t, at); t = at; }
  await page.close();
}
writeFileSync(join(out, `${label}-stats.json`), JSON.stringify(stats, null, 1));
await browser.close();
