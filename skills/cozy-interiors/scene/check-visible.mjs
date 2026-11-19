#!/usr/bin/env node
// Visibility check: every object shows in its area's home view (or in a tour shot). From the pixels, not the boxes: per object, the pixels it covers alone against the pixels that change when it is taken away.
// An object under 20% visible fails unless a tour shot shows it at 20% or more. Left out: rugs and runners (flat), objects under 40 px alone (too small to judge), a table under its own cloth.
//   hook: `await visibleIssues(page, camerasByArea)` -> issues [{ rule: 'visible', what }] with .coverage; node check-visible.mjs <scene.json> [--all] prints every object's numbers.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
const MIN = 0.2, TINY = 15, SKIP = ['rug', 'runner'];

export async function visibleIssues(page, camerasByArea = {}, opt = {}) {
  const size = page.viewportSize(); await page.setViewportSize({ width: 600, height: 375 });   // half size: a draw in software GL is a quarter of the time
  await page.evaluate(() => window.cozyScene.loop(false));
  const ids = await page.evaluate(() => window.cozyScene.areaIds), issues = [], rows = [], cov = { objects: 0, judged: 0, tiny: 0, flat: 0, rescued: 0 };
  for (const A of ids) {
    const res = await page.evaluate(([A, shots, SKIP, TINY]) => {
      const c = window.cozyScene, out = {}; c.setArea(A, true); c.controls.enabled = false; c.tour.update = () => false; c.advance(1.5);
      const sc = (k) => c.objects[k].userData.scene, all = Object.keys(c.objects).filter((k) => sc(k) && sc(k).area === A);
      const cv2 = document.createElement('canvas'); cv2.width = 300; cv2.height = 188; const x = cv2.getContext('2d', { willReadFrequently: true });
      const grab = () => { const cv = c.draw(); x.drawImage(cv, 0, 0, 300, 188); return x.getImageData(0, 0, 300, 188).data.slice(); };
      const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 12) n++; return n; };
      const set = (f) => { for (const k of all) c.objects[k].visible = f(k); };
      const measure = (list) => { set(() => false); const E = grab(); set(() => true); const F = grab(), m = {}; for (const k of list) { set((i) => i === k); const alone = diff(grab(), E); set((i) => i !== k); m[k] = [alone, diff(grab(), F)]; } set(() => true); return m; };
      const cands = all.filter((k) => !SKIP.includes(sc(k).asset)), home = { p: c.camera.position.clone(), t: c.controls.target.clone(), fov: c.camera.fov };
      const m0 = measure(cands), bad = cands.filter((k) => m0[k][0] >= TINY && m0[k][1] < 0.2 * m0[k][0]);
      for (const k of cands) out[k] = { alone: m0[k][0], seen: m0[k][1], asset: sc(k).asset, group: sc(k).group, shot: null };
      for (const [name, cam] of Object.entries(shots)) { if (!bad.length) break;   // only the objects that fail the home view are measured from the shot cameras
        c.camera.fov = cam[2]; c.camera.updateProjectionMatrix(); c.at(cam[0], cam[1]); const m = measure(bad);
        for (const k of bad) if (!out[k].shot && m[k][0] >= TINY && m[k][1] >= 0.2 * m[k][0]) out[k].shot = name; }
      c.camera.fov = home.fov; c.camera.updateProjectionMatrix(); c.at(home.p.toArray(), home.t.toArray());
      return out;
    }, [A, camerasByArea[A] || {}, SKIP, TINY]);
    for (const [id, r] of Object.entries(res)) {
      cov.objects++; rows.push({ id, ...r });
      if (r.alone < TINY) { cov.tiny++; continue; }
      cov.judged++;
      const f = r.seen / r.alone;
      if (f >= MIN) continue;
      if (r.shot) { cov.rescued++; continue; }
      if (r.asset === 'table' && Object.values(res).some((o) => o.asset === 'tablecloth' && o.group === r.group)) continue;   // a table under its own cloth
      issues.push({ rule: 'visible', what: `${id} (${r.asset}): ${Math.round(100 * f)}% of it shows in the ${A} home view (${r.seen} of ${r.alone} px) and no tour shot shows it better: it is hidden behind other pieces; move it or what stands in front` });
    }
  }
  await page.setViewportSize(size); await page.evaluate(() => window.cozyScene.loop(true));
  issues.rows = rows; issues.coverage = `visible: ${cov.objects} object(s) in ${ids.length} area(s): ${cov.judged} judged from the home view, ${cov.tiny} skipped (under ${TINY} px), flat rugs and runners left out, ${cov.rescued} shown by a tour shot instead`;
  return issues;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const here = dirname(fileURLToPath(import.meta.url)), scene = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!scene) { console.log('usage: node check-visible.mjs <scene.json> [--all]'); process.exit(1); }
  const sceneAbs = resolve(scene); execSync(`node ${join(here, 'build.mjs')} ${sceneAbs}`, { stdio: 'ignore' });
  const { chromium } = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright');
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 750 } });
  page.on('pageerror', (e) => console.log('PAGE ERROR', String(e)));
  await page.goto('file://' + sceneAbs.replace(/\.json$/, '.html'));
  await page.waitForFunction(() => window.cozyScene && window.cozyBaked, null, { timeout: 280000 });
  const cf = sceneAbs.replace(/\.json$/, '.cameras.json'), cams = fs.existsSync(cf) ? JSON.parse(fs.readFileSync(cf, 'utf8')) : {}; delete cams._core;
  const issues = await visibleIssues(page, cams);
  if (process.argv.includes('--all')) for (const r of issues.rows) console.log(r.id, r.alone, r.seen, r.alone ? Math.round(100 * r.seen / r.alone) + '%' : '-', r.shot || '');
  for (const i of issues) console.log(`[${i.rule}] ${i.what}`);
  console.log(issues.coverage); console.log(issues.length ? `${issues.length} problem(s).` : 'No problems.');
  await browser.close(); process.exit(issues.length ? 1 : 0);
}
