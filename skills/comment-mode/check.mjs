#!/usr/bin/env node
// Usage: node check.mjs [--theme=agent-default] [--css=file.css] [--sizes=1440x900,1280x720] page.html
// Renders the page with each toolbar spot and layout (row, column) and reports what the toolbar would cover, with comment mode off and on.
// Counts text, images, controls and drawn shapes on every slide (hidden slides keep their layout), not empty space.
import { execFileSync } from 'node:child_process';
import { copyFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve, basename, dirname } from 'node:path';
let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch (e) { console.error('check.mjs needs Playwright; look at the page yourself instead.'); process.exit(2); }
const args = process.argv.slice(2);
const opt = (k, d) => (args.find((a) => a.startsWith('--' + k + '=')) || '').slice(k.length + 3) || d;
const sizes = opt('sizes', '1440x900,1280x720').split(',').map((z) => z.split('x').map(Number));
const page = resolve(args.find((a) => !a.startsWith('--')) || '');
const SPOTS = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];
const browser = await chromium.launch();
const results = [];
for (const spot of SPOTS) for (const layout of ['row', 'column']) {
  // A copy next to the original, so relative assets still load.
  const file = join(dirname(page), '.cm-check-' + spot + '-' + basename(page));
  copyFileSync(page, file);
  execFileSync('node', [new URL('add.mjs', import.meta.url).pathname, '--toolbar=' + spot, ...(layout === 'column' ? ['--layout=column'] : []), ...(opt('theme') ? ['--theme=' + opt('theme')] : []), ...(opt('css') ? ['--css=' + opt('css')] : []), file]);
  const r = { spot: spot + (layout === 'column' ? ', column' : ''), off: new Set(), on: new Set() };
  for (const [w, h] of sizes) {
  const tab = await browser.newPage({ viewport: { width: w, height: h } });
  await tab.addInitScript(() => {
    localStorage.setItem('comment-mode:tip-seen', '1');
    localStorage.setItem('comment-mode:' + location.pathname, JSON.stringify({ dirty: true, items: [{ n: 1, text: 'x', selector: 'body', fx: 0.5, fy: 0.5, target: { type: 'empty space' } }] }));
  });
  await tab.goto('file://' + file);
  await tab.waitForTimeout(800);
  const covered = async () => tab.evaluate(() => {
    const host = [...document.body.children].find((e) => e.shadowRoot && e.shadowRoot.querySelector('.bar'));
    const bars = [...host.shadowRoot.querySelectorAll('.bar .p')].filter((b) => !b.hidden && b.offsetWidth).map((b) => b.getBoundingClientRect());
    const big = (r) => r.width * r.height > 0.35 * innerWidth * innerHeight;
    const hits = new Set();
    const hit = (r) => bars.some((b) => r.width && r.height && r.left < b.right + 8 && r.right > b.left - 8 && r.top < b.bottom + 8 && r.bottom > b.top - 8);
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n; (n = walk.nextNode());) {
      const el = n.parentElement;
      if (!n.nodeValue.trim() || !el || el.closest('script,style') || host.contains(el)) continue;
      const rg = document.createRange();
      rg.selectNodeContents(n);
      if ([...rg.getClientRects()].some(hit)) hits.add(el.closest('p,li,h1,h2,h3,h4,button,a,label,figcaption,text') || el);
    }
    for (const el of document.body.querySelectorAll('img,video,canvas,button,a,input,select,textarea,svg *')) {
      const r = el.getBoundingClientRect();
      if (el.closest('defs,clipPath,mask') || big(r) || host.contains(el)) continue;
      if (hit(r)) hits.add(el instanceof SVGElement && el.localName !== 'text' ? el.closest('svg') : el);
    }
    return [...hits].map((el) => el.localName + (el.id ? '#' + el.id : '') + ': ' + (el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 50));
  });
  for (const t of await covered()) r.off.add(t);
  await tab.keyboard.press('c');
  await tab.waitForTimeout(600);
  for (const t of await covered()) r.on.add(t);
  await tab.close();
  }
  results.push({ spot: r.spot, off: [...r.off], on: [...r.on] });
  rmSync(file);
}
await browser.close();
for (const r of results) {
  console.log(`${r.spot}: covers ${r.off.length} with comment mode off, ${r.on.length} with it on`);
  for (const t of [...new Set(r.off.concat(r.on))].slice(0, 5)) console.log('   ' + t);
}
// Least covered wins, mode off counting most; ties go to a corner, the least distracting place for a full toolbar.
const score = (r) => (r.off.length * 3 + r.on.length) * 10 + (r.spot.includes('center') ? 1 : 0);
const best = results.slice().sort((a, b) => score(a) - score(b))[0];
const [spot, layout] = best.spot.split(', ');
console.log((best.off.length + best.on.length ? 'No option is clear. Least covered: ' : 'Recommended: ') + `--toolbar=${spot}` + (layout ? ' --layout=column' : ''));
