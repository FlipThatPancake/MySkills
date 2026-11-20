#!/usr/bin/env node
// node strip.mjs <scene.html> <out-dir> [seconds=45] [frames=12] → frames of the living things in the home view (the page's motion stepped in fixed 1/30 s steps), a montage sheet.png (needs Pillow), and wind.json:
// how far each plant's top moves in the series (mm). Run from anywhere; Playwright is global.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
const [html, out0, sec = '45', fr = '12'] = process.argv.slice(2), out = resolve(out0 || '.'); mkdirSync(out, { recursive: true });
const { chromium } = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 900, height: 560 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('PAGE ERROR', String(e)));
await page.goto('file://' + resolve(html) + '?nobake'); await page.waitForFunction(() => window.cozyScene);
const view = await page.evaluate(() => { const v = window.cozyScene.motion.things.find((t) => t.ctx?.via).ctx.via; return { c: v.centre, n: v.n, y: v.sill + v.height / 2 }; });   // the camera looks at the window from inside, fixed
await page.evaluate((v) => { const { motion, kit } = window.cozyScene, cam = new kit.THREE.Vector3(v.c[0] + v.n[0] * 2600, 1450, v.c[1] + v.n[1] * 2600); motion.cameraOf = () => [cam]; }, view);   // the strip's camera is a camera the fliers keep away from, like a real one
const aim = () => page.evaluate((v) => { const c = window.cozyScene; c.camera.fov = 36; c.at([v.c[0] + v.n[0] * 2600, 1450, v.c[1] + v.n[1] * 2600], [v.c[0] + v.n[0] * 900, v.y - 100, v.c[1] + v.n[1] * 900]); c.camera.updateProjectionMatrix(); }, view);
const N = Number(fr), per = Number(sec) / N, wind = {};
for (let i = 0; i < N; i++) {
  const r = await page.evaluate(async ([per, shown]) => {   // step the whole motion by `per` s in 1/30 s steps without the page's own clock
    const { motion, area } = window.cozyScene, tops = {};
    let t = 0; for (; t < per || (shown && !motion.things.some((x) => x.shown)); t += 1 / 30) { for (const th of motion.things) if (th.update) th.update(1 / 30); if (t > 80) break; }   // `shown`: wait (up to 80 s) until something is on show
    for (const th of motion.things) if (th.plants) for (const p of th.plants) { const b = new (window.cozyScene.kit.THREE.Box3)().setFromObject(p.g); tops[p.id] = [Math.round(b.max.x), Math.round(b.max.z)]; }
    return { tops, states: motion.things.map((t) => t.kind + ':' + (t.state || '')) };
  }, [per, process.env.SHOWN === '1']);
  for (const [id, v] of Object.entries(r.tops)) (wind[id] ||= []).push(v);
  await page.mouse.move(5 + i, 5); await aim(); await page.waitForTimeout(300);
  await page.screenshot({ path: join(out, `f${String(i).padStart(2, '0')}.png`) });
  console.log((i * per + per).toFixed(0) + ' s', r.states.join(' '));
}
const amp = Object.fromEntries(Object.entries(wind).map(([id, v]) => [id, { dxMax: Math.max(...v.map((p) => p[0])) - Math.min(...v.map((p) => p[0])), dzMax: Math.max(...v.map((p) => p[1])) - Math.min(...v.map((p) => p[1])) }]));
writeFileSync(join(out, 'wind.json'), JSON.stringify(amp, null, 1));
await browser.close();
try { execSync(`python3 -c "
from PIL import Image; import glob,sys
fs=sorted(glob.glob('${out}/f*.png')); ims=[Image.open(f) for f in fs]; w,h=ims[0].size; s=0.5; tw,th=int(w*s),int(h*s); cols=4; rows=(len(ims)+cols-1)//cols
sheet=Image.new('RGB',(cols*tw,rows*th),'white')
for i,im in enumerate(ims): sheet.paste(im.resize((tw,th)),((i%cols)*tw,(i//cols)*th))
sheet.save('${out}/sheet.png')"`); } catch (e) { console.log('no montage (Pillow missing?)'); }
