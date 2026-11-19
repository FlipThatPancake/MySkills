#!/usr/bin/env node
// node tests/cozy-interiors/openings/render-checks.mjs  → red and green fixtures for the two render checks check-visible.mjs and check-pendants.mjs (about 3 min).
//  visible: a wardrobe standing in front of a chest and a picture hides them (red); the same room with the wardrobe at the side shows them (green).
//  cord: a pendant over a table shows its cord (green); with the cord's lines hidden the check names it (red).
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
const here = dirname(fileURLToPath(import.meta.url)), scene = join(here, '../../../skills/cozy-interiors/scene');
const { Home } = await import(join(scene, 'compose.mjs')), { visibleIssues } = await import(join(scene, 'check-visible.mjs')), { pendantIssues } = await import(join(scene, 'check-pendants.mjs')), { room } = await import(join(here, '../regress/fixtures/common.mjs'));
const tmp = fs.mkdtempSync(join(os.tmpdir(), 'render-')), log = console.log;
const build = (name, fn) => { console.log = () => {}; try { const { H, a } = room(Home, { W: 6000, D: 4000 }); fn(a, H); const j = join(tmp, name + '.json'); H.write(j, fs); execSync(`node ${join(scene, 'build.mjs')} ${j}`, { stdio: 'ignore' }); return j; } finally { console.log = log; } };
const hid = build('hidden', (a) => { a.put('chest', 'chestOfDrawers', [2200, 300], 0, { group: 'g' }); a.put('wardrobe', 'wardrobe', [2400, 1100], 180, { group: 'f' }); a.put('desk', 'desk', [4800, 600], 0, { group: 'd' }); });
const shown = build('shown', (a) => { a.put('chest', 'chestOfDrawers', [2200, 300], 0, { group: 'g' }); a.put('wardrobe', 'wardrobe', [5200, 2300], 180, { group: 'f' }); a.put('desk', 'desk', [4800, 600], 0, { group: 'd' }); });
const pend = build('pend', (a) => { a.view({ target: [3000, 1500, 2000], az: 20, el: 8, dist: 4500 }); const T = a.table('dt', { at: [3000, 2000], w: 1600, d: 900, chairs: 4 }); T.over('pendantLamp', {}); });
const { chromium } = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const open = async (j) => { const p = await browser.newPage({ viewport: { width: 1200, height: 750 } }); await p.goto('file://' + j.replace(/\.json$/, '.html')); await p.waitForFunction(() => window.cozyScene && window.cozyBaked, null, { timeout: 280000 }); return p; };
let bad = 0; const expect = (ok, msg) => { if (!ok) bad++; log((ok ? 'ok:   ' : 'FAIL: ') + msg); };
let p = await open(hid), r = await visibleIssues(p);
expect(r.some((i) => /t-chest/.test(i.what)), `wardrobe in front: the chest is named hidden (${r.map((i) => i.what.split(' ')[0]).join(', ') || 'nothing'})`); await p.close();
p = await open(shown); r = await visibleIssues(p); expect(!r.some((i) => /t-chest/.test(i.what)), 'wardrobe at the side: the chest shows'); await p.close();
p = await open(pend); const AT = { at: [[3000, 1700, 6500], [3000, 1900, 2000]] }; r = await pendantIssues(p, AT); expect(r.length === 0 && /1 judged/.test(r.coverage), `pendant with its cord: no problem (${r.coverage})`);
await p.evaluate(() => { const c = window.cozyScene; for (const k of Object.keys(c.objects)) if (/pendant/i.test(c.objects[k].userData.scene?.asset || '')) c.objects[k].traverse((o) => { if (o.userData.kitLine || o.isLineSegments2 || (o.isMesh && o.geometry.type === 'CylinderGeometry' && o.geometry.parameters.height > 400)) o.visible = false; }); });
r = await pendantIssues(p, AT); expect(r.length > 0, `cord hidden: the check names the pendant (${r[0]?.what.slice(0, 80) || 'nothing'})`); await p.close();
await browser.close(); fs.rmSync(tmp, { recursive: true, force: true }); process.exit(bad ? 1 : 0);
