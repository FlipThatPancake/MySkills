#!/usr/bin/env node
// check-motion.mjs — the rules for living, moving things (check-home calls motionIssues(page, sceneFile); `node check-motion.mjs <scene.json>` runs it alone on the built page next to the json).
// Static: at most 3 kinds per area, none twice; every thing built (no plug-in error); a thing that needs an open window has one rendered open (via, not shut, wide enough for a flier); wind has a plant.
// Moving (the page's own physics of motion, 240 s of simulated time in 1/30 s steps, every thing with `sampled`): its bodies stay out of every object's solid, inside the room, and cross a wall only
// (a body marked `ground: true`, a cat or a paw near the floor, may be below 300 mm) through `via` while it is open wide enough (its whole reach inside the gap, between sill and head), and two fliers pass one opening at least 4 s apart; and with the window shut a fresh thing never shows at all.
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
export async function motionIssues(page, sceneFile, { seconds = 240 } = {}) {
  const S = JSON.parse(readFileSync(sceneFile, 'utf8')), out = [];
  for (const A of S.areas) {
    const m = A.motion || [], kinds = m.map((e) => e.kind);
    if (m.length > 3) out.push({ rule: 'motion', what: `${A.id}: ${m.length} living things (3 at most)` });
    if (new Set(kinds).size !== kinds.length) out.push({ rule: 'motion', what: `${A.id}: the same kind twice (${kinds.join(', ')}): one of each kind` });
  }
  if (!S.areas.some((A) => A.motion?.length)) return out;
  const res = await page.evaluate(async (seconds) => {
    const { motion, kit } = window.cozyScene, T = kit.THREE, issues = [], once = new Set();
    const say = (key, what) => { if (!once.has(key)) { once.add(key); issues.push(what); } };
    const PLANTS = ['plant', 'floorPlant', 'pot', 'plantStand', 'herbs', 'hangingPlant'];
    for (const th of motion.things) {
      const tag = `${th.area}: ${th.kind}`;
      if (th.error) { say(tag + 'err', `${tag}: ${th.error}`); continue; }
      const needs = th.entry.needs || [], via = th.ctx?.via;
      if (needs.includes('openWindow')) {
        if (!th.entry.via || !via) say(tag + 'via', `${tag}: needs an open window but names none (a.alive picks one: the area has no window that opens)`);
        else if (via.open() <= 0 || !via.gap()) say(tag + 'shut', `${tag}: its window (${via.id}) is not rendered open`);
        else if (th.entry.via && motion.PLUGINS[th.kind]?.sampled && !via.usable(th.R || 42)) say(tag + 'gap', `${tag}: its window (${via.id}) opens only ${Math.round(via.gap())} mm at the middle: too narrow for a flier (open it wider)`);
      }
      if (needs.includes('plant') && !th.ctx.objects.some((o) => PLANTS.includes(o.asset))) say(tag + 'plant', `${tag}: needs a plant and the area has none`);
    }
    // every area's cameras (home view, tour shots): setArea fits each home view, then the list is kept
    const cams = {};
    for (const th of motion.things) if (th.sampled && !cams[th.area]) { window.cozyScene.setArea?.(th.area, true); cams[th.area] = motion.cameraOf ? motion.cameraOf(th.area).map((v) => v.clone()) : []; }
    const bodiesSeen = {}, prevDn = {}, passes = {};   // passes: when each flier crossed each opening's wall (two never within 4 s)
    motion.run(seconds, (th, t, bodies) => {
      const { ctx } = th, via = ctx.via, tag = `${th.area}: ${th.kind}`;
      if (via && th.R && bodies.length) { const W = via.W, p0 = bodies[0].c, dn = (p0[0] - W.to[0]) * W.n[0] + (p0[2] - W.to[1]) * W.n[1], key = tag; if (prevDn[key] !== undefined && (prevDn[key] < 0) !== (dn < 0)) (passes[via.id] ||= []).push({ t, tag }); prevDn[key] = dn; }
      for (const b of bodies) {
        const c = new T.Vector3(...b.c), r = b.r;
        bodiesSeen[tag] = (bodiesSeen[tag] || 0) + 1;
        for (const cam of cams[th.area] || []) if (c.distanceTo(cam) < 900) say(tag + 'cam', `${tag}: comes within ${Math.round(c.distanceTo(cam))} mm of a camera at ${t.toFixed(1)} s (900 mm at least: a flier that close fills the frame, clipped)`);
        for (const o of ctx.objects) {
          if (b.perch === o.id) continue;
          if (o.box.distanceToPoint(c) < r - 6 && o.box.max.y > 100) say(tag + o.id, `${tag}: passes through ${o.id} at ${t.toFixed(1)} s (${c.toArray().map(Math.round)})`);
        }
        let inGap = false;
        for (const { W } of ctx.walls) {
          const s = -((c.x - W.to[0]) * W.d[0] + (c.z - W.to[1]) * W.d[1]), dn = (c.x - W.to[0]) * W.n[0] + (c.z - W.to[1]) * W.n[1];
          if (s < -r || s > W.len + r || dn > r) continue;   // beside the wall or well inside the room
          const lat = via && W === via.W ? (c.x - via.centre[0]) * via.u[0] + (c.z - via.centre[1]) * via.u[1] : 1e9;
          const ok = via && W === via.W && Math.abs(lat) <= via.gap() / 2 - r + 1 && c.y >= via.sill + r - 1 && c.y <= via.sill + via.height - r + 1 && via.usable(r);
          if (!ok && (dn < 20 || b.outside)) say(tag + W.id, `${tag}: crosses ${W.id} outside its open window at ${t.toFixed(1)} s (${c.toArray().map(Math.round)}, ${dn.toFixed(0)} mm from the wall)`);
          else if (ok) inGap = true;
        }
        const A = ctx.area.bounds;
        if (!inGap && !b.outside && (c.x < A.x0 || c.x > A.x1 || c.z < A.z0 || c.z > A.z1 || c.y < (b.ground ? 0 : 300) || c.y > (A.top || 2500))) say(tag + 'room', `${tag}: leaves the room (${c.toArray().map(Math.round)}) at ${t.toFixed(1)} s`);
      }
    });
    for (const [id, list] of Object.entries(passes)) { list.sort((a, b) => a.t - b.t); for (let i = 1; i < list.length; i++) if (list[i].t - list[i - 1].t < 3.9) say(`gap${id}${list[i].t}`, `${list[i].tag} and ${list[i - 1].tag} pass through ${id} only ${(list[i].t - list[i - 1].t).toFixed(1)} s apart (4 s at least)`); }
    for (const th of motion.things) if (th.sampled && !th.error && !bodiesSeen[`${th.area}: ${th.kind}`]) say(`${th.area}: ${th.kind}never`, `${th.area}: ${th.kind}: never came in during ${seconds} s (the way in may be blocked, or it waits for a window that is shut)`);
    // with the window shut a fresh thing never shows
    for (const th of motion.things) {
      if (!th.sampled || th.error || !th.ctx.via) continue;
      const via = th.ctx.via, built = via.W.built[via.index], saved = built.openables.map((o) => o.userData.open?.v);
      built.openables.forEach((o) => { if (o.userData.open) o.userData.open.v = 0; });
      const fresh = motion.PLUGINS[th.kind].build(th.ctx); let shown = 0;
      for (let t = 0; t < 60; t += 1 / 30) { fresh.update(1 / 30); if (fresh.bodies().length) shown++; }
      built.openables.forEach((o, i) => { if (o.userData.open) o.userData.open.v = saved[i]; });
      if (shown) say(`${th.area}: ${th.kind}shutshow`, `${th.area}: ${th.kind}: shows while its window is shut (${shown} frames in 60 s)`);
    }
    return issues;
  }, seconds);
  return [...out, ...res.map((what) => ({ rule: 'motion', what }))];
}
if (process.argv[1] && process.argv[1].endsWith('check-motion.mjs')) {
  const here = dirname(fileURLToPath(import.meta.url)), scene = resolve(process.argv[2] || ''), html = scene.replace(/\.json$/, '.html');
  if (!process.argv[2] || !existsSync(html)) { console.error('usage: node check-motion.mjs <scene.json>  (build the page first: node build.mjs <scene.json>)'); process.exit(1); }
  const { chromium } = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright');
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 750 } });
  page.on('pageerror', (e) => console.log('PAGE ERROR', String(e)));
  await page.goto('file://' + html + '?check'); await page.waitForFunction(() => window.cozyScene, null, { timeout: 280000 });
  const issues = await motionIssues(page, scene);
  for (const i of issues) console.log(`[${i.rule}] ${i.what}`);
  console.log(issues.length ? `${issues.length} issue(s)` : 'No motion problems.');
  await browser.close();
}
