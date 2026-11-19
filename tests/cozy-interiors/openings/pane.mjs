#!/usr/bin/env node
// Blank-pane test: node tests/cozy-interiors/openings/pane.mjs  (about 2 min). A room with every window and glass door kind, seen from the home view and from six other angles.
// Red fixture: drawn the old way (no stencil clip, the paper floor over the picture) the check must report blank panes; as built it must report none. Exit 1 when either is wrong.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
const here = dirname(fileURLToPath(import.meta.url)), scene = join(here, '../../../skills/cozy-interiors/scene');
const { Home } = await import(join(scene, 'compose.mjs')), { windowIssues } = await import(join(scene, 'check-windows.mjs')), { room } = await import(join(here, '../regress/fixtures/common.mjs'));
const tmp = fs.mkdtempSync(join(os.tmpdir(), 'pane-')), json = join(tmp, 'panes.json');
const log = console.log; console.log = () => {};
const { H } = room(Home, { W: 14000, D: 4000, openings: [
  { kind: 'window', x: 1000, width: 1200, height: 1100, sill: 1000 }, { kind: 'window', style: 'picture', x: 3000 }, { kind: 'window', style: 'bay', x: 5200 },
  { kind: 'door', style: 'french', x: 7600 }, { kind: 'door', style: 'slider', x: 10200 }, { kind: 'window', style: 'wall', x: 12600, width: 2000 } ] });
H.write(json, fs); console.log = log;
execSync(`node ${join(scene, 'build.mjs')} ${json}`, { stdio: 'ignore' });
const { chromium } = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 750 } });
page.on('pageerror', (e) => console.log('PAGE ERROR', String(e)));
await page.goto('file://' + json.replace(/\.json$/, '.html'));
await page.waitForFunction(() => window.cozyScene && window.cozyBaked, null, { timeout: 280000 });
const angles = Object.fromEntries([[-60, 10], [-30, 25], [0, 40], [20, 15], [45, 30], [70, 12]].map(([az, el]) => [`az${az}el${el}`, { look: [az, el] }]));
let bad = 0;
const good = await windowIssues(page, { t: angles }, { frames: process.env.FRAMES }); if (good.length) { bad++; for (const i of good) log('FAIL as built: ' + i.what); } else log('ok: as built, no blank pane');
const old = await windowIssues(page, { t: angles }, { unclipped: true }); if (!old.length) { bad++; log('FAIL: drawn the old way the check found no blank pane (it cannot fail)'); } else log(`ok: drawn the old way, ${old.length} blank pane(s) found, e.g. ${old[0].what}`);
await browser.close(); fs.rmSync(tmp, { recursive: true, force: true });
process.exit(bad ? 1 : 0);
