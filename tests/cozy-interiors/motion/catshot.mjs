// node catshot.mjs <html> <out.png> [objectId | cat] — a 1400x875 close-up of the static cat asset (id ends in "cat") or of the first shown sleeping cat (motion kind 'cat'); prints its bounding box (mm).
import { createRequire } from 'node:module'; import { execSync } from 'node:child_process'; import { join, resolve } from 'node:path';
const [html, out, which = 'cat'] = process.argv.slice(2);
const { chromium } = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 875 } });
page.on('pageerror', (e) => console.log('PAGE ERROR', String(e).slice(0, 200)));
await page.goto('file://' + resolve(html) + '?check'); await page.waitForFunction(() => window.cozyScene, null, { timeout: 280000 });
const info = await page.evaluate((which) => {
  const cs = window.cozyScene, T = cs.kit.THREE; let g = null, area = null;
  if (which === 'motion') { const th = cs.motion.things.find((t) => t.kind === 'cat' && t.group); area = th.area; for (let i = 0; i < 60; i++) { th.update(1 / 30); } th.group.visible = true; g = th.group; }
  else { const k = Object.keys(cs.objects).find((i) => /cat$/.test(i)); const o = cs.objects[k]; g = o.g || o; area = o.area || k.split('-')[0]; }
  cs.setArea(area, true); cs.controls.update();
  const b = new T.Box3().setFromObject(g), c = b.getCenter(new T.Vector3());
  cs.camera.position.set(c.x + 420, c.y + 520, c.z + 640); cs.controls.target.copy(c); cs.camera.lookAt(c); cs.controls.update(); cs.camera.updateMatrixWorld();
  return { min: b.min.toArray().map(Math.round), max: b.max.toArray().map(Math.round) };
}, which);
console.log(JSON.stringify(info)); await page.waitForTimeout(800); await page.screenshot({ path: out }); await browser.close();
