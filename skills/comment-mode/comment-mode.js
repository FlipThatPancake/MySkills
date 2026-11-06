/* comment-mode: Figma-style comments for any HTML page. Press C or use the toolbar; Esc exits.
   Click the page to drop a pin and type; Enter saves. Copy or Download exports JSON. */
(() => {
  if (window.__commentMode) return;
  window.__commentMode = true;
  const KEY = 'comment-mode:' + location.pathname;
  let items = [], on = false, box = null; // box: { c, isNew, el }
  const pinEls = new Map();
  try { items = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) {}
  let seq = items.reduce((m, c) => Math.max(m, c.n), 0);
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {} };
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

  // Where a comment lives: a CSS path to the element plus a position inside it.
  const selectorOf = (el) => {
    const parts = [];
    for (; el && el !== document.documentElement; el = el.parentElement) {
      if (el.id) { parts.unshift('#' + CSS.escape(el.id)); break; }
      let i = 1;
      for (let s = el.previousElementSibling; s; s = s.previousElementSibling) if (s.localName === el.localName) i++;
      parts.unshift(el.localName + ':nth-of-type(' + i + ')');
    }
    return parts.join(' > ');
  };
  const sectionOf = (el) => {
    const s = el.closest('section,article,[data-slide],[role=tabpanel],main');
    const h = s && s.querySelector('h1,h2,h3');
    return h ? clean(h.textContent).slice(0, 80) : '';
  };
  const findEl = (c) => { try { return document.querySelector(c.selector); } catch (e) { return null; } };
  const pointOf = (c) => {
    const el = findEl(c);
    if (!el || (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true }))) return null;
    const r = el.getBoundingClientRect();
    return [r.left + c.fx * r.width, r.top + c.fy * r.height];
  };

  // UI lives in a shadow root so page styles cannot touch it.
  const host = document.createElement('div');
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>
    :host{position:fixed;inset:0;pointer-events:none;z-index:2147483647;font:13px/1.4 system-ui,sans-serif;
      --bg:#fff;--fg:#1b1b1b;--line:#d9d9d9;--blue:#0d99ff}
    @media (prefers-color-scheme:dark){:host{--bg:#2c2c2c;--fg:#f2f2f2;--line:#4a4a4a}}
    @media print{:host{display:none}}
    button{font:inherit;cursor:pointer;border:0;border-radius:8px;padding:6px 10px;background:transparent;color:inherit}
    .bar{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);display:flex;gap:2px;padding:4px;
      background:#1e1e1e;color:#fff;border-radius:12px;box-shadow:0 4px 16px #0006;pointer-events:auto}
    .bar button:hover{background:#ffffff22}.bar .on{background:var(--blue)}
    .pin{position:fixed;left:0;top:0;width:26px;height:26px;margin:-26px 0 0 0;border-radius:13px 13px 13px 0;
      background:var(--blue);color:#fff;font-weight:600;text-align:center;line-height:26px;border:2px solid #fff;
      box-sizing:border-box;box-shadow:0 2px 6px #0005;pointer-events:auto;cursor:pointer;padding:0}
    .box{position:fixed;left:0;top:0;width:260px;padding:8px;background:var(--bg);color:var(--fg);
      border:1px solid var(--line);border-radius:12px;box-shadow:0 6px 24px #0004;pointer-events:auto}
    textarea{width:100%;box-sizing:border-box;min-height:64px;resize:vertical;font:inherit;color:inherit;
      background:transparent;border:1px solid var(--line);border-radius:8px;padding:6px}
    .row{display:flex;justify-content:flex-end;gap:6px;margin-top:6px}
    .row .go{background:var(--blue);color:#fff}.row .del{color:#e5484d}
  </style><div class="bar"><button data-a="mode">Comment (C)</button><button data-a="copy">Copy JSON</button>
  <button data-a="dl">Download</button><button data-a="clear">Clear</button></div><div id="pins"></div>`;
  const $ = (s) => root.querySelector(s);
  const pins = $('#pins');

  const css = document.createElement('style');
  css.textContent = 'html.cm-on,html.cm-on *{cursor:crosshair!important}';
  const mount = () => { document.head.appendChild(css); document.body.appendChild(host); };
  document.body ? mount() : document.addEventListener('DOMContentLoaded', mount);

  const setMode = (v) => {
    on = v;
    document.documentElement.classList.toggle('cm-on', on);
    $('[data-a=mode]').classList.toggle('on', on);
    if (!on) closeBox(true);
  };

  function render() {
    pins.textContent = '';
    pinEls.clear();
    for (const c of items.concat(box && box.isNew ? [box.c] : [])) {
      const b = document.createElement('button');
      b.className = 'pin';
      b.textContent = c.n;
      b.title = c.text || 'New comment';
      b.onclick = (e) => { e.stopPropagation(); if (!box || box.c !== c) { closeBox(true); openBox(c, false); } };
      pinEls.set(c, b);
      pins.appendChild(b);
    }
    $('[data-a=clear]').hidden = !items.length;
  }

  function openBox(c, isNew) {
    const el = document.createElement('div');
    el.className = 'box';
    el.innerHTML = '<textarea placeholder="Add a comment"></textarea><div class="row"><button class="del">Delete</button><button class="go">Save ↵</button></div>';
    const ta = el.querySelector('textarea');
    ta.value = c.text || '';
    el.querySelector('.del').hidden = isNew;
    el.querySelector('.del').onclick = () => { items = items.filter((x) => x !== c); save(); closeBox(false); };
    el.querySelector('.go').onclick = () => closeBox(true);
    ta.onkeydown = (e) => {
      e.stopPropagation();
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); closeBox(true); }
      if (e.key === 'Escape') closeBox(false);
    };
    box = { c, isNew, el };
    root.appendChild(el);
    render();
    ta.focus();
  }
  // commit=true keeps the text; an empty comment is dropped.
  function closeBox(commit) {
    if (!box) return;
    const { c, isNew, el } = box;
    const text = el.querySelector('textarea').value.trim();
    box = null;
    el.remove();
    if (commit && text) {
      c.text = text;
      if (isNew) items.push(c);
    } else if (commit && !isNew) {
      items = items.filter((x) => x !== c);
    }
    save();
    render();
  }

  // Keep pins and the open box attached to their element through scrolling, resizing and animation.
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  (function tick() {
    for (const c of items.concat(box && box.isNew ? [box.c] : [])) {
      const p = pointOf(c), pin = pinEls.get(c);
      if (!pin) continue;
      pin.hidden = !p;
      if (p) pin.style.transform = `translate(${p[0]}px,${p[1]}px)`;
    }
    if (box) {
      const p = pointOf(box.c);
      if (p) box.el.style.transform = `translate(${clamp(p[0] + 8, 8, innerWidth - 276)}px,${clamp(p[1] + 8, 8, innerHeight - box.el.offsetHeight - 8)}px)`;
    }
    requestAnimationFrame(tick);
  })();

  // While commenting, the page must not react to clicks.
  const inUi = (e) => e.composedPath().includes(host);
  for (const t of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'dblclick'])
    document.addEventListener(t, (e) => { if (on && !inUi(e)) { e.preventDefault(); e.stopPropagation(); } }, true);
  document.addEventListener('click', (e) => {
    if (!on || inUi(e)) return;
    e.preventDefault();
    e.stopPropagation();
    if (box) return closeBox(true);
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const alt = el.getAttribute('alt') || el.getAttribute('aria-label') || '';
    let context = null;
    try { context = typeof window.commentContext === 'function' ? window.commentContext() : null; } catch (err) {}
    openBox({
      n: ++seq, text: '', selector: selectorOf(el), section: sectionOf(el),
      element: el.localName + (clean(alt || el.textContent) ? ' "' + clean(alt || el.textContent).slice(0, 80) + '"' : ''),
      fx: r.width ? (e.clientX - r.left) / r.width : 0.5, fy: r.height ? (e.clientY - r.top) / r.height : 0.5,
      at: new Date().toISOString(), context,
    }, true);
  }, true);

  document.addEventListener('keydown', (e) => {
    const t = e.composedPath()[0];
    if (e.key === 'Escape') return box ? closeBox(false) : setMode(false);
    if (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey && !/^(input|textarea|select)$/i.test(t.localName) && !t.isContentEditable) setMode(!on);
  });

  const exportData = () => ({
    page: document.title,
    exportedAt: new Date().toISOString(),
    comments: items.map((c) => ({
      n: c.n, comment: c.text, section: c.section, element: c.element, selector: c.selector,
      positionInElement: { x: +(c.fx * 100).toFixed(1) + '%', y: +(c.fy * 100).toFixed(1) + '%' },
      ...(c.context ? { context: c.context } : {}),
    })),
  });
  const flash = (b, msg) => { const old = b.textContent; b.textContent = msg; setTimeout(() => (b.textContent = old), 1500); };
  root.querySelector('.bar').onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const json = JSON.stringify(exportData(), null, 2);
    if (b.dataset.a === 'mode') setMode(!on);
    if (b.dataset.a === 'copy') {
      const fallback = () => { const ta = document.createElement('textarea'); ta.value = json; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); };
      (navigator.clipboard ? navigator.clipboard.writeText(json) : Promise.reject()).catch(fallback).then(() => flash(b, 'Copied ✓'));
    }
    if (b.dataset.a === 'dl') {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      a.download = (clean(document.title).replace(/\W+/g, '-').toLowerCase() || 'page') + '-comments.json';
      a.click();
      URL.revokeObjectURL(a.href);
    }
    if (b.dataset.a === 'clear' && confirm('Delete all ' + items.length + ' comments?')) { closeBox(false); items = []; save(); render(); }
  };
  render();
})();
