#!/usr/bin/env node
// node shots.mjs <scene.json> <out.png> → a contact sheet of every tour shot of every area (one row per area), to spot shots that look into a wall or cut the hero. Needs Playwright (global), esbuild (global) and Python with Pillow.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url)), scene = resolve(process.argv[2]), out = resolve(process.argv[3]), tmp = join('/tmp', 'cozy-shots-' + process.pid);
mkdirSync(tmp, { recursive: true });
execSync(`node ${join(here, 'build.mjs')} ${scene}`, { stdio: 'ignore' });
const { chromium } = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
await page.goto('file://' + scene.replace(/\.json$/, '.html')); await page.waitForFunction(() => window.cozyScene);
const list = await page.evaluate(() => window.cozyScene.areaIds.map((id) => [id, (window.cozyScene.areas[id].camera.shots || []).map((s) => s.name)]));
const files = [];
for (const [id, names] of list) for (let i = 0; i < names.length; i++) {
  await page.evaluate(([id, i]) => { const c = window.cozyScene, s = c.areas[id].camera.shots[i]; c.setArea(id, true); c.controls.minDistance = 10; c.at(s.from, s.look); c.camera.fov = s.fov || 30; c.camera.updateProjectionMatrix(); }, [id, i]);
  await page.waitForTimeout(500);
  const f = join(tmp, `${id}-${i}.png`); await page.screenshot({ path: f }); files.push([id, names[i], f]);
}
await browser.close();
const rows = list.map(([id, names]) => names.map((n, i) => `${id}-${i}.png|${n}`).join(',')).join(';');
execSync(`python3 - <<'PY'\nfrom PIL import Image, ImageDraw\nrows=[r.split(',') for r in '${rows}'.split(';')]\nW,H=480,300\nim=Image.new('RGB',(W*max(len(r) for r in rows),H*len(rows)),'white')\nd=ImageDraw.Draw(im)\nfor y,r in enumerate(rows):\n  for x,c in enumerate(r):\n    f,n=c.split('|'); t=Image.open('${tmp}/'+f).convert('RGB').resize((W,H)); im.paste(t,(x*W,y*H)); d.text((x*W+8,y*H+6),n,fill=(90,90,90))\nim.save('${out}')\nPY`);
console.log(out);
