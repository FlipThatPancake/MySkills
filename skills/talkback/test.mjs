#!/usr/bin/env node
// Usage: node test.mjs [--size=1440x900] [--setup='js'] page.html
// Tests Talkback on a page it is installed in: the theme took effect, the toolbar fits and nothing in it overlaps,
// and commenting, saving, export and clearing work. Each run starts with no stored comments. Exits 1 on any failure.
// A first-visit dialog (role=dialog, aria-modal or <dialog open>) is passed by clicking its first button; --setup runs your own JS instead.
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch (e) { console.error('test.mjs needs Playwright.'); process.exit(2); }
const args = process.argv.slice(2);
const [W, H] = ((args.find((a) => a.startsWith('--size=')) || '').slice(7) || '1440x900').split('x').map(Number);
const file = resolve(args.find((a) => !a.startsWith('--')) || '');
const setup = (args.find((a) => a.startsWith('--setup=')) || '').slice(8);
let failed = 0;
const check = (name, ok, detail = '') => { if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || !detail ? '' : ' — ' + detail)); };
const near = (a, b, d = 3) => a && b && Math.abs(a[0] - b[0]) <= d && Math.abs(a[1] - b[1]) <= d;
const overlap = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'] });
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));
await p.goto('file://' + file);
await p.evaluate(() => localStorage.clear());
await p.reload();
await p.waitForTimeout(600);
// Get past anything a first visit puts in front of the page, so comments land on the page itself.
const gate = setup ? await p.evaluate(setup) : await p.evaluate(() => {
  const d = [...document.querySelectorAll('[aria-modal="true"],[role="dialog"],dialog[open]')].find((e) => e.checkVisibility() && e.querySelector('button'));
  if (d) d.querySelector('button').click();
  return d && (d.getAttribute('aria-label') || d.id || d.localName);
});
if (gate) { console.log('Passed a first-visit dialog: ' + gate); await p.waitForTimeout(800); }

// Everything below reads the toolbar's shadow root.
const ui = (fn, arg) => p.evaluate(([src, arg]) => {
  const host = [...document.body.children].find((e) => e.shadowRoot && e.shadowRoot.querySelector('.bar'));
  const $ = (s) => host && host.shadowRoot.querySelector(s);
  const $$ = (s) => (host ? [...host.shadowRoot.querySelectorAll(s)] : []);
  const shown = (el) => !!el && !el.closest('[hidden]') && el.getClientRects().length > 0;
  const rect = (el) => { if (!el) throw new Error('a toolbar or comment element it needed is missing'); const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
  return new Function('host', '$', '$$', 'shown', 'rect', 'arg', 'return (' + src + ')(arg)')(host, $, $$, shown, rect, arg);
}, [fn.toString(), arg]);
const settle = (ms = 700) => p.waitForTimeout(ms);
const visibleButtons = () => ui(() => $$('.bar .p').filter(shown).map((b) => b.dataset.a));
const center = (sel) => ui((sel) => { const r = rect($(sel)); return [r.left + r.width / 2, r.top + r.height / 2]; }, sel);

// A spot with no text or control under it, away from the toolbar, for point comments.
const spot = await p.evaluate(() => {
  const bar = [...document.body.children].find((e) => e.shadowRoot)?.shadowRoot.querySelector('.bar').getBoundingClientRect();
  for (let y = 0.3; y < 0.8; y += 0.05) for (let x = 0.35; x < 0.75; x += 0.05) {
    const px = Math.round(innerWidth * x), py = Math.round(innerHeight * y), el = document.elementFromPoint(px, py);
    const c = document.caretRangeFromPoint(px, py), t = document.createRange();
    if (c && c.startContainer.nodeType === 3) t.selectNodeContents(c.startContainer);
    const onText = [...t.getClientRects()].some((q) => px >= q.left - 4 && px <= q.right + 4 && py >= q.top - 4 && py <= q.bottom + 4);
    if (el && !el.closest('a,button,input,select,textarea,img,text') && !onText &&!(bar && px > bar.left - 40 && px < bar.right + 40 && py > bar.top - 40 && py < bar.bottom + 40)) return [px, py];
  }
  return null;
});
// The first few visible words, for a text selection.
const words = await p.evaluate(() => {
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) {
    const t = n.nodeValue, i = t.search(/\S{3,}/), el = n.parentElement;
    if (i < 0 || el.closest('script,style,button,a') || !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
    const r = document.createRange(); r.setStart(n, i); r.setEnd(n, Math.min(t.length, i + 12));
    const q = r.getBoundingClientRect();
    if (q.width > 20 && q.top > 0 && q.bottom < innerHeight) return { text: r.toString(), from: [q.left + 1, q.top + q.height / 2], to: [q.right - 1, q.top + q.height / 2] };
  }
  return null;
});

let stage = 'install';
try {
// 1. Install and theme
const theme = await ui(() => { const b = $('.tg'), s = getComputedStyle(b); return { ok: !!b, themed: /PP Neue Montreal/.test((window.talkbackOptions || {}).css || ''), font: s.fontFamily, h: b.offsetHeight }; });
check('toolbar is installed', theme.ok);
if (theme.themed) {
  check('author theme: buttons use PP Neue Montreal', /PP Neue Montreal/.test(theme.font), theme.font);
  check('author theme: buttons are 48px tall', theme.h === 48, theme.h + 'px');
  check('author theme: font face loaded', await p.evaluate(() => document.fonts.check("500 14px 'PP Neue Montreal'")));
}

stage = 'mode off';
// 2. Mode off, no comments: the toggle alone
check('mode off shows only the toggle', JSON.stringify(await visibleButtons()) === '["tg"]', JSON.stringify(await visibleButtons()));

stage = 'point comment';
// 3. A point comment: the bubble tip marks the spot, the numbered pin waits until the box closes
await p.keyboard.press('c');
await settle(300);
check('C turns Talkback on', await ui(() => $('.bar').classList.contains('on')));
const tip = await ui(() => shown($('.tip')));
if (tip) { await p.mouse.click(...(await center('.tip button'))); await settle(300); }
check('first-time hint dismisses', !(await ui(() => shown($('.tip')))));
const pageClicks = await p.evaluate(() => { window.__cmClicks = 0; document.addEventListener('click', () => window.__cmClicks++); return 0; });
check('found an empty spot to comment on', !!spot);
if (spot) {
  await p.mouse.click(...spot);
  await settle(400);
  const open = await ui(() => { const bub = $('.box .bub'), f = $('.box .field'); if (!bub) return null; const r = rect(bub); return { tip: $('.box').classList.contains('flip') ? [r.right - 1, r.bottom - 2] : [r.left + 1, r.bottom - 2], pins: $$('.pin').filter(shown).length, fieldH: rect(f).height, inView: rect($('.box')).left >= 0 && rect($('.box')).right <= innerWidth }; });
  check('clicking opens a comment box', !!open);
  check('the bubble tip sits on the clicked spot', open && near(open.tip, spot), open && JSON.stringify(open.tip) + ' vs ' + JSON.stringify(spot));
  check('no numbered pin while the new box is open', open && open.pins === 0, open && open.pins + ' pins');
  check('an empty box is one line tall', open && open.fieldH <= 56, open && open.fieldH + 'px');
  check('the box stays on screen', open && open.inView);
  check('the page does not receive the click', (await p.evaluate(() => window.__cmClicks)) === 0);
  await p.keyboard.type('Point comment');
  await p.keyboard.press('Enter');
  await settle(400);
  const pin = await ui(() => { const el = $$('.pin').find(shown); if (!el) return null; const r = rect(el); return { at: [r.left, r.bottom], n: el.textContent }; });
  check('Enter saves it as pin 1 at the spot', pin && pin.n === '1' && near(pin.at, spot), pin && JSON.stringify(pin));
}

stage = 'text comment';
// 4. A text comment
check('found text to select', !!words);
if (words) {
  await p.mouse.move(...words.from); await p.mouse.down(); await p.mouse.move(...words.to, { steps: 5 }); await p.mouse.up();
  await settle(400);
  check('selecting text opens a comment box', await ui(() => shown($('.box'))));
  const mk = await ui(() => $$('.mk i').map((i) => [i.style.left, i.style.width, shown(i)]));
  check('the selection is highlighted', mk.some((m) => m[2]), JSON.stringify(mk) + ' ' + words.text);
  await p.keyboard.type('Text comment');
  await p.keyboard.press('Enter');
  await settle(400);
}

stage = 'toolbar';
// 5. Toolbar with comments: every button on screen, none overlapping, labels open on hover
await p.mouse.move(W / 2, H / 2);
await settle();
const bar = await ui(() => $$('.bar .p').filter(shown).map((b) => ({ a: b.dataset.a, r: rect(b), label: b.querySelector('.n') ? b.querySelector('.n').textContent : '' })));
check('mode on shows toggle, download, copy and clear', ['tg', 'dl', 'cp', 'cl'].every((a) => bar.some((b) => b.a === a)), bar.map((b) => b.a).join(','));
check('the toolbar is fully on screen', bar.every((b) => b.r.left >= 0 && b.r.top >= 0 && b.r.right <= W && b.r.bottom <= H));
check('no two toolbar buttons overlap', bar.every((a, i) => bar.every((b, j) => j <= i || !overlap(a.r, b.r))));
check('download counts the unsaved comments', /^2 unsaved$/i.test((bar.find((b) => b.a === 'dl') || {}).label || ''));
for (const a of ['cp', 'cl']) {
  await p.mouse.move(...(await center('.' + a)));
  await settle();
  const lb = await ui((a) => { const l = $('.' + a + ' .lb'); return { w: rect(l).width, o: +getComputedStyle(l).opacity }; }, a);
  check(`hovering ${a === 'cp' ? 'Copy' : 'Clear'} shows its label`, lb.w > 10 && lb.o > 0.9, JSON.stringify(lb));
}
await p.mouse.move(...(await center('.dl')));
await settle();
check('hovering download shows "Download comments"', await ui(() => shown($('.dl .h')) && rect($('.dl .h')).width > 10 && +getComputedStyle($('.dl .h')).opacity > 0.9));
const nowBar = await ui(() => $$('.bar .p').filter(shown).map((b) => rect(b)));
check('no buttons overlap while a label is open', nowBar.every((a, i) => nowBar.every((b, j) => j <= i || !overlap(a, b))));

stage = 'export';
// 6. Export
const [dl] = await Promise.all([p.waitForEvent('download'), p.mouse.click(...(await center('.dl')))]);
let json = null;
try { json = JSON.parse(await (await import('node:fs')).promises.readFile(await dl.path(), 'utf8')); } catch (e) {}
check('download saves valid JSON with both comments', json && json.comments.length === 2, json ? json.comments.length + ' comments' : 'not JSON');
check('the export keeps the selected words', !words || (json && json.comments.some((c) => c.target && c.target.type === 'text selection' && c.target.text === words.text.replace(/\s+/g, ' ').trim())));
await p.mouse.click(...(await center('.cp')));
await settle(300);
let clip = null;
try { clip = JSON.parse(await p.evaluate(() => navigator.clipboard.readText())); } catch (e) {}
check('Copy JSON puts the comments on the clipboard', clip && clip.comments.length === 2);
await p.keyboard.press('Escape');
await settle();
check('after saving, mode off shows only the toggle', JSON.stringify(await visibleButtons()) === '["tg"]', JSON.stringify(await visibleButtons()));

stage = 'reload';
// 7. Comments survive a reload
await p.reload();
await settle(600);
await p.keyboard.press('c');
await settle(300);
check('comments survive a reload', (await ui(() => $$('.pin').filter(shown).length)) === 2);

stage = 'reopen and delete';
// 8. Reopen and delete
const pin1 = await ui(() => { const r = rect($$('.pin').find((e) => shown(e) && e.textContent === '1')); return [r.left + r.width / 2, r.top + r.height / 2]; });
await p.mouse.click(...pin1);
await settle(400);
check('clicking a pin reopens its comment', (await ui(() => $('.box textarea') && $('.box textarea').value)) === 'Point comment');
check('the reopened box hides its pin', (await ui(() => $$('.pin').filter(shown).length)) === 1);
await p.mouse.click(...(await center('.box .del')));
await settle(400);
check('delete removes the comment', (await ui(() => $$('.pin').filter(shown).length)) === 1);

stage = 'clear';
// 9. Clear needs two clicks
await p.mouse.click(...(await center('.cl')));
await settle(300);
check('the first Clear click only asks to confirm', (await ui(() => $$('.pin').filter(shown).length)) === 1 && /again/i.test(await ui(() => $('.cl .lb').textContent)));
await p.mouse.click(...(await center('.cl')));
await settle(300);
check('the second Clear click removes every comment', (await ui(() => $$('.pin').length)) === 0);

stage = 'leaving';
// 10. Leaving
await p.keyboard.press('Escape');
await settle(300);
check('Esc turns Talkback off', !(await ui(() => $('.bar').classList.contains('on'))));
} catch (e) {
  check(`the test stopped at "${stage}"`, false, String(e.message).split('\n')[0].replace(/^.*Error: /, ''));
}

// 11. Live: a copy of the page is served by live.mjs; a message goes to the agent commands and the reply comes back.
try {
  stage = 'live';
  const { mkdtempSync, copyFileSync, readFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { spawn, execFileSync } = await import('node:child_process');
  const { join, dirname, basename } = await import('node:path');
  const dir = mkdtempSync(join(tmpdir(), 'talkback-live-')), live = join(dirname(new URL(import.meta.url).pathname), 'live.mjs');
  copyFileSync(file, join(dir, 'page.html'));
  const helper = spawn('node', [live, 'serve', 'page.html'], { cwd: dir, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 1000));
  const rt = JSON.parse(readFileSync(join(dir, '.talkback-live.json'), 'utf8'));
  const agent = (...a) => execFileSync('node', [live, ...a, '--dir=' + dir], { encoding: 'utf8' });
  const lp = await ctx.newPage();
  lp.on('pageerror', (e) => errors.push(e.message));
  await lp.goto(`http://127.0.0.1:${rt.port}/page.html?tb=${rt.token}`);
  if (setup) await lp.evaluate(setup);
  await lp.waitForTimeout(2500);
  const lui = (fn, arg) => lp.evaluate(([src, arg]) => {
    const host = [...document.body.children].find((e) => e.shadowRoot && e.shadowRoot.querySelector('.bar'));
    const $ = (s) => host.shadowRoot.querySelector(s), $$ = (s) => [...host.shadowRoot.querySelectorAll(s)];
    return new Function('$', '$$', 'arg', 'return (' + src + ')(arg)')($, $$, arg);
  }, [fn.toString(), arg]);
  check('live: the helper is found, nobody listening yet', (await lui(() => $('.bar').dataset.live)) === 'wait');
  check('live: the first-time guide shows once', await lui(() => !$('.panel').hidden && /Point at anything/.test($('.panel').textContent)));
  await lui(() => $('.panel button').click());
  const waiting = spawn('node', [live, 'wait', '--timeout=20', '--dir=' + dir]);
  let got = '';
  waiting.stdout.on('data', (d) => (got += d));
  await lp.waitForTimeout(2200);
  check('live: an open wait turns the dot green', (await lui(() => $('.bar').dataset.live)) === 'ok');
  await lp.keyboard.press('c');
  await lp.mouse.click(...spot);
  await lp.waitForTimeout(300);
  await lp.keyboard.type('Make this bigger');
  await lp.keyboard.press('Enter');
  await new Promise((r) => waiting.on('close', r));
  const msg = JSON.parse(got).messages[0];
  check('live: the agent receives the message with its target', msg && msg.messages[0] === 'Make this bigger' && msg.target && msg.selector, got.slice(0, 200));
  await lp.waitForTimeout(1800);
  check('live: the page shows it as picked up', /Picked up/.test(await lui(() => $('.conv').textContent)));
  agent('reply', String(msg.n), 'Done: it is bigger.', '--done');
  await lp.waitForTimeout(2200);
  check('live: the reply appears on the page', /Done: it is bigger\./.test(await lui(() => $('.conv').textContent)) && /Done, check it/.test(await lui(() => $('.conv .hd').textContent)));
  await lui(() => $('.rs').click());
  await lp.waitForTimeout(2200);
  check('live: only the user resolves, and it reaches the helper', /resolved/.test(JSON.parse(readFileSync(join(dir, 'page.html.talkback.json'), 'utf8')).threads[0].resolved ? 'resolved' : ''));
  await lp.keyboard.press('Escape');
  helper.kill();
  await lp.waitForTimeout(3200);
  check('live: with the helper stopped the dot goes grey', (await lui(() => $('.bar').dataset.live)) === 'off');
  await lp.close();
} catch (e) {
  check(`the live test stopped at "${stage}"`, false, String(e.message).split('\n')[0]);
}

// 12. claude.ai: with the comments capability present, Talkback points and hands the target to claude.ai's composer.
try {
  stage = 'claude.ai';
  const cp = await ctx.newPage();
  cp.on('pageerror', (e) => errors.push(e.message));
  await cp.addInitScript(() => {
    window.__calls = [];
    window.claude = { use: async (n) => (n === 'comments' ? { canSendToClaude: async () => 'available', customAnchors: async (cb) => { window.__cb = cb; return { domAnchor: (el, ev) => ['path:' + el.localName, { x: ev.clientX, y: ev.clientY }], compose: async (a, at, o) => { window.__calls.push({ a, o }); return { opened: true }; }, placed: (m) => { window.__placed = m; }, exitMode() {}, release() {}, areas: false, open: async () => {} }; } } : null) };
  });
  await cp.goto('file://' + file);
  if (setup) await cp.evaluate(setup);
  await cp.waitForTimeout(800);
  const hidden = await cp.evaluate(() => { const h = [...document.body.children].find((e) => e.shadowRoot && e.shadowRoot.querySelector('.bar')); return h.shadowRoot.querySelector('.bar').hidden; });
  check('claude.ai: Talkback hides its own toolbar', hidden);
  await cp.evaluate(() => window.__cb.mode(true));
  await cp.mouse.click(...spot);
  await cp.waitForTimeout(300);
  const call = await cp.evaluate(() => window.__calls[0]);
  check('claude.ai: a click opens claude.ai\'s composer with the target', !!call && /path:/.test(call.a) && !!call.o.label && /"selector"/.test(call.o.detail), JSON.stringify(call));
  await cp.evaluate(() => window.__cb.mode(false));
  check('claude.ai: leaving comment mode stops the pointing', !(await cp.evaluate(() => document.documentElement.classList.contains('cm-on'))));
  await cp.close();
} catch (e) {
  check(`the claude.ai test stopped at "${stage}"`, false, String(e.message).split('\n')[0]);
}
check('no script errors', errors.length === 0, errors.join(' | '));

await browser.close();
console.log(failed ? `${failed} failed` : 'all passed');
process.exit(failed ? 1 : 0);
