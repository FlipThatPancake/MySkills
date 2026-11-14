#!/usr/bin/env node
// node fitshots.mjs scenes/x.json → for every tour shot, searches for a camera inside the area (1100-1500 mm high, lens 26-40 deg) that has the shot's subject group whole in frame, filling 25 to 60 percent, on a third, with a foreground piece nearer than the subject at one edge. Prints it in the area's own coordinates (psi 0 areas).
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
const here = dirname(fileURLToPath(import.meta.url)), scene = resolve(process.argv[2]);
const spec = JSON.parse(fs.readFileSync(scene, 'utf8')), O = Object.fromEntries(spec.areas.map((a) => [a.id, a.O || [0, 0]]));
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
    const shots = api.areas[A].camera.shots || [], bd = api.areas[A].bounds, real = ids.filter((i) => areaOf(i) === A && !['socket', 'lightSwitch'].includes(sc(i).asset));
    const heroId = real.find((i) => sc(i).hero);
    for (const sh of shots) {
      const subj = sh.subject || (heroId && sc(heroId).group), mem = real.filter((i) => sc(i).group === subj); if (!mem.length) continue;
      api.setArea(A, true);
      const sb = new T.Box3(); for (const i of mem) sb.union(boxes[i]); const sc3 = sb.getCenter(new T.Vector3());
      const SMALLFG = ['pouf', 'basket', 'floorPlant', 'plant', 'stool', 'trolley', 'bench', 'footstool', 'sideTable', 'cat'];
      const others = real.filter((i) => !mem.includes(i) && sc(i).mount !== 'wall' && sc(i).asset !== 'rug');
      const test = (from, look, fov) => {
        api.at(from, look); camera.fov = fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
        let x0 = 9, x1 = -9, y0 = 9, y1 = -9; for (const i of mem) { const r = rect(boxes[i]); x0 = Math.min(x0, r.x0); x1 = Math.max(x1, r.x1); y0 = Math.min(y0, r.y0); y1 = Math.max(y1, r.y1); }
        const fill = Math.max((x1 - x0) / 2, (y1 - y0) / 2), cx = (x0 + x1) / 2; const ov = Math.max(-0.97 - x0, x1 - 0.97, -0.97 - y0, y1 - 0.97); if (ov > 0 && (!stat.minOv || ov < stat.minOv)) { stat.minOv = +ov.toFixed(2); stat.ext = [x0, x1, y0, y1].map((v) => +v.toFixed(2)); stat.cam = [from[0] | 0, from[1] | 0, from[2] | 0, fov]; } const why = !(x0 >= -0.97 && x1 <= 0.97 && y0 >= -0.97 && y1 <= 0.97) ? 'cut' : !(fill >= 0.28 && fill <= 0.62) ? 'fill' : !(Math.abs(cx) <= 0.33) ? 'third' : ''; if (why) { stat[why] = (stat[why] || 0) + 1; return null; }
        const cp = camera.position, dS = Math.min(...mem.map((i) => cp.distanceTo(boxes[i].getCenter(new T.Vector3()))));
        const near = others.filter((i) => cp.distanceTo(boxes[i].getCenter(new T.Vector3())) < dS), subjArea = (x1 - x0) * (y1 - y0);
        const ovl = (r) => Math.max(0, Math.min(r.x1, x1) - Math.max(r.x0, x0)) * Math.max(0, Math.min(r.y1, y1) - Math.max(r.y0, y0));
        for (const i of near) if (ovl(rect(boxes[i])) > 0.1 * subjArea) { stat.blocked = (stat.blocked || 0) + 1; return null; }
        const fg = near.some((i) => { const r = rect(boxes[i]), c = (r.x0 + r.x1) / 2; return SMALLFG.includes(sc(i).asset) && Math.abs(c) > 0.5 && Math.abs(c) < 1.15 && r.y1 > -1; });
        if (!fg) { stat.fg = (stat.fg || 0) + 1; return null; } return { fill, cx };
      };
      let best = null; const stat = {};
      for (let x = bd.x0 + 200; x <= bd.x1 - 200; x += 300) for (let z = bd.z0 + 300; z <= bd.z1 + 2500; z += 300) for (const y of [1100, 1250, 1400, 1500]) for (const fov of [26, 28, 30, 32, 34, 36, 38, 40]) for (const t of [-0.55, -0.5, -0.45, -0.4, -0.35, -0.3, -0.25, -0.2, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55]) for (const ly of [0, 300, 500, 700, 900, 1100]) {
        const from = new T.Vector3(x, y, z), dir = sc3.clone().sub(from), dist = dir.length(); if (dist < 1500) continue;
        const right = new T.Vector3().crossVectors(dir.clone().normalize(), new T.Vector3(0, 1, 0)).normalize(), half = dist * Math.tan(fov * Math.PI / 360) * (1200 / 750);
        const look = sc3.clone().addScaledVector(right, -t * half); look.y = ly || Math.min(sc3.y, 1300);
        const r = test(from.toArray(), look.toArray(), fov); if (!r) continue;
        const cost = Math.abs(dist - 4500) + 50 * Math.abs(fov - 34) + 800 * Math.abs(r.fill - 0.45) + 0.05 * Math.hypot(x - (sh.from[0] || 0), z - (sh.from[2] || 0));
        if (!best || cost < best.cost) best = { cost, from: from.toArray().map(Math.round), look: look.toArray().map(Math.round), fov, fill: +r.fill.toFixed(2), cx: +r.cx.toFixed(2) };
      }
      out.push({ area: A, name: sh.name, subject: subj, best, stat });
    }
  }
  return out;
});
for (const r of res) { const o = O[r.area]; console.log(r.area, JSON.stringify(r.name), '→', r.best ? `[${[r.best.from[0] - o[0], r.best.from[1], r.best.from[2] - o[1]]}], [${[r.best.look[0] - o[0], r.best.look[1], r.best.look[2] - o[1]]}], ${r.best.fov} (fills ${r.best.fill}, at ${r.best.cx})` : 'no camera found (make the subject group smaller, add a foreground piece) ' + JSON.stringify(r.stat)); }
await browser.close();
