#!/usr/bin/env node
// node watch.mjs <scene.json> [--area=a,b] [--seconds=24] [--frames=8] [--out=dir] → looks at the living things (src/motion: cat, paw, butterfly, bird, bee, wind) in motion: per area one strip PNG (watch-<area>.png): the home view at evenly spaced moments (top row), and a close-up of each mover that is in the air or on the floor then (second row; grey when none shows).
// The page's live loop is stopped and time advanced by hand (0.05 s steps), so the strip is the same every run and takes about 1 s a frame in software GL. Prints what each strip shows and where it is.
import { createRequire } from 'node:module';
import { globalPkg, buildPage } from './needs.mjs';
import { execSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
const here = dirname(fileURLToPath(import.meta.url)), arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').slice(k.length + 3) || d;
const scene = process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!scene) { console.log('usage: node watch.mjs <scene.json> [--area=a,b] [--seconds=24] [--frames=8] [--out=dir]'); process.exit(1); }
const sceneAbs = resolve(scene), SEC = Number(arg('seconds', 24)), N = Number(arg('frames', 8)), outDir = resolve(arg('out', dirname(sceneAbs))), only = arg('area', '').split(',').filter(Boolean);
buildPage(here, sceneAbs);
const { chromium } = globalPkg('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 750 } });
page.on('pageerror', (e) => console.log('PAGE ERROR', String(e)));
await page.goto('file://' + sceneAbs.replace(/\.json$/, '.html'));   // no ?check: things move
await page.waitForFunction(() => window.cozyScene && window.cozyBaked, null, { timeout: 280000 });
const areas = await page.evaluate((only) => window.cozyScene.areaIds.filter((a) => (!only.length || only.includes(a)) && window.cozyScene.motion.things.some((t) => t.area === a)), only);
fs.mkdirSync(outDir, { recursive: true });
await page.evaluate(() => window.cozyScene.loop(false));
for (const A of areas) {
  const r = await page.evaluate(([A, SEC, N]) => {
    const c = window.cozyScene, T = c.kit.THREE, things = c.motion.things.filter((t) => t.area === A), TW = 300, TH = 188;
    c.setArea(A, true); c.controls.enabled = false; c.tour.update = () => false; c.advance(1.5);
    const strip = document.createElement('canvas'); strip.width = TW * N; strip.height = TH * 2; const x = strip.getContext('2d'); x.fillStyle = '#ddd'; x.fillRect(0, 0, strip.width, strip.height); x.font = '14px sans-serif';
    const notes = [];
    for (let f = 0; f < N; f++) {
      c.advance(SEC / N, true);
      const cv = c.draw(), w = cv.width, h = cv.height; x.drawImage(cv, 0, 0, w, h, f * TW, 0, TW, TH);
      x.fillStyle = '#333'; x.fillText(`${((f + 1) * SEC / N).toFixed(1)} s`, f * TW + 6, 16);
      let shown = null;
      for (const th of things) { const bs = th.bodies ? th.bodies() : []; if (!bs.length) continue; const p = new T.Vector3(...bs[0].c).project(c.camera); if (Math.abs(p.x) > 1 || Math.abs(p.y) > 1) continue; shown = { th, p, b: bs[0] }; break; }
      if (shown) { const px = (shown.p.x + 1) / 2 * w, py = (1 - shown.p.y) / 2 * h, cw = 240, ch = 150, sx = Math.max(0, Math.min(w - cw, px - cw / 2)), sy = Math.max(0, Math.min(h - ch, py - ch / 2)); x.drawImage(cv, sx, sy, cw, ch, f * TW, TH, TW, TH); x.fillStyle = '#fff'; x.fillText(shown.th.kind, f * TW + 6, TH + 16); notes.push(`${((f + 1) * SEC / N).toFixed(1)} s: ${shown.th.kind} at ${shown.b.c.map(Math.round)}`); }
      else notes.push(`${((f + 1) * SEC / N).toFixed(1)} s: no mover in frame`);
    }
    return { png: strip.toDataURL('image/png').split(',')[1], notes };
  }, [A, SEC, N]);
  const file = join(outDir, `watch-${A}.png`); fs.writeFileSync(file, Buffer.from(r.png, 'base64'));
  console.log(`${A}: ${file}`); for (const n of r.notes) console.log('  ' + n);
}
if (!areas.length) console.log('no area with living things (a.alive([...]) in the spec)');
await browser.close();
