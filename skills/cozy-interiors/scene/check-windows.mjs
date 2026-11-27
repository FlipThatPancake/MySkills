#!/usr/bin/env node
// Blank-pane check: the painted outside must show through every window and glass door, from the home view and from each tour shot camera.
// Ground truth: the same picture drawn as a plain depth-tested plane (in magenta) is what a pane ought to show; the picture as drawn now (also magenta) must cover at least 85% of those pixels.
// A picture drawn under 60% is reported too: a window's picture belongs to its wall, so the view fade must not thin it (the bay's picture stands 660 mm out and was thinned to 18%: a white pane that this check once skipped as "faded").
// Leaves and sashes are hidden in both draws, so an opened sash never counts as a blank.
//   camerasByArea entries are [from, look, fov] or { look: [azimuth, elevation] } (the home view's distance and target, seen from there). opt.angles: more { name: { look: [az, el] } } cameras for every area. opt.unclipped: draw the pictures the old way (no stencil), to prove the check can fail.
//   hook: `import { windowIssues } from './check-windows.mjs'`; `await windowIssues(page, camerasByArea, { frames: dir? })` -> [{ rule: 'pane', what }]. page: the built home page, loop stopped by this function.
//   node check-windows.mjs <scene.json> [--frames=dir]   builds the page, runs the check, prints the issues, saves per window and camera a frame with the picture shown plain and as drawn.
import { createRequire } from 'node:module';
import { globalPkg, buildPage } from './needs.mjs';
import { execSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

// camerasByArea: { area: { shotName: [from, look, fov] } } (the scene's cameras.json). Returns the issues; with frames: a dir, saves frame strips.
export async function windowIssues(page, camerasByArea = {}, opt = {}) {
  await page.evaluate(() => window.cozyScene.loop(false));
  const issues = [], saved = [], cov = { windows: 0, views: 0, tested: 0, offscreen: 0, faded: 0 };
  const ids = await page.evaluate(() => window.cozyScene.areaIds);
  for (const id of ids) {
    const cams = { home: null, ...(opt.angles || {}), ...(camerasByArea[id] || {}) };
    const res = await page.evaluate(([id, cams, frames, unclipped]) => {
      const c = window.cozyScene, T = c.kit.THREE, { home } = c, out = [];
      c.setArea(id, true); c.controls.enabled = false; c.tour.update = () => false; c.advance(1.5);
      const visibleDeep = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
      const inRoom = (m) => { for (const W of home.walls) if (c.portal.has(c.orderArea(W))) for (let q = m; q; q = q.parent) if (q === W.node) return true; return false; };   // a window of the room drawn behind an arch is that room's: it is judged from its own area
      const skies = []; home.group.traverse((m) => { if (m.isMesh && m.name === 'outside-backdrop' && visibleDeep(m) && !inRoom(m)) skies.push(m); });
      if (!skies.length) return out;
      const home0 = { p: c.camera.position.clone(), t: c.controls.target.clone(), fov: c.camera.fov };
      if (unclipped) c.scene.traverse((m) => { if (m.isMesh && m.material && m.material.stencilWrite && m.name !== 'opening-mask') { m.material.stencilWrite = false; m.material.needsUpdate = true; } });
      const mag = (d, j) => Math.min(d[j], d[j + 2]) - d[j + 1] > 40;   // a picture thinned by the view fade is a tint, not pure magenta
      const grab = () => { const cv = c.draw(), w = cv.width, h = cv.height, k = document.createElement('canvas'); k.width = w; k.height = h; k.getContext('2d').drawImage(cv, 0, 0); return k; };
      const count = (k) => { const d = k.getContext('2d').getImageData(0, 0, k.width, k.height).data; let n = 0; for (let j = 0; j < d.length; j += 4) if (mag(d, j)) n++; return n; };
      const leaves = []; for (const W of home.walls) for (const b of W.built) for (const o of b.openables) leaves.push(o);
      for (const [name, cam] of Object.entries(cams)) {
        if (cam && cam.look) { c.camera.fov = home0.fov; c.camera.updateProjectionMatrix(); c.look(home0.p.distanceTo(home0.t), cam.look[0], cam.look[1], home0.t.toArray()); }
        else if (cam) { c.camera.fov = cam[2]; c.camera.updateProjectionMatrix(); c.at(cam[0], cam[1]); } else { c.camera.fov = home0.fov; c.camera.updateProjectionMatrix(); c.at(home0.p.toArray(), home0.t.toArray()); }
        home.group.updateMatrixWorld(true);
        const wasVis = leaves.map((o) => o.visible); for (const o of leaves) o.visible = false;
        skies.forEach((s, si) => {
          for (const q of skies) q.visible = q === s;
          const m = s.material, keep = { map: m.map, color: m.color.clone() };
          // truth: a plain depth-tested plane in magenta
          const oracle = new T.Mesh(s.geometry, new T.MeshBasicMaterial({ color: 0xff00ff, depthTest: true, depthWrite: false, toneMapped: false, stencilWrite: true, stencilRef: s.material.stencilRef, stencilFunc: T.EqualStencilFunc })); oracle.renderOrder = 5;   // clipped to the opening like the picture: the plain plane far out would otherwise show over the wall beside a bay
          oracle.position.copy(s.position); oracle.rotation.copy(s.rotation); oracle.scale.copy(s.scale); s.parent.add(oracle);
          s.visible = false; const K = grab(); const truth = count(K);
          oracle.visible = false; s.visible = true; m.map = null; m.color.set(0xff00ff); m.needsUpdate = true;
          const A = grab(), now = count(A);
          m.map = keep.map; m.color.copy(keep.color); m.needsUpdate = true; s.parent.remove(oracle); oracle.material.dispose();
          const rec = { name, sky: si, truth, now, op: +(m.opacity).toFixed(2) };   // op: how solid the picture is here (the view fade thins a far window; below 0.6 it is not judged)
          if (frames && truth >= 300) { rec.png = [K, A].map((k) => k.toDataURL('image/png').split(',')[1]); }
          out.push(rec);
        });
        for (const q of skies) q.visible = true; leaves.forEach((o, i) => { o.visible = wasVis[i]; });
      }
      return out;
    }, [id, cams, !!opt.frames, !!opt.unclipped]);
    const wins = new Set(res.map((r) => r.sky)); cov.windows += wins.size;
    for (const r of res) {
      cov.views++; if (r.truth < 300) cov.offscreen++; else if (r.op < 0.6) cov.faded++; else cov.tested++;
      if (opt.frames && r.png) { fs.mkdirSync(opt.frames, { recursive: true }); r.png.forEach((b, i) => { const f = join(opt.frames, `${id}-${r.name}-w${r.sky}-${['truth', 'drawn'][i]}.png`); fs.writeFileSync(f, Buffer.from(b, 'base64')); saved.push(f); }); }
      if (r.truth >= 300 && r.op < 0.6) issues.push({ rule: 'pane', what: `${id} window ${r.sky}, camera ${r.name}: the outside picture is drawn at ${Math.round(100 * r.op)}% (it must be solid: the view fade thins what stands beyond the area's box, and a window's picture belongs to its wall, so a faded picture reads as a white pane)` });
      if (r.truth >= 300 && r.op >= 0.6 && r.now < 0.85 * r.truth) issues.push({ rule: 'pane', what: `${id} window ${r.sky}, camera ${r.name}: the outside picture covers ${r.now} px of the ${r.truth} the pane shows (a blank pane: something is drawn over the picture)` });
      if (process.argv.includes('--time')) console.error('[time]   pane', id, JSON.stringify({ name: r.name, sky: r.sky, truth: r.truth, now: r.now }));
    }
  }
  await page.evaluate(() => window.cozyScene.loop(true));
  issues.saved = saved; issues.coverage = `panes: ${cov.windows} window(s) with an outside picture, ${cov.views} window-camera view(s): ${cov.tested} judged, ${cov.offscreen} skipped (window out of frame), ${cov.faded} faded (reported)`;
  return issues;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const here = dirname(fileURLToPath(import.meta.url)), scene = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!scene) { console.log('usage: node check-windows.mjs <scene.json> [--frames=dir]'); process.exit(1); }
  const frames = (process.argv.find((a) => a.startsWith('--frames=')) || '').slice(9) || null, sceneAbs = resolve(scene);
  buildPage(here, sceneAbs);
  const { chromium } = globalPkg('playwright');
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 750 } });
  page.on('pageerror', (e) => console.log('PAGE ERROR', String(e)));
  await page.goto('file://' + sceneAbs.replace(/\.json$/, '.html'));
  await page.waitForFunction(() => window.cozyScene && window.cozyBaked, null, { timeout: 280000 });
  const cf = sceneAbs.replace(/\.json$/, '.cameras.json'), cams = fs.existsSync(cf) ? JSON.parse(fs.readFileSync(cf, 'utf8')) : {};
  delete cams._core;
  const issues = await windowIssues(page, cams, { frames: frames && resolve(frames) });
  for (const i of issues) console.log(`pane: ${i.what}`);
  for (const f of issues.saved) console.log('frame ' + f);
  console.log(issues.coverage);
  console.log(issues.length ? `${issues.length} problem(s).` : 'No problems.');
  await browser.close();
  process.exit(issues.length ? 1 : 0);
}
