#!/usr/bin/env node
// node fitshots.mjs scenes/x.json → for every tour shot, searches for a camera inside the area (eye level, high, low and tight in turn: 700-2100 mm high, lens 26-40 deg) that has the shot's subject group whole in frame, filling 25 to 60 percent, on a third, with a foreground piece nearer than the subject at one edge. Prints it in the area's own coordinates (psi 0 areas).
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { nbrRule } from './openshot.mjs';
const here = dirname(fileURLToPath(import.meta.url)), scene = resolve(process.argv.slice(2).find((a) => !a.startsWith('--')));
const spec = JSON.parse(fs.readFileSync(scene, 'utf8')), O = Object.fromEntries(spec.areas.map((a) => [a.id, a.O || [0, 0]]));
execSync(`node ${join(here, 'build.mjs')} ${scene}`, { stdio: 'ignore' });
const { chromium } = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 750 } });
await page.goto('file://' + scene.replace(/\.json$/, '.html') + '?check');
await page.waitForFunction(() => window.cozyScene && window.cozyBaked, null, { timeout: 280000 });
const res = await page.evaluate(([openGroups, only, nbrSrc]) => {
  const nbrRule = new Function('return ' + nbrSrc)();
  const TFINE = Array.from({ length: 30 }, (_, i) => +(0.17 + i * 0.014).toFixed(3)).flatMap((v) => [-v, v]);   // the fine pass slides the subject along the frame in steps of 1.4%: a group that overshoots by 1% at the coarse steps fits at one of these
  const api = window.cozyScene, { home, kit, camera } = api, T = kit.THREE, objs = home.objects, sc = (id) => objs[id].userData.scene, out = [];
  home.group.updateMatrixWorld(true);
  const box = (g) => { g.updateMatrixWorld(true); const b = new T.Box3(), bb = new T.Box3(); g.traverse((o) => { if (!o.isMesh || o.isLineSegments2 || o.userData.lines || o.material.isMeshBasicMaterial || kit.hulls.includes(o.material) || o.material === kit.depth) return; o.geometry.computeBoundingBox(); b.union(bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); }); if (b.isEmpty()) b.expandByPoint(new T.Vector3().setFromMatrixPosition(g.matrixWorld)); return b; };     // a lines-only object (scratches, leaf, scuff, height chart) has no solid parts: its box is its origin point
  const CH = { woodStove: 1700, hood: 2250, baseRun: 940 }, ids = Object.keys(objs), boxes = Object.fromEntries(ids.map((i) => { const b = box(objs[i]); if (CH[sc(i).asset]) b.max.y = Math.min(b.max.y, CH[sc(i).asset]); return [i, b]; }));   // a flue or chimney runs on up to the ceiling: only its first 1700 (stove) or 2250 (hood) mm frame as the object
  const areaOf = (id) => sc(id).area || api.areaIds.find((a) => { const b = api.areas[a].bounds, c = boxes[id].getCenter(new T.Vector3()); return c.x >= b.x0 && c.x <= b.x1 && c.z >= b.z0 && c.z <= b.z1; });
  const rect = (b) => { const xs = [], ys = []; for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) { const p = new T.Vector3(x, y, z).project(camera); xs.push(p.x); ys.push(p.y); } return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }; };
  for (const A of api.areaIds.filter((a) => !only.length || only.includes(a))) {   // --area=dining,living: only these areas
    const shots = api.areas[A].camera.shots || [], bd = api.areas[A].bounds, real = ids.filter((i) => areaOf(i) === A && !['socket', 'lightSwitch'].includes(sc(i).asset));
    const heroId = real.find((i) => sc(i).hero), taken = [];   // taken: the directions of the shots found so far in this area
    for (const [k, sh] of shots.entries()) {
      const ST = [{ ys: [1100, 1250, 1400], fovs: [32, 34, 36, 38, 40], fp: 36, dp: 4500 }, { ys: [1700, 1900, 2100], fovs: [30, 32, 34, 36], fp: 33, dp: 5000 }, { ys: [700, 850, 1000], fovs: [28, 30, 32, 34], fp: 31, dp: 4000 }, { ys: [1100, 1250], fovs: [26, 28, 30], fp: 28, dp: 3500 }][k % 4];   // shot 1 eye level, 2 high, 3 low, 4 tight: the tour does not look the same four times
      const subj = sh.subject || (heroId && sc(heroId).group), mem = real.filter((i) => sc(i).group === subj); if (!mem.length) continue;
      api.setArea(A, true);
      const sb = new T.Box3(); for (const i of mem) sb.union(boxes[i]); const sc3 = sb.getCenter(new T.Vector3());
      const SMALLFG = ['pouf', 'basket', 'floorPlant', 'plant', 'stool', 'trolley', 'bench', 'footstool', 'sideTable', 'cat', 'crate', 'stepStool', 'wateringCan', 'umbrellaStand', 'shoes', 'wasteBin', 'fileBox'];
      const others = real.filter((i) => !mem.includes(i) && sc(i).mount !== 'wall' && sc(i).asset !== 'rug');
      const test = (from, look, fov) => {
        // the tour plays this exact camera, so place it directly (api.at would clamp it to the orbit limits and score a view nobody sees), then reject points the orbit controls would move
        const cs = api.controls, off = new T.Vector3(from[0] - look[0], from[1] - look[1], from[2] - look[2]), dd = off.length(), pol = Math.acos(off.y / dd), azi = Math.atan2(off.x, off.z);
        if (pol < cs.minPolarAngle || pol > cs.maxPolarAngle || dd < cs.minDistance || dd > cs.maxDistance || azi < cs.minAzimuthAngle || azi > cs.maxAzimuthAngle) { stat.orbit = (stat.orbit || 0) + 1; return null; }
        camera.position.set(...from); camera.lookAt(...look); camera.fov = fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
        let x0 = 9, x1 = -9, y0 = 9, y1 = -9; for (const i of mem) { const r = rect(boxes[i]); x0 = Math.min(x0, r.x0); x1 = Math.max(x1, r.x1); y0 = Math.min(y0, r.y0); y1 = Math.max(y1, r.y1); }
        const fill = Math.max((x1 - x0) / 2, (y1 - y0) / 2), cx = (x0 + x1) / 2; const ov = Math.max(-0.97 - x0, x1 - 0.97, -0.97 - y0, y1 - 0.97); if (ov > 0 && (!stat.minOv || ov < stat.minOv)) { stat.minOv = +ov.toFixed(2); stat.ext = [x0, x1, y0, y1].map((v) => +v.toFixed(2)); stat.cam = [from[0] | 0, from[1] | 0, from[2] | 0, fov]; { const U = new T.Box3(); mem.forEach((i) => U.union(boxes[i])); stat.mm = Math.round(Math.max(U.max.x - U.min.x, U.max.z - U.min.z)); stat.fit = +(0.97 / Math.max(...[x0, x1, y0, y1].map(Math.abs))).toFixed(2); } } const why = !(x0 >= -0.97 && x1 <= 0.97 && y0 >= -0.97 && y1 <= 0.97) ? 'cut' : !(fill >= 0.28 && fill <= 0.62) ? 'fill' : !(Math.abs(cx) <= 0.33) ? 'third' : ''; if (why) { stat[why] = (stat[why] || 0) + 1; return null; }
        const cp = camera.position, dS = Math.min(...mem.map((i) => cp.distanceTo(boxes[i].getCenter(new T.Vector3()))));
        const near = others.filter((i) => cp.distanceTo(boxes[i].getCenter(new T.Vector3())) < dS), subjArea = (x1 - x0) * (y1 - y0);
        const ovl = (r) => Math.max(0, Math.min(r.x1, x1) - Math.max(r.x0, x0)) * Math.max(0, Math.min(r.y1, y1) - Math.max(r.y0, y0));
        for (const i of near) if (ovl(rect(boxes[i])) > 0.1 * subjArea) { stat.blocked = (stat.blocked || 0) + 1; return null; }
        const fg = near.concat(mem.length > 1 ? mem.filter((i) => ['pouf', 'basket', 'floorPlant', 'plant', 'stool', 'footstool', 'sideTable', 'crate', 'bench'].includes(sc(i).asset)) : []).some((i) => { const r = rect(boxes[i]), c = (r.x0 + r.x1) / 2; return SMALLFG.includes(sc(i).asset) && Math.abs(c) > 0.5 && Math.abs(c) < 1.15 && r.y1 > -1; });
        if (!fg) { stat.fg = (stat.fg || 0) + 1; return null; }
        for (const i of near) if (SMALLFG.includes(sc(i).asset)) { const r = rect(boxes[i]); if (Math.max(0, Math.min(r.x1, 1) - Math.max(r.x0, -1)) * Math.max(0, Math.min(r.y1, 1) - Math.max(r.y0, -1)) / 4 > 0.1) { stat.fgbig = (stat.fgbig || 0) + 1; return null; } }   // a foreground piece fills at most 10 percent of the frame
        { const dy = from[1] - look[1], pitch = Math.atan2(dy, Math.hypot(from[0] - look[0], from[2] - look[2])) * 180 / Math.PI; if (pitch > 15 && from[1] < 1600) { stat.pitch = (stat.pitch || 0) + 1; return null; } }   // looks down 15 degrees at most unless it is the high shot
        { const az = Math.atan2(look[0] - from[0], look[2] - from[2]) * 180 / Math.PI; if (taken.some((t) => { let d = Math.abs(t - az) % 360; if (d > 180) d = 360 - d; return d < 25; })) { stat.dir = (stat.dir || 0) + 1; return null; } }   // two shots of an area differ in direction by 25 degrees or more
        if (strict && Math.abs(cx) > 0.34) { stat.off = (stat.off || 0) + 1; return null; }   // the subject sits in the middle third
        { const g = openGroups.find((q) => q.areas.includes(A)); if (g) {   // open plan: a neighbouring area may show only behind the subject (openshot.mjs)
          const nb = ids.filter((i) => { const ar = areaOf(i); return ar !== A && g.areas.includes(ar) && !['socket', 'lightSwitch'].includes(sc(i).asset); }).map((i) => ({ id: i, box: boxes[i] }));
          const bad = nbrRule(T, camera, mem.map((i) => boxes[i]), nb); if (bad) { stat.glimpse = (stat.glimpse || 0) + 1; return null; } } }
        const cd = camera.getWorldDirection(new T.Vector3()), crossing = (b) => [b.min.x, b.max.x].some((x) => [b.min.y, b.max.y].some((y) => [b.min.z, b.max.z].some((z) => new T.Vector3(x, y, z).sub(camera.position).dot(cd) < 50))), rs = real.filter((i) => !['curtain', 'rug'].includes(sc(i).asset) && !crossing(boxes[i])).map((i) => rect(boxes[i])), cell = [0, 0, 0], tot = [0, 0, 0], NX = 24, NY = 14;
        for (let a = 0; a < NX; a++) for (let b = 0; b < NY; b++) { const px = -1 + (a + 0.5) * 2 / NX, py = -1 + (b + 0.5) * 2 / NY, t = Math.min(2, Math.floor(a * 3 / NX)); tot[t]++; if (rs.some((r) => px >= r.x0 && px <= r.x1 && py >= r.y0 && py <= r.y1)) cell[t]++; }
        if ((strict && (cell[0] / tot[0] < 0.09 || cell[2] / tot[2] < 0.09)) || (cell[0] + cell[1] + cell[2]) / (tot[0] + tot[1] + tot[2]) < 0.35) { stat.empty = (stat.empty || 0) + 1; stat.cov = [cell[0] / tot[0], cell[1] / tot[1], cell[2] / tot[2]].map((v) => +v.toFixed(2)); return null; }   // no empty side, at least 35 percent of the frame holds things
        if (strict) for (const i of real) { if (['curtain', 'rug', 'baseRun', 'wallRun'].includes(sc(i).asset)) continue; const r = rect(boxes[i]); if (r.y1 > 0.97 && r.y0 < 0.9 && r.x1 > -1 && r.x0 < 1 && !(mem.includes(i) && fill > 0.5)) { stat.clip = (stat.clip || 0) + 1; return null; } }   // nothing is cut by the top edge
        return { fill, cx, cov: (cell[0] + cell[1] + cell[2]) / (tot[0] + tot[1] + tot[2]) };
      };
      let best = null, strict = true; const stat = {};
      for (const pass of [[true, 0], [false, 0], [false, 1]]) { strict = pass[0]; const fine = pass[1]; if (best) break;   // the last pass searches finer (steps of 150 mm, every lens from 26 to 40 degrees): a group that overshoots the frame by a few percent often fits from a spot between the coarse steps
      for (let x = bd.x0 + 200; x <= bd.x1 - 200; x += fine ? 150 : 300) for (let z = bd.z0 + 300; z <= bd.z1 + 2500; z += fine ? 150 : 300) for (const y of ST.ys) for (const fov of fine ? [26, 28, 30, 32, 34, 36, 38, 40] : ST.fovs) for (const t of fine ? TFINE : [-0.55, -0.5, -0.45, -0.4, -0.35, -0.3, -0.25, -0.2, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55]) for (const ly of [0, 300, 500, 700, 900, 1100]) {
        const from = new T.Vector3(x, y, z), dir = sc3.clone().sub(from), dist = dir.length(); if (dist < 1500) continue;
        const right = new T.Vector3().crossVectors(dir.clone().normalize(), new T.Vector3(0, 1, 0)).normalize(), half = dist * Math.tan(fov * Math.PI / 360) * (1200 / 750);
        const look = sc3.clone().addScaledVector(right, -t * half); look.y = ly || Math.min(sc3.y, 1300);
        const r = test(from.toArray(), look.toArray(), fov); if (!r) continue;
        const cost = Math.abs(dist - ST.dp) + 50 * Math.abs(fov - ST.fp) + 800 * Math.abs(r.fill - 0.45) + 0.05 * Math.hypot(x - (sh.from[0] || 0), z - (sh.from[2] || 0));
        if (!best || cost < best.cost) best = { cost, from: from.toArray().map(Math.round), look: look.toArray().map(Math.round), fov, fill: +r.fill.toFixed(2), cx: +r.cx.toFixed(2), cov: +r.cov.toFixed(2) };
      }
      if (best && !strict && !fine) best.loose = true; if (best && fine) best.fine = true; }   // the strict pass found nothing: this camera ignores the middle-third, empty-side and top-clip rules (coverage and the other shot rules always hold)
      if (best) taken.push(Math.atan2(best.look[0] - best.from[0], best.look[2] - best.from[2]) * 180 / Math.PI);
      out.push({ area: A, name: sh.name, subject: subj, best, stat });
    }
  }
  return out;
}, [spec.groups || [], (process.argv.find((a) => a.startsWith('--area=')) || '').slice(7).split(',').filter(Boolean), nbrRule.toString()]);
const WHY = { glimpse: 'a neighbouring area shows in front of the subject: in an open-plan group a neighbour may show only behind the subject (farther from the camera than its nearest point)', orbit: 'the camera would leave the orbit limits: the area is too shallow for this group, or the group stands too far back', cut: 'the group does not fit the frame: make the subject group smaller', fill: 'the group fills too little or too much of the frame: resize the group', third: 'the group cannot sit in the middle third', blocked: 'a piece stands in front of the subject: move it or add a group', fg: 'no foreground piece fits: add a stool, basket or bench end', off: 'the subject cannot sit in the middle third', empty: 'a frame side stays empty, or things cover under 35 percent of the frame: add things around the subject', clip: 'something is cut by the top edge', fgbig: 'the foreground piece would fill over 10% of the frame: use a smaller piece', pitch: 'the camera would look down over 15 degrees: raise the group or use the high shot', dir: 'every direction is within 25 degrees of an earlier shot: reorder or add a second view' };
for (const r of res) { const o = O[r.area]; console.log(r.area, JSON.stringify(r.name), '→', r.best ? `[${[r.best.from[0] - o[0], r.best.from[1], r.best.from[2] - o[1]]}], [${[r.best.look[0] - o[0], r.best.look[1], r.best.look[2] - o[1]]}], ${r.best.fov} (fills ${r.best.fill}, covers ${r.best.cov}, at ${r.best.cx}${r.best.loose ? ", LOOSE: strict rules found nothing" : r.best.fine ? ", FINE: found by the fine search" : ""})` : `no camera found${r.stat.fit ? ` (the subject group is about ${r.stat.mm} mm wide; from the best camera the largest that fits is about ${Math.round(r.stat.mm * r.stat.fit)} mm: shrink the group to that, or move the camera back)` : ''}: ${(() => { const all = Object.entries(r.stat).filter(([k, v]) => typeof v === 'number' && !['minOv', 'mm', 'fit'].includes(k)), late = all.filter(([k]) => !['orbit', 'cut', 'fill', 'third'].includes(k)), top = (late.length ? late : all).sort((x, y) => y[1] - x[1])[0]?.[0]; return `${late.length ? 'of the cameras that frame the subject, most were rejected by' : 'most candidates failed on'} "${top || 'none'}" (${WHY[top] || 'make the subject group smaller, add a foreground piece'}) `; })()}` + JSON.stringify(r.stat)); }
await browser.close();
