// node secs.mjs <scene.json> → how long each move between two areas lasts (the glide's seconds)
import { globalPkg, buildPage } from './needs.mjs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url)), scene = resolve(process.argv[2]); buildPage(here, scene);
const { chromium } = globalPkg('playwright'), browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }), page = await browser.newPage();
await page.goto('file://' + scene.replace(/\.json$/, '.html')); await page.waitForFunction(() => window.cozyScene && window.cozyBaked, null, { timeout: 280000 });
const r = await page.evaluate(() => { const c = window.cozyScene, o = []; for (const a of c.areaIds) for (const b of c.areaIds) if (a !== b) { c.setArea(a, true); c.startGlide(b, true); o.push([a, b, +c.glide.secs.toFixed(1)]); } return o; });
for (const [a, b, s] of r) console.log(`${a} -> ${b}: ${s} s`);
const n = r.length, over = (t) => r.filter((x) => x[2] > t).length; console.log(`moves ${n}; over 4 s: ${over(4)}; over 6 s: ${over(6)}; longest ${Math.max(...r.map((x) => x[2]))} s`);
await browser.close();
