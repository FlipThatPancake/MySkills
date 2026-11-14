#!/usr/bin/env node
// node fitshots.mjs scenes/x.json → for every tour shot, finds the nearest camera (from, look, fov) that has the subject group whole in frame and filling 30 to 55 percent of it, and prints it in the area's own coordinates (areas with psi 0 only).
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url)), scene = resolve(process.argv[2]);
execSync(`node ${join(here, 'build.mjs')} ${scene}`, { stdio: 'ignore' });
const { chromium } = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 750 } });
await page.goto('file://' + scene.replace(/\.json$/, '.html') + '?check');
await page.waitForFunction(() => window.cozyScene);
const res = await page.evaluate(() => {
  const api = window.cozyScene, { home, kit, camera } = api, T = kit.THREE, objs = home.objects, sc = (id) => objs[id].userData.scene, out = [];
  home.group.updateMatrixWorld(true);
  const box = (g) => { g.updateMatrixWorld(true); const b = new T.Box3(), bb = new T.Box3(); g.traverse((o) => { if (!o.isMesh || o.isLineSegments2 || o.material.isMeshBasicMaterial || kit.hulls.includes(o.material) || o.material === kit.depth) return; o.geometry.computeBoundingBox(); b.union(bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); }); return b; };
  const ids = Object.keys(objs), boxes = Object.fromEntries(ids.map((i) => [i, box(objs[i])]));
  const areaOf = (id) => sc(id).area || api.areaIds.find((a) => { const b = api.areas[a].bounds, c = boxes[id].getCenter(new T.Vector3()); return c.x >= b.x0 && c.x <= b.x1 && c.z >= b.z0 && c.z <= b.z1; });
  const rect = (b) => { const xs = [], ys = []; for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) { const p = new T.Vector3(x, y, z).project(camera); xs.push(p.x); ys.push(p.y); } return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }; };
  for (const A of api.areaIds) {
    const shots = api.areas[A].camera.shots || [], real = ids.filter((i) => areaOf(i) === A && !['socket', 'lightSwitch'].includes(sc(i).asset));
    const heroId = real.find((i) => sc(i).hero);
    for (const sh of shots) {
      const subj = sh.subject || (heroId && sc(heroId).group), mem = real.filter((i) => sc(i).group === subj); if (!mem.length) continue;
      api.setArea(A, true);
      const test = (from, look, fov) => { api.at(from, look); camera.fov = fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld(true); let x0 = 9, x1 = -9, y0 = 9, y1 = -9; for (const i of mem) { const r = rect(boxes[i]); x0 = Math.min(x0, r.x0); x1 = Math.max(x1, r.x1); y0 = Math.min(y0, r.y0); y1 = Math.max(y1, r.y1); } return { ok: x0 >= -0.95 && x1 <= 0.95 && y0 >= -0.95 && y1 <= 0.95, fill: Math.max((x1 - x0) / 2, (y1 - y0) / 2), cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }; };
      let best = null;
      for (const fov of [sh.fov || 38, 34, 42, 48, 54, 60]) for (const s of [0.6, 0.7, 0.8, 0.9, 1, 1.15, 1.3, 1.5, 1.8, 2.2]) for (const dx of [-1500, -1000, -500, 0, 500, 1000, 1500]) for (const dz of [-1500, -1000, -500, 0, 500, 1000, 1500]) for (const dy of [-400, -200, 0, 200, 400]) {
        const look = [sh.look[0] + dx, sh.look[1] + dy, sh.look[2] + dz], from = look.map((v, k) => v + (sh.from[k] - sh.look[k]) * s);
        if (from[1] < 700) from[1] = 700;
        const t = test(from, look, fov); if (!t.ok || t.fill < 0.3 || t.fill > 0.55) continue;
        const cost = Math.abs(dx) + Math.abs(dz) + Math.abs(dy) + 400 * Math.abs(Math.log(s)) + 15 * Math.abs(fov - (sh.fov || 38)) + 600 * Math.hypot(t.cx, t.cy) + 0.25 * Math.hypot(from[0] - look[0], from[2] - look[2]);
        if (!best || cost < best.cost) best = { cost, from: from.map(Math.round), look: look.map(Math.round), fov, fill: +t.fill.toFixed(2) };
      }
      const o = api.areas[A].bounds; out.push({ area: A, name: sh.name, subject: subj, o: [o.x0, o.z0], best });
    }
  }
  return out;
});
for (const r of res) console.log(r.area, JSON.stringify(r.name), '→', r.best ? `[${[r.best.from[0] - r.o[0], r.best.from[1], r.best.from[2] - r.o[1]]}], [${[r.best.look[0] - r.o[0], r.best.look[1], r.best.look[2] - r.o[1]]}], ${r.best.fov} (fills ${r.best.fill})` : 'no camera found');
await browser.close();
