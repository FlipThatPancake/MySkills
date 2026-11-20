#!/usr/bin/env node
// node tests/cozy-interiors/openings/render-checks.mjs  → red and green fixtures for the two render checks check-visible.mjs and check-pendants.mjs (about 3 min).
//  visible: a wardrobe standing in front of a chest and a picture hides them (red); the same room with the wardrobe at the side shows them (green).
//  cord: the round-5 hairline cord (ink 0.2) is named (red); with a 20 mm cord added the check is quiet (green).
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
const hid = build('hidden', (a) => { a.put('chest', 'chestOfDrawers', [2200, 300], 0, { group: 'g' }); a.put('wardrobe', 'wardrobe', [2400, 1100], 180, { group: 'g' }); a.put('desk', 'desk', [4800, 600], 0, { group: 'd' }); });
const shown = build('shown', (a) => { a.put('chest', 'chestOfDrawers', [2200, 300], 0, { group: 'g' }); a.put('wardrobe', 'wardrobe', [800, 700], 180, { group: 'g' }); a.put('desk', 'desk', [4800, 600], 0, { group: 'd' }); });
const pend = build('pend', (a) => { a.view({ target: [3000, 1500, 2000], az: 20, el: 8, dist: 4500 }); const T = a.table('dt', { at: [3000, 2000], w: 1600, d: 900, chairs: 4 }); T.over('pendantLamp', {}); });
const { chromium } = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const open = async (j) => { const p = await browser.newPage({ viewport: { width: 1200, height: 750 } }); await p.goto('file://' + j.replace(/\.json$/, '.html')); await p.waitForFunction(() => window.cozyScene && window.cozyBaked, null, { timeout: 280000 }); return p; };
let bad = 0; const expect = (ok, msg) => { if (!ok) bad++; log((ok ? 'ok:   ' : 'FAIL: ') + msg); };
let p = await open(hid), r = await visibleIssues(p);
expect(r.some((i) => /t-chest/.test(i.what)), `wardrobe in front: the chest is named hidden (${r.map((i) => i.what.split(' ')[0]).join(', ') || 'nothing'})`);
expect(r.some((i) => /t-wardrobe .*hides the rest of group/.test(i.what)), 'wardrobe in front: the wardrobe is named as hiding its group'); await p.close();
p = await open(shown); r = await visibleIssues(p); expect(!r.some((i) => /t-chest|hides the rest/.test(i.what)), `wardrobe at the side: the chest and its group show (${r.map((i) => i.what.slice(0, 160)).join(' / ')})`); await p.close();
p = await open(pend); const AT = { at: [[3000, 1700, 6500], [3000, 1900, 2000]] }; r = await pendantIssues(p, AT); expect(r.length > 0 && /cord/.test(r[0].what), `round-5 hairline cord (ink ~0.2): the check names the pendant (${r[0]?.what.slice(0, 90) || 'nothing'})`);
await p.evaluate(() => { const c = window.cozyScene, T = c.kit.THREE; for (const k of Object.keys(c.objects)) if (/pendant/i.test(c.objects[k].userData.scene?.asset || '')) { const o = c.objects[k]; o.updateMatrixWorld(true); const b = new T.Box3().setFromObject(o), q = o.worldToLocal(new T.Vector3((b.min.x + b.max.x) / 2, b.min.y + 250, (b.min.z + b.max.z) / 2)); o.add(c.kit.cyl(q.x, q.y, q.z, 10, 1100, { seg: 8, tone: 'lo' })); o.updateMatrixWorld(true); } });
r = await pendantIssues(p, AT); expect(r.length === 0 && /1 judged/.test(r.coverage), `a 20 mm cord added: no problem (${r.coverage}; ${r[0]?.what.slice(0, 90) || ''})`); await p.close();
await browser.close(); fs.rmSync(tmp, { recursive: true, force: true }); process.exit(bad ? 1 : 0);
