/* comment-mode: Figma-style comments for any HTML page. Press C or use the toggle; Esc exits.
   Select text or click anything to comment; Enter saves. Copy JSON or Download exports every comment.
   With comment mode off, only the toggle stays, plus the download button while comments are unsaved. */
(() => {
  if (window.__commentMode) return;
  window.__commentMode = true;
  const KEY = 'comment-mode:' + location.pathname;
  const SPOTS = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];
  const spot = SPOTS.includes((window.commentModeOptions || {}).toolbar) ? window.commentModeOptions.toolbar : 'bottom-center';
  const col = (window.commentModeOptions || {}).layout === 'column'; // actions stack above or below the toggle instead of beside it
  const COLORS = ['#0d99ff', '#f69b13', '#af63f2', '#f35151', '#1fbf5a', '#10b8c4', '#e5469a'];
  let items = [], dirty = false, on = false, box = null, picked = false, armed = 0; // box: { c, isNew, el }
  const pinEls = new Map(), markEls = new Map();
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    items = Array.isArray(d) ? d : (d && d.items) || [];
    dirty = Array.isArray(d) ? items.length > 0 : !!(d && d.dirty);
  } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ items, dirty })); } catch (e) {} };
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const cut = (s, n = 120) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
  const colorOf = (c) => COLORS[(c.n - 1) % COLORS.length];
  const isText = (c) => c.quote !== undefined; // a text selection; other comments hang from a point

  // Where a comment lives: a CSS path to the element, plus a position inside it or the selected characters.
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
    return h ? cut(clean(h.textContent), 80) : '';
  };
  const findEl = (c) => { try { return document.querySelector(c.selector); } catch (e) { return null; } };
  // The selected characters as a live Range; the quote is searched again if the text moved.
  function rangeOf(c, el) {
    const all = el.textContent;
    let s = c.start, e = c.end;
    if (all.slice(s, e) !== c.quote) { s = all.indexOf(c.quote); e = s + c.quote.length; }
    if (s < 0) return null;
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), r = document.createRange();
    let pos = 0, n, started = false;
    while ((n = w.nextNode())) {
      const end = pos + n.nodeValue.length;
      if (!started && s < end) { r.setStart(n, s - pos); started = true; }
      if (started && e <= end) { r.setEnd(n, e - pos); return r; }
      pos = end;
    }
    return null;
  }
  // Screen geometry of a comment, or null while it is hidden: rects (text), pin (where its number sits), at (where its box hangs).
  function geoOf(c) {
    const el = findEl(c);
    if (!el || (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true }))) return null;
    if (!isText(c)) {
      const r = el.getBoundingClientRect(), p = [r.left + c.fx * r.width, r.top + c.fy * r.height];
      return { pin: p, at: p };
    }
    const rg = rangeOf(c, el);
    const all = rg ? [...rg.getClientRects()].filter((q) => q.width && q.height) : [];
    const rects = all.filter((a, i) => !all.some((b, j) => j !== i && b.left <= a.left && b.right >= a.right && b.top <= a.top && b.bottom >= a.bottom && (j < i || b.width > a.width || b.height > a.height)));
    if (!rects.length) return null;
    const last = rects[rects.length - 1];
    return { rects, pin: [last.right + 2, last.top], at: [Math.min(...rects.map((q) => q.left)), last.bottom] };
  }

  // What the pointer is over: a named element, an object, one line of text, a text block, or empty space.
  const OBJECTS = 'img,canvas,video,iframe,button,input,select,textarea,a,.katex,.MathJax,math';
  const BLOCKS = 'p,li,h1,h2,h3,h4,h5,h6,blockquote,figcaption,td,th,dt,dd,label,summary,caption,pre,legend';
  const ownText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  const describe = (el) => clean(el.getAttribute('aria-label') || el.getAttribute('alt') || el.getAttribute('title') || el.textContent);
  const union = (rs) => {
    const r = { left: Math.min(...rs.map((q) => q.left)), top: Math.min(...rs.map((q) => q.top)), right: Math.max(...rs.map((q) => q.right)), bottom: Math.max(...rs.map((q) => q.bottom)) };
    return Object.assign(r, { width: r.right - r.left, height: r.bottom - r.top });
  };
  function lineAt(block, x, y) {
    const caret = document.caretRangeFromPoint && document.caretRangeFromPoint(x, y);
    if (!caret || caret.startContainer.nodeType !== 3 || !block.contains(caret.startContainer)) return null;
    const all = document.createRange();
    all.selectNodeContents(block);
    const rs = [...all.getClientRects()].filter((q) => q.width && y >= q.top && y <= q.bottom);
    if (!rs.length) return null;
    const r = union(rs);
    if (x < r.left || x > r.right) return null;
    const mid = (r.top + r.bottom) / 2, a = document.caretRangeFromPoint(r.left + 1, mid), b = document.caretRangeFromPoint(r.right - 0.5, mid);
    let text = '';
    if (a && b) { const t = document.createRange(); t.setStart(a.startContainer, a.startOffset); t.setEnd(b.startContainer, b.startOffset); text = clean(t.toString()); }
    return { el: block, rect: r, type: 'text line', text: text || describe(block), txt: true };
  }
  function targetAt(x, y) {
    let el = document.elementFromPoint(x, y);
    if (el === document.documentElement) el = document.body; // below a short page
    if (!el || el === host) return null;
    const named = el.closest('[data-comment]');
    if (named) return { el: named, type: named.localName, name: named.dataset.comment, text: cut(describe(named)), txt: !!el.closest('text') || (!(el instanceof SVGElement) && !el.closest(OBJECTS) && !!(el.closest(BLOCKS) || ownText(el))) }; // text inside a named element can still be selected
    if (el instanceof SVGElement) return { el, type: el.localName === 'svg' ? 'svg' : 'svg ' + el.localName, text: cut(describe(el)), txt: !!el.closest('text') };
    const obj = el.closest(OBJECTS);
    if (obj) return { el: obj, type: obj.localName === 'a' ? 'link' : obj.matches('.katex,.MathJax,math') ? 'math' : obj.localName, text: cut(describe(obj)) };
    const block = el.closest(BLOCKS) || (ownText(el) ? el : null);
    if (block) return lineAt(block, x, y) || { el: block, type: block.localName, text: cut(describe(block)), txt: true };
    return { el, type: 'empty space', text: '', space: true };
  }
  // The comment a click on already highlighted text belongs to.
  const markAt = (x, y) => items.find((c) => {
    const g = isText(c) && geoOf(c);
    return g && g.rects.some((q) => x >= q.left && x <= q.right && y >= q.top && y <= q.bottom);
  });
  // The comment that selected text would make: attached to the block that holds it, with exact character offsets.
  function fromSelection() {
    const sel = getSelection(), r = sel.rangeCount && sel.getRangeAt(0), quote = r ? r.toString() : '';
    if (!quote.trim()) return null;
    let el = r.commonAncestorContainer;
    if (el.nodeType !== 1) el = el.parentElement || document.body;
    el = el.closest(BLOCKS) || el;
    const pre = document.createRange();
    pre.selectNodeContents(el);
    pre.setEnd(r.startContainer, r.startOffset);
    sel.removeAllRanges();
    const start = pre.toString().length;
    return make(el, { target: { type: 'text selection', text: clean(quote) }, quote, start, end: start + quote.length });
  }
  function make(el, extra) {
    let context = null;
    try { context = typeof window.commentContext === 'function' ? window.commentContext() : null; } catch (err) {}
    return { n: items.length + 1, text: '', selector: selectorOf(el), section: sectionOf(el), at: new Date().toISOString(), context, ...extra };
  }

  // UI lives in a shadow root so page styles cannot touch it.
  const host = document.createElement('div');
  const root = host.attachShadow({ mode: 'open' });
  const [vert, horiz] = spot.split('-');
  const SEND = '<svg viewBox="0 0 12 13"><path d="M5.4.2.25 5.1c-.27.27-.37.86-.07 1.18.3.32.88.32 1.19 0l3.77-3.57v9.48a.81.81 0 0 0 1.62 0V2.7l3.77 3.57c.3.32.9.34 1.18 0 .26-.31.27-.9-.07-1.18L6.51.22C6.3 0 5.76-.15 5.4.22Z" fill="currentColor"/></svg>';
  const TRASH = '<svg viewBox="0 0 9 11"><path d="M6.13.57 6 .1A.14.14 0 0 0 5.87 0H2.57a.14.14 0 0 0-.14.1l-.13.47a.14.14 0 0 1-.13.1H.14A.14.14 0 0 0 0 .81v.4c0 .07.06.13.14.13h8.16c.08 0 .14-.06.14-.14V.8a.14.14 0 0 0-.14-.14H6.26a.14.14 0 0 1-.13-.1ZM.25 1.94v7.2c0 .69.55 1.23 1.23 1.23h5.47c.68 0 1.23-.55 1.23-1.23v-7.2H.25Zm1.54 7.01a.23.23 0 0 1-.23.23h-.05a.23.23 0 0 1-.23-.23V3.34c0-.12.1-.22.23-.22h.05c.13 0 .23.1.23.22v5.61Zm2.68 0a.23.23 0 0 1-.23.23h-.05a.23.23 0 0 1-.23-.23V3.34c0-.12.1-.22.23-.22h.05c.13 0 .23.1.23.22v5.61Zm2.68 0a.23.23 0 0 1-.23.23h-.05a.23.23 0 0 1-.23-.23V3.34c0-.12.1-.22.23-.22h.05c.13 0 .23.1.23.22v5.61Z" fill="currentColor"/></svg>';
  const BUBBLE = '<svg class="bub" viewBox="9 3 21 22"><path d="M25.32 4.58c2.04 0 3.68 1.65 3.68 3.69v7.63c0 2.03-1.65 3.68-3.68 3.68H14.66l-4.5 3.84V8.27c0-2.04 1.65-3.69 3.68-3.69h11.48Z" fill="currentColor"/></svg>';
  const ICON = {
    tg: '<svg viewBox="0 0 16 16"><path d="M2.95 0h9.18a2.95 2.95 0 0 1 2.94 2.95v6.1A2.95 2.95 0 0 1 12.13 12H3.6L0 15.06V2.95A2.95 2.95 0 0 1 2.95 0Z" fill="currentColor"/></svg>',
    dl: '<svg viewBox="0 0 16 17"><path d="M14.48 9.59 9.33 14.57c-.46.46-.76.72-1.05.93h5.03v1.25H2v-1.25h5.02c-.29-.21-.67-.47-1.13-.93L.74 9.5c-.84-.92-.25-1.13.38-1.13h2.51V1.68C3.63.5 4.47 0 5.3 0h4.6c1.35 0 1.69.88 1.69 1.68v6.7h2.47c1.05 0 1.26.33.42 1.21Z" fill="currentColor"/></svg>',
    cp: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="5" width="10" height="10" rx="2"/><path d="M11 2.8A1.8 1.8 0 0 0 9.2 1H2.8A1.8 1.8 0 0 0 1 2.8v6.4A1.8 1.8 0 0 0 2.8 11"/></svg>',
    cl: TRASH.replace('<svg', '<svg preserveAspectRatio="xMidYMid meet"'),
  };
  // Every toolbar button is an icon plus a label; a theme decides when the label shows.
  const tool = (a, label, title) => `<button class="p ${a}" data-a="${a}" title="${title}"><i class="ic">${ICON[a]}</i><span class="lw"><span class="lb">${label}</span></span></button>`;
  root.innerHTML = `<style>
    :host{position:fixed;inset:0;pointer-events:none;z-index:2147483647;font:13px/1.4 system-ui,sans-serif;--blue:#0d99ff;--edge:16px}
    @media print{:host{display:none}}
    [hidden]{display:none!important}
    button{font:inherit;cursor:pointer;border:0;padding:0;color:inherit;background:none}
    .bar{position:fixed;${vert}:var(--edge);${horiz === 'center' ? 'left:50%;transform:translateX(-50%)' : horiz + ':var(--edge)'};pointer-events:auto}
    .x{position:absolute;display:flex;align-items:center;gap:var(--xgap,6px);width:max-content}
    .x{${col ? `${vert}:calc(100% + var(--xgap,6px));flex-direction:${vert === 'bottom' ? 'column' : 'column-reverse'};align-items:${horiz === 'right' ? 'flex-end' : horiz === 'center' ? 'center' : 'flex-start'};${horiz === 'center' ? 'left:50%;transform:translateX(-50%)' : horiz + ':0'}` : `${vert}:0;flex-direction:${horiz === 'right' ? 'row' : 'row-reverse'};flex-wrap:wrap;max-width:${horiz === 'center' ? 'calc(50vw - 90px)' : 'calc(100vw - 190px)'};${horiz === 'right' ? 'right' : 'left'}:calc(100% + 6px)`}}
    .p{position:relative;display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 12px;border-radius:99px;font-weight:500;white-space:nowrap;
      background:#161616ee;color:#e8e6e1;border:1px solid #ffffff26;box-shadow:0 2px 10px #0004;backdrop-filter:blur(8px)}
    .p:hover{border-color:#ffffff77}
    .ic{display:flex;width:12px;height:12px}.ic svg{width:100%;height:100%}
    .lw{display:contents}.dl:is(:hover,:not(.dirty)) .n,.dl.dirty:not(:hover) .h{display:none}
    .on .tg{background:#dbdbd6;color:#292929;border-color:#dbdbd6}
    .bar:not(.on) .dl{height:22px;padding:0 9px;font-size:11px;box-shadow:none}
    .dl.dirty{color:#ffb454;border-color:#ffb45477}
    .cl.arm{background:#e5484d;border-color:#e5484d;color:#fff}
    .tip{position:absolute;${vert}:calc(100% + 12px);${horiz === 'center' ? 'left:50%;transform:translateX(-50%)' : horiz + ':0'};width:300px;padding:16px 18px;
      background:#000000e0;color:#dfdeda;border:1px solid #dfdeda24;border-radius:20px;backdrop-filter:blur(14px);cursor:pointer}
    .tip p{margin:0;font-size:15px;line-height:1.4}
    .tip div{display:flex;align-items:center;justify-content:space-between;margin-top:14px;font-size:11px;letter-spacing:.05em;text-transform:uppercase}
    .tip span{opacity:.55}.tip button{padding:6px 12px;border:1px solid #dfdeda55;border-radius:99px;letter-spacing:inherit}
    .hl{position:fixed;border:2px solid var(--blue);background:#0d99ff14;border-radius:3px;box-sizing:border-box}
    .tag{position:fixed;max-width:280px;padding:2px 6px;background:var(--blue);color:#fff;border-radius:4px;font-size:11px;
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .mk i{position:fixed;box-sizing:border-box;border-bottom:2px solid var(--c);border-radius:2px;
      background:color-mix(in srgb,var(--c) 28%,transparent)}
    .pin{position:fixed;left:0;top:0;width:26px;height:26px;margin:-26px 0 0;border-radius:13px 13px 13px 0;
      background:var(--c);color:#fff;font-weight:600;text-align:center;line-height:22px;border:2px solid #fff;
      box-sizing:border-box;box-shadow:0 2px 6px #0005;pointer-events:auto}
    .pin.text{width:20px;height:20px;margin:-10px 0 0;border-radius:10px;line-height:16px;font-size:11px}
    .box{position:fixed;left:0;top:0;display:flex;align-items:flex-end;gap:6px;pointer-events:auto}
    .box.flip{flex-direction:row-reverse}.box.flip .bub{transform:scaleX(-1)}
    .bub{flex:none;width:21px;height:22px;color:var(--c)}
    .field{display:flex;align-items:flex-end;gap:8px;width:280px;padding:9px 7px 9px 14px;background:#fff;border:1px solid var(--c);
      border-radius:13px;box-shadow:0 1px 2px #0001,2px 3px 4px #0000001a,4px 7px 5px #0000000d}
    textarea{flex:1;min-width:0;max-height:160px;resize:none;border:0;outline:0;padding:0;background:none;font:500 15px/1.3 system-ui,sans-serif;
      color:#292929;letter-spacing:.01em}
    textarea::placeholder{color:#29292955}
    .cb{flex:none;width:25px;height:25px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#2929290f;color:#292929}
    .cb svg{width:52%;height:52%}
    .cb.go{background:var(--c);color:#fff}.cb:disabled{background:#2929290f;color:#929292;cursor:not-allowed}
  </style><div id="marks"></div><div class="hl" hidden></div><div class="tag" hidden></div><div id="pins"></div>
  <div class="bar${col ? ' col' : ''}">${tool('tg', 'Comment', 'Comment mode (C)')}
  <div class="x">${tool('cl', '', 'Clear all comments')}${tool('cp', 'Copy JSON', 'Copy every comment as JSON')}${tool('dl', '<span class="n"></span><span class="h">Download comments</span>', 'Download every comment as JSON')}</div>
  <div class="tip" hidden><p>Select text, or click anything on the page, to pin a comment there.</p><div><span>Esc exits · C toggles</span><button>Got it</button></div></div></div>`;
  if (window.commentModeOptions && window.commentModeOptions.css) root.appendChild(document.createElement('style')).textContent = window.commentModeOptions.css;
  const $ = (s) => root.querySelector(s);
  const pins = $('#pins'), marks = $('#marks'), hl = $('.hl'), tag = $('.tag'), bar = $('.bar');

  const css = document.createElement('style');
  // @font-face only works in the page's own stylesheet, so a theme's font rules are copied there.
  css.textContent = 'html.cm-on,html.cm-on *{cursor:crosshair!important;-webkit-user-select:text!important;user-select:text!important}' + (((window.commentModeOptions || {}).css || '').match(/@font-face\{[^}]*\}/g) || []).join('');
  // A theme can style light pages differently: the host gets .light when the page background is light.
  const lightPage = () => {
    for (const el of [document.body, document.documentElement]) {
      const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
      if (m && (m[3] === undefined || +m[3] > 0.5)) return 0.3 * m[0] + 0.59 * m[1] + 0.11 * m[2] > 140;
    }
    return true;
  };
  const mount = () => { document.head.appendChild(css); document.body.appendChild(host); host.classList.toggle('light', lightPage()); };
  document.body ? mount() : document.addEventListener('DOMContentLoaded', mount);

  const label = (t) => (t.name ? t.name : t.type) + (t.text && !t.name ? ': ' + t.text : '');
  function highlight(t) {
    hl.hidden = tag.hidden = !t || t.space;
    if (hl.hidden) return;
    const r = t.rect || t.el.getBoundingClientRect();
    if (r.width * r.height > 0.35 * innerWidth * innerHeight) { hl.hidden = tag.hidden = true; return; } // a page-sized object is not worth outlining
    Object.assign(hl.style, { left: r.left - 3 + 'px', top: r.top - 3 + 'px', width: r.width + 6 + 'px', height: r.height + 6 + 'px' });
    tag.textContent = label(t);
    tag.style.left = Math.max(4, Math.min(r.left - 3, innerWidth - tag.offsetWidth - 4)) + 'px';
    tag.style.top = (r.top - 26 > 0 ? r.top - 26 : r.bottom + 6) + 'px';
  }

  // Toolbar: with comment mode off only the toggle shows, plus the download button while comments are unsaved.
  const TIP = 'comment-mode:tip-seen';
  let tipSeen = false;
  try { tipSeen = !!localStorage.getItem(TIP); } catch (e) {}
  const hideTip = () => { tipSeen = true; try { localStorage.setItem(TIP, '1'); } catch (e) {} syncBar(); };
  $('.tip').onclick = hideTip;
  const say = (b, t) => (b.querySelector('.lb').textContent = t);
  function syncBar() {
    const n = items.length, dl = $('.dl'), cl = $('.cl');
    bar.classList.toggle('on', on);
    $('.tg').setAttribute('aria-pressed', on);
    pins.hidden = marks.hidden = !on;
    $('.cp').hidden = cl.hidden = !on || !n;
    dl.hidden = !n || (!on && !dirty);
    $('.tip').hidden = !on || tipSeen;
    dl.querySelector('.n').textContent = n + ' unsaved'; // shown while dirty; hover shows Download comments
    dl.title = n + (n === 1 ? ' comment' : ' comments') + (dirty ? ', not downloaded or copied yet' : ', saved') + ' · click to download';
    dl.classList.toggle('dirty', dirty);
    say(cl, armed ? 'Click again to clear' : 'Clear comments');
    cl.classList.toggle('arm', !!armed);
  }
  const setMode = (v) => {
    on = v;
    document.documentElement.classList.toggle('cm-on', on);
    if (!on) { closeBox(true); highlight(null); }
    syncBar();
  };

  function render() {
    items.forEach((c, i) => (c.n = i + 1));
    pins.textContent = marks.textContent = '';
    pinEls.clear();
    markEls.clear();
    for (const c of items.concat(box && box.isNew ? [box.c] : [])) {
      const b = document.createElement('button');
      b.className = 'pin' + (isText(c) ? ' text' : '');
      b.style.setProperty('--c', colorOf(c));
      b.textContent = c.n;
      b.title = c.text || 'New comment';
      b.onclick = (e) => { e.stopPropagation(); if (!box || box.c !== c) { closeBox(true); openBox(c, false); } };
      pinEls.set(c, b);
      pins.appendChild(b);
      if (isText(c)) {
        const m = document.createElement('div');
        m.className = 'mk';
        m.style.setProperty('--c', colorOf(c));
        markEls.set(c, m);
        marks.appendChild(m);
      }
    }
    syncBar();
  }

  function openBox(c, isNew) {
    highlight(null);
    if (!tipSeen) hideTip();
    const el = document.createElement('div');
    el.className = 'box' + (isNew ? '' : ' review');
    el.style.setProperty('--c', colorOf(c));
    el.innerHTML = BUBBLE + '<div class="field"><textarea rows="1" placeholder="Add a comment"></textarea><button class="cb del" title="Delete">' + TRASH + '</button><button class="cb go" title="Save (Enter)">' + SEND + '</button></div>';
    const ta = el.querySelector('textarea'), go = el.querySelector('.go'), del = el.querySelector('.del');
    const fit = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; go.disabled = !ta.value.trim(); };
    ta.value = c.text || '';
    del.hidden = isNew;
    del.onclick = () => { items = items.filter((x) => x !== c); dirty = true; closeBox(false); };
    go.onclick = () => closeBox(true);
    ta.oninput = fit;
    ta.onkeydown = (e) => {
      e.stopPropagation();
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); closeBox(true); }
      if (e.key === 'Escape') closeBox(false);
    };
    box = { c, isNew, el };
    root.appendChild(el);
    render();
    fit();
    ta.focus();
  }
  // commit=true keeps the text; an empty comment is dropped.
  function closeBox(commit) {
    if (!box) return;
    const { c, isNew, el } = box;
    const text = el.querySelector('textarea').value.trim();
    box = null;
    el.remove();
    if (commit && text && text !== c.text) {
      c.text = text;
      if (isNew) items.push(c);
      dirty = true;
    } else if (commit && !text && !isNew) {
      items = items.filter((x) => x !== c);
      dirty = true;
    }
    save();
    render();
  }

  // Keep pins, highlights and the open box attached to their content through scrolling, resizing and animation.
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  (function tick() {
    if (on) {
      for (const c of items.concat(box && box.isNew ? [box.c] : [])) {
        const g = geoOf(c), pin = pinEls.get(c), mk = markEls.get(c);
        if (!pin) continue;
        pin.hidden = !g || (box && box.c === c); // the open box stands in for its pin
        if (mk) mk.hidden = !g;
        if (!g) continue;
        pin.style.transform = `translate(${g.pin[0]}px,${g.pin[1]}px)`;
        if (!mk) continue;
        while (mk.children.length < g.rects.length) mk.appendChild(document.createElement('i'));
        while (mk.children.length > g.rects.length) mk.lastChild.remove();
        g.rects.forEach((q, i) => Object.assign(mk.children[i].style, { left: q.left + 'px', top: q.top + 'px', width: q.width + 'px', height: q.height + 'px' }));
      }
      const g = box && geoOf(box.c);
      if (g) {
        const w = box.el.offsetWidth, h = box.el.offsetHeight, [px, py] = g.at;
        // A point comment hangs from the bubble's tip, its bottom corner, flipping left near the right edge; a text comment sits under its text.
        const flip = isText(box.c) ? px + 8 + w > innerWidth - 8 : px + w > innerWidth - 8;
        box.el.classList.toggle('flip', flip);
        const x = isText(box.c) ? clamp(px + 8, 8, innerWidth - w - 8) : clamp(flip ? px - w : px, 8, innerWidth - w - 8);
        box.el.style.transform = `translate(${x}px,${clamp(isText(box.c) ? py + 10 : py - h, 8, innerHeight - h - 8)}px)`;
      }
    }
    requestAnimationFrame(tick);
  })();

  // While commenting, the page must not react to clicks. Text keeps its default so it can be selected.
  const inUi = (e) => e.composedPath().includes(host);
  for (const t of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'dblclick'])
    document.addEventListener(t, (e) => {
      if (!on || inUi(e)) return;
      e.stopPropagation();
      const t = e.type === 'mouseup' ? null : targetAt(e.clientX, e.clientY);
      if (!t || !t.txt) e.preventDefault();
    }, true);
  document.addEventListener('mouseup', (e) => {
    if (!on || inUi(e) || (box && (!box.isNew || box.el.querySelector('textarea').value))) return;
    const c = fromSelection();
    if (!c) return;
    closeBox(false); // an empty box left by the first click of a double-click
    picked = true;
    setTimeout(() => (picked = false));
    openBox(c, true);
  }, true);
  document.addEventListener('pointermove', (e) => { if (on && !box) highlight(inUi(e) || e.buttons ? null : targetAt(e.clientX, e.clientY)); }, true);
  document.addEventListener('scroll', () => highlight(null), true);
  document.addEventListener('click', (e) => {
    if (!on || inUi(e)) return;
    e.preventDefault();
    e.stopPropagation();
    if (picked) return;
    if (box) return closeBox(true);
    const hit = markAt(e.clientX, e.clientY);
    if (hit) return openBox(hit, false);
    const t = targetAt(e.clientX, e.clientY);
    if (!t) return;
    const r = t.el.getBoundingClientRect();
    openBox(make(t.el, {
      target: { type: t.type, ...(t.name ? { name: t.name } : {}), ...(t.text ? { text: t.text } : {}) },
      fx: r.width ? (e.clientX - r.left) / r.width : 0.5, fy: r.height ? (e.clientY - r.top) / r.height : 0.5,
    }), true);
  }, true);

  document.addEventListener('keydown', (e) => {
    const t = e.composedPath()[0];
    if (e.key === 'Escape') return box ? closeBox(false) : setMode(false);
    if (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey && !/^(input|textarea|select)$/i.test(t.localName) && !t.isContentEditable) setMode(!on);
  });

  const exportData = () => {
    let extras = null;
    try { extras = typeof window.commentExtras === 'function' ? window.commentExtras() : null; } catch (err) {}
    return {
      page: document.title,
      exportedAt: new Date().toISOString(),
      comments: items.map((c) => ({
        n: c.n, comment: c.text, section: c.section, target: c.target, selector: c.selector,
        ...(isText(c) ? {} : { positionInTarget: { x: +(c.fx * 100).toFixed(1) + '%', y: +(c.fy * 100).toFixed(1) + '%' } }),
        ...(c.context ? { context: c.context } : {}),
      })),
      ...(extras ? { extras } : {}),
    };
  };
  const delivered = () => { dirty = false; save(); syncBar(); };
  bar.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const a = b.dataset.a, json = JSON.stringify(exportData(), null, 2);
    if (a === 'tg') setMode(!on);
    if (a === 'cp') {
      const fallback = () => { const ta = document.createElement('textarea'); ta.value = json; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); };
      (navigator.clipboard ? navigator.clipboard.writeText(json) : Promise.reject()).catch(fallback).then(() => {
        say(b, 'Copied ✓');
        setTimeout(() => say(b, 'Copy JSON'), 1500);
        delivered();
      });
    }
    if (a === 'dl') {
      const l = document.createElement('a');
      l.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      l.download = (clean(document.title).replace(/\W+/g, '-').toLowerCase() || 'page') + '-comments.json';
      l.click();
      URL.revokeObjectURL(l.href);
      delivered();
    }
    if (a === 'cl') {
      if (!armed) { armed = setTimeout(() => { armed = 0; syncBar(); }, 4000); return syncBar(); }
      clearTimeout(armed);
      armed = 0;
      closeBox(false);
      items = [];
      dirty = false;
      save();
      render();
    }
  };
  render();
})();
