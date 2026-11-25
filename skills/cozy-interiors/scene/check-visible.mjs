#!/usr/bin/env node
// Visibility check: every object shows in its area's home view (or in a tour shot). From the pixels, not the boxes: per object, the pixels it covers alone against the pixels that change when it is taken away.
// An object under 20% visible fails unless a tour shot shows it at 20% or more. Left out: rugs and runners (flat), objects under 40 px alone (too small to judge), a table under its own cloth.
//   hook: `await visibleIssues(page, camerasByArea)` -> issues [{ rule: 'visible', what }] with .coverage; node check-visible.mjs <scene.json> [--all] prints every object's numbers.
import { createRequire } from 'node:module';
import { globalPkg, buildPage } from './needs.mjs';
import { execSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
const MIN = 0.2, GMIN = 0.3, GTINY = 40, BIG = 1500, TINY = 15, SKIP = ['rug', 'runner'];

export async function visibleIssues(page, camerasByArea = {}, opt = {}) {
  const size = page.viewportSize(); await page.setViewportSize({ width: 600, height: 375 });   // half size: a draw in software GL is a quarter of the time
  await page.evaluate(() => window.cozyScene.loop(false));
  const ids = await page.evaluate(() => window.cozyScene.areaIds), issues = [], rows = [], cov = { faded: 0, objects: 0, judged: 0, tiny: 0, flat: 0, rescued: 0, groups: 0, hiddenGroups: 0 };
  for (const A of ids) {
    const res = await page.evaluate(([A, shots, SKIP, TINY, GMIN, GTINY, BIG]) => {
      const c = window.cozyScene, out = {}; c.setArea(A, true); c.controls.enabled = false; c.tour.update = () => false; c.advance(1.5);
      const sc = (k) => c.objects[k].userData.scene, all = Object.keys(c.objects).filter((k) => sc(k) && sc(k).area === A);
      const cv2 = document.createElement('canvas'); cv2.width = 300; cv2.height = 188; const x = cv2.getContext('2d', { willReadFrequently: true });
      const grab = () => { const cv = c.draw(); x.drawImage(cv, 0, 0, 300, 188); return x.getImageData(0, 0, 300, 188).data.slice(); };
      const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 12) n++; return n; };
      const set = (f) => { for (const k of all) c.objects[k].visible = f(k); };
      const measure = (list) => { set(() => false); const E = grab(); set(() => true); const F = grab(), m = {}; for (const k of list) { set((i) => i === k); const alone = diff(grab(), E); set((i) => i !== k); m[k] = [alone, diff(grab(), F)]; } set(() => true); return m; };
      const fade = {}; for (const b of c.home.blockers) if (sc(b.id) && sc(b.id).area === A && b.goal < 1 && !(b.wall && b.wall.goal === 0)) fade[b.id] = +b.goal.toFixed(2);   // the view fade at the home view (a piece hung on a wall that fades with it is left out: the near wall goes by design), before any piece is switched off: a piece the camera looks through is drawn at its goal
      const cands = all.filter((k) => !SKIP.includes(sc(k).asset)), home = { p: c.camera.position.clone(), t: c.controls.target.clone(), fov: c.camera.fov };
      const m0 = measure(cands), bad = cands.filter((k) => m0[k][0] >= TINY && m0[k][1] < 0.2 * m0[k][0]);
      for (const k of cands) out[k] = { alone: m0[k][0], seen: m0[k][1], asset: sc(k).asset, group: sc(k).group, shot: null, fade: fade[k] ?? 1 };
      out.__fade = Object.entries(fade).map(([id, goal]) => ({ id, goal, asset: sc(id).asset, group: sc(id).group }));
      for (const [name, cam] of Object.entries(shots)) { if (!bad.length) break;   // only the objects that fail the home view are measured from the shot cameras
        c.camera.fov = cam[2]; c.camera.updateProjectionMatrix(); c.at(cam[0], cam[1]); const m = measure(bad);
        for (const k of bad) if (!out[k].shot && m[k][0] >= TINY && m[k][1] >= 0.2 * m[k][0]) out[k].shot = name; }
      c.camera.fov = home.fov; c.camera.updateProjectionMatrix(); c.at(home.p.toArray(), home.t.toArray());
      // groups, from the home view only (no tour shot rescues a group): one big piece in front of the rest of a group. For each piece k of BIG pixels and each group (without k), the pixels the group covers alone against the pixels that change when it is taken away with k standing; under GMIN seen, k hides the group
      const groups = [], byG = {}; for (const k of cands) if (sc(k).group) (byG[sc(k).group] ||= []).push(k);
      const T = c.kit.THREE, rect = (list) => { const bx = new T.Box3(); for (const k of list) bx.expandByObject(c.objects[k]); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const xx of [bx.min.x, bx.max.x]) for (const yy of [bx.min.y, bx.max.y]) for (const zz of [bx.min.z, bx.max.z]) { const v = new T.Vector3(xx, yy, zz).project(c.camera); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); } return [x0, y0, x1, y1, bx.getCenter(new T.Vector3()).distanceTo(c.camera.position)]; };
      const lap = (r1, r2) => r1[0] < r2[2] && r2[0] < r1[2] && r1[1] < r2[3] && r2[1] < r1[3];
      c.home.group.updateMatrixWorld(true); set(() => false); const E0 = grab(), bigs = cands.filter((k) => m0[k][0] >= BIG);
      for (const [g, gk] of Object.entries(byG)) for (const k of bigs) { const rest = gk.filter((i) => i !== k); if (!rest.length) continue;
        const rg = rect(rest), rk = rect([k]); if (!lap(rg, rk) || rk[4] >= rg[4]) continue;   // k must overlap the group on screen and stand nearer the camera
        set((i) => rest.includes(i)); const alone = diff(grab(), E0); if (alone < GTINY) continue;
        set((i) => i === k || rest.includes(i)); const F2 = grab(); set((i) => i === k); const seen = diff(F2, grab());
        // seen: pixels the group adds to the picture with k standing in front of it
        groups.push({ g, cause: k, asset: sc(k).asset, members: rest.length, alone, seen }); }
      set(() => true);
      c.camera.fov = home.fov; c.camera.updateProjectionMatrix(); c.at(home.p.toArray(), home.t.toArray());
      out.__groups = groups;
      return out;
    }, [A, camerasByArea[A] || {}, SKIP, TINY, GMIN, GTINY, BIG]);
    const gr = res.__groups, fd = res.__fade; delete res.__groups; delete res.__fade;
    for (const f of fd) { if (f.group) { cov.faded++; issues.push({ rule: 'visible', what: `${f.id} (${f.asset}) is faded out in the ${A} home view (drawn at ${Math.round(100 * f.goal)}%): the camera looks through it to the view centre, and the home view must not fade a piece of the area's own group ${f.group}: move the view target or the piece` }); } }
    for (const r of gr) { cov.groups++; (issues.groupRows ||= []).push({ area: A, ...r }); if (r.seen >= GMIN * r.alone) continue; cov.hiddenGroups++;
      issues.push({ rule: 'visible', what: `${r.cause} (${r.asset}) hides the rest of group ${r.g} in the ${A} home view: only ${Math.round(100 * r.seen / r.alone)}% of the group's pixels show (${r.seen} of ${r.alone} px; ${Math.round(100 * GMIN)}% at least): move ${r.cause} or the group; a tour shot does not excuse a group hidden in the home view` }); }
    for (const [id, r] of Object.entries(res)) {
      cov.objects++; rows.push({ id, ...r });
      if (r.alone < TINY) { cov.tiny++; continue; }
      cov.judged++;
      const f = r.seen / r.alone;
      if (f >= MIN) continue;
      if (r.fade < 0.6) { if (r.group) continue; cov.faded++; issues.push({ rule: 'visible', what: `${id} (${r.asset}): faded out in the ${A} home view, drawn at ${Math.round(100 * r.fade)}%: the camera looks through it to the view centre (the view fade, not another piece, hides it): move the view target or the piece` }); continue; }
      if (r.shot) { cov.rescued++; (cov.ids ||= []).push(`${id} by shot ${r.shot}`); continue; }
      if (r.asset === 'table' && Object.values(res).some((o) => o.asset === 'tablecloth' && o.group === r.group)) continue;   // a table under its own cloth
      issues.push({ rule: 'visible', what: `${id} (${r.asset}): ${Math.round(100 * f)}% of it shows in the ${A} home view (${r.seen} of ${r.alone} px) and no tour shot shows it better: it is hidden behind other pieces; move it or what stands in front` });
    }
  }
  await page.setViewportSize(size); await page.evaluate(() => window.cozyScene.loop(true));
  issues.rows = rows; issues.coverage = `visible: ${cov.objects} object(s) in ${ids.length} area(s): ${cov.judged} judged from the home view, ${cov.tiny} skipped (under ${TINY} px), flat rugs and runners left out, ${cov.rescued} shown by a tour shot instead; ${cov.groups} group(s) judged as a whole, ${cov.hiddenGroups} hidden, ${cov.faded} faded in the home view${cov.ids ? ' (' + cov.ids.join(', ') + ')' : ''}`;
  return issues;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const here = dirname(fileURLToPath(import.meta.url)), scene = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!scene) { console.log('usage: node check-visible.mjs <scene.json> [--all]'); process.exit(1); }
  const sceneAbs = resolve(scene); buildPage(here, sceneAbs);
  const { chromium } = globalPkg('playwright');
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 750 } });
  page.on('pageerror', (e) => console.log('PAGE ERROR', String(e)));
  await page.goto('file://' + sceneAbs.replace(/\.json$/, '.html'));
  await page.waitForFunction(() => window.cozyScene && window.cozyBaked, null, { timeout: 280000 });
  const cf = sceneAbs.replace(/\.json$/, '.cameras.json'), cams = fs.existsSync(cf) ? JSON.parse(fs.readFileSync(cf, 'utf8')) : {}; delete cams._core;
  const issues = await visibleIssues(page, cams);
  if (process.argv.includes('--all')) for (const g of issues.groupRows || []) console.log('group', g.area, g.g, 'behind', g.cause, g.members, g.alone, g.seen, Math.round(100 * g.seen / g.alone) + '%');
  if (process.argv.includes('--all')) for (const r of issues.rows) console.log(r.id, r.alone, r.seen, r.alone ? Math.round(100 * r.seen / r.alone) + '%' : '-', r.shot || '');
  for (const i of issues) console.log(`[${i.rule}] ${i.what}`);
  console.log(issues.coverage); console.log(issues.length ? `${issues.length} problem(s).` : 'No problems.');
  await browser.close(); process.exit(issues.length ? 1 : 0);
}
