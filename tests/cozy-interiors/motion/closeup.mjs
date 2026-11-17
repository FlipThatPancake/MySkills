#!/usr/bin/env node
// node closeup.mjs <scene.html> <kind> <out-dir> [frames=12] [distance mm=500] [every s=0.12] → close frames of one living thing (butterfly, bee, bird): the page's motion stepped in 1/30 s steps until it is on show, then the camera follows it from the side of its heading
// and slightly above (env STATE: the state to start from, WHERE: a test on the position p, e.g. `p.x > 6000`, to pick a perch) at `distance`. Wings, perch and take-off show up in the series. Playwright and Pillow (sheet.png) as in strip.mjs.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
const [html, kind, out0, fr = '12', dist = '500', every = '0.12'] = process.argv.slice(2), out = resolve(out0 || '.'); mkdirSync(out, { recursive: true });
const { chromium } = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 640, height: 480 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('PAGE ERROR', String(e)));
await page.goto('file://' + resolve(html) + '?check'); await page.waitForFunction(() => window.cozyScene);
await page.evaluate(() => { const c = window.cozyScene; c.motion.things.forEach((t) => { if (t.group) t.group.visible = false; }); });
const N = Number(fr);
for (let i = 0; i < N; i++) {
  const r = await page.evaluate(([kind, dist, every, first, process_where]) => {
    const c = window.cozyScene, th = c.motion.things.find((t) => t.kind === kind), where = process_where ? new Function('p', 'return ' + process_where) : null;
    let t = 0;
    for (; t < (first ? 900 : every); t += 1 / 30) { th.update(1 / 30); if (first && th.shown && th.state === first && (!where || where(th.group.position))) break; }
    c.setArea(th.area, true);
    th.group.visible = true; for (const o of c.motion.things) if (o !== th && o.group) o.group.visible = false;
    th.group.updateMatrixWorld(true);
    const p = th.group.position, yaw = th.group.rotation.y, h = [Math.sin(yaw), Math.cos(yaw)], side = [-h[1], h[0]];
    c.controls.minDistance = 10; c.camera.fov = 30; c.camera.updateProjectionMatrix();
    c.at([p.x + side[0] * dist + h[0] * dist * 0.3, p.y + dist * 0.15, p.z + side[1] * dist + h[1] * dist * 0.3], [p.x, p.y, p.z]);
    return th.state + ' ' + [p.x, p.y, p.z].map(Math.round);
  }, [kind, Number(dist), Number(every), i === 0 ? (process.env.STATE || 'fly') : null, process.env.WHERE || '']);
  await page.mouse.move(5 + i, 5); await page.waitForTimeout(Number(process.env.WAIT || 900));
  await page.screenshot({ path: join(out, `c${String(i).padStart(2, '0')}.png`) });
  console.log(i, r);
}
await browser.close();
try { execSync(`python3 -c "
from PIL import Image; import glob
fs=sorted(glob.glob('${out}/c*.png')); ims=[Image.open(f) for f in fs]; w,h=ims[0].size; s=0.5; tw,th=int(w*s),int(h*s); cols=4; rows=(len(ims)+cols-1)//cols
sheet=Image.new('RGB',(cols*tw,rows*th),'white')
for i,im in enumerate(ims): sheet.paste(im.resize((tw,th)),((i%cols)*tw,(i//cols)*th))
sheet.save('${out}/sheet.png')"`); } catch (e) { console.log('no montage (Pillow missing?)'); }
