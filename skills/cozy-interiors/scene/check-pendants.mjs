#!/usr/bin/env node
// Pendant cord check: a pendant's cord must show in its area's home view, so the lamp reads as hung from the ceiling and not floating (round-5 E3/E5: the cord was too faint to tie the lamp to anything).
// The pendant is drawn alone at the home view's size; along the projected line of its cord (from 250 mm above the shade's top to 2500 mm, the height the cord melts out), the frame with the pendant is compared with the frame without it across a 9 px band, and the mean change (ink: the cord's width in pixels times its contrast) must be 0.5 or more. Round 5's hairline cords measured 0.2, a 20 mm cord 0.8. A cord shorter than 24 px (1200 px wide frame) on screen is left out.
//   hook: `await pendantIssues(page)` -> issues [{ rule: 'cord', what }] with .coverage; node check-pendants.mjs <scene.json> prints each pendant.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const MIN = 0.5, SHORT = 24, TOP = 2500;

export async function pendantIssues(page, opt = {}) {   // opt.at: [[x, y, z], [x, y, z]] a camera to judge from instead of the home view (tests)
  await page.evaluate(() => window.cozyScene.loop(false));
  const ids = await page.evaluate(() => window.cozyScene.areaIds), issues = [], rows = []; let looked = 0, short = 0, total = 0;
  for (const A of ids) {
    const res = await page.evaluate(([A, MIN, SHORT, TOP, at]) => {
      const c = window.cozyScene, T = c.kit.THREE, out = []; c.setArea(A, true); c.controls.enabled = false; c.tour.update = () => false; if (at) c.at(at[0], at[1]); c.advance(1.5);
      const all = Object.keys(c.objects), pend = all.filter((k) => c.objects[k].userData.scene && c.objects[k].userData.scene.area === A && ['pendantLamp', 'pendantForm'].includes(c.objects[k].userData.scene.asset));
      if (!pend.length) return out;
      const W = 1200, H = 750, cv2 = document.createElement('canvas'); cv2.width = W; cv2.height = H; const x = cv2.getContext('2d', { willReadFrequently: true });
      const set = (f) => { for (const k of all) c.objects[k].visible = f(k); };
      c.home.group.updateMatrixWorld(true);
      for (const k of pend) {
        const bx = new T.Box3().setFromObject(c.objects[k]), cx = (bx.min.x + bx.max.x) / 2, cz = (bx.min.z + bx.max.z) / 2, y0 = bx.min.y + Math.min(250, (bx.max.y - bx.min.y) * 0.3), y1 = Math.min(bx.max.y, TOP);
        const P = (y) => { const v = new T.Vector3(cx, y, cz).project(c.camera); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };
        const a = P(y0), b = P(y1), len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (len < SHORT) { out.push({ id: k, short: true, len: Math.round(len) }); continue; }
        const grab = () => { const cv = c.draw(); x.clearRect(0, 0, W, H); x.drawImage(cv, 0, 0, W, H); return x.getImageData(0, 0, W, H).data.slice(); };
        set(() => true); const d1 = grab(); c.objects[k].visible = false; const d2 = grab(); c.objects[k].visible = true;   // the frame with the pendant against the frame without it: what the cord adds to what a viewer sees (a cord over a window pane or a picture counts only if it shows there)
        let hit = 0, seen = 0, pks = [], n = Math.round(len);   // only the part of the line inside the frame counts
        for (let s = 0; s <= n; s++) { const px = a[0] + (b[0] - a[0]) * s / n, py = a[1] + (b[1] - a[1]) * s / n; if (px < 0 || py < 0 || px >= W || py >= H) continue; seen++; let on = false, pk = 0;
          const X0 = Math.round(px), Y = Math.round(py); if (Y < 0 || Y >= H) { seen--; continue; }
          for (let dx = -4; dx <= 4; dx++) { const X = X0 + dx; if (X < 0 || X >= W) continue; const i = (Y * W + X) * 4; pk += (Math.abs(d1[i] - d2[i]) + Math.abs(d1[i + 1] - d2[i + 1]) + Math.abs(d1[i + 2] - d2[i + 2])) / 765; }   // ink: how much the cord changes the picture across a 9 px band, in pixels of full contrast (a 1 px hairline of full contrast is 1)
          pks.push(pk); }
        if (seen < SHORT) { out.push({ id: k, short: true, len: seen }); continue; }
        out.push({ id: k, len: seen, pks });
      }
      return out;
    }, [A, MIN, SHORT, TOP, opt.at || null]);
    for (const r of res) { if (r.pks) r.ink = r.pks.reduce((a, v) => a + v, 0) / r.pks.length; total++; rows.push(r); if (r.short) { short++; continue; } looked++;
      if (r.ink < (opt.min ?? MIN)) issues.push({ rule: 'cord', what: `${r.id}: its cord is ${r.ink.toFixed(2)} px of ink wide in the ${A} home view over ${r.len} px of line (${MIN} at least; a 1 px hairline of full contrast is 1, a thin pale one about 0.2): the lamp reads as floating; draw the cord thicker or darker, or hang it where the cord is seen` }); }
  }
  await page.evaluate(() => window.cozyScene.loop(true));
  issues.rows = rows; issues.coverage = `cord: ${total} pendant(s): ${looked} judged, ${short} skipped (cord under ${SHORT} px on screen)`;
  return issues;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const here = dirname(fileURLToPath(import.meta.url)), scene = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!scene) { console.log('usage: node check-pendants.mjs <scene.json>'); process.exit(1); }
  const sceneAbs = resolve(scene); execSync(`node ${join(here, 'build.mjs')} ${sceneAbs}`, { stdio: 'ignore' });
  const { chromium } = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright');
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 750 } });
  await page.goto('file://' + sceneAbs.replace(/\.json$/, '.html'));
  await page.waitForFunction(() => window.cozyScene && window.cozyBaked, null, { timeout: 280000 });
  const issues = await pendantIssues(page);
  for (const r of issues.rows) console.log(r.id, r.short ? `short (${r.len} px)` : `${r.len} px, cord ink ${r.ink.toFixed(2)}`);
  for (const i of issues) console.log(`[${i.rule}] ${i.what}`);
  console.log(issues.coverage); console.log(issues.length ? `${issues.length} problem(s).` : 'No problems.');
  await browser.close(); process.exit(issues.length ? 1 : 0);
}
