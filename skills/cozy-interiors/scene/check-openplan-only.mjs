#!/usr/bin/env node
// node check-openplan-only.mjs <scene.json> [--quick] → only the open-plan rules (check-openplan.mjs), for tuning views fast.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openPlanIssues } from './check-openplan.mjs';
const here = dirname(fileURLToPath(import.meta.url)), scene = resolve(process.argv[2]);
execSync(`node ${join(here, 'build.mjs')} ${scene}`, { stdio: 'ignore' });
const { chromium } = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 750 } });
await page.goto('file://' + scene.replace(/\.json$/, '.html') + '?check'); await page.waitForFunction(() => window.cozyScene);
const issues = await openPlanIssues(page, scene, { quick: process.argv.includes('--quick') });
await browser.close();
for (const i of issues) console.log(`[${i.rule}] ${i.what}`);
console.log(issues.length ? `${issues.length} open-plan issue(s)` : 'Open plan: no problems.');
