#!/usr/bin/env node
// node smoke.mjs [scene.json ...] → page-load smoke test: builds each scene's page with build.mjs, loads it headless and fails on any uncaught exception or console error (a broken import or an undefined name in src/ shows up here and nowhere else until a page is opened). With no scene it builds example.spec.mjs into a temp folder. About 15 s a scene; scenes load side by side.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
const here = dirname(fileURLToPath(import.meta.url));
let scenes = process.argv.slice(2).filter((a) => !a.startsWith('--')).map((s) => resolve(s));
if (!scenes.length) { const d = mkdtempSync(join(tmpdir(), 'cozy-smoke-')); execSync(`node ${join(here, 'example.spec.mjs')} ${join(d, 'example.json')}`, { stdio: 'inherit' }); scenes = [join(d, 'example.json')]; }
const { chromium } = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let bad = 0;
await Promise.all(scenes.map(async (scene) => {
  const errors = [];
  try { execSync(`node ${join(here, 'build.mjs')} ${scene}`, { stdio: 'pipe' }); } catch (e) { errors.push('build failed: ' + String(e.stderr || e.message).slice(0, 300)); }
  if (!errors.length) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 750 } });
    page.on('pageerror', (e) => errors.push('uncaught: ' + String(e.stack || e).slice(0, 300)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 300)); });
    await page.goto('file://' + scene.replace(/\.json$/, '.html'));
    await page.waitForFunction(() => window.cozyScene && window.cozyBaked, null, { timeout: 55000 }).catch(() => errors.push('the page did not finish loading within 55 s (window.cozyScene / cozyBaked missing)'));
    await page.close();
  }
  if (errors.length) { bad++; console.log(`[smoke] ${scene}: ${errors.length} error(s)\n  ` + [...new Set(errors)].join('\n  ')); } else console.log(`[smoke] ${scene}: page loads clean`);
}));
await browser.close();
process.exitCode = bad ? 1 : 0;
