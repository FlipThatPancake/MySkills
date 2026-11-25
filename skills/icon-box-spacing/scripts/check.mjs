// node check.mjs <page.html|url> --box <css> --icon <css> [--sizes 14,16,24] [--tol 1]
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const a = process.argv.slice(2), opt = (n, d) => (a.includes(n) ? a[a.indexOf(n) + 1] : d);
const target = a[0], box = opt('--box'), icon = opt('--icon');
const sizes = opt('--sizes', '14,16,24').split(',').map(Number), tol = +opt('--tol', 1);
if (!target || !box || !icon) { console.error('usage: check.mjs <page> --box <css> --icon <css> [--sizes 14,16,24] [--tol 1]'); process.exit(2); }
const url = /^https?:|^file:/.test(target) ? target : 'file://' + resolve(target);
const b = await chromium.launch(), p = await b.newPage();
await p.goto(url);
let bad = 0;
for (const fs of sizes) {
  const r = await p.evaluate(([box, icon, fs]) => {
    const B = document.querySelector(box), I = B.querySelector(icon);
    B.style.fontSize = fs + 'px';
    const bb = B.getBoundingClientRect(), ib = I.getBoundingClientRect();
    const T = I.nextElementSibling, rg = document.createRange(); rg.selectNodeContents(T);
    const line = rg.getClientRects()[0];
    return { top: ib.top - bb.top, left: ib.left - bb.left, gap: line.left - ib.right,
             offCenter: (ib.top + ib.height / 2) - (line.top + line.height / 2) };
  }, [box, icon, fs]);
  const issues = [];
  if (Math.abs(r.top - r.left) > tol) issues.push(`top inset ${r.top.toFixed(1)} != left inset ${r.left.toFixed(1)}`);
  if (Math.abs(r.gap - r.left) > tol) issues.push(`gap to text ${r.gap.toFixed(1)} != left inset ${r.left.toFixed(1)}`);
  if (Math.abs(r.offCenter) > tol) issues.push(`icon centre ${r.offCenter.toFixed(1)}px off first-line centre`);
  bad += issues.length;
  console.log(`${fs}px: ${issues.length ? 'FAIL ' + issues.join('; ') : 'ok'}`);
}
await b.close(); process.exit(bad ? 1 : 0);
